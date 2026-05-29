from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RAGSearchRequest, RAGSearchResponse
from app.services.knowledge import KnowledgeService

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/search", response_model=RAGSearchResponse)
def rag_search(data: RAGSearchRequest, db: Session = Depends(get_db)):
    service = KnowledgeService(db)
    results = service.search_all(
        query=data.query,
        course_id=data.course_id,
        top_k=data.top_k,
    )

    # Synthesize a simple answer from retrieved content
    chunks = results.get("chunks", [])
    papers = results.get("papers", [])
    kps = results.get("knowledge_points", [])

    answer_parts: list[str] = []
    if kps:
        kp_names = [kp["name"] for kp in kps[:3]]
        answer_parts.append(f"相关内容涉及知识点：{'、'.join(kp_names)}。")
    if chunks:
        answer_parts.append(chunks[0]["content"][:300])
    if papers:
        paper_names = [p["title_zh"] or p["title"] for p in papers[:3]]
        answer_parts.append(f"参考文献：{'、'.join(paper_names)}。")

    return RAGSearchResponse(
        query=data.query,
        results=[
            {
                "chunk_id": c["id"],
                "content": c["content"],
                "score": c["score"],
                "source": c["source"],
            }
            for c in chunks
        ],
        answer="\n".join(answer_parts) if answer_parts else "未找到相关内容，请尝试其他关键词。",
        source_refs=results.get("papers", []),
    )


@router.get("/knowledge")
def keyword_search(
    q: str = Query(..., min_length=1),
    course_id: int | None = Query(None),
    top_k: int = Query(5),
    db: Session = Depends(get_db),
):
    service = KnowledgeService(db)
    return service.search_all(query=q, course_id=course_id, top_k=top_k)
