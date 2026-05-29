from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import IndustryCaseOut, IndustryCaseCreate
from app.services.cases import IndustryCaseService

router = APIRouter(prefix="/api/industry", tags=["industry-cases"])


@router.get("/cases", response_model=dict)
def list_cases(
    direction: str | None = Query(None),
    difficulty: str | None = Query(None),
    featured: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = IndustryCaseService(db)
    items, total = service.list_cases(direction, difficulty, featured, page, page_size)
    return {
        "items": [IndustryCaseOut.model_validate(c) for c in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/cases/search")
def search_cases(q: str = Query(..., min_length=1), limit: int = Query(10), db: Session = Depends(get_db)):
    service = IndustryCaseService(db)
    return [IndustryCaseOut.model_validate(c) for c in service.search_cases(q, limit)]


@router.get("/cases/{case_key}", response_model=IndustryCaseOut)
def get_case_by_key(case_key: str, db: Session = Depends(get_db)):
    service = IndustryCaseService(db)
    case = service.get_case_by_key(case_key)
    if not case:
        raise HTTPException(404, "Industry case not found")
    return case


@router.get("/cases/{case_key}/research-tasks")
def get_case_research_tasks(case_key: str, db: Session = Depends(get_db)):
    service = IndustryCaseService(db)
    case = service.get_case_by_key(case_key)
    if not case:
        raise HTTPException(404, "Industry case not found")
    return {
        "case_key": case.case_key,
        "case_title": case.title,
        "tasks": case.linked_research_task.split(";") if case.linked_research_task else [],
        "knowledge_points": case.knowledge_points,
        "recommended_keywords": case.recommended_keywords,
    }


@router.post("/cases", response_model=IndustryCaseOut, status_code=201)
def create_case(data: IndustryCaseCreate, db: Session = Depends(get_db)):
    service = IndustryCaseService(db)
    return service.create_case(data.model_dump())


@router.get("/answer")
def case_answer(case_key: str = Query(None), query: str = Query(...), db: Session = Depends(get_db)):
    service = IndustryCaseService(db)
    return service.get_case_answer_by_key(case_key, query)