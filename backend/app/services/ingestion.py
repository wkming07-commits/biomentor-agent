"""
Ingestion Service — material upload, document parsing, chunking, embedding pipeline.
Supports PDF, DOCX, TXT files. Extracts text, splits into chunks, stores metadata.
"""

from __future__ import annotations

import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Material, MaterialChunk, MaterialStatus

settings = get_settings()


def _utcnow():
    return datetime.now(timezone.utc)


class IngestionService:

    def __init__(self, db: Session):
        self.db = db

    # ----- Upload & Parse -----

    def create_material(
        self,
        filename: str,
        file_type: str,
        file_size: int,
        course_id: int | None = None,
        chapter_id: int | None = None,
    ) -> Material:
        material = Material(
            course_id=course_id,
            chapter_id=chapter_id,
            filename=filename,
            file_type=file_type,
            file_size_bytes=file_size,
            status=MaterialStatus.uploading,
        )
        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)
        return material

    def process_material(self, material_id: int, content: str) -> Material:
        """Process uploaded material: save text content, chunk it, and store chunks."""
        material = self.db.query(Material).filter(Material.id == material_id).first()
        if not material:
            raise ValueError(f"Material {material_id} not found")

        try:
            material.status = MaterialStatus.processing
            self.db.commit()

            material.content_text = content

            chunks = self._chunk_text(content)
            material.chunk_count = len(chunks)

            for i, chunk_text in enumerate(chunks):
                chunk = MaterialChunk(
                    material_id=material_id,
                    chunk_index=i,
                    content=chunk_text,
                    token_count=len(chunk_text),
                    embedding_id=str(uuid.uuid4()),
                )
                self.db.add(chunk)

            material.status = MaterialStatus.done
            self.db.commit()
            self.db.refresh(material)
            return material

        except Exception as e:
            material.status = MaterialStatus.error
            material.error_message = str(e)
            self.db.commit()
            raise

    def _chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks for RAG.

        Uses paragraph + sentence-aware splitting. Chinese text aware.
        """
        chunk_size = settings.CHUNK_SIZE
        chunk_overlap = settings.CHUNK_OVERLAP

        if not text or not text.strip():
            return []

        # Normalize whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text)

        # Split by paragraphs first
        paragraphs = text.split("\n\n")

        chunks: list[str] = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) + 1 <= chunk_size:
                current_chunk = (current_chunk + "\n" + para).strip() if current_chunk else para
            else:
                if current_chunk:
                    chunks.append(current_chunk)

                # If paragraph itself exceeds chunk size, split by sentence-like boundaries
                if len(para) > chunk_size:
                    sub_chunks = self._split_long_paragraph(para, chunk_size, chunk_overlap)
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        # Add overlap between consecutive chunks
        if chunk_overlap > 0 and len(chunks) > 1:
            overlapped = [chunks[0]]
            for i in range(1, len(chunks)):
                prev = chunks[i - 1]
                curr = chunks[i]
                if len(prev) > chunk_overlap:
                    overlap_text = prev[-chunk_overlap:]
                    curr = overlap_text + "\n" + curr
                overlapped.append(curr)
            chunks = overlapped

        return chunks

    def _split_long_paragraph(self, text: str, max_len: int, overlap: int) -> list[str]:
        """Split a long paragraph by sentence boundaries (, .  ; ! ?) ."""
        sentences = re.split(r"(?<=[。，；！？\.\,\;\?\!])", text)
        chunks: list[str] = []
        current = ""

        for sent in sentences:
            if len(current) + len(sent) <= max_len:
                current += sent
            else:
                if current:
                    chunks.append(current.strip())
                if len(sent) > max_len:
                    # Force-split very long sentence
                    for i in range(0, len(sent), max_len - overlap):
                        chunks.append(sent[i : i + max_len].strip())
                else:
                    current = sent

        if current.strip():
            chunks.append(current.strip())

        return chunks

    # ----- Material CRUD -----

    def get_material(self, material_id: int) -> Material | None:
        return self.db.query(Material).filter(Material.id == material_id).first()

    def list_materials(
        self, course_id: int | None = None, status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Material], int]:
        q = self.db.query(Material)
        if course_id is not None:
            q = q.filter(Material.course_id == course_id)
        if status:
            q = q.filter(Material.status == status)

        total = q.count()
        items = q.order_by(Material.uploaded_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def delete_material(self, material_id: int) -> bool:
        material = self.get_material(material_id)
        if not material:
            return False
        self.db.query(MaterialChunk).filter(MaterialChunk.material_id == material_id).delete()
        self.db.delete(material)
        self.db.commit()
        return True

    # ----- Text Extraction (delegated to routers, but helpers here) -----

    @staticmethod
    def extract_text_from_txt(content: bytes) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return content.decode("gbk")
            except UnicodeDecodeError:
                return content.decode("utf-8", errors="replace")

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            import fitz
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()
            return text
        except ImportError:
            return "[PDF 解析需要安装 PyMuPDF]"

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            return "[DOCX 解析需要安装 python-docx]"
