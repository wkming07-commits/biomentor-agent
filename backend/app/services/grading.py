"""
Grading Service — LLM-powered rubric-based grading for subjective questions.

Features:
- LLM rubric evaluation with structured JSON output
- Confidence scoring and review flagging
- Rule-based fallback when LLM unavailable
- Batch grading for entire attempts
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Grade, Response, Question, Attempt, AttemptStatus, GraderType
from app.services.llm import get_llm
from app.services.prompts import GRADING_SYSTEM, GRADING_USER, GRADING_SCHEMA

settings = get_settings()


def _utcnow():
    return datetime.now(timezone.utc)


class GradingService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    def grade_response(self, response_id: int) -> Grade | None:
        response = self.db.query(Response).filter(Response.id == response_id).first()
        if not response: return None

        question = self.db.query(Question).filter(Question.id == response.question_id).first()
        if not question: return None

        if question.type.value in ("choice", "truefalse"):
            response.grader_type = GraderType.auto
            response.graded_at = _utcnow()
            self.db.commit()
            return None

        if self.llm.available:
            try:
                return self._llm_grade(response, question)
            except Exception:
                pass  # fall through to rule-based

        return self._rule_based_grade(response, question)

    def _llm_grade(self, response: Response, question: Question) -> Grade:
        rubric = question.rubric or []
        rubric_str = "\n".join(
            f"- {d.get('dimension','')}({d.get('max_score',3)}分): {d.get('description','')}"
            for d in rubric
        ) if rubric else "无预设评分标准，请根据生物学准确性、逻辑完整性和表达清晰度综合评分。"

        user_prompt = GRADING_USER.format(
            question_stem=question.stem,
            reference_answer=question.answer,
            rubric=rubric_str,
            student_answer=response.answer_text,
        )

        result = self.llm.generate_json(
            system_prompt=GRADING_SYSTEM,
            user_prompt=user_prompt,
            schema=GRADING_SCHEMA,
            temperature=0.2,
        )

        score_breakdown = result.get("score_breakdown", [])
        total_score = float(result.get("total_score", 0))
        max_score = float(result.get("max_score", 10))
        missing_points = result.get("missing_points", [])
        feedback = result.get("feedback", "")
        confidence = float(result.get("confidence", 0.5))
        needs_review = result.get("needs_review", confidence < settings.GRADING_CONFIDENCE_THRESHOLD)

        grade = Grade(
            response_id=response.id,
            rubric_scores=rubric,
            score_breakdown=score_breakdown,
            missing_points=missing_points,
            feedback=feedback,
            confidence=confidence,
            needs_review=needs_review,
        )
        self.db.add(grade)

        response.score = total_score
        response.max_score = max_score
        response.grader_type = GraderType.ai
        response.graded_at = _utcnow()
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def _rule_based_grade(self, response: Response, question: Question) -> Grade | None:
        """Keyword-overlap fallback when LLM is unavailable."""
        rubric = question.rubric or []
        student_answer = response.answer_text
        reference_answer = question.answer

        if not student_answer.strip():
            grade = Grade(
                response_id=response.id,
                rubric_scores=rubric,
                score_breakdown=[],
                missing_points=["未作答"],
                feedback="未作答，请尝试用自己的语言回答。",
                confidence=1.0,
                needs_review=False,
            )
            self.db.add(grade)
            response.score = 0.0
            response.max_score = float(sum(d.get("max_score", 3) for d in rubric)) if rubric else 10.0
            response.grader_type = GraderType.ai
            response.graded_at = _utcnow()
            self.db.commit()
            self.db.refresh(grade)
            return grade

        ref_keywords = set(reference_answer.replace("、", " ").replace("，", " ").split())
        student_lower = student_answer.lower()
        matched = sum(1 for kw in ref_keywords if len(kw) >= 2 and kw.lower() in student_lower)
        overlap_ratio = min(matched / max(len(ref_keywords), 1), 1.0)

        max_score = float(sum(d.get("max_score", 3) for d in rubric)) if rubric else 10.0
        scored = round(max_score * overlap_ratio, 1)

        score_breakdown = [
            {"dimension": d.get("dimension", ""), "score": round(d.get("max_score", 3) * overlap_ratio, 1),
             "max_score": d.get("max_score", 3), "comment": "关键词覆盖评估"}
            for d in rubric
        ] if rubric else [{"dimension": "综合", "score": scored, "max_score": max_score, "comment": "关键词覆盖评估"}]

        confidence = round(0.4 + overlap_ratio * 0.3, 2)

        if overlap_ratio > 0.6:
            feedback = "回答覆盖了大部分关键概念，结构较完整。建议补充更多具体细节和机制解释。"
        elif overlap_ratio > 0.3:
            feedback = "回答触及了一些关键点，但还可以更系统。建议按照「定义→机制→意义」的结构组织答案。"
        else:
            feedback = "回答需要补充更多核心概念。建议先回顾相关知识点，再尝试从定义、机制和应用三个层面作答。"

        grade = Grade(
            response_id=response.id,
            rubric_scores=rubric,
            score_breakdown=score_breakdown,
            missing_points=[],
            feedback=feedback,
            confidence=confidence,
            needs_review=confidence < settings.GRADING_CONFIDENCE_THRESHOLD,
        )
        self.db.add(grade)

        response.score = scored
        response.max_score = max_score
        response.grader_type = GraderType.ai
        response.graded_at = _utcnow()
        self.db.commit()
        self.db.refresh(grade)
        return grade

    def grade_attempt_subjective(self, attempt_id: int) -> list[Grade]:
        attempt = self.db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt: return []

        responses = (
            self.db.query(Response)
            .filter(Response.attempt_id == attempt_id, Response.grader_type == GraderType.ai)
            .all()
        )

        grades: list[Grade] = []
        for resp in responses:
            grade = self.grade_response(resp.id)
            if grade: grades.append(grade)

        all_responses = self.db.query(Response).filter(Response.attempt_id == attempt_id).all()
        attempt.total_score = sum(r.score for r in all_responses)
        attempt.max_score = sum(r.max_score for r in all_responses)
        attempt.status = AttemptStatus.graded
        attempt.graded_at = _utcnow()
        self.db.commit()

        return grades

    def get_grade(self, response_id: int) -> Grade | None:
        return self.db.query(Grade).filter(Grade.response_id == response_id).first()
