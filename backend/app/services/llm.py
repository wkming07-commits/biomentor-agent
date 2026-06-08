"""
LLM service built around GLM chat completions API.

User-facing behavior is strict:
- no fake success payloads
- no local template pretending the model worked
- return real GLM output or raise a real error
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import get_settings
from app.services.ocr import OcrService


@dataclass
class LLMResponse:
    content: str
    parsed: dict[str, Any] | None = None
    model: str = ""
    tokens_prompt: int = 0
    tokens_completion: int = 0
    tokens_total: int = 0
    duration_ms: int = 0
    finish_reason: str = "stop"


class LLMService:
    def __init__(self) -> None:
        self._clients: list[tuple[str, httpx.Client]] | None = None
        self._http_clients: list[httpx.Client] = []

    @property
    def settings(self):
        return get_settings()

    @property
    def available(self) -> bool:
        return bool(self.settings.resolved_llm_api_key())

    @property
    def is_glm(self) -> bool:
        return "bigmodel" in self.settings.resolved_llm_base_url().lower()

    @property
    def is_deepseek(self) -> bool:
        return False

    @property
    def clients(self) -> list[tuple[str, httpx.Client]]:
        if self._clients is None:
            self._clients = []
            self._http_clients = []

            timeout_seconds = self.settings.AGENT_TIMEOUT_SECONDS

            for proxy_url in self._resolve_proxy_urls():
                label = proxy_url or "direct"
                http_client_kwargs: dict[str, Any] = {
                    "trust_env": False,
                    "timeout": timeout_seconds,
                }
                if proxy_url:
                    http_client_kwargs["proxy"] = proxy_url

                http_client = httpx.Client(**http_client_kwargs)
                self._http_clients.append(http_client)
                self._clients.append((label, http_client))

        return self._clients

    def chat(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        response_schema: dict | None = None,
        retries: int | None = None,
        extra_body: dict[str, Any] | None = None,
    ) -> LLMResponse:
        if not self.available:
            raise RuntimeError("LLM service unavailable: GLM API key is not configured")

        preferred_model = model or self.settings.resolved_llm_model()
        temperature = temperature if temperature is not None else self.settings.LLM_TEMPERATURE
        max_tokens = max_tokens or self.settings.LLM_MAX_TOKENS
        max_retries = retries if retries is not None else self.settings.AGENT_MAX_RETRIES

        request_messages = [dict(message) for message in messages]
        if response_schema:
            request_messages = self._inject_json_instructions(request_messages, response_schema)

        base_kwargs: dict[str, Any] = {
            "messages": request_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if extra_body:
            base_kwargs["extra_body"] = extra_body
        if response_schema and not self._messages_have_multimodal_content(messages):
            base_kwargs["response_format"] = (
                {"type": "json_object"}
                if self.is_glm
                else {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "response",
                        "strict": True,
                        "schema": response_schema,
                    },
                }
            )

        last_error: Exception | None = None
        start = time.time()
        model_candidates = self._model_candidates(preferred_model, messages)
        total_attempts = max_retries + 1

        for model_name in model_candidates:
            kwargs = {**base_kwargs, "model": model_name}
            for attempt in range(total_attempts):
                for client_label, client in self.clients:
                    try:
                        completion = self._post_chat_completion(client, kwargs)
                        elapsed = int((time.time() - start) * 1000)
                        choice = (completion.get("choices") or [{}])[0]
                        message = choice.get("message") or {}
                        content = self._message_content_to_text(message.get("content"))
                        if not content.strip():
                            raise RuntimeError("GLM response content is empty")
                        usage = completion.get("usage") or {}
                        parsed = self._extract_json(content) if response_schema else None
                        return LLMResponse(
                            content=content,
                            parsed=parsed,
                            model=str(completion.get("model") or model_name),
                            tokens_prompt=int(usage.get("prompt_tokens") or 0),
                            tokens_completion=int(usage.get("completion_tokens") or 0),
                            tokens_total=int(usage.get("total_tokens") or 0),
                            duration_ms=elapsed,
                            finish_reason=str(choice.get("finish_reason") or "stop"),
                        )
                    except Exception as exc:
                        last_error = RuntimeError(f"[{client_label}][{model_name}] {exc}")
                        if self._is_non_retryable_error(exc):
                            raise last_error from exc
                        continue

                if attempt < max_retries:
                    time.sleep(self._retry_delay(last_error, attempt))

        raise RuntimeError(
            f"LLM call failed after trying models {', '.join(model_candidates)}: {last_error}"
        )

    def chat_stream(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ):
        if not self.available:
            yield "LLM service unavailable: GLM API key is not configured."
            return

        model = model or self.settings.resolved_llm_model()
        temperature = temperature if temperature is not None else self.settings.LLM_TEMPERATURE
        max_tokens = max_tokens or self.settings.LLM_MAX_TOKENS

        try:
            last_error: Exception | None = None
            for _client_label, client in self.clients:
                try:
                    payload = {
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "stream": True,
                    }
                    with client.stream("POST", self._chat_completions_url(), headers=self._headers(), json=payload) as stream:
                        stream.raise_for_status()
                        for line in stream.iter_lines():
                            if not line:
                                continue
                            data = line.removeprefix("data: ").strip()
                            if data == "[DONE]":
                                return
                            try:
                                chunk = json.loads(data)
                            except json.JSONDecodeError:
                                continue
                            choice = (chunk.get("choices") or [{}])[0]
                            delta = choice.get("delta") or {}
                            content = self._message_content_to_text(delta.get("content"))
                            if content:
                                yield content
                    return
                except Exception as exc:
                    last_error = exc
                    continue
            if last_error is not None:
                raise last_error
        except Exception as exc:
            yield f"\n[error: {exc}]"

    def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        return []

    def embed_single(self, text: str, model: str | None = None) -> list[float]:
        return self.embed([text], model)[0]

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        model: str | None = None,
        temperature: float = 0.2,
        max_tokens: int | None = None,
        retries: int | None = None,
    ) -> dict[str, Any]:
        response = self.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_schema=schema,
            retries=retries,
        )
        if response.parsed:
            return response.parsed

        repaired = self._retry_json_generation(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema=schema,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if repaired:
            return repaired

        raise RuntimeError("LLM returned empty or invalid JSON")

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        return self.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    def generate_json_from_file(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        file_bytes: bytes,
        filename: str,
        model: str | None = None,
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> dict[str, Any]:
        del max_output_tokens
        if not self.available:
            raise RuntimeError("LLM service unavailable: GLM API key is not configured")

        extracted = OcrService().extract(
            file_bytes=file_bytes,
            mime_type=self._guess_mime_type(filename),
            filename=filename,
        )
        if not extracted.get("success"):
            raise RuntimeError(str(extracted.get("error", "File extraction failed")))

        extracted_text = str(extracted.get("text", "")).strip()
        if not extracted_text:
            raise RuntimeError("GLM parser returned empty text")

        prompt = (
            f"{user_prompt}\n\n"
            f"文件名：{filename or 'uploaded-file'}\n"
            "以下是通过 GLM 解析得到的文本内容，请基于它完成结构化分析：\n\n"
            f"{extracted_text[:16000]}"
        )
        return self.generate_json(
            system_prompt=system_prompt,
            user_prompt=prompt,
            schema=schema,
            model=model or self.settings.resolved_llm_model(),
            temperature=temperature,
        )

    def _inject_json_instructions(self, messages: list[dict[str, Any]], schema: dict) -> list[dict[str, Any]]:
        props = schema.get("properties", {})
        required = set(schema.get("required", []))
        field_descs: list[str] = []

        for name, prop in props.items():
            ptype = prop.get("type", "string")
            if ptype == "array":
                item_type = prop.get("items", {}).get("type", "string")
                suffix = f"array<{item_type}>"
            else:
                suffix = ptype
            required_marker = " (required)" if name in required else ""
            field_descs.append(f'- "{name}": {suffix}{required_marker}')

        schema_prompt = (
            "\n\n你必须输出一个纯 JSON 对象，不要包含 Markdown 代码块。\n"
            "JSON 必须包含以下字段：\n"
            + "\n".join(field_descs)
            + "\n\n只输出 JSON，不要输出其他解释。"
        )

        request_messages = [dict(message) for message in messages]
        if request_messages and request_messages[0].get("role") == "system":
            request_messages[0]["content"] = request_messages[0].get("content", "") + schema_prompt
        else:
            request_messages.insert(0, {"role": "system", "content": schema_prompt.strip()})
        return request_messages

    def _extract_json(self, text: str) -> dict[str, Any]:
        try:
            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            pass

        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if match:
            try:
                parsed = json.loads(match.group(1))
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                pass

        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                parsed = json.loads(match.group(0))
                return parsed if isinstance(parsed, dict) else {}
            except json.JSONDecodeError:
                pass

        return {}

    def _retry_json_generation(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        model: str | None,
        temperature: float,
        max_tokens: int | None,
    ) -> dict[str, Any]:
        fallback_messages = self._inject_json_instructions(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            schema,
        )

        response = self.chat(
            messages=fallback_messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_schema=None,
            retries=0,
        )
        return self._extract_json(response.content)

    def _guess_mime_type(self, filename: str) -> str:
        lower = (filename or "").lower()
        if lower.endswith(".pdf"):
            return "application/pdf"
        if lower.endswith(".doc"):
            return "application/msword"
        if lower.endswith(".docx"):
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if lower.endswith(".ppt"):
            return "application/vnd.ms-powerpoint"
        if lower.endswith(".pptx"):
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        if lower.endswith(".xls"):
            return "application/vnd.ms-excel"
        if lower.endswith(".xlsx"):
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if lower.endswith(".csv"):
            return "text/csv"
        if lower.endswith(".html") or lower.endswith(".htm"):
            return "text/html"
        if lower.endswith(".md"):
            return "text/markdown"
        if lower.endswith(".txt"):
            return "text/plain"
        if lower.endswith(".wps"):
            return "application/vnd.ms-works"
        if lower.endswith(".png"):
            return "image/png"
        if lower.endswith(".jpg") or lower.endswith(".jpeg"):
            return "image/jpeg"
        if lower.endswith(".webp"):
            return "image/webp"
        if lower.endswith(".bmp"):
            return "image/bmp"
        if lower.endswith(".gif"):
            return "image/gif"
        if lower.endswith(".heic"):
            return "image/heic"
        if lower.endswith(".heif"):
            return "image/heif"
        if lower.endswith(".eps"):
            return "application/postscript"
        if lower.endswith(".icns"):
            return "image/x-icon"
        if lower.endswith(".pcx"):
            return "image/x-pcx"
        if lower.endswith(".ppm"):
            return "image/x-portable-pixmap"
        if lower.endswith(".tif") or lower.endswith(".tiff"):
            return "image/tiff"
        if lower.endswith(".xbm"):
            return "image/x-xbitmap"
        if lower.endswith(".jp2"):
            return "image/jp2"
        return "application/octet-stream"

    def _model_candidates(self, preferred_model: str, messages: list[dict[str, Any]]) -> list[str]:
        candidates: list[str] = []
        self._append_unique(candidates, preferred_model)
        has_multimodal = self._messages_have_multimodal_content(messages)
        if has_multimodal:
            for item in (
                self.settings.GLM_VISION_MODEL,
                "glm-4v-flash",
                "glm-4.6v-flash",
                self.settings.resolved_llm_model(),
            ):
                self._append_unique(candidates, item)
        else:
            for item in (
                self.settings.resolved_llm_model(),
                "glm-4-flash-250414",
                "glm-4-flash",
            ):
                self._append_unique(candidates, item)
        return candidates

    def _append_unique(self, items: list[str], value: str | None) -> None:
        clean = (value or "").strip()
        if clean and clean not in items:
            items.append(clean)

    def _messages_have_multimodal_content(self, messages: list[dict[str, Any]]) -> bool:
        for message in messages:
            content = message.get("content")
            if isinstance(content, list):
                for part in content:
                    if not isinstance(part, dict):
                        continue
                    part_type = str(part.get("type") or "").lower()
                    if part_type in {"image_url", "file_url", "video_url", "input_image", "input_file"}:
                        return True
        return False

    def _is_non_retryable_error(self, error: Exception) -> bool:
        text = str(error or "").lower()
        non_retryable_markers = (
            "401",
            "403",
            "unauthorized",
            "forbidden",
            "invalid api key",
            "insufficient balance",
            "insufficient_balance",
            "quota",
        )
        return any(marker in text for marker in non_retryable_markers)

    def _retry_delay(self, error: Exception | None, attempt: int) -> int:
        text = str(error or "").lower()
        if any(marker in text for marker in ("429", "rate limit", "1302", "1305")):
            return min(4 * (attempt + 1), 12)
        if "timeout" in text or "timed out" in text:
            return min(2 * (attempt + 1), 6)
        return min(1 + attempt, 4)

    def _post_chat_completion(self, client: httpx.Client, payload: dict[str, Any]) -> dict[str, Any]:
        response = client.post(
            self._chat_completions_url(),
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, dict) else {}

    def _chat_completions_url(self) -> str:
        base_url = self.settings.resolved_llm_base_url().rstrip("/")
        lowered = base_url.lower()
        if lowered.endswith("/chat/completions"):
            return base_url
        if lowered.endswith("/api/paas/v4") or lowered.endswith("/v1"):
            return f"{base_url}/chat/completions"
        return f"{base_url}/v1/chat/completions"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.resolved_llm_api_key()}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _message_content_to_text(self, content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    parts.append(str(item.get("text") or item.get("content") or ""))
                elif item is not None:
                    parts.append(str(item))
            return "".join(parts)
        return "" if content is None else str(content)

    def _resolve_proxy_urls(self) -> list[str | None]:
        candidates: list[str | None] = []

        for key in ("HTTPS_PROXY", "ALL_PROXY", "HTTP_PROXY"):
            proxy_url = self._normalize_proxy_url(os.getenv(key, ""))
            if proxy_url:
                candidates.append(proxy_url)

        system_proxy = self._load_windows_proxy()
        if system_proxy:
            candidates.append(system_proxy)

        candidates.append(None)

        deduped: list[str | None] = []
        seen: set[str] = set()
        for candidate in candidates:
            marker = candidate or "__direct__"
            if marker in seen:
                continue
            seen.add(marker)
            deduped.append(candidate)
        return deduped

    def _normalize_proxy_url(self, proxy_url: str) -> str | None:
        value = proxy_url.strip()
        if not value:
            return None

        lowered = value.lower()
        if lowered in {
            "http://127.0.0.1:9",
            "https://127.0.0.1:9",
            "127.0.0.1:9",
            "http://localhost:9",
            "https://localhost:9",
            "localhost:9",
        }:
            return None

        if "://" not in value:
            return f"http://{value}"
        return value

    def _load_windows_proxy(self) -> str | None:
        if os.name != "nt":
            return None

        try:
            import winreg

            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            ) as key:
                proxy_enabled = int(winreg.QueryValueEx(key, "ProxyEnable")[0] or 0)
                if proxy_enabled != 1:
                    return None
                raw_proxy = str(winreg.QueryValueEx(key, "ProxyServer")[0] or "").strip()
        except Exception:
            return None

        if not raw_proxy:
            return None

        if "=" in raw_proxy:
            pairs = {}
            for item in raw_proxy.split(";"):
                if "=" not in item:
                    continue
                scheme, address = item.split("=", 1)
                pairs[scheme.strip().lower()] = address.strip()
            raw_proxy = pairs.get("https") or pairs.get("http") or ""

        return self._normalize_proxy_url(raw_proxy)


_llm_instance: LLMService | None = None


def get_llm() -> LLMService:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMService()
    return _llm_instance


def reset_llm() -> None:
    global _llm_instance
    if _llm_instance is not None:
        for client in _llm_instance._http_clients:
            try:
                client.close()
            except Exception:
                pass
    _llm_instance = None
