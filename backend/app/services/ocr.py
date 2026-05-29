"""
Real OCR Service — Extract text from uploaded files.
- PDF: PyMuPDF (fitz)
- DOCX: python-docx
- Images: DeepSeek Vision API (base64 → text)
"""

from __future__ import annotations

import base64
import io
import json
import os
from typing import Any

import fitz  # PyMuPDF
from docx import Document
from openai import OpenAI


class OcrService:
    """Extract text from PDF, DOCX, and images using real tools."""

    # MIME type → handler map
    MIME_MAP = {
        "application/pdf": "pdf",
        "image/png": "image",
        "image/jpeg": "image",
        "image/jpg": "image",
        "image/webp": "image",
        "image/bmp": "image",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "text",
        "text/markdown": "text",
    }

    def __init__(self):
        self._vision_client: OpenAI | None = None

    @property
    def vision_client(self) -> OpenAI:
        if self._vision_client is None:
            api_key = os.getenv("OPENAI_API_KEY", "")
            base_url = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
            self._vision_client = OpenAI(api_key=api_key, base_url=base_url)
        return self._vision_client

    def extract(self, file_bytes: bytes, mime_type: str, filename: str = "") -> dict[str, Any]:
        """Main entry: extract text from any supported file type."""
        clean_name = filename.rsplit(".", 1)[0] if filename else "untitled"
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        handler_type = self.MIME_MAP.get(mime_type)
        if not handler_type:
            # Try by extension
            if ext in ("pdf",):
                handler_type = "pdf"
            elif ext in ("png", "jpg", "jpeg", "webp", "bmp"):
                handler_type = "image"
            elif ext in ("docx",):
                handler_type = "docx"
            elif ext in ("txt", "md"):
                handler_type = "text"

        if handler_type == "pdf":
            text = self._extract_pdf(file_bytes)
            engine = "PyMuPDF"
        elif handler_type == "image":
            text = self._extract_image(file_bytes, mime_type)
            engine = "DeepSeek Vision"
        elif handler_type == "docx":
            text = self._extract_docx(file_bytes)
            engine = "python-docx"
        elif handler_type == "text":
            text = file_bytes.decode("utf-8", errors="replace")
            engine = "utf-8"
        else:
            # Try as text
            try:
                text = file_bytes.decode("utf-8", errors="replace")
                engine = "utf-8 fallback"
            except Exception:
                return {"success": False, "error": f"不支持的文件类型: {mime_type}", "text": "", "engine": "none"}

        # Truncate very long text
        if len(text) > 10000:
            text = text[:10000] + "\n\n…(内容过长，已截断前10000字符)"

        return {
            "success": True,
            "text": text.strip(),
            "engine": engine,
            "filename": filename,
            "char_count": len(text),
        }

    def _extract_pdf(self, data: bytes) -> str:
        """Extract text from PDF using PyMuPDF."""
        doc = fitz.open(stream=data, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        doc.close()
        return "\n\n".join(pages)

    def _extract_docx(self, data: bytes) -> str:
        """Extract text from DOCX using python-docx."""
        doc = Document(io.BytesIO(data))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)

    def _extract_image(self, data: bytes, mime_type: str) -> str:
        """Extract text from image using DeepSeek Vision API."""
        try:
            image_b64 = base64.b64encode(data).decode("utf-8")
            data_uri = f"data:{mime_type};base64,{image_b64}"

            response = self.vision_client.chat.completions.create(
                model=os.getenv("LLM_MODEL", "deepseek-chat"),
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "请仔细识别这张图片中的所有中文和英文文本内容，逐字逐句输出，不要遗漏任何文字。如果是课本或教材内容，请保留原文格式（段落、标题等）。只输出识别到的文字，不要加任何解释。",
                            },
                            {"type": "image_url", "image_url": {"url": data_uri}},
                        ],
                    }
                ],
                max_tokens=4000,
                temperature=0.1,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"[OCR 识别失败: {str(e)}]"
