"""
Diagnosis Service — LLM-powered learning diagnosis, error analysis, ability profiling.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import StudentKnowledgeState, ErrorEvent, KnowledgePoint, Attempt, Response, Question
from app.services.llm import get_llm
from app.services.prompts import DIAGNOSIS_SYSTEM, DIAGNOSIS_USER, DIAGNOSIS_SCHEMA


def _utcnow():
    return datetime.now(timezone.utc)


class DiagnosisService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    # ── Knowledge State Tracking ─────────────────────────────────

    def get_or_create_state(self, user_id: int, kp_id: int) -> StudentKnowledgeState:
        state = self.db.query(StudentKnowledgeState).filter(
            StudentKnowledgeState.user_id == user_id,
            StudentKnowledgeState.knowledge_point_id == kp_id,
        ).first()
        if not state:
            state = StudentKnowledgeState(user_id=user_id, knowledge_point_id=kp_id)
            self.db.add(state)
            self.db.commit()
            self.db.refresh(state)
        return state

    def update_mastery_from_response(self, user_id: int, kp_id: int, is_correct: bool) -> StudentKnowledgeState:
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
        attempt = self.db.query(Attempt).filter(Attempt.id == attempt_id).first()
        if not attempt: return []

        updated: dict[int, StudentKnowledgeState] = {}
        responses = self.db.query(Response).filter(Response.attempt_id == attempt_id).all()
        for resp in responses:
            question = self.db.query(Question).filter(Question.id == resp.question_id).first()
            if not question or not question.knowledge_point_ids: continue
            for kp_id_str in question.knowledge_point_ids:
                try: kp_id = int(kp_id_str) if str(kp_id_str).isdigit() else None
                except (ValueError, TypeError): continue
                if kp_id is None: continue
                state = self.update_mastery_from_response(attempt.user_id, kp_id, bool(resp.is_correct))
                updated[kp_id] = state
                if not resp.is_correct and resp.is_correct is not None:
                    error = ErrorEvent(
                        user_id=attempt.user_id, knowledge_point_id=kp_id, question_id=resp.question_id,
                        error_type=self._classify_error(resp, question),
                        description=f"测验{attempt.quiz_id}题目{question.id}答错",
                    )
                    self.db.add(error)
        self.db.commit()
        return list(updated.values())

    def _classify_error(self, response: Response, question: Question) -> str:
        if question.type.value == "choice": return "概念混淆" if response.answer_text else "未作答"
        elif question.type.value == "truefalse": return "判断错误"
        elif question.type.value in ("short_answer", "essay"): return "知识表达不完整"
        return "其他错误"

    # ── LLM-Powered Ability Profile ──────────────────────────────

    def get_ability_profile(self, user_id: int) -> dict[str, Any]:
        states = self.db.query(StudentKnowledgeState).filter(StudentKnowledgeState.user_id == user_id).all()
        errors = self.db.query(ErrorEvent).filter(ErrorEvent.user_id == user_id).order_by(ErrorEvent.created_at.desc()).limit(50).all()

        # Rule-based baseline profile
        dim_scores = {"concept_mastery": [], "mechanism_understanding": [], "application_ability": [],
                       "literature_comprehension": [], "research_design": [], "knowledge_transfer": []}
        category_to_dim = {"基础概念": "concept_mastery", "实验方法": "mechanism_understanding",
                           "应用方向": "application_ability", "前沿技术": "literature_comprehension",
                           "AI模型": "research_design", "工具平台": "knowledge_transfer"}
        for s in states:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == s.knowledge_point_id).first()
            dim = category_to_dim.get(kp.category if kp else "基础概念", "concept_mastery")
            dim_scores[dim].append(s.mastery_level)
        profile = {dim: round(sum(scores) / len(scores), 1) if scores else 0.0 for dim, scores in dim_scores.items()}

        # LLM-enhanced analysis
        llm_analysis = {}
        if self.llm.available and states:
            try:
                attempt_data = "\n".join(
                    f"知识点{s.knowledge_point_id}: 掌握度{s.mastery_level:.0f}%, 尝试{s.total_attempts}次, 正确{s.correct_count}次"
                    for s in states
                )
                error_data = "\n".join(f"- [{e.error_type}] {e.description}" for e in errors[:20])
                kp_names = []
                for s in states:
                    kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == s.knowledge_point_id).first()
                    kp_names.append(f"{kp.name}({s.knowledge_point_id})" if kp else str(s.knowledge_point_id))

                user_prompt = DIAGNOSIS_USER.format(
                    attempt_data=attempt_data,
                    knowledge_structure="知识点: " + ", ".join(kp_names),
                )
                llm_analysis = self.llm.generate_json(
                    system_prompt=DIAGNOSIS_SYSTEM, user_prompt=user_prompt,
                    schema=DIAGNOSIS_SCHEMA, temperature=0.3,
                )
            except Exception:
                pass

        weak = [s for s in states if s.mastery_level < 40]
        strong = [s for s in states if s.mastery_level >= 80]

        def _kp_name(kp_id: int) -> str:
            kp = self.db.query(KnowledgePoint).filter(KnowledgePoint.id == kp_id).first()
            return kp.name if kp else str(kp_id)

        weak_names = [f"{_kp_name(s.knowledge_point_id)}({s.mastery_level:.0f}%)" for s in weak[:5]]
        strong_names = [_kp_name(s.knowledge_point_id) for s in strong[:5]]

        # Merge LLM results with rule-based
        llm_recs = llm_analysis.get("recommendations", [])
        rule_recs = []
        if weak: rule_recs.append(f"薄弱知识点：{', '.join(weak_names[:3])}，建议优先复习")
        if strong: rule_recs.append(f"优势领域：{', '.join(strong_names[:3])}，可尝试科研拓展")
        if not weak and not strong: rule_recs.append("尚未建立知识状态，建议开始基础知识探索")

        return {
            "user_id": user_id,
            "ability_profile": llm_analysis.get("ability_profile", profile),
            "knowledge_states": [
                {"id": s.id, "user_id": s.user_id, "knowledge_point_id": s.knowledge_point_id,
                 "mastery_level": s.mastery_level, "total_attempts": s.total_attempts,
                 "correct_count": s.correct_count,
                 "last_assessed_at": s.last_assessed_at.isoformat() if s.last_assessed_at else None,
                 "error_types": s.error_types or []}
                for s in states
            ],
            "weak_points": [w["concept"] for w in llm_analysis.get("weak_points", [])] or weak_names,
            "strengths": [s["concept"] for s in llm_analysis.get("strengths", [])] or strong_names,
            "error_patterns": llm_analysis.get("error_patterns", []),
            "recommendations": llm_recs if llm_recs else rule_recs,
        }

    def get_error_events(self, user_id: int, kp_id: int | None = None, limit: int = 50) -> list[ErrorEvent]:
        q = self.db.query(ErrorEvent).filter(ErrorEvent.user_id == user_id)
        if kp_id is not None: q = q.filter(ErrorEvent.knowledge_point_id == kp_id)
        return q.order_by(ErrorEvent.created_at.desc()).limit(limit).all()

    def get_error_type_distribution(self, user_id: int) -> dict[str, int]:
        events = self.db.query(ErrorEvent).filter(ErrorEvent.user_id == user_id).all()
        dist: dict[str, int] = {}
        for e in events: dist[e.error_type] = dist.get(e.error_type, 0) + 1
        return dict(sorted(dist.items(), key=lambda x: -x[1]))
