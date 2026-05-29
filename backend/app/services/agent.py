"""
Agent Orchestrator — LLM-powered workflow state machine.

Workflows:
- question_generation: knowledge points + evidence -> LLM generates questions -> validate
- grading: attempt -> LLM grades each response -> aggregate scores
- diagnosis: attempt -> update knowledge states -> LLM error analysis
- recommendation: diagnosis -> LLM generates personalized recommendations
- paper_analysis: paper -> LLM extracts insights -> learning plan
- case_tutoring: case + student query -> LLM Socratic response
- material_summary: material -> LLM structured analysis
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Callable

from sqlalchemy.orm import Session

from app.models import AgentRun, WorkflowStatus
from app.services.llm import get_llm
from app.services.questions import QuestionService
from app.services.grading import GradingService
from app.services.diagnosis import DiagnosisService
from app.services.ingestion import IngestionService


def _utcnow():
    return datetime.now(timezone.utc)


class AgentOrchestrator:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.question_service = QuestionService(db)
        self.grading_service = GradingService(db)
        self.diagnosis_service = DiagnosisService(db)
        self.ingestion_service = IngestionService(db)

    def run_workflow(self, workflow_name: str, input_data: dict[str, Any]) -> AgentRun:
        start_time = time.time()

        run = AgentRun(
            workflow_name=workflow_name,
            input_summary=str(input_data.get("query", ""))[:200] or workflow_name,
            input_data=input_data,
            status=WorkflowStatus.running,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        try:
            output = self._execute_workflow(workflow_name, input_data)
            elapsed = int((time.time() - start_time) * 1000)
            run.output_data = output
            run.output_summary = str(output.get("summary", ""))[:200] or "completed"
            run.status = WorkflowStatus.completed
            run.duration_ms = elapsed
            run.tokens_used = output.get("tokens_used", 0)
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            run.status = WorkflowStatus.failed
            run.error_message = str(e)
            run.duration_ms = elapsed

        self.db.commit()
        self.db.refresh(run)
        return run

    def _execute_workflow(self, workflow_name: str, input_data: dict) -> dict[str, Any]:
        workflows: dict[str, Callable[[dict], dict]] = {
            "question_generation": self._wf_question_generation,
            "grading": self._wf_grading,
            "diagnosis": self._wf_diagnosis,
            "recommendation": self._wf_recommendation,
            "paper_analysis": self._wf_paper_analysis,
            "case_tutoring": self._wf_case_tutoring,
            "material_summary": self._wf_material_summary,
        }
        handler = workflows.get(workflow_name)
        if not handler:
            return {"summary": f"Unknown workflow: {workflow_name}", "status": "error"}
        return handler(input_data)

    def _wf_question_generation(self, data: dict) -> dict[str, Any]:
        kps = data.get("knowledge_points", [])
        evidence = data.get("evidence_text", "")
        types = data.get("question_types", ["choice", "truefalse", "short_answer"])
        count = min(data.get("count", 5), 20)
        difficulty = data.get("difficulty", "medium")
        course_id = data.get("course_id")

        questions = self.question_service.generate_questions(
            knowledge_points=kps, evidence_text=evidence,
            question_types=types, count=count, difficulty=difficulty, course_id=course_id,
        )

        validation = []
        for q in questions:
            vr = self.question_service.validate_question(q.id)
            validation.append({"question_id": q.id, "valid": vr["valid"], "errors": vr["errors"]})

        return {
            "summary": f"Generated {len(questions)} questions with LLM",
            "questions": [{"id": q.id, "type": q.type.value, "stem": q.stem[:100]} for q in questions],
            "validation": validation,
        }

    def _wf_grading(self, data: dict) -> dict[str, Any]:
        attempt_id = data.get("attempt_id")
        if not attempt_id: return {"summary": "No attempt_id provided", "status": "error"}
        grades = self.grading_service.grade_attempt_subjective(attempt_id)
        return {
            "summary": f"LLM graded {len(grades)} subjective responses",
            "grades": [{"id": g.id, "confidence": g.confidence, "needs_review": g.needs_review} for g in grades],
        }

    def _wf_diagnosis(self, data: dict) -> dict[str, Any]:
        user_id = data.get("user_id")
        attempt_id = data.get("attempt_id")
        if not user_id: return {"summary": "No user_id provided", "status": "error"}
        states = self.diagnosis_service.process_attempt_for_diagnosis(attempt_id) if attempt_id else []
        profile = self.diagnosis_service.get_ability_profile(user_id)
        return {
            "summary": f"LLM diagnosis: updated {len(states)} knowledge states",
            "ability_profile": profile["ability_profile"],
            "weak_points": profile["weak_points"],
            "strengths": profile["strengths"],
            "recommendations": profile.get("recommendations", []),
        }

    def _wf_recommendation(self, data: dict) -> dict[str, Any]:
        from app.services.recommendation import RecommendationService
        svc = RecommendationService(self.db)
        user_id = data.get("user_id")
        if not user_id: return {"summary": "No user_id provided", "status": "error"}
        recs = svc.generate_recommendations(user_id)
        return {
            "summary": f"LLM generated {len(recs)} recommendations",
            "recommendations": [{"type": r.type.value, "reason": r.reason} for r in recs],
        }

    def _wf_paper_analysis(self, data: dict) -> dict[str, Any]:
        from app.services.papers import PaperService
        svc = PaperService(self.db)
        paper_id = data.get("paper_id")
        if not paper_id: return {"summary": "No paper_id provided", "status": "error"}
        analysis = svc.analyze_paper(paper_id)
        return {"summary": f"LLM analyzed paper: {analysis.get('one_sentence_summary', '')}", **analysis}

    def _wf_case_tutoring(self, data: dict) -> dict[str, Any]:
        from app.services.cases import IndustryCaseService
        svc = IndustryCaseService(self.db)
        case_id = data.get("case_id")
        query = data.get("query", "")
        if not case_id: return {"summary": "No case_id provided", "status": "error"}
        result = svc.get_case_answer(case_id, query)
        return {"summary": f"LLM tutoring response for case {case_id}", "answer": result.get("answer", "")}

    def _wf_material_summary(self, data: dict) -> dict[str, Any]:
        material_id = data.get("material_id")
        if not material_id: return {"summary": "No material_id provided", "status": "error"}
        result = self.ingestion_service.summarize_material(material_id)
        return {"summary": f"LLM analyzed material: {result.get('title', '')}", **result}

    # ── Run History ──────────────────────────────────────────────

    def get_run(self, run_id: int) -> AgentRun | None:
        return self.db.query(AgentRun).filter(AgentRun.id == run_id).first()

    def list_runs(self, workflow_name: str | None = None, page: int = 1, page_size: int = 20) -> tuple[list[AgentRun], int]:
        q = self.db.query(AgentRun)
        if workflow_name: q = q.filter(AgentRun.workflow_name == workflow_name)
        total = q.count()
        items = q.order_by(AgentRun.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
