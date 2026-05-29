"""
Photo Learning Service — LLM-powered OCR text analysis, concept extraction, question generation.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import KnowledgePoint, ResearchPaper
from app.services.llm import get_llm
from app.services.prompts import PHOTO_ANALYSIS_SYSTEM, PHOTO_ANALYSIS_USER, PHOTO_ANALYSIS_SCHEMA
from app.services.questions import QuestionService

# Built-in keyword dictionary as fallback
KEYWORD_DICT = [
    "CRISPR", "Cas9", "Cas12", "Prime editing", "碱基编辑", "基因编辑",
    "细胞凋亡", "caspase", "Bcl-2", "Bax", "p53", "线粒体途径",
    "mRNA", "LNP", "脂质纳米颗粒", "递送", "mRNA疫苗", "mRNA治疗",
    "蛋白质结构", "AlphaFold", "定向进化", "蛋白质工程",
    "单细胞", "TCR", "抗原", "转录组", "知识图谱",
    "NHEJ", "HDR", "DNA修复", "基因治疗", "免疫治疗",
    "合成生物学", "代谢工程", "酶催化", "生物催化",
    "干细胞", "iPSC", "类器官", "NGS", "RNA-seq",
    "肿瘤微环境", "CAR-T", "微生物组", "发酵",
]


class PhotoLearningService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.question_service = QuestionService(db)

    def analyze(self, text: str, image_base64: str | None = None) -> dict[str, Any]:
        """Full photo learning pipeline: OCR text -> LLM analysis -> questions."""

        # LLM-powered analysis
        llm_result = {}
        if self.llm.available:
            try:
                user_prompt = PHOTO_ANALYSIS_USER.format(text=text[:3000])
                llm_result = self.llm.generate_json(
                    system_prompt=PHOTO_ANALYSIS_SYSTEM,
                    user_prompt=user_prompt,
                    schema=PHOTO_ANALYSIS_SCHEMA,
                    temperature=0.3,
                )
            except Exception:
                pass

        llm_keywords = llm_result.get("keywords", [])
        domain = llm_result.get("domain", "")
        summary = llm_result.get("summary", "")

        # Fallback: dictionary-based keyword extraction
        fallback_keywords = self._dict_extract(text)
        all_keywords = list(dict.fromkeys(llm_keywords + fallback_keywords))[:12]

        # Match against knowledge base
        concepts, papers = self._match_knowledge(all_keywords[:8])

        # Generate questions
        questions = self._generate_questions(text, all_keywords, concepts, papers)

        # Build summary if LLM didn't provide one
        if not summary:
            summary = self._build_fallback_summary(text, all_keywords, concepts, papers)

        return {
            "raw_text": text,
            "extracted_keywords": all_keywords,
            "domain": domain,
            "matched_concepts": concepts[:8],
            "matched_papers": papers[:6],
            "matched_tasks": [],
            "summary": summary,
            "learning_suggestions": llm_result.get("learning_suggestions", []),
            "questions": questions,
        }

    def _dict_extract(self, text: str) -> list[str]:
        found: set[str] = set()
        lower_text = text.lower()
        for kw in KEYWORD_DICT:
            if kw.lower() in lower_text:
                found.add(kw)
        return sorted(found, key=lambda x: -len(x))

    def _match_knowledge(self, keywords: list[str]) -> tuple[list[dict], list[dict]]:
        concept_map: dict[int, dict] = {}
        paper_map: dict[int, dict] = {}
        for kw in keywords:
            for kp in self.db.query(KnowledgePoint).filter(
                KnowledgePoint.name.contains(kw) | KnowledgePoint.definition.contains(kw)
            ).limit(5).all():
                concept_map[kp.id] = {"id": kp.id, "name": kp.name, "category": kp.category, "definition": kp.definition[:200]}
            for p in self.db.query(ResearchPaper).filter(
                ResearchPaper.title.contains(kw) | ResearchPaper.title_zh.contains(kw)
            ).limit(5).all():
                paper_map[p.id] = {"id": p.id, "title": p.title, "title_zh": p.title_zh, "direction": p.direction, "core_problem": p.core_problem[:200]}
        return list(concept_map.values()), list(paper_map.values())

    def _generate_questions(
        self, text: str, keywords: list[str], concepts: list[dict], papers: list[dict],
    ) -> list[dict]:
        kp_names = [c["name"] for c in concepts[:3]] or keywords[:3]
        if not kp_names: return []
        try:
            qs = self.question_service.generate_questions(
                knowledge_points=kp_names, evidence_text=text[:1000],
                question_types=["choice", "choice", "truefalse", "short_answer", "research", "industry"],
                count=6, difficulty="medium",
            )
            return [
                {"id": str(q.id), "type": q.type.value, "question": q.stem,
                 "options": q.options if isinstance(q.options, list) else [],
                 "answer": q.answer, "explanation": q.explanation,
                 "related_concept_ids": q.knowledge_point_ids or [], "related_paper_ids": []}
                for q in qs
            ]
        except Exception:
            return []

    def _build_fallback_summary(self, text: str, keywords: list[str], concepts: list[dict], papers: list[dict]) -> str:
        kw_list = "、".join(keywords[:6]) or "生物学"
        cats = set(c.get("category", "") for c in concepts)
        cat_str = "、".join(cats) if cats else "生命科学"
        concept_names = "、".join(c["name"] for c in concepts[:4])
        paper_names = "、".join(p["title_zh"][:20] for p in papers[:3])
        hint = "，可进一步连接到产业应用" if any(c.get("category") in ("应用方向", "前沿技术") for c in concepts) else ""
        return f"系统识别到 {kw_list} 等关键词，属于 {cat_str} 大类，涉及 {concept_names or '基础生物学'} 等知识。可连接到 {paper_names or '前沿科研方向'} 等科研前沿{hint}。"
