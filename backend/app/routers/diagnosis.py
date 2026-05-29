"""
Diagnosis router — handle post-attempt diagnosis processing and ability profile queries.
Separate from reports to allow fine-grained access.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.diagnosis import DiagnosisService
from app.services.grading import GradingService

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])


@router.post("/process-attempt/{attempt_id}")
def process_attempt(attempt_id: int, db: Session = Depends(get_db)):
    """After submitting an attempt, grade subjective questions and update knowledge states."""
    grading_service = GradingService(db)
    diagnosis_service = DiagnosisService(db)

    # Grade subjective first
    grades = grading_service.grade_attempt_subjective(attempt_id)

    # Then process for diagnosis
    states = diagnosis_service.process_attempt_for_diagnosis(attempt_id)

    return {
        "attempt_id": attempt_id,
        "graded_responses": len(grades),
        "updated_knowledge_states": len(states),
    }


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    service = DiagnosisService(db)
    return service.get_ability_profile(user_id)
