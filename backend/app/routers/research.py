from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ResearchPaperOut, ResearchPaperCreate
from app.services.papers import PaperService

router = APIRouter(prefix="/api/research", tags=["research"])


@router.get("/papers", response_model=dict)
def list_papers(
    direction: str | None = Query(None),
    difficulty: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = PaperService(db)
    items, total = service.list_papers(direction, difficulty, page, page_size)
    return {
        "items": [ResearchPaperOut.model_validate(p) for p in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/papers/search")
def search_papers(q: str = Query(..., min_length=1), limit: int = Query(10), db: Session = Depends(get_db)):
    service = PaperService(db)
    return [ResearchPaperOut.model_validate(p) for p in service.search_papers(q, limit)]


@router.get("/papers/demo")
def demo_papers(db: Session = Depends(get_db)):
    service = PaperService(db)
    return [ResearchPaperOut.model_validate(p) for p in service.get_demo_papers()]


@router.get("/papers/{paper_id}", response_model=ResearchPaperOut)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    service = PaperService(db)
    paper = service.get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.post("/papers", response_model=ResearchPaperOut, status_code=201)
def create_paper(data: ResearchPaperCreate, db: Session = Depends(get_db)):
    service = PaperService(db)
    return service.create_paper(data.model_dump())


@router.get("/papers/{paper_id}/learning-plan")
def get_paper_learning_plan(paper_id: int, db: Session = Depends(get_db)):
    service = PaperService(db)
    plan = service.build_learning_plan(paper_id)
    if not plan:
        raise HTTPException(404, "Paper not found")
    return plan


@router.post("/papers/defense-outline")
def build_defense_outline(paper_ids: list[int], db: Session = Depends(get_db)):
    service = PaperService(db)
    return {"outline": service.build_defense_outline(paper_ids)}


@router.get("/tasks")
def list_research_tasks(direction: str | None = Query(None), db: Session = Depends(get_db)):
    """Return research tasks from the knowledge base."""
    from app.models import KnowledgePoint
    # Research tasks are embedded in KnowledgePoint learning_path metadata
    kps = db.query(KnowledgePoint).filter(KnowledgePoint.category.in_(["实验方法", "前沿技术", "AI模型"])).all()

    tasks = []
    for kp in kps:
        if kp.learning_path:
            tasks.append({
                "id": f"task-kp-{kp.id}",
                "title": f"{kp.name} 实验探究",
                "difficulty": kp.difficulty.value if kp.difficulty else "medium",
                "scenario": kp.definition,
                "knowledge_point": kp.name,
                "category": kp.category,
                "steps": kp.learning_path if isinstance(kp.learning_path, list) else [],
            })

    return tasks
