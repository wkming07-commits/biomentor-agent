from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    StudentKnowledgeStateOut,
    ErrorEventOut,
    DiagnosisReport,
    WrongQuestionEntryOut,
    LearningPathOut,
    RecommendationOut,
)
from app.services.diagnosis import DiagnosisService
from app.services.recommendation import RecommendationService
from app.services.grading import GradingService

router = APIRouter(prefix="/api/reports", tags=["reports"])


# ---- Diagnosis ----

@router.get("/diagnosis/{user_id}", response_model=DiagnosisReport)
def get_diagnosis(user_id: int, db: Session = Depends(get_db)):
    service = DiagnosisService(db)
    return service.get_ability_profile(user_id)


@router.get("/diagnosis/{user_id}/knowledge-states", response_model=list[StudentKnowledgeStateOut])
def get_knowledge_states(user_id: int, kp_id: int | None = Query(None), db: Session = Depends(get_db)):
    from app.models import StudentKnowledgeState
    q = db.query(StudentKnowledgeState).filter(StudentKnowledgeState.user_id == user_id)
    if kp_id is not None:
        q = q.filter(StudentKnowledgeState.knowledge_point_id == kp_id)
    return q.all()


@router.get("/diagnosis/{user_id}/error-events", response_model=list[ErrorEventOut])
def get_error_events(
    user_id: int,
    kp_id: int | None = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
):
    service = DiagnosisService(db)
    return service.get_error_events(user_id, kp_id, limit)


@router.get("/diagnosis/{user_id}/error-distribution")
def get_error_distribution(user_id: int, db: Session = Depends(get_db)):
    service = DiagnosisService(db)
    return service.get_error_type_distribution(user_id)


# ---- Wrong Questions ----

@router.get("/wrong-questions/{user_id}")
def list_wrong_questions(user_id: int, db: Session = Depends(get_db)):
    from app.models import WrongQuestionEntry
    entries = (
        db.query(WrongQuestionEntry)
        .filter(WrongQuestionEntry.user_id == user_id)
        .order_by(WrongQuestionEntry.created_at.desc())
        .limit(100)
        .all()
    )
    return [WrongQuestionEntryOut.model_validate(e) for e in entries]


# ---- Learning Path & Recommendations ----

@router.get("/learning-path/{user_id}", response_model=LearningPathOut | None)
def get_learning_path(user_id: int, db: Session = Depends(get_db)):
    rec_service = RecommendationService(db)
    path = rec_service.get_active_learning_path(user_id)
    if not path:
        return None
    return path


@router.post("/learning-path/{user_id}/generate", response_model=LearningPathOut)
def generate_learning_path(user_id: int, db: Session = Depends(get_db)):
    rec_service = RecommendationService(db)
    return rec_service.generate_learning_path(user_id)


@router.get("/recommendations/{user_id}")
def get_recommendations(
    user_id: int,
    consumed: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    rec_service = RecommendationService(db)
    recs = rec_service.get_recommendations(user_id, consumed)
    return [RecommendationOut.model_validate(r) for r in recs]


@router.post("/recommendations/{user_id}/generate")
def generate_recommendations(user_id: int, db: Session = Depends(get_db)):
    rec_service = RecommendationService(db)
    recs = rec_service.generate_recommendations(user_id)
    return {
        "count": len(recs),
        "recommendations": [RecommendationOut.model_validate(r) for r in recs],
    }


# ---- Grading history ----

@router.get("/grades/{response_id}")
def get_grade(response_id: int, db: Session = Depends(get_db)):
    grading_service = GradingService(db)
    grade = grading_service.get_grade(response_id)
    if not grade:
        raise HTTPException(404, "Grade not found")
    from app.schemas import GradeOut
    return GradeOut.model_validate(grade)
