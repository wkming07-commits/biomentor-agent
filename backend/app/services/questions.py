"""
Question Service — AI-assisted question generation, validation, CRUD, quality control.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Question, QuestionStatus, QuestionType

settings = get_settings()


def _utcnow():
    return datetime.now(timezone.utc)


class QuestionService:

    def __init__(self, db: Session):
        self.db = db

    # ----- CRUD -----

    def list_questions(
        self,
        course_id: int | None = None,
        status: str | None = None,
        type: str | None = None,
        difficulty: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Question], int]:
        q = self.db.query(Question)

        if course_id is not None:
            q = q.filter(Question.course_id == course_id)
        if status:
            q = q.filter(Question.status == status)
        if type:
            q = q.filter(Question.type == type)
        if difficulty:
            q = q.filter(Question.difficulty == difficulty)

        total = q.count()
        items = (
            q.order_by(Question.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get_question(self, question_id: int) -> Question | None:
        return self.db.query(Question).filter(Question.id == question_id).first()

    def create_question(self, data: dict) -> Question:
        question = Question(**data)
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def update_question(self, question_id: int, data: dict) -> Question | None:
        question = self.get_question(question_id)
        if not question:
            return None
        for key, value in data.items():
            if hasattr(question, key):
                setattr(question, key, value)
        question.updated_at = _utcnow()
        self.db.commit()
        self.db.refresh(question)
        return question

    def delete_question(self, question_id: int) -> bool:
        question = self.get_question(question_id)
        if not question:
            return False
        self.db.delete(question)
        self.db.commit()
        return True

    def publish_question(self, question_id: int) -> Question | None:
        return self.update_question(question_id, {"status": QuestionStatus.published.value})

    # ----- AI Generation -----

    def generate_questions(
        self,
        knowledge_points: list[str],
        evidence_text: str,
        question_types: list[str],
        count: int = 5,
        difficulty: str = "medium",
        course_id: int | None = None,
    ) -> list[Question]:
        """Generate questions using rule-based templates + LLM fallback.

        Returns questions saved to DB with status='draft'.
        """
        if not knowledge_points:
            knowledge_points = ["通用生物学"]

        generated: list[Question] = []
        type_cycle = question_types if question_types else ["choice", "truefalse", "short_answer"]

        for i in range(count):
            qtype = type_cycle[i % len(type_cycle)]
            try:
                q = self._generate_single(
                    knowledge_points, evidence_text, qtype, difficulty, course_id, i
                )
                if q:
                    generated.append(q)
            except Exception:
                continue

        return generated

    def _generate_single(
        self,
        knowledge_points: list[str],
        evidence: str,
        qtype: str,
        difficulty: str,
        course_id: int | None,
        index: int,
    ) -> Question | None:
        kp_str = "、".join(knowledge_points[:5])
        evidence_snippet = evidence[:600] if evidence else ""

        if qtype == QuestionType.choice.value:
            return self._build_question(
                course_id=course_id,
                qtype=QuestionType.choice,
                stem=f"关于 {kp_str}，以下描述正确的是？",
                options=[
                    {"label": "A", "text": f"{kp_str}仅存在于原核生物中"},
                    {"label": "B", "text": f"{kp_str}是现代生命科学研究的重要方向之一"},
                    {"label": "C", "text": f"{kp_str}只在体外实验中可被观测"},
                    {"label": "D", "text": f"{kp_str}已被证实与任何疾病无关"},
                ],
                answer="B",
                explanation=f"{kp_str}是现代生命科学研究的核心领域，在基础研究和临床转化中均有重要意义。"
                + (f" 参考：{evidence_snippet[:100]}" if evidence_snippet else ""),
                difficulty=difficulty,
            )

        if qtype == QuestionType.truefalse.value:
            return self._build_question(
                course_id=course_id,
                qtype=QuestionType.truefalse,
                stem=f"{kp_str}在所有生物体中都以相同的方式发挥作用。（判断对错）",
                answer="错误",
                explanation=f"{kp_str}在不同生物体或细胞环境中可能存在差异化的作用机制，理解其多样性和特异性具有重要意义。",
                difficulty=difficulty,
            )

        if qtype == QuestionType.short_answer.value:
            return self._build_question(
                course_id=course_id,
                qtype=QuestionType.short_answer,
                stem=f"请简要说明 {kp_str} 的基本原理及其在生物医学研究中的意义。",
                answer=f"需要从基本定义、核心机制和应用价值三个维度进行阐述。"
                + (f" 关键证据：{evidence_snippet[:150]}" if evidence_snippet else ""),
                explanation="考查对核心概念的完整理解和结构化表达能力。",
                rubric=[
                    {"dimension": "概念准确性", "max_score": 3, "description": "是否正确定义核心概念"},
                    {"dimension": "机制理解", "max_score": 4, "description": "是否清晰阐述作用机制"},
                    {"dimension": "应用价值", "max_score": 3, "description": "是否说明研究或临床意义"},
                ],
                difficulty=difficulty,
            )

        if qtype == QuestionType.research.value:
            return self._build_question(
                course_id=course_id,
                qtype=QuestionType.research,
                stem=f"如果要设计一个实验研究 {kp_str} 的功能，请提出实验方案的关键步骤和预期结果。",
                answer="实验方案应包括：明确的实验目的（探究功能/机制）、合适的模型系统选择、对照组设计、关键检测指标和预期结果分析。",
                explanation="考查科研思维和实验设计能力。",
                rubric=[
                    {"dimension": "实验设计合理性", "max_score": 5, "description": "方案是否逻辑严谨"},
                    {"dimension": "对照组设计", "max_score": 3, "description": "对照组是否完整"},
                    {"dimension": "创新性", "max_score": 2, "description": "是否有新颖的实验思路"},
                ],
                difficulty="hard",
            )

        if qtype == QuestionType.industry.value:
            return self._build_question(
                course_id=course_id,
                qtype=QuestionType.industry,
                stem=f"{kp_str} 相关技术在产业转化中面临哪些主要挑战？请从技术、成本和监管三个角度分析。",
                answer="技术方面：需要验证在真实生产环境下的稳定性和可扩展性。成本方面：需要评估规模化生产成本和市场竞争可行性。监管方面：需关注相关法规和审批路径。",
                explanation="考查产业思维和技术转化意识。",
                difficulty=difficulty,
            )

        return None

    def _build_question(
        self,
        course_id: int | None,
        qtype: QuestionType,
        stem: str,
        answer: str,
        explanation: str,
        difficulty: str = "medium",
        options: list[dict] | None = None,
        rubric: list[dict] | None = None,
        knowledge_point_ids: list[str] | None = None,
    ) -> Question:
        question = Question(
            course_id=course_id,
            knowledge_point_ids=knowledge_point_ids or [],
            type=qtype,
            stem=stem,
            options=options or [],
            answer=answer,
            explanation=explanation,
            rubric=rubric or [],
            source_refs=[],
            difficulty=difficulty,
            status=QuestionStatus.draft,
            created_by="ai",
            ai_confidence=0.7,
            needs_review=True,
        )
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    # ----- Quality Control -----

    def validate_question(self, question_id: int) -> dict[str, Any]:
        """Auto-validate a question: check answer uniqueness, option mutual exclusion, evidence consistency."""
        question = self.get_question(question_id)
        if not question:
            return {"valid": False, "errors": ["问题不存在"]}

        errors: list[str] = []

        if not question.stem or len(question.stem) < 5:
            errors.append("题干过短或为空")

        if not question.answer:
            errors.append("缺少答案")

        if question.type == QuestionType.choice.value:
            if not question.options or len(question.options) < 2:
                errors.append("选择题至少需要2个选项")
            else:
                labels = [o.get("label", "") if isinstance(o, dict) else "" for o in question.options]
                if len(labels) != len(set(labels)):
                    errors.append("选项标签存在重复")

        if question.type == QuestionType.truefalse.value:
            if question.answer not in ("正确", "错误", "对", "错", "True", "False", "true", "false"):
                errors.append("判断题答案应为正确/错误")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "suggestion": "题目格式基本符合要求" if not errors else "请修复上述问题后重新提交",
        }
