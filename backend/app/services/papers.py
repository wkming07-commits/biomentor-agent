"""
Paper Service — research paper CRUD, search, learning plan generation, defense outline.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import ResearchPaper, KnowledgePoint


class PaperService:

    def __init__(self, db: Session):
        self.db = db

    def list_papers(
        self,
        direction: str | None = None,
        difficulty: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ResearchPaper], int]:
        q = self.db.query(ResearchPaper)
        if direction:
            q = q.filter(ResearchPaper.direction == direction)
        if difficulty:
            q = q.filter(ResearchPaper.reading_difficulty == difficulty)

        total = q.count()
        items = (
            q.order_by(ResearchPaper.suggested_reading_order, ResearchPaper.year.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
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
        return (
            self.db.query(ResearchPaper)
            .filter(
                ResearchPaper.title.contains(lower)
                | ResearchPaper.title_zh.contains(lower)
                | ResearchPaper.direction.contains(lower)
                | ResearchPaper.abstract.contains(lower)
            )
            .limit(limit)
            .all()
        )

    def get_demo_papers(self) -> list[ResearchPaper]:
        """Get papers suitable for demo/showcase."""
        return (
            self.db.query(ResearchPaper)
            .filter(ResearchPaper.can_support_demo == True)
            .order_by(ResearchPaper.suggested_reading_order)
            .limit(12)
            .all()
        )

    def build_learning_plan(self, paper_id: int) -> dict[str, Any] | None:
        """Build a structured learning plan for a paper."""
        paper = self.get_paper(paper_id)
        if not paper:
            return None

        related_concepts = paper.related_concepts or []

        return {
            "paper_id": paper.id,
            "title": paper.title_zh or paper.title,
            "learning_goal": f"深入理解《{paper.title_zh}》，掌握{paper.direction}领域的核心方法",
            "prerequisite_concepts": related_concepts,
            "reading_steps": [
                f"第一步：阅读摘要和引言（5-10分钟）——理解这篇文献要解决什么问题",
                f"第二步：精读方法部分（15-20分钟）——重点关注：{paper.method_summary[:100]}",
                f"第三步：理解核心发现（10分钟）——{paper.key_finding[:100]}",
                f"第四步：思考教学和研究价值（10分钟）——{paper.teaching_value[:100]}",
                f"第五步：阅读讨论部分，记录自己的疑问和思考",
            ],
            "experiment_thinking": [
                f"方法拆解：{paper.method_summary[:200]}",
                f"关键技术步骤分析：这篇文献的核心实验/计算流程可以分成哪几个阶段？",
                "如何复现？如果你要在实验室或课堂上复现这个方法，需要哪些资源和时间？",
                "局限与改进：这篇文献的方法有什么局限性？你能否提出一个改进方案？",
            ],
            "defense_talking_points": [
                f"核心贡献：{paper.key_finding[:150]}",
                f"领域定位：{paper.direction}领域的{paper.source_type}",
                f"研究价值：{paper.research_value[:150]}",
                f"教学启示：{paper.teaching_value[:150]}",
                "对未来研究的启发：基于这篇文献，下一个值得探索的方向是什么？",
            ],
            "possible_questions": paper.demo_questions or [
                "这篇文献的研究动机是什么？",
                "核心方法有哪些创新点？",
                "这项研究的局限性是什么？",
                "如果让你来改进这个方法，你会怎么做？",
                "这篇文献的实验结果是否足以支持其结论？为什么？",
            ],
        }

    def build_defense_outline(self, paper_ids: list[int]) -> list[str]:
        """Build a defense outline from selected papers."""
        papers = (
            self.db.query(ResearchPaper)
            .filter(ResearchPaper.id.in_(paper_ids))
            .all()
        )

        if not papers:
            return ["尚未选择文献，无法生成答辩提纲"]

        outline = [
            "一、为什么选择这些文献",
        ]
        for i, p in enumerate(papers, start=1):
            outline.append(f"  {i}. 《{p.title_zh}》— {p.direction} — {p.venue} ({p.year})")
        outline.append(f"  这些文献覆盖了{len(set(p.direction for p in papers))}个不同的生物学前沿方向")
        outline.append("")

        outline.append("二、它们分别覆盖哪些生物学方向")
        for p in papers:
            outline.append(f"  · {p.direction}：{p.core_problem[:80]}...")
        outline.append("")

        outline.append("三、它们如何支撑 BioMentor 的知识库建设")
        for p in papers:
            outline.append(f"  · 《{p.title_zh[:30]}》：{p.teaching_value[:100]}...")
        outline.append("")

        outline.append("四、它们如何转化为实验学习任务")
        for p in papers:
            if "实验学习" in (p.recommended_for or []):
                outline.append(f"  · {p.title_zh[:40]}：{p.experiment_learning_value[:100]}...")

        outline.append("")
        outline.append("五、它们如何体现 AI + 生物制造 / 生命科学教育创新")
        outline.append("  · AI方法在生物学研究中的应用：蛋白质设计、知识图谱推理、单细胞模型解释")
        outline.append("  · 计算与实验融合的新范式：从数据驱动到知识驱动")
        outline.append("  · 教育价值：将前沿科研文献转化为可教、可学、可练的教学资源")

        return outline
