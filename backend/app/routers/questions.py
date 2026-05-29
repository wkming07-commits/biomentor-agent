from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.schemas import (
    QuestionOut,
    QuestionCreate,
    AIQuestionGenerateRequest,
    PaginatedResponse,
)
from app.services.questions import QuestionService

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("/", response_model=dict)
def list_questions(
    course_id: int | None = Query(None),
    status: str | None = Query(None),
    type: str | None = Query(None),
    difficulty: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = QuestionService(db)
    items, total = service.list_questions(course_id, status, type, difficulty, page, page_size)
    return {
        "items": [QuestionOut.model_validate(q) for q in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(question_id: int, db: Session = Depends(get_db)):
    service = QuestionService(db)
    question = service.get_question(question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    return question


@router.post("/", response_model=QuestionOut, status_code=201)
def create_question(data: QuestionCreate, db: Session = Depends(get_db)):
    service = QuestionService(db)
    return service.create_question(data.model_dump())


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(question_id: int, data: QuestionCreate, db: Session = Depends(get_db)):
    service = QuestionService(db)
    question = service.update_question(question_id, data.model_dump())
    if not question:
        raise HTTPException(404, "Question not found")
    return question


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    service = QuestionService(db)
    if not service.delete_question(question_id):
        raise HTTPException(404, "Question not found")
    return {"detail": "deleted"}


@router.post("/{question_id}/publish")
def publish_question(question_id: int, db: Session = Depends(get_db)):
    service = QuestionService(db)
    question = service.publish_question(question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    return {"detail": "published"}


@router.post("/{question_id}/validate")
def validate_question(question_id: int, db: Session = Depends(get_db)):
    service = QuestionService(db)
    return service.validate_question(question_id)


@router.post("/ai-generate")
def ai_generate_questions(data: AIQuestionGenerateRequest, db: Session = Depends(get_db)):
    service = QuestionService(db)
    questions = service.generate_questions(
        knowledge_points=data.knowledge_points,
        evidence_text=data.evidence_text,
        question_types=[t.value for t in data.question_types] if data.question_types else ["choice", "truefalse", "short_answer"],
        count=data.count,
        difficulty=data.difficulty,
        course_id=data.course_id,
    )
    return {
        "count": len(questions),
        "questions": [QuestionOut.model_validate(q) for q in questions],
    }
