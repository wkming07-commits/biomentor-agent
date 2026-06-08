"""
Backend file extraction service backed entirely by GLM.

Routing rules:
- images / PDFs -> GLM layout parsing
- office/text files -> GLM file parser
No local OCR is used.
"""

from __future__ import annotations

from typing import Any

from app.services.glm_file_parser import GLMFileParserService
from app.services.glm_vision_parser import GLMVisionParserService


class OcrService:
    def __init__(self) -> None:
        self._vision_parser = GLMVisionParserService()
        self._file_parser = GLMFileParserService()

    def extract(self, file_bytes: bytes, mime_type: str, filename: str = "") -> dict[str, Any]:
        try:
            parsed = self._select_parser(mime_type, filename).parse_bytes(file_bytes, mime_type, filename)
        except Exception as exc:
            return {
                "success": False,
                "error": str(exc),
                "text": "",
                "engine": "glm",
                "filename": filename,
                "char_count": 0,
            }

        text = parsed.text.strip()
        if len(text) > 20000:
            text = text[:20000] + "\n\n[truncated to first 20000 chars]"

        return {
            "success": True,
            "text": text,
            "engine": parsed.engine,
            "filename": filename,
            "char_count": len(text),
            "parsing_result_url": getattr(parsed, "parsing_result_url", ""),
            "page_count": getattr(parsed, "page_count", 0),
        }

    def _select_parser(self, mime_type: str, filename: str):
        lower = (filename or "").lower()
        if lower.endswith(".pdf") or mime_type == "application/pdf":
            return self._file_parser
        if (mime_type or "").startswith("image/") or lower.endswith(
            (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")
        ):
            return self._vision_parser
        return self._file_parser
