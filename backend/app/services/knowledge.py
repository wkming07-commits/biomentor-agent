"""
Knowledge Service — LLM-powered RAG retrieval with hybrid search.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import MaterialChunk, Material, KnowledgePoint, ResearchPaper
from app.services.llm import get_llm
from app.services.embedding import EmbeddingService
from app.services.prompts import RAG_SYNTHESIS_SYSTEM, RAG_SYNTHESIS_USER


class KnowledgeService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.vector = EmbeddingService()

    # ── Chunk CRUD ───────────────────────────────────────────────

    def get_chunks_by_material(self, material_id: int) -> list[MaterialChunk]:
        return self.db.query(MaterialChunk).filter(MaterialChunk.material_id == material_id).order_by(MaterialChunk.chunk_index).all()

    def get_chunk(self, chunk_id: int) -> MaterialChunk | None:
        return self.db.query(MaterialChunk).filter(MaterialChunk.id == chunk_id).first()

    # ── Vector Indexing ──────────────────────────────────────────

    def index_material_chunks(self, material_id: int, collection: str = "course_materials") -> int:
        """Index all chunks of a material into vector DB."""
        chunks = self.get_chunks_by_material(material_id)
        if not chunks: return 0

        texts = [c.content for c in chunks]
        metadatas = [{"material_id": material_id, "chunk_index": c.chunk_index, "chunk_id": c.id} for c in chunks]
        ids = [f"mat-{material_id}-chunk-{c.chunk_index}" for c in chunks]

        # Generate embeddings via LLM service
        try:
            embeddings = self.llm.embed(texts)
        except Exception:
            embeddings = None

        return len(self.vector.index_chunks(collection, texts, metadatas, ids, embeddings))

    # ── Hybrid Search ────────────────────────────────────────────

    def search_all(self, query: str, course_id: int | None = None, top_k: int = 5) -> dict[str, Any]:
        """LLM-powered hybrid search across all knowledge sources."""
        context_parts: list[str] = []
        sources: list[dict] = []

        # Vector search in course materials
        try:
            vec_hits = self.vector.hybrid_search("course_materials", query, top_k)
            for h in vec_hits:
                context_parts.append(f"[资料来源 {h['metadata'].get('material_id','?')}]\n{h['content'][:600]}")
                sources.append({"type": "material", "id": h["metadata"].get("material_id"), "content": h["content"][:200]})
        except Exception:
            pass

        # Keyword search in papers
        papers = (
            self.db.query(ResearchPaper)
            .filter(ResearchPaper.title.contains(query) | ResearchPaper.title_zh.contains(query) | ResearchPaper.abstract.contains(query))
            .limit(top_k).all()
        )
        for p in papers:
            context_parts.append(f"[论文 {p.id}] {p.title_zh}: {p.key_finding[:300]}")
            sources.append({"type": "paper", "id": p.id, "title": p.title_zh})

        # Keyword search in KPs
        kps = self.db.query(KnowledgePoint).filter(KnowledgePoint.name.contains(query) | KnowledgePoint.definition.contains(query)).limit(top_k).all()
        kp_list = [{"id": kp.id, "name": kp.name, "definition": kp.definition[:200]} for kp in kps]

        context = "\n\n".join(context_parts) if context_parts else "未找到相关资料。"

        # LLM answer synthesis
        answer = ""
        if self.llm.available and context_parts:
            try:
                user_prompt = RAG_SYNTHESIS_USER.format(query=query, context=context[:3000])
                response = self.llm.generate_text(RAG_SYNTHESIS_SYSTEM, user_prompt, temperature=0.3, max_tokens=800)
                answer = response.content
            except Exception:
                answer = f"根据检索结果，相关内容涉及：{'、'.join(kp['name'] for kp in kp_list[:5])}。"

        return {
            "query": query,
            "answer": answer,
            "sources": sources,
            "knowledge_points": kp_list,
            "papers": [{"id": p.id, "title": p.title_zh, "direction": p.direction} for p in papers],
        }

    # ── Knowledge Point CRUD ─────────────────────────────────────

    def list_knowledge_points(self, chapter_id: int | None = None) -> list[KnowledgePoint]:
        q = self.db.query(KnowledgePoint)
        if chapter_id is not None: q = q.filter(KnowledgePoint.chapter_id == chapter_id)
        return q.order_by(KnowledgePoint.order).all()

    def get_knowledge_point(self, kp_id: int) -> KnowledgePoint | None:
        return self.db.query(KnowledgePoint).filter(KnowledgePoint.id == kp_id).first()

    def create_knowledge_point(self, chapter_id: int, data: dict) -> KnowledgePoint:
        kp = KnowledgePoint(chapter_id=chapter_id, **data)
        self.db.add(kp)
        self.db.commit()
        self.db.refresh(kp)
        return kp
