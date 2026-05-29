"""
Paper Service — LLM-powered research paper analysis, learning plans, defense outlines.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import ResearchPaper
from app.services.llm import get_llm
from app.services.prompts import PAPER_ANALYSIS_SYSTEM, PAPER_ANALYSIS_USER, PAPER_ANALYSIS_SCHEMA


class PaperService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    def list_papers(self, direction: str | None = None, difficulty: str | None = None,
                    page: int = 1, page_size: int = 20) -> tuple[list[ResearchPaper], int]:
        q = self.db.query(ResearchPaper)
        if direction: q = q.filter(ResearchPaper.direction == direction)
        if difficulty: q = q.filter(ResearchPaper.reading_difficulty == difficulty)
        total = q.count()
        items = q.order_by(ResearchPaper.suggested_reading_order, ResearchPaper.year.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_paper(self, paper_id: int) -> ResearchPaper | None:
        return self.db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()

    def create_paper(self, data: dict) -> ResearchPaper:
        paper = ResearchPaper(**data)
        self.db.add(paper)
        self.db.commit()
        self.db.refresh(paper)
        return paper

    def search_papers(self, query: str, limit: int = 10) -> list[ResearchPaper]:
        lower = query.lower()
        return self.db.query(ResearchPaper).filter(
            ResearchPaper.title.contains(lower) | ResearchPaper.title_zh.contains(lower) |
            ResearchPaper.direction.contains(lower) | ResearchPaper.abstract.contains(lower)
        ).limit(limit).all()

    def get_demo_papers(self) -> list[ResearchPaper]:
        return self.db.query(ResearchPaper).filter(ResearchPaper.can_support_demo == True).order_by(
            ResearchPaper.suggested_reading_order).limit(12).all()

    # ── LLM-Powered Paper Analysis ───────────────────────────────

    def analyze_paper(self, paper_id: int) -> dict[str, Any]:
        """LLM deep analysis of a paper."""
        paper = self.get_paper(paper_id)
        if not paper: return {"error": "Paper not found"}

        if self.llm.available:
            try:
                user_prompt = PAPER_ANALYSIS_USER.format(
                    title=paper.title_zh or paper.title,
                    abstract=paper.abstract or paper.core_problem,
                    methods=paper.method_summary,
                    findings=paper.key_finding,
                    direction=paper.direction,
                )
                result = self.llm.generate_json(
                    system_prompt=PAPER_ANALYSIS_SYSTEM, user_prompt=user_prompt,
                    schema=PAPER_ANALYSIS_SCHEMA, temperature=0.4,
                )
                return {"paper_id": paper.id, "title": paper.title_zh, **result}
            except Exception:
                pass

        return {"paper_id": paper.id, "title": paper.title_zh, "one_sentence_summary": paper.core_problem,
                "key_innovation": paper.key_finding, "method_breakdown": [paper.method_summary],
                "teaching_points": [paper.teaching_value], "discussion_questions": paper.demo_questions or [],
                "experiment_ideas": [paper.experiment_learning_value], "defense_talking_points": [paper.defense_value],
                "reading_difficulty": "中等"}

    def build_learning_plan(self, paper_id: int) -> dict[str, Any] | None:
        paper = self.get_paper(paper_id)
        if not paper: return None

        # Try LLM analysis first
        analysis = self.analyze_paper(paper_id)

        return {
            "paper_id": paper.id, "title": paper.title_zh or paper.title,
            "learning_goal": f"深入理解《{paper.title_zh}》，掌握{paper.direction}领域的核心方法",
            "prerequisite_concepts": paper.related_concepts or [],
            "one_sentence_summary": analysis.get("one_sentence_summary", ""),
            "key_innovation": analysis.get("key_innovation", ""),
            "reading_steps": [
                f"第一步：阅读摘要和引言（5-10分钟）——理解研究动机",
                f"第二步：精读方法部分（15-20分钟）——重点关注：{paper.method_summary[:100]}",
                f"第三步：理解核心发现（10分钟）——{paper.key_finding[:100]}",
                f"第四步：思考教学和研究价值（10分钟）",
                f"第五步：阅读讨论部分，记录疑问和思考",
            ],
            "method_breakdown": analysis.get("method_breakdown", []),
            "experiment_thinking": analysis.get("experiment_ideas", []),
            "defense_talking_points": analysis.get("defense_talking_points", [
                f"核心贡献：{paper.key_finding[:150]}",
                f"领域定位：{paper.direction}领域的{paper.source_type}",
                f"教学启示：{paper.teaching_value[:150]}",
            ]),
            "discussion_questions": analysis.get("discussion_questions", paper.demo_questions or []),
            "reading_difficulty": analysis.get("reading_difficulty", "中等"),
        }

    def build_defense_outline(self, paper_ids: list[int]) -> list[str]:
        papers = self.db.query(ResearchPaper).filter(ResearchPaper.id.in_(paper_ids)).all()
        if not papers: return ["尚未选择文献，无法生成答辩提纲"]

        outline = [
            "一、为什么选择这些文献",
            *[f"  {i}. 《{p.title_zh}》— {p.direction} — {p.venue} ({p.year})" for i, p in enumerate(papers, 1)],
            f"  覆盖{len(set(p.direction for p in papers))}个生物学前沿方向", "",
            "二、研究方向覆盖",
            *[f"  · {p.direction}：{p.core_problem[:80]}..." for p in papers], "",
            "三、对BioMentor知识库的支撑",
            *[f"  · 《{p.title_zh[:30]}》：{p.teaching_value[:100]}..." for p in papers], "",
            "四、AI + 生物制造教育创新",
            "  · AI在生物学研究中的应用：蛋白质设计、知识图谱推理、单细胞模型解释",
            "  · 计算与实验融合的新范式", "  · 前沿文献转化为可教可学的教学资源",
        ]
        return outline
