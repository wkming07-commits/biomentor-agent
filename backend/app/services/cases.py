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
        results = self.db.query(IndustryCase).filter(
            IndustryCase.title.contains(lower) | IndustryCase.industry_direction.contains(lower) |
            IndustryCase.background.contains(lower) | IndustryCase.problem_statement.contains(lower) |
            IndustryCase.category.contains(lower) | IndustryCase.core_problem.contains(lower)
        ).limit(limit).all()

        if len(results) >= limit:
            return results

        remaining = self.db.query(IndustryCase).filter(
            ~IndustryCase.id.in_([r.id for r in results]) if results else True
        ).all()

        keywords = [w.strip().lower() for w in query.replace("？", " ").replace("?", " ").replace("，", " ").split() if len(w.strip()) >= 2]

        scored = []
        for case in remaining:
            score = 0.0
            kps = [k.lower() for k in (case.knowledge_points or []) if isinstance(k, str)]
            kws = [k.lower() for k in (case.recommended_keywords or []) if isinstance(k, str)]
            for kw in keywords:
                for kp in kps:
                    if kw in kp or kp in kw:
                        score += 1.5
                for kw2 in kws:
                    if kw in kw2 or kw2 in kw:
                        score += 1.5
                title_lower = (case.title or "").lower()
                if kw in title_lower:
                    score += 2
                if kw in (case.industry_direction or "").lower():
                    score += 2
                if kw in (case.category or "").lower():
                    score += 1
            if score > 0:
                scored.append((score, case))

        scored.sort(key=lambda x: x[0], reverse=True)
        extra = [case for _, case in scored[:limit - len(results)]]
        return results + extra

    def get_case_by_key(self, case_key: str) -> IndustryCase | None:
        return self.db.query(IndustryCase).filter(IndustryCase.case_key == case_key).first() if case_key else None

    def get_case_answer_by_key(self, case_key: str | None, query: str) -> dict[str, Any]:
        """Answer query using a specific case if provided, otherwise general answer."""
        if case_key:
            case = self.get_case_by_key(case_key)
            if case:
                return self.get_case_answer(case.id, query)
        return self.generate_industry_answer(query)

    def generate_industry_answer(self, query: str) -> dict[str, Any]:
        clean_query = (query or "").strip()
        if not clean_query:
            raise RuntimeError("query is required")
        if not self.llm.available:
            raise RuntimeError("GLM API key is not configured")

        matched_cases = self.search_cases(clean_query, limit=6)
        if len(matched_cases) < 6:
            existing_ids = [case.id for case in matched_cases]
            recent_query = self.db.query(IndustryCase)
            if existing_ids:
                recent_query = recent_query.filter(~IndustryCase.id.in_(existing_ids))
            matched_cases.extend(recent_query.order_by(IndustryCase.created_at.desc()).limit(6 - len(matched_cases)).all())

        schema = {
            "type": "object",
            "properties": {
                "answer": {"type": "string"},
                "relatedKnowledgePoints": {"type": "array", "items": {"type": "string"}},
                "matchedCases": {"type": "array", "items": {"type": "object"}},
                "researchFrontiers": {"type": "array", "items": {"type": "string"}},
                "industryApplications": {"type": "array", "items": {"type": "string"}},
                "requiredAbilities": {"type": "array", "items": {"type": "string"}},
                "recommendedKeywords": {"type": "array", "items": {"type": "string"}},
                "nextTasks": {"type": "array", "items": {"type": "string"}},
                "sourceScope": {"type": "string"},
                "disclaimer": {"type": "string"},
            },
            "required": [
                "answer",
                "relatedKnowledgePoints",
                "matchedCases",
                "researchFrontiers",
                "industryApplications",
                "requiredAbilities",
                "recommendedKeywords",
                "nextTasks",
                "sourceScope",
                "disclaimer",
            ],
        }
        system_prompt = (
            "You are a life-science industry case tutor. Return exactly one JSON object in Simplified Chinese. "
            "Ground the answer in the supplied local case context when possible. "
            "If direct local matches are weak, set sourceScope to extended_reasoning. "
            "Do not output markdown. Do not use templates."
        )
        user_prompt = "\n".join(
            [
                f"User query: {clean_query}",
                "",
                "Local case context:",
                self._build_case_context(matched_cases) or "No local case context is available.",
                "",
                "Required output fields: answer, relatedKnowledgePoints, matchedCases, researchFrontiers,",
                "industryApplications, requiredAbilities, recommendedKeywords, nextTasks, sourceScope, disclaimer.",
                "matchedCases items should use ids from the local case context only.",
            ]
        )
        try:
            data = self.llm.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=schema,
                temperature=0.2,
                max_tokens=1600,
            )
        except Exception as exc:
            raise RuntimeError(f"GLM industry answer failed: {exc}") from exc

        response = self._normalize_industry_answer(clean_query, data, matched_cases)
        if not response["answer"]:
            raise RuntimeError("GLM industry answer returned empty answer")
        return response

    def _build_case_context(self, cases: list[IndustryCase]) -> str:
        parts: list[str] = []
        for index, case in enumerate(cases[:8], 1):
            parts.append(
                "\n".join(
                    [
                        f"Case {index}: [{case.case_key}] {case.title}",
                        f"Industry Direction: {case.industry_direction or ''}",
                        f"Core Problem: {case.core_problem or case.problem_statement or ''}",
                        f"Research Foundation: {case.research_foundation or ''}",
                        f"Application Value: {case.application_value or ''}",
                        f"Knowledge Points: {', '.join(self._string_list(case.knowledge_points))}",
                        f"Required Abilities: {', '.join(self._string_list(case.required_abilities))}",
                        f"Recommended Keywords: {', '.join(self._string_list(case.recommended_keywords))}",
                        f"Next Research Task: {case.linked_research_task or ''}",
                    ]
                )
            )
        return "\n\n".join(parts)

    def _normalize_industry_answer(self, query: str, data: dict[str, Any], context_cases: list[IndustryCase]) -> dict[str, Any]:
        source = data if isinstance(data, dict) else {}
        valid_cases = {case.case_key: case for case in context_cases if case.case_key}
        matched: list[dict[str, str]] = []
        raw_cases = source.get("matchedCases")
        if isinstance(raw_cases, list):
            for item in raw_cases:
                if not isinstance(item, dict):
                    continue
                case_key = str(item.get("id") or item.get("case_key") or "").strip()
                if case_key not in valid_cases:
                    continue
                case = valid_cases[case_key]
                reason = str(item.get("reason") or "").strip()
                matched.append({"id": case.case_key, "title": case.title, "reason": reason})
                if len(matched) >= 3:
                    break
        source_scope = str(source.get("sourceScope") or "").strip()
        if source_scope not in {"based_on_local_cases", "extended_reasoning", "no_direct_match"}:
            source_scope = "based_on_local_cases" if matched else "extended_reasoning"
        return {
            "query": query,
            "answer": str(source.get("answer") or "").strip(),
            "relatedKnowledgePoints": self._string_list(source.get("relatedKnowledgePoints"))[:8],
            "matchedCases": matched,
            "researchFrontiers": self._string_list(source.get("researchFrontiers"))[:6],
            "industryApplications": self._string_list(source.get("industryApplications"))[:6],
            "requiredAbilities": self._string_list(source.get("requiredAbilities"))[:6],
            "recommendedKeywords": self._string_list(source.get("recommendedKeywords"))[:8],
            "nextTasks": self._string_list(source.get("nextTasks"))[:6],
            "sourceScope": source_scope,
            "disclaimer": str(source.get("disclaimer") or "Generated by GLM for learning use only.").strip(),
            "_source": "glm-backend",
        }

    def _string_list(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _general_answer(self, query: str) -> dict[str, Any]:
        """General answer when no specific case is provided. Clearly marked as non-AI."""
        q = query.lower()
        if any(k in q for k in ["crispr", "基因编辑"]):
            return {"query": query, "answer": "⚠️ 当前回答来自平台知识库模板，非 AI 实时生成。\n\nCRISPR基因编辑技术可用于基因治疗（如镰刀细胞贫血的CTX001疗法）、作物改良（抗病品种培育）和功能基因组学研究。在产业应用中需要注意脱靶效应和递送效率等关键技术挑战。", "sources": []}
        if any(k in q for k in ["凋亡", "apoptosis"]):
            return {"query": query, "answer": "⚠️ 当前回答来自平台知识库模板，非 AI 实时生成。\n\n细胞凋亡是程序性细胞死亡的主要形式，Bcl-2家族蛋白（Bax/Bcl-2）和caspase家族在其中发挥核心作用。BCL-2抑制剂Venetoclax已成功用于血液肿瘤治疗。", "sources": []}
        if any(k in q for k in ["mrna", "lnp", "递送"]):
            return {"query": query, "answer": "⚠️ 当前回答来自平台知识库模板，非 AI 实时生成。\n\nLNP（脂质纳米颗粒）是mRNA药物递送的关键技术。通过AI多目标优化，可实现组织选择性递送，突破传统LNP肝脏偏向性的局限。", "sources": []}
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
        prefix = "⚠️ AI 服务暂不可用，以下为基于案例数据库字段的模板回答：\n\n"
        if any(k in q for k in ["背景", "问题", "挑战"]):
            return f"{prefix}该案例聚焦{case.industry_direction}领域。{case.problem_statement}"
        if any(k in q for k in ["技术", "方法", "方案"]):
            return f"{prefix}核心思路是结合{', '.join(case.knowledge_points[:3] if case.knowledge_points else ['相关知识'])}进行系统性分析。{case.analysis_text[:200] if case.analysis_text else ''}"
        if any(k in q for k in ["产业", "应用", "转化"]):
            return f"{prefix}{case.title}属于{case.industry_direction}方向。{case.background[:200] if case.background else ''}"
        return f"{prefix}关于「{query}」，建议从{case.industry_direction}产业背景入手。{case.background[:300] if case.background else ''}"
