"""
Embedding Service — vector storage & retrieval with ChromaDB.

Provides:
- Document chunk embedding and indexing
- Vector similarity search
- Hybrid search (keyword + vector fusion)
- Collection management per domain (materials, papers, cases, questions)
"""

from __future__ import annotations

import uuid
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings

settings = get_settings()


class EmbeddingService:
    """Manages ChromaDB collections for RAG vector search."""

    def __init__(self):
        self._client: chromadb.ClientAPI | None = None
        self._collections: dict[str, chromadb.Collection] = {}

    @property
    def client(self) -> chromadb.ClientAPI:
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    @property
    def available(self) -> bool:
        try:
            _ = self.client
            return True
        except Exception:
            return False

    # ── Collection Management ─────────────────────────────────────

    def get_collection(self, name: str) -> chromadb.Collection:
        if name not in self._collections:
            try:
                self._collections[name] = self.client.get_collection(name)
            except Exception:
                self._collections[name] = self.client.create_collection(
                    name=name,
                    metadata={"hnsw:space": "cosine"},
                )
        return self._collections[name]

    # ── Indexing ──────────────────────────────────────────────────

    def index_chunks(
        self,
        collection_name: str,
        chunks: list[str],
        metadatas: list[dict[str, Any]] | None = None,
        ids: list[str] | None = None,
        embeddings: list[list[float]] | None = None,
    ) -> list[str]:
        """Index document chunks into a vector collection.

        If embeddings are not provided, ChromaDB will generate them using its
        built-in embedding function (requires configured embedding backend).

        Returns the list of chunk IDs.
        """
        if not chunks:
            return []

        coll = self.get_collection(collection_name)

        if ids is None:
            ids = [str(uuid.uuid4()) for _ in chunks]
        if metadatas is None:
            metadatas = [{} for _ in chunks]

        coll.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas,
            embeddings=embeddings,
        )
        return ids

    def delete_by_material(self, collection_name: str, material_id: int) -> int:
        """Delete all chunks belonging to a material."""
        coll = self.get_collection(collection_name)
        results = coll.get(where={"material_id": material_id})
        if results["ids"]:
            coll.delete(ids=results["ids"])
            return len(results["ids"])
        return 0

    # ── Search ────────────────────────────────────────────────────

    def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        query_embedding: list[float] | None = None,
    ) -> list[dict[str, Any]]:
        """Vector similarity search in a collection.

        Returns list of {id, content, metadata, score}.
        """
        coll = self.get_collection(collection_name)

        kwargs: dict[str, Any] = {
            "query_texts": [query],
            "n_results": top_k,
        }
        if where:
            kwargs["where"] = where
        if query_embedding:
            kwargs["query_embeddings"] = [query_embedding]

        results = coll.query(**kwargs)

        hits: list[dict[str, Any]] = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                hits.append({
                    "id": doc_id,
                    "content": results["documents"][0][i] if results["documents"] else "",
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "score": results["distances"][0][i] if results["distances"] else 0.0,
                })
        return hits

    def hybrid_search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        keyword_weight: float = 0.3,
    ) -> list[dict[str, Any]]:
        """Hybrid search combining vector similarity with keyword matching.

        Falls back to pure vector search when keyword matches are unavailable.
        """
        vector_results = self.search(collection_name, query, top_k * 2, where)

        if not vector_results:
            return []

        # Boost results that contain exact query keywords
        query_terms = set(query.lower().split())
        for hit in vector_results:
            content_lower = hit["content"].lower()
            keyword_hits = sum(1 for term in query_terms if term in content_lower)
            keyword_bonus = (keyword_hits / max(len(query_terms), 1)) * keyword_weight
            hit["score"] = hit.get("score", 0.5) * (1 - keyword_weight) + keyword_bonus

        vector_results.sort(key=lambda h: h.get("score", 0), reverse=True)
        return vector_results[:top_k]

    # ── Collection Stats ──────────────────────────────────────────

    def collection_stats(self, name: str) -> dict[str, Any]:
        """Get statistics for a collection."""
        try:
            coll = self.get_collection(name)
            return {
                "name": name,
                "count": coll.count(),
            }
        except Exception:
            return {"name": name, "count": 0, "error": "unavailable"}

    def list_collections(self) -> list[str]:
        return self.client.list_collections()
