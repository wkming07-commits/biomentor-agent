"""
Industry Case Service — case CRUD, search, RAG-powered Q&A, research task linking.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import IndustryCase, ResearchPaper, Question


class IndustryCaseService:

    def __init__(self, db: Session):
        self.db = db

    def list_cases(
        self,
        direction: str | None = None,
        difficulty: str | None = None,
        featured: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[IndustryCase], int]:
        q = self.db.query(IndustryCase)
        if direction:
            q = q.filter(IndustryCase.industry_direction == direction)
        if difficulty:
            q = q.filter(IndustryCase.difficulty == difficulty)
        if featured is not None:
            q = q.filter(IndustryCase.is_featured == featured)

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
        return (
            self.db.query(IndustryCase)
            .filter(
                IndustryCase.title.contains(lower)
                | IndustryCase.industry_direction.contains(lower)
                | IndustryCase.background.contains(lower)
                | IndustryCase.problem_statement.contains(lower)
            )
            .limit(limit)
            .all()
        )

    def get_case_answer(self, case_id: int, query: str) -> dict[str, Any]:
        """Generate an answer for a case-related question using RAG-like approach."""
        case = self.get_case(case_id)
        if not case:
            return {"answer": "案例未找到", "sources": []}

        # Search relevant context from the case and related papers
        context_parts = [
            f"背景：{case.background}",
            f"问题：{case.problem_statement}",
            f"分析：{case.analysis_text}",
        ]

        related_paper_ids = case.related_papers or []
        if isinstance(related_paper_ids, list) and related_paper_ids:
            papers = (
                self.db.query(ResearchPaper)
                .filter(ResearchPaper.title_zh.in_(related_paper_ids))
                .limit(3)
                .all()
            )
            for p in papers:
                context_parts.append(f"文献《{p.title_zh}》：{p.key_finding}")

        context = "\n".join(c for c in context_parts if c)

        # Rule-based answer generation
        answer = self._synthesize_answer(query, context, case)
        return {
            "query": query,
            "answer": answer,
            "sources": [
                {"type": "case", "id": case.id, "title": case.title},
                *[
                    {"type": "paper", "id": p.id, "title": p.title_zh}
                    for p in (self.db.query(ResearchPaper).filter(
                        ResearchPaper.title_zh.in_(related_paper_ids)
                    ).limit(3).all() if isinstance(related_paper_ids, list) and related_paper_ids else [])
                ],
            ],
        }

    def _synthesize_answer(self, query: str, context: str, case: IndustryCase) -> str:
        q_lower = query.lower()

        if any(kw in q_lower for kw in ["背景", "问题", "挑战", "难点"]):
            return f"该案例聚焦{case.industry_direction}领域。{case.problem_statement}"

        if any(kw in q_lower for kw in ["技术", "方法", "方案", "如何"]):
            return f"针对{case.title}涉及的技术挑战，核心思路是结合{', '.join(case.knowledge_points[:3] if case.knowledge_points else ['相关知识'])}进行系统性分析。{case.analysis_text[:300] if case.analysis_text else '请参考案例详情中的完整分析。'}"

        if any(kw in q_lower for kw in ["产业", "应用", "转化", "商业"]):
            return f"{case.title}属于{case.industry_direction}方向，{case.background[:200] if case.background else '正在从实验室研究向产业化转化，面临规模化生产、成本控制和监管审批等多重挑战。'}"

        # Default
        return f"关于「{query}」，建议从{case.industry_direction}产业背景入手理解。{case.background[:300] if case.background else ''}"
