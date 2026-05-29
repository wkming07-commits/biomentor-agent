from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.knowledge import KnowledgeService

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/search")
def rag_search(data: dict, db: Session = Depends(get_db)):
    """LLM-powered RAG search with vector retrieval and answer synthesis."""
    service = KnowledgeService(db)
    results = service.search_all(
        query=data.get("query", ""),
        course_id=data.get("course_id"),
        top_k=data.get("top_k", 5),
    )
    return results


@router.get("/knowledge")
def keyword_search(
    q: str = Query(..., min_length=1),
    course_id: int | None = Query(None),
    top_k: int = Query(5),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    return service.search_all(query=q, course_id=course_id, top_k=top_k)
