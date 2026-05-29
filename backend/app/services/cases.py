"""
Industry Case Service — LLM-powered case Q&A with Socratic tutoring.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import IndustryCase, ResearchPaper
from app.services.llm import get_llm
from app.services.prompts import CASE_TUTOR_SYSTEM, CASE_TUTOR_USER


class IndustryCaseService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    # ── CRUD ─────────────────────────────────────────────────────

    def list_cases(self, direction: str | None = None, difficulty: str | None = None,
                   featured: bool | None = None, page: int = 1, page_size: int = 20) -> tuple[list[IndustryCase], int]:
        q = self.db.query(IndustryCase)
        if direction: q = q.filter(IndustryCase.industry_direction == direction)
        if difficulty: q = q.filter(IndustryCase.difficulty == difficulty)
        if featured is not None: q = q.filter(IndustryCase.is_featured == featured)
        total = q.count()
        items = q.order_by(IndustryCase.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_case(self, case_id: int) -> IndustryCase | None:
        return self.db.query(IndustryCase).filter(IndustryCase.id == case_id).first()

    def create_case(self, data: dict) -> IndustryCase:
        case = IndustryCase(**data)
        self.db.add(case)
        self.db.commit()
        self.db.refresh(case)
        return case

    def search_cases(self, query: str, limit: int = 10) -> list[IndustryCase]:
        lower = query.lower()
        return self.db.query(IndustryCase).filter(
            IndustryCase.title.contains(lower) | IndustryCase.industry_direction.contains(lower) |
            IndustryCase.background.contains(lower) | IndustryCase.problem_statement.contains(lower)
        ).limit(limit).all()

    # ── LLM-Powered Case Q&A / Tutoring ──────────────────────────

    def get_case_answer(self, case_id: int, query: str) -> dict[str, Any]:
        """LLM-powered case question answering with Socratic tutoring."""
        case = self.get_case(case_id)
        if not case: return {"answer": "案例未找到", "sources": []}

        # Build context from case and related papers
        context_parts = [
            f"背景：{case.background}",
            f"核心问题：{case.problem_statement}",
            f"分析：{case.analysis_text or '请参考案例详情'}",
        ]
        paper_ids = case.related_papers or []
        if isinstance(paper_ids, list) and paper_ids:
            papers = self.db.query(ResearchPaper).filter(ResearchPaper.title_zh.in_(paper_ids)).limit(3).all()
            for p in papers:
                context_parts.append(f"文献《{p.title_zh}》：{p.key_finding}")

        if self.llm.available:
            try:
                user_prompt = CASE_TUTOR_USER.format(
                    case_title=case.title,
                    case_background=case.background,
                    case_problem=case.problem_statement,
                    knowledge_points="、".join(case.knowledge_points or []),
                    student_input=query,
                )
                response = self.llm.generate_text(CASE_TUTOR_SYSTEM, user_prompt, temperature=0.5, max_tokens=800)
                return {
                    "query": query,
                    "answer": response.content,
                    "sources": [{"type": "case", "id": case.id, "title": case.title}],
                    "tokens": response.tokens_total,
                }
            except Exception:
                pass

        # Fallback: rule-based
        return {"query": query, "answer": self._fallback_answer(query, case), "sources": []}

    def _fallback_answer(self, query: str, case: IndustryCase) -> str:
        q = query.lower()
        if any(k in q for k in ["背景", "问题", "挑战"]):
            return f"该案例聚焦{case.industry_direction}领域。{case.problem_statement}"
        if any(k in q for k in ["技术", "方法", "方案"]):
            return f"核心思路是结合{', '.join(case.knowledge_points[:3] if case.knowledge_points else ['相关知识'])}进行系统性分析。{case.analysis_text[:200] if case.analysis_text else ''}"
        if any(k in q for k in ["产业", "应用", "转化"]):
            return f"{case.title}属于{case.industry_direction}方向。{case.background[:200] if case.background else ''}"
        return f"关于「{query}」，建议从{case.industry_direction}产业背景入手。{case.background[:300] if case.background else ''}"
