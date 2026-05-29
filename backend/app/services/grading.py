"""
Grading Service — AI rubric-based grading for subjective questions, confidence estimation, review flagging.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Grade, Response, Question, Attempt, AttemptStatus, GraderType

settings = get_settings()


def _utcnow():
    return datetime.now(timezone.utc)


class GradingService:

    def __init__(self, db: Session):
        self.db = db

    def grade_response(self, response_id: int) -> Grade | None:
        """AI-grade a single subjective response using rubric-based evaluation."""
        response = self.db.query(Response).filter(Response.id == response_id).first()
        if not response:
            return None

        question = self.db.query(Question).filter(Question.id == response.question_id).first()
        if not question:
            return None

        # Objective questions already auto-graded
        if question.type.value in ("choice", "truefalse"):
            response.grader_type = GraderType.auto
            response.graded_at = _utcnow()
            self.db.commit()
            return None

        # Subjective grading
        rubric = question.rubric or []
        student_answer = response.answer_text
        reference_answer = question.answer

        # Rule-based fallback when no LLM available
        score_breakdown, total_score, max_score, feedback, confidence = self._rule_based_grade(
            student_answer, reference_answer, rubric
        )

        grade = Grade(
            response_id=response_id,
            rubric_scores=rubric,
            score_breakdown=score_breakdown,
            missing_points=[],
            feedback=feedback,
            confidence=confidence,
            needs_review=confidence < settings.GRADING_CONFIDENCE_THRESHOLD,
        )
        self.db.add(grade)

        response.score = total_score
        response.max_score = max_score
        response.grader_type = GraderType.ai
        response.graded_at = _utcnow()
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def _rule_based_grade(
        self, student_answer: str, reference_answer: str, rubric: list[dict]
    ) -> tuple[list[dict], float, float, str, float]:
        """Rule-based grading fallback. Analyzes keyword overlap and answer structure."""
        if not student_answer.strip():
            return [], 0.0, float(len(rubric) * 3 or 10), "未作答，请尝试用自己的语言回答。", 1.0

        ref_keywords = set(reference_answer.replace("、", " ").replace("，", " ").split())
        student_lower = student_answer.lower()
        matched = sum(1 for kw in ref_keywords if len(kw) >= 2 and kw.lower() in student_lower)

        total_kw = max(len(ref_keywords), 1)
        overlap_ratio = min(matched / total_kw, 1.0)

        max_score = float(sum(d.get("max_score", 3) for d in rubric)) if rubric else 10.0

        # Score by rubric dimensions
        score_breakdown: list[dict] = []
        scored = 0.0
        for dim in rubric:
            dim_max = float(dim.get("max_score", 3))
            # Check if student answer mentions dimension-related terms
            dim_text = dim.get("description", "") + dim.get("dimension", "")
            dim_kw = set(dim_text.replace("、", " ").split())
            dim_match = sum(1 for kw in dim_kw if len(kw) >= 2 and kw.lower() in student_lower)
            dim_ratio = min(dim_match / max(len(dim_kw), 1), 1.0)
            dim_score = round(dim_max * dim_ratio * 0.7 + dim_max * overlap_ratio * 0.3, 1)
            scored += dim_score
            score_breakdown.append({
                "dimension": dim.get("dimension", ""),
                "score": dim_score,
                "max_score": dim_max,
                "comment": "关键词覆盖较好" if dim_ratio > 0.5 else "可进一步展开",
            })

        confidence = round(0.5 + overlap_ratio * 0.3, 2)

        if overlap_ratio > 0.6:
            feedback = "回答覆盖了大部分关键概念，结构较完整。建议补充更多具体细节和机制解释。"
        elif overlap_ratio > 0.3:
            feedback = "回答触及了一些关键点，但还可以更系统。建议按照「定义→机制→意义」的结构组织答案。"
        else:
            feedback = "回答需要补充更多核心概念。建议先回顾相关知识点，再尝试从定义、机制和应用三个层面作答。"

        return score_breakdown, round(scored, 1), max_score, feedback, confidence

    def grade_attempt_subjective(self, attempt_id: int) -> list[Grade]:
        """Grade all subjective (non-auto) responses in an attempt."""
        attempt = self.db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return []

        responses = (
            self.db.query(Response)
            .filter(Response.attempt_id == attempt_id, Response.grader_type == GraderType.ai)
            .all()
        )

        grades: list[Grade] = []
        for resp in responses:
            grade = self.grade_response(resp.id)
            if grade:
                grades.append(grade)

        # Update attempt total
        all_responses = self.db.query(Response).filter(Response.attempt_id == attempt_id).all()
        attempt.total_score = sum(r.score for r in all_responses)
        attempt.max_score = sum(r.max_score for r in all_responses)
        attempt.status = AttemptStatus.graded
        attempt.graded_at = _utcnow()
        self.db.commit()

        return grades

    def get_grade(self, response_id: int) -> Grade | None:
        return self.db.query(Grade).filter(Grade.response_id == response_id).first()
