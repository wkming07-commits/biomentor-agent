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

    def get_case_by_key(self, case_key: str) -> IndustryCase | None:
        return self.db.query(IndustryCase).filter(IndustryCase.case_key == case_key).first() if case_key else None

    def get_case_answer_by_key(self, case_key: str | None, query: str) -> dict[str, Any]:
        """Answer query using a specific case if provided, otherwise general answer."""
        if case_key:
            case = self.get_case_by_key(case_key)
            if case:
                return self.get_case_answer(case.id, query)
        return self._general_answer(query)

    def _general_answer(self, query: str) -> dict[str, Any]:
        """Fallback general answer when no specific case is provided."""
        q = query.lower()
        if any(k in q for k in ["crispr", "基因编辑"]):
            return {"query": query, "answer": "CRISPR基因编辑技术可用于基因治疗（如镰刀细胞贫血的CTX001疗法）、作物改良（抗病品种培育）和功能基因组学研究。在产业应用中需要注意脱靶效应和递送效率等关键技术挑战。", "sources": []}
        if any(k in q for k in ["凋亡", "apoptosis"]):
            return {"query": query, "answer": "细胞凋亡是程序性细胞死亡的主要形式，Bcl-2家族蛋白（Bax/Bcl-2）和caspase家族在其中发挥核心作用。BCL-2抑制剂Venetoclax已成功用于血液肿瘤治疗。", "sources": []}
        if any(k in q for k in ["mrna", "lnp", "递送"]):
            return {"query": query, "answer": "LNP（脂质纳米颗粒）是mRNA药物递送的关键技术。通过AI多目标优化，可实现组织选择性递送，突破传统LNP肝脏偏向性的局限。", "sources": []}
        return {"query": query, "answer": f"关于「{query}」的相关信息，建议从知识库中的产业案例和科研文献中查找。BioMentor知识库已收录12篇前沿文献和5个产业案例。", "sources": []}

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
