from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.agent import AgentOrchestrator

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.get("/runs")
def list_runs(
    workflow_name: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    orchestrator = AgentOrchestrator(db)
    items, total = orchestrator.list_runs(workflow_name, page, page_size)
    return {
        "items": [
            {
                "id": r.id,
                "workflow_name": r.workflow_name,
                "status": r.status.value if r.status else "unknown",
                "input_summary": r.input_summary,
                "output_summary": r.output_summary,
                "tokens_used": r.tokens_used,
                "duration_ms": r.duration_ms,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/runs/{run_id}")
def get_run(run_id: int, db: Session = Depends(get_db)):
    orchestrator = AgentOrchestrator(db)
    run = orchestrator.get_run(run_id)
    if not run:
        raise HTTPException(404, "Agent run not found")
    return {
        "id": run.id,
        "workflow_name": run.workflow_name,
        "status": run.status.value if run.status else "unknown",
        "input_summary": run.input_summary,
        "output_summary": run.output_summary,
        "input_data": run.input_data,
        "output_data": run.output_data,
        "error_message": run.error_message,
        "tokens_used": run.tokens_used,
        "duration_ms": run.duration_ms,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }


@router.post("/workflow/{workflow_name}")
def run_workflow(workflow_name: str, input_data: dict, db: Session = Depends(get_db)):
    orchestrator = AgentOrchestrator(db)
    run = orchestrator.run_workflow(workflow_name, input_data)
    return {
        "run_id": run.id,
        "workflow_name": run.workflow_name,
        "status": run.status.value if run.status else "unknown",
        "output_summary": run.output_summary,
        "duration_ms": run.duration_ms,
        "created_at": run.created_at.isoformat() if run.created_at else None,
    }
