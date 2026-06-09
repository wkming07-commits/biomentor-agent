"""
Milvus vector storage and retrieval service for RAG.

The public interface is intentionally stable for the rest of the backend:
index_chunks, search, hybrid_search, delete_by_where and collection_stats.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import uuid
from pathlib import Path
from typing import Any

from app.config import get_settings

settings = get_settings()


class EmbeddingService:
    """Manages Milvus vector collections for RAG search."""

    def __init__(self):
        self.backend = "milvus"
        self._client: Any | None = None
        self._collections: set[str] = set()
        self._import_error: Exception | None = None

    @property
    def client(self) -> Any:
        if self._client is None:
            try:
                self._client = self._create_client()
            except Exception as exc:
                self._import_error = exc
                raise
        return self._client

    @property
    def available(self) -> bool:
        try:
            _ = self.client
            return True
        except Exception:
            return False

    def _create_client(self) -> Any:
        from pymilvus import MilvusClient

        uri = (settings.MILVUS_URI or "").strip()
        if uri and not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", uri):
            Path(uri).parent.mkdir(parents=True, exist_ok=True)

        kwargs: dict[str, Any] = {"uri": uri}
        if settings.MILVUS_TOKEN:
            kwargs["token"] = settings.MILVUS_TOKEN
        if settings.MILVUS_DB_NAME and uri.startswith(("http://", "https://", "tcp://", "grpc://")):
            kwargs["db_name"] = settings.MILVUS_DB_NAME
        return MilvusClient(**kwargs)

    def get_collection(self, name: str) -> str:
        return self._ensure_collection(name)

    def _ensure_collection(self, name: str) -> str:
        if name in self._collections:
            return name

        from pymilvus import DataType, MilvusClient

        client: MilvusClient = self.client
        if not client.has_collection(collection_name=name):
            schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=True)
            schema.add_field(field_name="id", datatype=DataType.VARCHAR, is_primary=True, max_length=512)
            schema.add_field(field_name="content", datatype=DataType.VARCHAR, max_length=65535)
            schema.add_field(field_name="metadata_json", datatype=DataType.VARCHAR, max_length=65535)
            schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=settings.MILVUS_VECTOR_DIM)

            index_params = client.prepare_index_params()
            index_params.add_index(
                field_name="vector",
                index_type="AUTOINDEX",
                metric_type=settings.MILVUS_METRIC_TYPE,
            )
            client.create_collection(collection_name=name, schema=schema, index_params=index_params)
        self._load_collection(name)
        self._collections.add(name)
        return name

    def _load_collection(self, name: str) -> None:
        try:
            self.client.load_collection(collection_name=name)
        except Exception:
            pass

    def drop_collection(self, name: str) -> bool:
        if not self.available:
            return False
        if self.client.has_collection(collection_name=name):
            try:
                self.client.release_collection(collection_name=name)
            except Exception:
                pass
            self.client.drop_collection(collection_name=name)
            self._collections.discard(name)
            return True
        self._collections.discard(name)
        return False

    def index_chunks(
        self,
        collection_name: str,
        chunks: list[str],
        metadatas: list[dict[str, Any]] | None = None,
        ids: list[str] | None = None,
        embeddings: list[list[float]] | None = None,
    ) -> list[str]:
        """Index document chunks into a Milvus collection and return chunk IDs."""
        if not chunks:
            return []
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in chunks]
        if metadatas is None:
            metadatas = [{} for _ in chunks]
        if not self.available:
            return ids

        self.get_collection(collection_name)
        vectors = embeddings or [self._embed_text(chunk) for chunk in chunks]
        rows = []
        for idx, chunk in enumerate(chunks):
            metadata = metadatas[idx] if idx < len(metadatas) and isinstance(metadatas[idx], dict) else {}
            row: dict[str, Any] = {
                "id": ids[idx],
                "content": str(chunk)[:65000],
                "metadata_json": self._json_dumps(metadata)[:65000],
                "vector": self._coerce_vector(vectors[idx] if idx < len(vectors) else None),
            }
            row.update(self._dynamic_metadata_fields(metadata))
            rows.append(row)
        if rows:
            self.client.insert(collection_name=collection_name, data=rows)
            try:
                self.client.flush(collection_name=collection_name)
            except Exception:
                pass
        return ids

    def delete_by_material(self, collection_name: str, material_id: int) -> int:
        """Delete all chunks belonging to a material."""
        return self.delete_by_where(collection_name, {"material_id": material_id})

    def delete_by_where(self, collection_name: str, where: dict[str, Any]) -> int:
        """Delete all chunks matching a metadata filter."""
        if not self.available:
            return 0
        self.get_collection(collection_name)
        expr = self._filter_expr(where)
        if not expr:
            return 0
        rows = self.client.query(collection_name=collection_name, filter=expr, output_fields=["id"], limit=16384)
        ids = [str(row.get("id")) for row in rows if row.get("id")]
        if not ids:
            return 0
        self.client.delete(collection_name=collection_name, ids=ids)
        return len(ids)

    def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        query_embedding: list[float] | None = None,
    ) -> list[dict[str, Any]]:
        """Vector similarity search returning {id, content, metadata, score}."""
        if not self.available:
            return []
        self.get_collection(collection_name)
        vector = self._coerce_vector(query_embedding or self._embed_text(query))
        search_kwargs: dict[str, Any] = {
            "collection_name": collection_name,
            "data": [vector],
            "anns_field": "vector",
            "limit": top_k,
            "output_fields": ["content", "metadata_json"],
            "search_params": {"metric_type": settings.MILVUS_METRIC_TYPE, "params": {}},
        }
        expr = self._filter_expr(where)
        if expr:
            search_kwargs["filter"] = expr
        results = self.client.search(**search_kwargs)

        hits: list[dict[str, Any]] = []
        for hit in (results[0] if results else []):
            entity = hit.get("entity") or {}
            metadata = self._json_loads(entity.get("metadata_json") or "{}")
            hits.append({
                "id": str(hit.get("id") or entity.get("id") or ""),
                "content": entity.get("content", ""),
                "metadata": metadata,
                "score": float(hit.get("distance", 0.0) or 0.0),
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
        """Hybrid search combining vector similarity with keyword matching."""
        vector_results = self.search(collection_name, query, top_k * 2, where)
        if not vector_results:
            return []

        query_terms = set(query.lower().split())
        for rank, hit in enumerate(vector_results):
            content_lower = hit["content"].lower()
            keyword_hits = sum(1 for term in query_terms if term in content_lower)
            keyword_bonus = (keyword_hits / max(len(query_terms), 1)) * keyword_weight
            distance = float(hit.get("score", 1.0) or 1.0)
            vector_similarity = 1.0 / (1.0 + max(distance, 0.0))
            rank_bonus = max(0.0, (len(vector_results) - rank) / max(len(vector_results), 1)) * 0.05
            hit["distance"] = distance
            hit["score"] = vector_similarity * (1 - keyword_weight) + keyword_bonus + rank_bonus

        vector_results.sort(key=lambda h: h.get("score", 0), reverse=True)
        return vector_results[:top_k]

    def collection_stats(self, name: str) -> dict[str, Any]:
        """Get statistics for a Milvus collection."""
        try:
            self.get_collection(name)
            stats = self.client.get_collection_stats(collection_name=name)
            count = stats.get("row_count") or stats.get("num_entities") or stats.get("count") or 0
            return {"name": name, "backend": self.backend, "count": int(count)}
        except Exception as exc:
            return {"name": name, "backend": self.backend, "count": 0, "error": str(exc) or "unavailable"}

    def list_collections(self) -> list[str]:
        if not self.available:
            return []
        return list(self.client.list_collections())

    def _embed_text(self, text: str) -> list[float]:
        """Deterministic local embedding used by the Milvus index."""
        dim = max(8, int(settings.MILVUS_VECTOR_DIM or 384))
        tokens = self._tokenize(text)
        vector = [0.0] * dim
        for token in tokens:
            digest = hashlib.blake2b(token.encode("utf-8", errors="ignore"), digest_size=16).digest()
            index = int.from_bytes(digest[:4], "little") % dim
            sign = -1.0 if digest[4] & 1 else 1.0
            weight = 1.0 + min(len(token), 12) / 12.0
            vector[index] += sign * weight
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def _tokenize(self, text: str) -> list[str]:
        value = (text or "").lower()
        tokens = re.findall(r"[a-z0-9_]+|[\u4e00-\u9fff]", value)
        if not tokens and value.strip():
            tokens = [value.strip()[:128]]
        return tokens[:4096]

    def _coerce_vector(self, vector: list[float] | None) -> list[float]:
        dim = max(8, int(settings.MILVUS_VECTOR_DIM or 384))
        values = [float(item) for item in (vector or [])[:dim]]
        if len(values) < dim:
            values.extend([0.0] * (dim - len(values)))
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [value / norm for value in values]

    def _dynamic_metadata_fields(self, metadata: dict[str, Any]) -> dict[str, Any]:
        fields: dict[str, Any] = {}
        for key, value in metadata.items():
            if not self._valid_field_name(key):
                continue
            if isinstance(value, (bool, int, float, str)):
                fields[key] = value
        return fields

    def _filter_expr(self, where: dict[str, Any] | None) -> str:
        if not where:
            return ""
        parts = []
        for key, value in where.items():
            if not self._valid_field_name(key):
                continue
            if isinstance(value, bool):
                parts.append(f"{key} == {str(value).lower()}")
            elif isinstance(value, (int, float)):
                parts.append(f"{key} == {value}")
            elif isinstance(value, str):
                escaped = value.replace("\\", "\\\\").replace('"', '\\"')
                parts.append(f'{key} == "{escaped}"')
        return " and ".join(parts)

    def _valid_field_name(self, key: str) -> bool:
        return bool(re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,63}", str(key or "")))

    def _json_dumps(self, value: Any) -> str:
        try:
            return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        except Exception:
            return "{}"

    def _json_loads(self, value: str) -> dict[str, Any]:
        try:
            loaded = json.loads(value or "{}")
            return loaded if isinstance(loaded, dict) else {}
        except Exception:
            return {}