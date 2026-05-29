from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.questions import QuestionService
from app.services.agent import AgentOrchestrator

router = APIRouter(prefix="/api/ai-generate", tags=["ai-generate"])


@router.get("/status")
def status():
    return {
        "status": "ready",
        "available_workflows": [
            "question_generation",
            "grading",
            "diagnosis",
            "recommendation",
        ],
    }


@router.post("/questions")
def generate_questions(
    knowledge_points: str = Query(""),
    evidence: str = Query(""),
    count: int = Query(5, ge=1, le=20),
    difficulty: str = Query("medium"),
    course_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    service = QuestionService(db)
    kp_list = [kp.strip() for kp in knowledge_points.split(",") if kp.strip()] if knowledge_points else []
    questions = service.generate_questions(
        knowledge_points=kp_list,
        evidence_text=evidence,
        question_types=["choice", "truefalse", "short_answer"],
        count=count,
        difficulty=difficulty,
        course_id=course_id,
    )
    return {
        "count": len(questions),
        "questions": [
            {"id": q.id, "type": q.type.value, "stem": q.stem, "answer": q.answer}
            for q in questions
        ],
    }


@router.post("/workflow/{workflow_name}")
def run_workflow(workflow_name: str, input_data: dict, db: Session = Depends(get_db)):
    orchestrator = AgentOrchestrator(db)
    run = orchestrator.run_workflow(workflow_name, input_data)
    return {
        "run_id": run.id,
        "status": run.status.value,
        "summary": run.output_summary,
        "duration_ms": run.duration_ms,
    }
