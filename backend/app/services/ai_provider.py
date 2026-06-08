from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import get_settings


AI_ERROR_TYPES = {
    "not_configured",
    "auth_error",
    "insufficient_balance",
    "rate_limited",
    "timeout",
    "network_error",
    "invalid_json",
    "schema_invalid",
    "unknown_error",
}


@dataclass
class AIResult:
    success: bool
    content: dict | None
    error_type: str | None
    source_mode: str
    raw_text: str | None = None


class GLMAIProvider:
    """Small GLM chat client with defensive error mapping."""

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.resolved_llm_api_key()
        self.base_url = settings.resolved_llm_base_url().rstrip("/")
        self.model = settings.resolved_llm_model() or "glm-4-flash"
        self.timeout = max(1, min(settings.GLM_TIMEOUT_SECONDS or 30, 30))

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        required_fields: list[str],
        temperature: float = 0.2,
        max_tokens: int = 1800,
        retries: int = 2,
        timeout_seconds: int | float | None = None,
    ) -> AIResult:
        if not self.api_key:
            return AIResult(False, None, "not_configured", "local_fallback")
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
            "thinking": {"type": "disabled"},
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error: AIResult | None = None
        request_timeout = max(1, min(float(timeout_seconds or self.timeout), 30))
        async with httpx.AsyncClient(timeout=request_timeout, trust_env=False) as client:
            for attempt in range(retries + 1):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                except httpx.TimeoutException:
                    last_error = AIResult(False, None, "timeout", "local_fallback")
                    if attempt < retries:
                        await _sleep_retry(attempt)
                        continue
                    return last_error
                except httpx.NetworkError:
                    last_error = AIResult(False, None, "network_error", "local_fallback")
                    if attempt < retries:
                        await _sleep_retry(attempt)
                        continue
                    return last_error
                except httpx.HTTPError:
                    last_error = AIResult(False, None, "network_error", "local_fallback")
                    if attempt < retries:
                        await _sleep_retry(attempt)
                        continue
                    return last_error
                except Exception:
                    last_error = AIResult(False, None, "unknown_error", "local_fallback")
                    if attempt < retries:
                        await _sleep_retry(attempt)
                        continue
                    return last_error

                if response.status_code in (401, 403):
                    return AIResult(False, None, "auth_error", "local_fallback", response.text[:1000])
                if response.status_code == 402 or _looks_like_balance_error(response.text):
                    return AIResult(False, None, "insufficient_balance", "local_fallback", response.text[:1000])
                if response.status_code == 429 or _looks_like_rate_limit_error(response.text):
                    last_error = AIResult(False, None, "rate_limited", "local_fallback", response.text[:1000])
                    if attempt < retries:
                        await _sleep_retry(attempt, response.text)
                        continue
                    return last_error
                if response.status_code >= 400:
                    return AIResult(False, None, "unknown_error", "local_fallback", response.text[:1000])

                try:
                    data = response.json()
                    raw_text = _extract_message_content(data)
                except Exception:
                    return AIResult(False, None, "invalid_json", "local_fallback", response.text[:1000])

                if not raw_text:
                    last_error = AIResult(False, None, "invalid_json", "local_fallback", response.text[:1000])
                    if attempt < retries:
                        await _sleep_retry(attempt, response.text)
                        continue
                    return last_error

                try:
                    parsed = _extract_json_object(raw_text)
                except Exception:
                    return AIResult(False, None, "invalid_json", "local_fallback", raw_text[:2000])

                parsed = _unwrap_structured_payload(parsed, required_fields)

                if not _has_required_fields(parsed, required_fields):
                    return AIResult(False, parsed, "schema_invalid", "local_fallback", raw_text[:2000])

                return AIResult(True, parsed, None, "ai_grounded", raw_text)

        return last_error or AIResult(False, None, "unknown_error", "local_fallback")


def _looks_like_balance_error(text: str) -> bool:
    lowered = (text or "").lower()
    return any(token in lowered for token in ("insufficient balance", "balance", "quota"))


def _looks_like_rate_limit_error(text: str) -> bool:
    lowered = (text or "").lower()
    return any(token in lowered for token in ("1302", "1305", "rate limit", "访问量过大", "速率限制"))


def _extract_json_object(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(raw[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("JSON root must be an object")
    return parsed


def _has_required_fields(value: dict[str, Any], required_fields: list[str]) -> bool:
    for field in required_fields:
        if field not in value:
            return False
        item = value[field]
        if item is None:
            return False
        if isinstance(item, str) and not item.strip():
            return False
        if isinstance(item, list) and len(item) == 0:
            return False
    return True


def _unwrap_structured_payload(value: dict[str, Any], required_fields: list[str]) -> dict[str, Any]:
    if _has_required_fields(value, required_fields):
        return value

    for key in ("answer", "data", "result", "payload"):
        nested = value.get(key)
        if isinstance(nested, dict) and _has_required_fields(nested, required_fields):
            return nested

    return value


def _extract_message_content(data: dict[str, Any]) -> str:
    message = (((data.get("choices") or [{}])[0]).get("message") or {})
    content = message.get("content")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "".join(
            item.get("text", "") if isinstance(item, dict) else str(item or "")
            for item in content
        ).strip()
    return ""


async def _sleep_retry(attempt: int, text: str = "") -> None:
    import asyncio

    lowered = (text or "").lower()
    base = 6 if any(token in lowered for token in ("1302", "1305", "rate limit")) else 2
    await asyncio.sleep(base * (attempt + 1))
