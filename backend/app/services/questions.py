"""
Question Service — LLM-powered question generation, validation, CRUD.

Uses LLM for intelligent question generation with:
- Knowledge-point-aware question design
- Bloom's taxonomy-aligned difficulty
- Structured JSON output with rubric
- Automatic validation
- Fallback to template-based generation when LLM unavailable
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import Question, QuestionStatus, QuestionType
from app.services.llm import get_llm
from app.services.prompts import (
    QUESTION_GENERATION_SYSTEM,
    QUESTION_GENERATION_USER,
    QUESTION_GENERATION_SCHEMA,
)

def _utcnow():
    return datetime.now(timezone.utc)


class QuestionService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    # ── CRUD ─────────────────────────────────────────────────────

    def list_questions(
        self, course_id: int | None = None, status: str | None = None,
        type: str | None = None, difficulty: str | None = None,
        page: int = 1, page_size: int = 20,
    ) -> tuple[list[Question], int]:
        q = self.db.query(Question)
        if course_id is not None: q = q.filter(Question.course_id == course_id)
        if status: q = q.filter(Question.status == status)
        if type: q = q.filter(Question.type == type)
        if difficulty: q = q.filter(Question.difficulty == difficulty)
        total = q.count()
        items = q.order_by(Question.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
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
        if not question: return None
        for key, value in data.items():
            if hasattr(question, key): setattr(question, key, value)
        question.updated_at = _utcnow()
        self.db.commit()
        self.db.refresh(question)
        return question

    def delete_question(self, question_id: int) -> bool:
        question = self.get_question(question_id)
        if not question: return False
        self.db.delete(question)
        self.db.commit()
        return True

    def publish_question(self, question_id: int) -> Question | None:
        return self.update_question(question_id, {"status": QuestionStatus.published.value})

    # ── LLM-Powered Generation ───────────────────────────────────

    def generate_questions(
        self, knowledge_points: list[str], evidence_text: str,
        question_types: list[str], count: int = 5,
        difficulty: str = "medium", course_id: int | None = None,
    ) -> list[Question]:
        """Generate questions using LLM with structured JSON output.
        Falls back to template-based generation if LLM unavailable or fails.
        """
        if not knowledge_points:
            knowledge_points = ["通用生物学"]

        if self.llm.available:
            try:
                return self._llm_generate(knowledge_points, evidence_text, question_types, count, difficulty, course_id)
            except Exception:
                pass  # fall through to template fallback

        return self._template_generate(knowledge_points, evidence_text, question_types, count, difficulty, course_id)

    def _llm_generate(
        self, knowledge_points: list[str], evidence: str,
        question_types: list[str], count: int, difficulty: str,
        course_id: int | None,
    ) -> list[Question]:
        user_prompt = QUESTION_GENERATION_USER.format(
            knowledge_points="、".join(knowledge_points),
            evidence=evidence[:2000] if evidence else "无额外参考资料",
            question_types="、".join(question_types),
            count=count,
            difficulty=difficulty,
        )

        result = self.llm.generate_json(
            system_prompt=QUESTION_GENERATION_SYSTEM,
            user_prompt=user_prompt,
            schema=QUESTION_GENERATION_SCHEMA,
            temperature=0.4,
        )

        questions_data = result.get("questions", [])
        generated: list[Question] = []

        for qd in questions_data[:count]:
            try:
                q = Question(
                    course_id=course_id,
                    knowledge_point_ids=knowledge_points,
                    type=QuestionType(qd["type"]),
                    stem=qd["stem"],
                    options=qd.get("options", []),
                    answer=qd["answer"],
                    explanation=qd.get("explanation", ""),
                    rubric=qd.get("rubric", []),
                    source_refs=[],
                    bloom_level=qd.get("bloom_level", "understand"),
                    difficulty=qd.get("difficulty", difficulty),
                    status=QuestionStatus.draft,
                    created_by="ai",
                    ai_confidence=0.85,
                    needs_review=True,
                )
                self.db.add(q)
                self.db.commit()
                self.db.refresh(q)
                generated.append(q)
            except Exception:
                continue

        return generated

    def _template_generate(
        self, knowledge_points: list[str], evidence: str,
        question_types: list[str], count: int, difficulty: str,
        course_id: int | None,
    ) -> list[Question]:
        """Template-based fallback when LLM is unavailable."""
        generated: list[Question] = []
        type_cycle = question_types if question_types else ["choice", "truefalse", "short_answer"]
        kp_str = "、".join(knowledge_points[:5])

        templates = {
            "choice": (
                f"关于 {kp_str}，以下描述正确的是？",
                [
                    {"label": "A", "text": f"{kp_str}仅存在于原核生物中"},
                    {"label": "B", "text": f"{kp_str}是现代生命科学研究的重要方向之一"},
                    {"label": "C", "text": f"{kp_str}只在体外实验中可被观测"},
                    {"label": "D", "text": f"{kp_str}已被证实与任何疾病无关"},
                ],
                "B",
                f"{kp_str}是现代生命科学研究的核心领域，在基础研究和临床转化中均有重要意义。",
            ),
            "truefalse": (
                f"{kp_str}在所有生物体中都发挥相同功能。（判断对错）",
                [],
                "错误",
                f"{kp_str}在不同生物体中可能存在差异化的作用机制。",
            ),
            "short_answer": (
                f"请简要说明 {kp_str} 的基本原理及其在生物医学中的意义。",
                [],
                f"应从定义、机制和应用三个维度阐述 {kp_str}。",
                f"考查对核心概念的完整理解。",
            ),
            "research": (
                f"请设计一个实验方案来研究 {kp_str} 的功能。包括目的、方法、预期结果。",
                [],
                "实验方案应包括明确的假设、对照组设计、关键检测指标和预期结果分析。",
                "考查科研思维和实验设计能力。",
            ),
            "industry": (
                f"{kp_str} 相关技术在产业转化中面临哪些挑战？请从技术、成本和监管角度分析。",
                [],
                "技术方面需验证稳定性和可扩展性，成本需评估规模化可行性，监管需关注审批路径。",
                "考查产业思维和技术转化意识。",
            ),
        }

        for i in range(count):
            qtype = type_cycle[i % len(type_cycle)]
            if qtype not in templates:
                continue
            stem, options, answer, explanation = templates[qtype]
            try:
                q = Question(
                    course_id=course_id,
                    knowledge_point_ids=knowledge_points,
                    type=QuestionType(qtype),
                    stem=stem,
                    options=options,
                    answer=answer,
                    explanation=explanation,
                    rubric=[],
                    source_refs=[],
                    difficulty=difficulty,
                    status=QuestionStatus.draft,
                    created_by="ai",
                    ai_confidence=0.5,
                    needs_review=True,
                )
                self.db.add(q)
                self.db.commit()
                self.db.refresh(q)
                generated.append(q)
            except Exception:
                continue

        return generated

    # ── Validation ───────────────────────────────────────────────

    def validate_question(self, question_id: int) -> dict[str, Any]:
        question = self.get_question(question_id)
        if not question:
            return {"valid": False, "errors": ["问题不存在"]}

        errors: list[str] = []
        if not question.stem or len(question.stem) < 5:
            errors.append("题干过短或为空")
        if not question.answer:
            errors.append("缺少答案")
        if question.type.value == "choice":
            if not question.options or len(question.options) < 2:
                errors.append("选择题至少需要2个选项")
            else:
                labels = [o.get("label", "") if isinstance(o, dict) else "" for o in question.options]
                if len(labels) != len(set(labels)):
                    errors.append("选项标签存在重复")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "suggestion": "题目格式符合要求" if not errors else "请修复上述问题",
        }
