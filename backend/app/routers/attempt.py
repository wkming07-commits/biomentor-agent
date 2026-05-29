from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AttemptOut, AttemptSubmit
from app.services.quiz import QuizService

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


@router.get("/", response_model=list[AttemptOut])
def list_attempts(
    user_id: int | None = Query(None),
    quiz_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    service = QuizService(db)
    return service.list_attempts(user_id, quiz_id)


@router.get("/{attempt_id}", response_model=AttemptOut)
def get_attempt(attempt_id: int, db: Session = Depends(get_db)):
    service = QuizService(db)
    attempt = service.get_attempt(attempt_id)
    if not attempt:
        raise HTTPException(404, "Attempt not found")
    return attempt


@router.post("/start", response_model=AttemptOut, status_code=201)
def start_attempt(quiz_id: int = Query(...), user_id: int = Query(...), db: Session = Depends(get_db)):
    service = QuizService(db)
    return service.start_attempt(quiz_id, user_id)


@router.post("/{attempt_id}/submit", response_model=AttemptOut)
def submit_attempt(attempt_id: int, data: AttemptSubmit, db: Session = Depends(get_db)):
    service = QuizService(db)
    try:
        return service.submit_attempt(attempt_id, [r.model_dump() for r in data.responses])
    except ValueError as e:
        raise HTTPException(404, str(e))
