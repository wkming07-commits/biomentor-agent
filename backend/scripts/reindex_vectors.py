"""Rebuild vector indexes for the configured vector backend.

Examples:
  VECTOR_BACKEND=milvus python backend/scripts/reindex_vectors.py --all --clear
  VECTOR_BACKEND=chroma python backend/scripts/reindex_vectors.py --papers
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import get_settings
from app.database import SessionLocal
from app.models import Material, MaterialChunk, ResearchPaper
from app.services.embedding import EmbeddingService
from app.services.papers import PaperService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rebuild material and paper vector indexes.")
    parser.add_argument("--all", action="store_true", help="Reindex materials and papers.")
    parser.add_argument("--materials", action="store_true", help="Reindex course materials.")
    parser.add_argument("--papers", action="store_true", help="Reindex research papers.")
    parser.add_argument("--clear", action="store_true", help="Delete existing vectors before reindexing.")
    return parser.parse_args()


def reindex_materials(db, vector: EmbeddingService, clear: bool) -> int:
    settings = get_settings()
    collection = settings.CHROMA_COLLECTION_MATERIALS
    total = 0

    material_ids = [row[0] for row in db.query(Material.id).order_by(Material.id).all()]
    for material_id in material_ids:
        chunks = (
            db.query(MaterialChunk)
            .filter(MaterialChunk.material_id == material_id)
            .order_by(MaterialChunk.chunk_index)
            .all()
        )
        if not chunks:
            continue
        if clear:
            vector.delete_by_material(collection, material_id)
        texts = [chunk.content for chunk in chunks]
        ids = [f"mat-{material_id}-chunk-{chunk.chunk_index}" for chunk in chunks]
        metadatas = [
            {
                "material_id": material_id,
                "chunk_index": chunk.chunk_index,
                "chunk_id": chunk.id,
            }
            for chunk in chunks
        ]
        vector.index_chunks(collection, texts, metadatas=metadatas, ids=ids)
        total += len(chunks)
        print(f"materials: indexed material_id={material_id} chunks={len(chunks)}")
    return total


def reindex_papers(db, clear: bool) -> int:
    service = PaperService(db)
    settings = get_settings()
    paper_ids = [row[0] for row in db.query(ResearchPaper.id).order_by(ResearchPaper.id).all()]
    total = 0
    for paper_id in paper_ids:
        if clear:
            service.vector.delete_by_where(settings.CHROMA_COLLECTION_PAPERS, {"paper_id": paper_id})
        count = service.index_paper_to_knowledge_base(paper_id)
        total += count
        print(f"papers: indexed paper_id={paper_id} chunks={count}")
    return total


def main() -> int:
    args = parse_args()
    if not (args.all or args.materials or args.papers):
        args.all = True

    vector = EmbeddingService()
    print(f"vector_backend={vector.backend} available={vector.available}")
    if not vector.available:
        print(f"vector backend is unavailable: {vector.collection_stats('healthcheck').get('error', 'unknown')}")
        return 2

    with SessionLocal() as db:
        material_count = reindex_materials(db, vector, args.clear) if args.all or args.materials else 0
        paper_count = reindex_papers(db, args.clear) if args.all or args.papers else 0
    print(f"done material_chunks={material_count} paper_chunks={paper_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
