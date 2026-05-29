"""
Knowledge Service — RAG retrieval, hybrid search, chunk management.

Design: metadata-first hybrid RAG. Filter by course/chapter/knowledge_point
first, then vector-semantic recall top-k, then optional LLM rerank.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    MaterialChunk,
    Material,
    KnowledgePoint,
    ResearchPaper,
    IndustryCase,
)
from app.schemas import RAGSearchResult

settings = get_settings()


class KnowledgeService:

    def __init__(self, db: Session):
        self.db = db

    # ----- Chunk CRUD -----

    def get_chunks_by_material(self, material_id: int) -> list[MaterialChunk]:
        return (
            self.db.query(MaterialChunk)
            .filter(MaterialChunk.material_id == material_id)
            .order_by(MaterialChunk.chunk_index)
            .all()
        )

    def get_chunk(self, chunk_id: int) -> MaterialChunk | None:
        return self.db.query(MaterialChunk).filter(MaterialChunk.id == chunk_id).first()

    # ----- Metadata-filtered Keyword Search (no embedding fallback) -----

    def keyword_search_chunks(
        self,
        query: str,
        course_id: int | None = None,
        top_k: int = 5,
    ) -> list[RAGSearchResult]:
        q = self.db.query(MaterialChunk).join(Material)

        if course_id is not None:
            q = q.filter(Material.course_id == course_id)

        q = q.filter(Material.status == "done")
        q = q.filter(MaterialChunk.content.contains(query))

        chunks = q.limit(top_k).all()

        results: list[RAGSearchResult] = []
        for c in chunks:
            results.append(RAGSearchResult(
                chunk_id=c.id,
                content=c.content,
                score=0.5,
                source={
                    "material_id": c.material_id,
                    "filename": c.material.filename if c.material else "",
                    "chunk_index": c.chunk_index,
                },
            ))
        return results

    def search_all(
        self,
        query: str,
        course_id: int | None = None,
        top_k: int = 5,
    ) -> dict[str, Any]:
        """Hybrid search across chunks, papers, and knowledge points."""
        chunk_results = self.keyword_search_chunks(query, course_id, top_k)

        papers = (
            self.db.query(ResearchPaper)
            .filter(
                ResearchPaper.title.contains(query)
                | ResearchPaper.title_zh.contains(query)
                | ResearchPaper.abstract.contains(query)
            )
            .limit(top_k)
            .all()
        )

        kps = (
            self.db.query(KnowledgePoint)
            .filter(
                KnowledgePoint.name.contains(query)
                | KnowledgePoint.definition.contains(query)
            )
            .limit(top_k)
            .all()
        )

        return {
            "query": query,
            "chunks": [
                {"id": r.chunk_id, "content": r.content[:400], "score": r.score, "source": r.source}
                for r in chunk_results
            ],
            "papers": [
                {
                    "id": p.id,
                    "title": p.title,
                    "title_zh": p.title_zh,
                    "direction": p.direction,
                    "core_problem": p.core_problem[:200],
                }
                for p in papers
            ],
            "knowledge_points": [
                {"id": kp.id, "name": kp.name, "definition": kp.definition[:200]}
                for kp in kps
            ],
        }

    # ----- Knowledge Point CRUD -----

    def list_knowledge_points(self, chapter_id: int | None = None) -> list[KnowledgePoint]:
        q = self.db.query(KnowledgePoint)
        if chapter_id is not None:
            q = q.filter(KnowledgePoint.chapter_id == chapter_id)
        return q.order_by(KnowledgePoint.order).all()

    def get_knowledge_point(self, kp_id: int) -> KnowledgePoint | None:
        return self.db.query(KnowledgePoint).filter(KnowledgePoint.id == kp_id).first()

    def create_knowledge_point(self, chapter_id: int, data: dict) -> KnowledgePoint:
        kp = KnowledgePoint(chapter_id=chapter_id, **data)
        self.db.add(kp)
        self.db.commit()
        self.db.refresh(kp)
        return kp
