"""
Ingestion Service — LLM-powered document parsing, chunking, summarization.
"""

from __future__ import annotations

import os, re, uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Material, MaterialChunk, MaterialStatus
from app.services.llm import get_llm
from app.services.embedding import EmbeddingService
from app.services.prompts import MATERIAL_SUMMARY_SYSTEM, MATERIAL_SUMMARY_USER, MATERIAL_SUMMARY_SCHEMA

settings = get_settings()


def _utcnow():
    return datetime.now(timezone.utc)


class IngestionService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.vector = EmbeddingService()

    # ── Upload & Parse ───────────────────────────────────────────

    def create_material(self, filename: str, file_type: str, file_size: int,
                        course_id: int | None = None, chapter_id: int | None = None) -> Material:
        material = Material(course_id=course_id, chapter_id=chapter_id, filename=filename,
                            file_type=file_type, file_size_bytes=file_size, status=MaterialStatus.uploading)
        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)
        return material

    def process_material(self, material_id: int, content: str) -> Material:
        material = self.db.query(Material).filter(Material.id == material_id).first()
        if not material: raise ValueError(f"Material {material_id} not found")

        try:
            material.status = MaterialStatus.processing
            self.db.commit()

            material.content_text = content
            chunks = self._chunk_text(content)
            material.chunk_count = len(chunks)

            for i, chunk_text in enumerate(chunks):
                chunk = MaterialChunk(material_id=material_id, chunk_index=i, content=chunk_text,
                                      token_count=len(chunk_text), embedding_id=str(uuid.uuid4()))
                self.db.add(chunk)

            material.status = MaterialStatus.done
            self.db.commit()
            self.db.refresh(material)

            # Index into vector DB
            try:
                self.vector.index_chunks(
                    "course_materials",
                    chunks,
                    [{"material_id": material_id, "chunk_index": i, "filename": material.filename} for i in range(len(chunks))],
                    [f"mat-{material_id}-chunk-{i}" for i in range(len(chunks))],
                )
            except Exception:
                pass  # vector indexing is best-effort

            return material
        except Exception as e:
            material.status = MaterialStatus.error
            material.error_message = str(e)
            self.db.commit()
            raise

    # ── LLM-Powered Summarization ────────────────────────────────

    def summarize_material(self, material_id: int) -> dict[str, Any]:
        """LLM analysis of uploaded material content."""
        material = self.get_material(material_id)
        if not material: return {"error": "Material not found"}

        if self.llm.available:
            try:
                user_prompt = MATERIAL_SUMMARY_USER.format(content=material.content_text[:4000])
                return self.llm.generate_json(
                    system_prompt=MATERIAL_SUMMARY_SYSTEM, user_prompt=user_prompt,
                    schema=MATERIAL_SUMMARY_SCHEMA, temperature=0.3,
                )
            except Exception:
                pass

        # Fallback: basic stats
        text = material.content_text or ""
        return {
            "title": material.filename,
            "subject_area": "生物学",
            "key_concepts": [],
            "knowledge_relations": [],
            "difficulty_level": "基础",
            "suggested_prerequisites": [],
            "teaching_suggestions": [],
            "word_count": len(text),
            "chunk_count": material.chunk_count,
        }

    # ── Chunking ─────────────────────────────────────────────────

    def _chunk_text(self, text: str) -> list[str]:
        chunk_size = settings.CHUNK_SIZE
        chunk_overlap = settings.CHUNK_OVERLAP
        if not text or not text.strip(): return []
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        paragraphs = text.split("\n\n")

        chunks: list[str] = []
        current = ""
        for para in paragraphs:
            para = para.strip()
            if not para: continue
            if len(current) + len(para) + 1 <= chunk_size:
                current = (current + "\n" + para).strip() if current else para
            else:
                if current: chunks.append(current)
                if len(para) > chunk_size:
                    chunks.extend(self._split_long_paragraph(para, chunk_size, chunk_overlap))
                    current = ""
                else:
                    current = para
        if current: chunks.append(current)

        if chunk_overlap > 0 and len(chunks) > 1:
            overlapped = [chunks[0]]
            for i in range(1, len(chunks)):
                prev = chunks[i - 1]
                curr = chunks[i]
                if len(prev) > chunk_overlap:
                    curr = prev[-chunk_overlap:] + "\n" + curr
                overlapped.append(curr)
            return overlapped
        return chunks

    def _split_long_paragraph(self, text: str, max_len: int, overlap: int) -> list[str]:
        sentences = re.split(r"(?<=[。，；！？\.\,\;\?\!])", text)
        result, current = [], ""
        for sent in sentences:
            if len(current) + len(sent) <= max_len:
                current += sent
            else:
                if current: result.append(current.strip())
                if len(sent) > max_len:
                    for i in range(0, len(sent), max_len - overlap):
                        result.append(sent[i:i + max_len].strip())
                else:
                    current = sent
        if current.strip(): result.append(current.strip())
        return result

    # ── Material CRUD ────────────────────────────────────────────

    def get_material(self, material_id: int) -> Material | None:
        return self.db.query(Material).filter(Material.id == material_id).first()

    def list_materials(self, course_id: int | None = None, status: str | None = None,
                       page: int = 1, page_size: int = 20) -> tuple[list[Material], int]:
        q = self.db.query(Material)
        if course_id is not None: q = q.filter(Material.course_id == course_id)
        if status: q = q.filter(Material.status == status)
        total = q.count()
        items = q.order_by(Material.uploaded_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def delete_material(self, material_id: int) -> bool:
        material = self.get_material(material_id)
        if not material: return False
        self.db.query(MaterialChunk).filter(MaterialChunk.material_id == material_id).delete()
        self.db.delete(material)
        self.db.commit()
        try: self.vector.delete_by_material("course_materials", material_id)
        except Exception: pass
        return True

    @staticmethod
    def extract_text_from_txt(content: bytes) -> str:
        for enc in ["utf-8", "gbk", "utf-8"]:
            try: return content.decode(enc)
            except UnicodeDecodeError: continue
        return content.decode("utf-8", errors="replace")

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            import fitz; doc = fitz.open(file_path)
            text = "".join(page.get_text() + "\n" for page in doc)
            doc.close(); return text
        except ImportError: return "[PDF解析需要 PyMuPDF]"

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            from docx import Document
            return "\n".join(p.text for p in Document(file_path).paragraphs)
        except ImportError: return "[DOCX解析需要 python-docx]"
