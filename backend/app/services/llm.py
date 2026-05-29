"""
LLM Service — OpenAI-compatible API client with structured output, retry, streaming.

Supports: OpenAI, DeepSeek, and other compatible providers.
Handles provider differences:
- DeepSeek: json_object mode (no json_schema strict), no embeddings API
- OpenAI: full json_schema + embeddings support
"""

from __future__ import annotations

import json
import time
import re
from dataclasses import dataclass
from typing import Any

from openai import OpenAI

from app.config import get_settings

settings = get_settings()


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

    def __init__(self):
        self._client: OpenAI | None = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.OPENAI_API_KEY or "sk-placeholder",
                base_url=settings.OPENAI_BASE_URL,
                timeout=settings.AGENT_TIMEOUT_SECONDS,
                max_retries=0,
            )
        return self._client

    @property
    def available(self) -> bool:
        return bool(settings.OPENAI_API_KEY)

    @property
    def is_deepseek(self) -> bool:
        return "deepseek" in (settings.OPENAI_BASE_URL or "").lower()

    # ── Chat Completion ──────────────────────────────────────────

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        response_schema: dict | None = None,
        retries: int | None = None,
    ) -> LLMResponse:
        model = model or settings.LLM_MODEL
        temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        max_retries = retries if retries is not None else settings.AGENT_MAX_RETRIES

        if not self.available:
            return self._fallback_response(messages)

        # Inject JSON schema into system prompt for providers without strict mode
        if response_schema:
            schema_prompt = f"\n\n你必须严格按照以下JSON格式输出，不要输出其他内容：\n```json\n{json.dumps(response_schema, ensure_ascii=False, indent=2)}\n```\n请直接输出符合上述schema的JSON对象。"
            if messages and messages[0]["role"] == "system":
                messages[0]["content"] += schema_prompt
            else:
                messages.insert(0, {"role": "system", "content": schema_prompt.strip()})

        start = time.time()

        kwargs: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # DeepSeek: use json_object mode; OpenAI: use json_schema strict
        if response_schema:
            if self.is_deepseek:
                kwargs["response_format"] = {"type": "json_object"}
            else:
                kwargs["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {"name": "response", "strict": True, "schema": response_schema},
                }

        last_error: Exception | None = None
        for attempt in range(max_retries + 1):
            try:
                completion = self.client.chat.completions.create(**kwargs)
                elapsed = int((time.time() - start) * 1000)

                choice = completion.choices[0]
                content = choice.message.content or ""

                parsed = None
                if response_schema:
                    parsed = self._extract_json(content)

                return LLMResponse(
                    content=content,
                    parsed=parsed,
                    model=completion.model,
                    tokens_prompt=completion.usage.prompt_tokens if completion.usage else 0,
                    tokens_completion=completion.usage.completion_tokens if completion.usage else 0,
                    tokens_total=completion.usage.total_tokens if completion.usage else 0,
                    duration_ms=elapsed,
                    finish_reason=choice.finish_reason or "stop",
                )

            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    time.sleep(2 ** attempt)
                continue

        raise RuntimeError(f"LLM call failed after {max_retries + 1} attempts: {last_error}")

    # ── Streaming ─────────────────────────────────────────────────

    def chat_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ):
        model = model or settings.LLM_MODEL
        temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS

        if not self.available:
            yield "AI 服务暂未配置。请设置 OPENAI_API_KEY。"
            return

        try:
            stream = self.client.chat.completions.create(
                model=model, messages=messages,
                temperature=temperature, max_tokens=max_tokens, stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            yield f"\n[错误: {e}]"

    # ── Embeddings ────────────────────────────────────────────────

    def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """Generate embeddings. Returns zero vectors on providers without embeddings API."""
        model = model or settings.EMBEDDING_MODEL

        if not self.available or self.is_deepseek:
            dim = 1536
            return [[0.0] * dim for _ in texts]

        try:
            response = self.client.embeddings.create(model=model, input=texts)
            return [d.embedding for d in response.data]
        except Exception:
            dim = 1536
            return [[0.0] * dim for _ in texts]

    def embed_single(self, text: str, model: str | None = None) -> list[float]:
        return self.embed([text], model)[0]

    # ── Convenience Methods ───────────────────────────────────────

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        model: str | None = None,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        response = self.chat(messages=messages, model=model, temperature=temperature, response_schema=schema)
        return response.parsed or {}

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return self.chat(messages=messages, model=model, temperature=temperature, max_tokens=max_tokens)

    # ── Helpers ───────────────────────────────────────────────────

    def _extract_json(self, text: str) -> dict[str, Any]:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        return {}

    def _fallback_response(self, messages: list[dict[str, str]]) -> LLMResponse:
        return LLMResponse(
            content=json.dumps({"message": "AI 服务未配置", "fallback": True}, ensure_ascii=False),
            parsed={"message": "AI 服务未配置", "fallback": True},
            model="fallback", tokens_total=0,
        )


_llm_instance: LLMService | None = None


def get_llm() -> LLMService:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMService()
    return _llm_instance
