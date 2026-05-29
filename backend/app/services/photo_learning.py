"""
Photo Learning Service — OCR text analysis, keyword extraction, knowledge base matching, question generation.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import KnowledgePoint, ResearchPaper
from app.services.knowledge import KnowledgeService
from app.services.questions import QuestionService


class PhotoLearningService:

    # Built-in biology keyword dictionary
    KEYWORD_DICT = [
        "CRISPR", "Cas", "Cas9", "Cas12", "Cas12a", "gRNA", "sgRNA", "PAM",
        "Prime editing", "pegRNA", "碱基编辑", "基因编辑", "基因敲除",
        "CRISPR-Cas", "CRISPR-Cas9", "CRISPR-Cas12",
        "细胞凋亡", "caspase", "caspase-3", "caspase-9",
        "Bcl-2", "Bax", "Bak", "Bcl-xL", "p53",
        "线粒体途径", "死亡受体", "凋亡小体", "程序性细胞死亡", "肿瘤抑制",
        "mRNA", "LNP", "脂质纳米颗粒", "递送", "翻译",
        "Cap", "UTR", "polyA", "核糖体", "蛋白表达",
        "mRNA疫苗", "mRNA药物", "mRNA治疗", "可电离阳离子脂质", "PEG化脂质",
        "蛋白质结构", "一级结构", "二级结构", "三级结构", "四级结构",
        "α螺旋", "β折叠", "活性位点", "结构域",
        "翻译后修饰", "PTM", "磷酸化", "乙酰化", "泛素化", "糖基化", "甲基化",
        "蛋白质工程", "定向进化", "理性设计", "结构预测", "AlphaFold",
        "单细胞", "TCR", "T细胞受体", "抗原", "抗原发现",
        "知识图谱", "转录组", "TxPert", "扰动预测",
        "数字孪生", "功能基因组", "植物",
        "逆转录酶", "RNA稳定元件", "RNA靶向",
        "免疫重塑", "IRF8", "NIK", "肿瘤微环境",
        "de novo", "肽段测序", "零样本",
        "NHEJ", "HDR", "DNA修复", "非同源末端连接", "同源定向修复",
        "基因治疗", "作物改良", "药物研发", "免疫治疗", "癌症", "肿瘤", "CAR-T",
        "合成生物学", "代谢工程", "发酵", "酶催化", "生物催化",
        "微生物组", "宏基因组", "16S", "肠道菌群",
        "干细胞", "iPSC", "分化", "类器官", "再生医学",
        "测序", "NGS", "RNA-seq", "ChIP-seq", "ATAC-seq",
    ]

    def __init__(self, db: Session):
        self.db = db
        self.knowledge_service = KnowledgeService(db)
        self.question_service = QuestionService(db)

    def analyze(self, text: str, image_base64: str | None = None) -> dict[str, Any]:
        """Full photo learning pipeline: OCR text → keywords → knowledge match → questions."""
        keywords = self._extract_keywords(text)
        concepts, papers = self._match_knowledge(keywords[:8])
        summary = self._build_summary(text, keywords, concepts, papers)
        questions = self._generate_questions_from_text(text, keywords, concepts, papers)

        return {
            "raw_text": text,
            "extracted_keywords": keywords[:12],
            "matched_concepts": concepts[:8],
            "matched_papers": papers[:6],
            "matched_tasks": [],
            "summary": summary,
            "questions": questions,
        }

    def _extract_keywords(self, text: str) -> list[str]:
        found: set[str] = set()
        lower_text = text.lower()

        for kw in self.KEYWORD_DICT:
            if len(kw) <= 3:
                import re
                escaped = re.escape(kw)
                if re.search(rf"\b{escaped}\b", text, re.IGNORECASE):
                    found.add(kw)
            else:
                if kw.lower() in lower_text:
                    found.add(kw)

        return sorted(found, key=lambda x: -len(x))

    def _match_knowledge(self, keywords: list[str]) -> tuple[list[dict], list[dict]]:
        concept_map: dict[int, dict] = {}
        paper_map: dict[int, dict] = {}

        for kw in keywords:
            kps = (
                self.db.query(KnowledgePoint)
                .filter(
                    KnowledgePoint.name.contains(kw)
                    | KnowledgePoint.definition.contains(kw)
                )
                .limit(5)
                .all()
            )
            for kp in kps:
                concept_map[kp.id] = {
                    "id": kp.id,
                    "name": kp.name,
                    "name_en": kp.name_en,
                    "category": kp.category,
                    "definition": kp.definition[:200],
                }

            papers = (
                self.db.query(ResearchPaper)
                .filter(
                    ResearchPaper.title.contains(kw)
                    | ResearchPaper.title_zh.contains(kw)
                    | ResearchPaper.abstract.contains(kw)
                )
                .limit(5)
                .all()
            )
            for p in papers:
                paper_map[p.id] = {
                    "id": p.id,
                    "title": p.title,
                    "title_zh": p.title_zh,
                    "direction": p.direction,
                    "keywords": p.keywords,
                    "core_problem": p.core_problem[:200],
                }

        return list(concept_map.values()), list(paper_map.values())

    def _build_summary(
        self,
        text: str,
        keywords: list[str],
        concepts: list[dict],
        papers: list[dict],
    ) -> str:
        kw_list = "、".join(keywords[:6]) or "生物学"
        categories = set(c.get("category", "") for c in concepts)
        cat_str = "、".join(categories) if categories else "生命科学"
        concept_names = "、".join(c["name"] for c in concepts[:4])
        paper_names = "、".join(p["title_zh"][:20] for p in papers[:3])

        industry_hint = (
            "，可进一步连接到 mRNA 治疗、基因编辑治疗和分子诊断等产业应用"
            if any(c.get("category") in ("应用方向", "前沿技术") for c in concepts)
            else ""
        )

        return (
            f"系统从上传内容中识别到 {kw_list} 等关键词，"
            f"这些内容主要属于 {cat_str} 大类，"
            f"涉及 {concept_names or '基础生物学'} 等基础知识。"
            f"可进一步连接到 {paper_names or '前沿科研方向'} 等科研前沿{industry_hint}。"
        )

    def _generate_questions_from_text(
        self,
        text: str,
        keywords: list[str],
        concepts: list[dict],
        papers: list[dict],
    ) -> list[dict]:
        """Generate questions using the QuestionService rule-based pipeline."""
        if not keywords:
            return []

        kp_names = [c["name"] for c in concepts[:3]] or keywords[:3]
        try:
            questions = self.question_service.generate_questions(
                knowledge_points=kp_names,
                evidence_text=text[:1000],
                question_types=["choice", "choice", "truefalse", "short_answer", "research", "industry"],
                count=6,
                difficulty="medium",
            )
            return [
                {
                    "id": str(q.id),
                    "type": q.type.value,
                    "question": q.stem,
                    "options": q.options if isinstance(q.options, list) else [],
                    "answer": q.answer,
                    "explanation": q.explanation,
                    "related_concept_ids": q.knowledge_point_ids or [],
                    "related_paper_ids": [],
                }
                for q in questions
            ]
        except Exception:
            return []
