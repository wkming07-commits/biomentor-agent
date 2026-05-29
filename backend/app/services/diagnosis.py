"""
Diagnosis Service — knowledge mastery tracking, error analysis, ability profiling, learning reports.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import (
    StudentKnowledgeState,
    ErrorEvent,
    KnowledgePoint,
    Attempt,
    Response,
    Question,
    Grade,
)

def _utcnow():
    return datetime.now(timezone.utc)


class DiagnosisService:

    def __init__(self, db: Session):
        self.db = db

    # ----- Knowledge State -----

    def get_or_create_state(self, user_id: int, kp_id: int) -> StudentKnowledgeState:
        state = (
            self.db.query(StudentKnowledgeState)
            .filter(
                StudentKnowledgeState.user_id == user_id,
                StudentKnowledgeState.knowledge_point_id == kp_id,
            )
            .first()
        )
        if not state:
            state = StudentKnowledgeState(user_id=user_id, knowledge_point_id=kp_id)
            self.db.add(state)
            self.db.commit()
            self.db.refresh(state)
        return state

    def update_mastery_from_response(
        self, user_id: int, kp_id: int, is_correct: bool
    ) -> StudentKnowledgeState:
        state = self.get_or_create_state(user_id, kp_id)

        state.total_attempts += 1
        if is_correct:
            state.correct_count += 1
            state.mastery_level = min(100.0, state.mastery_level + (1.0 - state.mastery_level / 100) * 15)
        else:
            decay = max(5.0, state.mastery_level * 0.08)
            state.mastery_level = max(0.0, min(100.0, state.mastery_level - decay))

        state.last_assessed_at = _utcnow()
        state.updated_at = _utcnow()
        self.db.commit()
        self.db.refresh(state)
        return state

    def process_attempt_for_diagnosis(self, attempt_id: int) -> list[StudentKnowledgeState]:
        """Process an entire attempt: update knowledge states and record error events."""
        attempt = self.db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt:
            return []

        updated_states: dict[int, StudentKnowledgeState] = {}

        responses = self.db.query(Response).filter(Response.attempt_id == attempt_id).all()
        for resp in responses:
            question = self.db.query(Question).filter(Question.id == resp.question_id).first()
            if not question or not question.knowledge_point_ids:
                continue

            for kp_id_str in question.knowledge_point_ids:
                try:
                    kp_id = int(kp_id_str) if kp_id_str.isdigit() else None
                except (ValueError, TypeError):
                    continue
                if kp_id is None:
                    continue

                state = self.update_mastery_from_response(
                    attempt.user_id, kp_id, bool(resp.is_correct)
                )
                updated_states[kp_id] = state

                if not resp.is_correct and resp.is_correct is not None:
                    error = ErrorEvent(
                        user_id=attempt.user_id,
                        knowledge_point_id=kp_id,
                        question_id=resp.question_id,
                        error_type=self._classify_error(resp, question),
                        description=f"在测验 {attempt.quiz_id} 中答错题目 {question.id}",
                    )
                    self.db.add(error)

        self.db.commit()
        return list(updated_states.values())

    def _classify_error(self, response: Response, question: Question) -> str:
        if question.type.value == "choice":
            return "概念混淆" if response.answer_text else "未作答"
        elif question.type.value == "truefalse":
            return "判断错误"
        elif question.type.value in ("short_answer", "essay"):
            return "知识表达不完整"
        return "其他错误"

    # ----- Ability Profile -----

    def get_ability_profile(self, user_id: int) -> dict[str, Any]:
        """Compute 6-dimension ability profile from knowledge states."""
        states = (
            self.db.query(StudentKnowledgeState)
            .filter(StudentKnowledgeState.user_id == user_id)
            .all()
        )

        if not states:
            return {
                "user_id": user_id,
                "ability_profile": {
                    "concept_mastery": 0.0,
                    "mechanism_understanding": 0.0,
                    "application_ability": 0.0,
                    "literature_comprehension": 0.0,
                    "research_design": 0.0,
                    "knowledge_transfer": 0.0,
                },
                "knowledge_states": [],
                "weak_points": [],
                "strengths": [],
                "recommendations": ["开始学习：建议从基础概念入手，逐步建立知识体系。"],
            }

        # Map knowledge point categories to ability dimensions
        dim_scores: dict[str, list[float]] = {
            "concept_mastery": [],
            "mechanism_understanding": [],
            "application_ability": [],
            "literature_comprehension": [],
            "research_design": [],
            "knowledge_transfer": [],
        }

        category_to_dim = {
            "基础概念": "concept_mastery",
            "实验方法": "mechanism_understanding",
            "应用方向": "application_ability",
            "前沿技术": "literature_comprehension",
            "AI模型": "research_design",
            "工具平台": "knowledge_transfer",
        }

        for s in states:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == s.knowledge_point_id).first()
            category = kp.category if kp else "基础概念"
            dim = category_to_dim.get(category, "concept_mastery")
            dim_scores[dim].append(s.mastery_level)

        profile = {}
        for dim, scores in dim_scores.items():
            if scores:
                profile[dim] = round(sum(scores) / len(scores), 1)
            else:
                profile[dim] = 0.0

        # Identify weak points and strengths
        weak = [s for s in states if s.mastery_level < 40]
        strong = [s for s in states if s.mastery_level >= 80]

        weak_names: list[str] = []
        for ws in weak[:5]:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ws.knowledge_point_id).first()
            weak_names.append(f"{kp.name}({ws.mastery_level:.0f}%)" if kp else f"KP#{ws.knowledge_point_id}")

        strong_names: list[str] = []
        for ss in strong[:5]:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == ss.knowledge_point_id).first()
            strong_names.append(kp.name if kp else f"KP#{ss.knowledge_point_id}")

        recommendations: list[str] = []
        if weak:
            recommendations.append(f"薄弱知识点：{', '.join(weak_names[:3])}，建议优先复习相关章节。")
        if not strong:
            recommendations.append("尚未建立明显的知识优势，建议多参与练习和讨论。")
        else:
            recommendations.append(f"已掌握较好的领域：{', '.join(strong_names[:3])}，可尝试科研拓展任务。")

        return {
            "user_id": user_id,
            "ability_profile": profile,
            "knowledge_states": [
                {
                    "id": s.id,
                    "user_id": s.user_id,
                    "knowledge_point_id": s.knowledge_point_id,
                    "mastery_level": s.mastery_level,
                    "total_attempts": s.total_attempts,
                    "correct_count": s.correct_count,
                    "last_assessed_at": s.last_assessed_at.isoformat() if s.last_assessed_at else None,
                    "error_types": s.error_types or [],
                }
                for s in states
            ],
            "weak_points": weak_names,
            "strengths": strong_names,
            "recommendations": recommendations,
        }

    # ----- Error Events -----

    def get_error_events(
        self, user_id: int, kp_id: int | None = None, limit: int = 50
    ) -> list[ErrorEvent]:
        q = self.db.query(ErrorEvent).filter(ErrorEvent.user_id == user_id)
        if kp_id is not None:
            q = q.filter(ErrorEvent.knowledge_point_id == kp_id)
        return q.order_by(ErrorEvent.created_at.desc()).limit(limit).all()

    def get_error_type_distribution(self, user_id: int) -> dict[str, int]:
        events = self.db.query(ErrorEvent).filter(ErrorEvent.user_id == user_id).all()
        dist: dict[str, int] = {}
        for e in events:
            dist[e.error_type] = dist.get(e.error_type, 0) + 1
        return dict(sorted(dist.items(), key=lambda x: -x[1]))
