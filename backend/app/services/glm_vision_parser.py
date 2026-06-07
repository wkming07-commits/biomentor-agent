from __future__ import annotations

import base64
import time
from dataclasses import dataclass
from pathlib import Path

import httpx

from app.config import get_settings


@dataclass
class VisionParsedResult:
    text: str
    engine: str
    page_count: int = 0


class GLMVisionParserService:
    """
    GLM image/PDF extraction via the official layout parsing endpoint.

    This keeps image/PDF understanding fully on the GLM side:
    - images: sent directly as base64
    - PDFs: sent directly as base64
    No local OCR is used.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.resolved_llm_api_key()
        self.base_url = self.settings.resolved_llm_base_url().rstrip("/")
        self.vision_model = self.settings.GLM_VISION_MODEL or "glm-4v-flash"
        self.timeout = max(self.settings.GLM_FILE_PARSER_TIMEOUT_SECONDS, 180)

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def parse_bytes(self, file_bytes: bytes, mime_type: str, filename: str = "") -> VisionParsedResult:
        if not self.available:
            raise RuntimeError("GLM API key is not configured")
        if not file_bytes:
            raise RuntimeError("Uploaded file is empty")

        lower = (filename or "").lower()
        if (mime_type or "").startswith("image/") or lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")):
            text, engine = self._extract_image(
                file_bytes=file_bytes,
                mime_type=mime_type or self._guess_mime_type(filename),
                filename=filename,
            )
            return VisionParsedResult(text=text, engine=engine, page_count=1)

        if mime_type == "application/pdf" or lower.endswith(".pdf"):
            text, engine = self._extract_pdf(file_bytes=file_bytes, filename=filename)
            page_count = text.count("\n\n--- page") or 1
            return VisionParsedResult(text=text, engine=engine, page_count=page_count)

        raise RuntimeError(f"GLM vision parser does not support: {mime_type or filename or 'unknown file'}")

    def parse_path(self, file_path: str, mime_type: str = "") -> VisionParsedResult:
        path = Path(file_path)
        guessed_mime = mime_type or self._guess_mime_type(path.name)
        return self.parse_bytes(path.read_bytes(), guessed_mime, path.name)

    def _extract_image(self, *, file_bytes: bytes, mime_type: str, filename: str) -> tuple[str, str]:
        try:
            return self._call_layout_parsing(file_bytes=file_bytes, filename=filename or "upload.png"), "glm-layout-parsing:image"
        except Exception as layout_error:
            try:
                text = self._call_vision_ocr(
                    prompt="请准确提取图片中全部可见文字，直接输出正文，不要解释，不要总结，不要补充图片中没有的信息。",
                    image_bytes=file_bytes,
                    mime_type=mime_type,
                )
                return text, f"glm-vision:{self.vision_model}"
            except Exception as vision_error:
                raise RuntimeError(f"{layout_error}; fallback vision failed: {vision_error}") from vision_error

    def _extract_pdf(self, *, file_bytes: bytes, filename: str) -> tuple[str, str]:
        try:
            return self._call_layout_parsing(file_bytes=file_bytes, filename=filename or "upload.pdf"), "glm-layout-parsing:pdf"
        except Exception as layout_error:
            raise RuntimeError(f"GLM direct PDF parsing failed: {layout_error}") from layout_error

    def _vision_model_candidates(self) -> list[str]:
        candidates: list[str] = []
        for item in (
            self.vision_model,
            "glm-4v-flash",
            "glm-4.6v-flash",
        ):
            clean = (item or "").strip()
            if clean and clean not in candidates:
                candidates.append(clean)
        return candidates

    def _is_non_retryable_error(self, error: Exception) -> bool:
        text = str(error or "").lower()
        return any(
            marker in text
            for marker in (
                "401",
                "403",
                "unauthorized",
                "forbidden",
                "invalid api key",
                "insufficient balance",
                "insufficient_balance",
                "quota",
            )
        )

    def _call_layout_parsing(self, *, file_bytes: bytes, filename: str) -> str:
        encoded = base64.b64encode(file_bytes).decode("ascii")
        mime_type = self._guess_mime_type(filename) or "application/octet-stream"
        payload = {
            "model": "glm-ocr",
            "file": f"data:{mime_type};base64,{encoded}",
            "request_id": f"biomentor-{int(time.time() * 1000)}",
        }

        last_error: Exception | None = None
        for attempt in range(3):
            try:
                with httpx.Client(timeout=self.timeout, trust_env=False) as client:
                    response = client.post(
                        f"{self.base_url}/layout_parsing",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                if response.is_error:
                    raise RuntimeError(f"HTTP {response.status_code}: {response.text[:800]}")
                data = response.json()
                text = self._extract_text(data).strip()
                if text:
                    return text

                message = self._extract_message(data)
                if message:
                    raise RuntimeError(message)
                raise RuntimeError("GLM layout parsing returned empty content")
            except Exception as exc:
                last_error = exc
                time.sleep(self._retry_delay(last_error, attempt))

        raise RuntimeError(f"GLM layout parsing failed: {last_error}") from last_error

    def _call_vision_ocr(self, *, prompt: str, image_bytes: bytes, mime_type: str) -> str:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        last_error: Exception | None = None

        for model_name in self._vision_model_candidates():
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}"}},
                        ],
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 2200,
            }

            for attempt in range(3):
                try:
                    with httpx.Client(timeout=self.timeout, trust_env=False) as client:
                        response = client.post(
                            f"{self.base_url}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {self.api_key}",
                                "Content-Type": "application/json",
                            },
                            json=payload,
                        )
                    if response.is_error:
                        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:800]}")
                    data = response.json()
                    message = ((data.get("choices") or [{}])[0]).get("message") or {}
                    content = str(message.get("content", "") or "").strip()
                    if content:
                        return content
                    raise RuntimeError(self._extract_message(data) or "GLM vision returned empty content")
                except Exception as exc:
                    last_error = exc
                    if self._is_non_retryable_error(exc):
                        raise RuntimeError(f"GLM vision call failed: {exc}") from exc
                    if attempt < 2:
                        time.sleep(self._retry_delay(last_error, attempt))

        raise RuntimeError(f"GLM vision call failed after trying models {', '.join(self._vision_model_candidates())}: {last_error}") from last_error

    def _extract_text(self, payload: object) -> str:
        texts: list[str] = []

        def visit(node: object) -> None:
            if isinstance(node, dict):
                for key in ("text", "content", "markdown", "md", "raw_text"):
                    value = node.get(key)
                    if isinstance(value, str) and value.strip():
                        texts.append(value.strip())

                md_results = node.get("md_results")
                if isinstance(md_results, str) and md_results.strip():
                    texts.append(md_results.strip())
                elif isinstance(md_results, list):
                    for item in md_results:
                        if isinstance(item, dict):
                            md = item.get("content")
                            if isinstance(md, str) and md.strip():
                                texts.append(md.strip())

                if isinstance(node.get("layout"), list):
                    for item in node["layout"]:
                        visit(item)

                if isinstance(node.get("layout_details"), list):
                    for page_index, page in enumerate(node["layout_details"], start=1):
                        before_count = len(texts)
                        visit(page)
                        if len(texts) > before_count:
                            texts.append(f"--- page {page_index} ---")

                for value in node.values():
                    if isinstance(value, (dict, list)):
                        visit(value)
            elif isinstance(node, list):
                for item in node:
                    visit(item)

        visit(payload)

        ordered: list[str] = []
        seen: set[str] = set()
        for item in texts:
            clean = item.strip()
            if not clean or clean in seen:
                continue
            seen.add(clean)
            ordered.append(clean)

        return "\n\n".join(ordered)

    def _extract_message(self, payload: object) -> str:
        if isinstance(payload, dict):
            for key in ("message", "msg", "error", "detail"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
                if isinstance(value, dict):
                    nested = self._extract_message(value)
                    if nested:
                        return nested
            for value in payload.values():
                nested = self._extract_message(value)
                if nested:
                    return nested
        elif isinstance(payload, list):
            for item in payload:
                nested = self._extract_message(item)
                if nested:
                    return nested
        return ""

    def _retry_delay(self, error: Exception | None, attempt: int) -> int:
        text = str(error or "")
        if "429" in text or "速率限制" in text or "rate limit" in text.lower():
            return min(10 * (attempt + 1), 30)
        return min(2**attempt, 4)

    def _guess_mime_type(self, filename: str) -> str:
        lower = (filename or "").lower()
        if lower.endswith(".pdf"):
            return "application/pdf"
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
        return "application/octet-stream"
