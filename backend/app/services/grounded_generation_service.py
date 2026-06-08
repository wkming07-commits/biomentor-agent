from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy.orm import Session

from app.models import IndustryCase
from app.services.ai_provider import GLMAIProvider
from app.services.retrieval_service import RetrievalService

GROUNDED_SYSTEM_PROMPT = """你是一名生命科学科研训练助手。

只能基于传入的 case_context、selected_task、selected_literature 和 evidence_items 回答。
不要编造论文、DOI、PMID、作者、年份、临床结论、监管状态或外部搜索结果。
如果证据不足，请明确说明“当前证据不足，不能确认”。
输出必须是一个合法 JSON 对象，不要输出 Markdown。"""


class GroundedGenerationService:
    def __init__(self, db: Session | None = None):
        self.db = db
        self.retrieval = RetrievalService(db)
        self.ai = GLMAIProvider()

    async def generate_research_tasks(
        self,
        topic: str,
        case_key: str | None = None,
        mode: str = "independent",
        local_builder=None,
    ) -> dict[str, Any]:
        package = await self.retrieval.collect(topic, case_key=case_key, limit=4)
        local_payload = local_builder() if callable(local_builder) else {
            "topic": topic,
            "case_key": case_key,
            "mode": mode,
            "research_question": topic,
            "background": "测试提示：当前为本地训练框架生成",
            "tasks": [],
        }
        if package["evidence_count"] < 1:
            local_payload.update(self._task_meta("local_fallback", package))
            return local_payload

        prompt = json.dumps(
            {
                "topic": topic,
                "mode": mode,
                "case_context": package["case_context"],
                "evidence_items": self._compact_evidence_items(package["evidence_items"]),
                "required_task_types": ["literature_review", "experiment_design", "mechanism_explanation", "evidence_judgement"],
                "output_schema": {
                    "research_question": "string",
                    "background": "string",
                    "tasks": [
                        {
                            "id": "string",
                            "type": "literature_review | experiment_design | mechanism_explanation | evidence_judgement",
                            "title": "string",
                            "goal": "string",
                            "why_this_task": "string",
                            "steps": ["string"],
                            "expected_output": "string",
                            "keywords": ["string"],
                            "evidence_ids": ["string"],
                            "difficulty": "入门 | 中等 | 挑战",
                        }
                    ],
                    "mentor_advice": "string",
                    "seminar_topic": "string",
                    "limitations": "string",
                },
            },
            ensure_ascii=False,
        )
        result = await self.ai.generate_json(
            GROUNDED_SYSTEM_PROMPT,
            prompt,
            required_fields=["research_question", "background", "tasks", "mentor_advice", "limitations"],
            max_tokens=1800,
            retries=0,
            timeout_seconds=6,
        )
        if not result.success or not result.content:
            local_payload.update(self._task_meta("local_fallback", package))
            return local_payload

        tasks = result.content.get("tasks")
        if not isinstance(tasks, list) or len(tasks) < 4:
            local_payload.update(self._task_meta("local_fallback", package))
            return local_payload

        content = result.content
        content.update(self._task_meta("ai_grounded", package))
        return content

    async def generate_evidence_note(
        self,
        task_title: str,
        task_description: str | None,
        selected_literature: list[dict[str, Any]],
        case_title: str | None = None,
    ) -> dict[str, Any]:
        if not selected_literature:
            raise RuntimeError("At least one selected literature item is required")

        query = " ".join([case_title or "", task_title, task_description or ""]).strip()
        package = await self.retrieval.collect(
            query=query or task_title,
            selected_task={"title": task_title, "goal": task_description or ""},
            selected_literature=selected_literature,
            limit=5,
        )

        prompt = json.dumps(
            {
                "case_context": {"title": case_title or ""},
                "selected_task": {"title": task_title, "goal": task_description or ""},
                "selected_literature": selected_literature,
                "evidence_items": package["evidence_items"],
                "output_schema": {
                    "note_title": "string",
                    "direct_answer": "string",
                    "core_question": "string",
                    "literature_roles": [
                        {
                            "evidence_id": "string",
                            "title": "string",
                            "role": "string",
                            "usable_evidence": "string",
                            "limitation": "string",
                        }
                    ],
                    "case_connection": "string",
                    "seminar_quote": "string",
                    "next_steps": ["string"],
                    "limitations": "string",
                },
            },
            ensure_ascii=False,
        )
        result = await self.ai.generate_json(
            GROUNDED_SYSTEM_PROMPT,
            prompt,
            required_fields=["note_title", "direct_answer", "literature_roles", "limitations"],
            max_tokens=2000,
            retries=2,
        )
        if not result.success or not result.content:
            return self._fallback_note(task_title, task_description, selected_literature, package, case_title)

        return {
            **result.content,
            "source_mode": "ai_grounded",
            "evidence_items": package["evidence_items"],
            "summary": self._note_summary(result.content),
            "limitations_list": [result.content.get("limitations") or "该结果仅用于科研训练。"],
        }

    async def answer_tutor(
        self,
        question: str,
        case_id: str | None = None,
        case_title: str | None = None,
        selected_task: dict[str, Any] | None = None,
        selected_literature: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        empty_package = {
            "evidence_items": [],
            "evidence_count": 0,
            "has_external_evidence": False,
            "has_local_evidence": False,
            "case_context": {},
        }
        early_answer = self._local_tutor_for_question(question, case_id, case_title, selected_task, empty_package)
        if early_answer:
            return early_answer

        package = await self.retrieval.collect(
            query=" ".join([case_title or "", selected_task.get("title", "") if selected_task else "", question]).strip(),
            case_key=case_id,
            selected_task=selected_task,
            selected_literature=selected_literature,
            limit=5,
        )

        prompt = json.dumps(
            {
                "question": question,
                "case_context": {"case_id": case_id, "case_title": case_title},
                "selected_task": selected_task or {},
                "selected_literature": selected_literature or [],
                "evidence_items": package["evidence_items"],
                "output_schema": {
                    "answer": "string",
                    "evidence_used": ["string"],
                    "suggested_next_questions": ["string"],
                    "boundary": "string",
                },
            },
            ensure_ascii=False,
        )
        result = await self.ai.generate_json(
            GROUNDED_SYSTEM_PROMPT,
            prompt,
            required_fields=["answer", "evidence_used", "suggested_next_questions", "boundary"],
            max_tokens=1200,
            retries=0,
            timeout_seconds=6,
        )
        if result.content and isinstance(result.content, dict):
            answer = str(result.content.get("answer") or "").strip()
            if answer:
                if self._is_bare_insufficient_answer(answer, result.content.get("boundary")):
                    return self._fallback_tutor(question, selected_task, package, case_id, case_title)
                evidence_used = result.content.get("evidence_used")
                suggested_next_questions = result.content.get("suggested_next_questions")
                boundary = str(result.content.get("boundary") or "").strip()
                return {
                    "source_mode": "ai_grounded",
                    "answer": answer,
                    "evidence_used": evidence_used if isinstance(evidence_used, list) and evidence_used else [],
                    "suggested_next_questions": suggested_next_questions if isinstance(suggested_next_questions, list) and suggested_next_questions else [],
                    "boundary": boundary or "当前回答仅基于已选任务、已选文献和检索到的证据，不代表完整文献综述结论。",
                }
        if not result.success or not result.content:
            return self._fallback_tutor(question, selected_task, package, case_id, case_title)
        return {"source_mode": "ai_grounded", **result.content}

    def _task_meta(self, source_mode: str, package: dict[str, Any]) -> dict[str, Any]:
        external = package.get("has_external_evidence")
        local = package.get("has_local_evidence")
        evidence_mode = "external_and_local" if external and local else "external_only" if external else "local_only"
        return {
            "source_mode": source_mode,
            "evidence_mode": evidence_mode,
            "debug_hint": "基于真实检索证据生成",
            "evidence_items": package.get("evidence_items", []),
            "limitations": "生成内容用于科研训练，不等同于完整实验方案。",
        }

    def _fallback_note(
        self,
        task_title: str,
        task_description: str | None,
        selected_literature: list[dict[str, Any]],
        package: dict[str, Any],
        case_title: str | None,
    ) -> dict[str, Any]:
        roles = []
        for idx, lit in enumerate(selected_literature, start=1):
            evidence_id = lit.get("id") or lit.get("pmid") or lit.get("doi") or f"selected-{idx}"
            roles.append({
                "evidence_id": evidence_id,
                "title": lit.get("title") or "未提供标题",
                "role": "用于支撑当前科研训练任务的背景、方法或证据边界。",
                "usable_evidence": lit.get("abstract") or "可用于定位原始文献并整理研究线索。",
                "limitation": "未进行全文解析，不能直接替代原文阅读或完整证据评价。",
            })
        direct = f"已选择 {len(selected_literature)} 篇文献，可用于围绕「{task_title}」整理证据线索。"
        return {
            "source_mode": "local_fallback",
            "note_title": f"{case_title or task_title} 的文献支撑笔记",
            "direct_answer": direct,
            "core_question": task_description or task_title,
            "literature_roles": roles,
            "case_connection": "这些资料可帮助把案例核心问题、任务目标和公开文献线索连接起来。",
            "seminar_quote": "可在答辩中说明：当前判断来自已选择文献和案例资料，仍需回到原文确认方法、结论和适用边界。",
            "next_steps": ["补充阅读原文", "比较不同文献的证据类型", "整理仍无法确认的问题"],
            "limitations": "该笔记基于已选文献信息生成，不替代完整论文阅读。",
            "evidence_items": package.get("evidence_items", []),
            "summary": direct,
            "limitations_list": ["该笔记基于已选文献信息生成，不替代完整论文阅读。"],
        }

    def _local_tutor_for_question(
        self,
        question: str,
        case_id: str | None,
        case_title: str | None,
        selected_task: dict[str, Any] | None,
        package: dict[str, Any],
    ) -> dict[str, Any] | None:
        normalized = (question or "").strip().lower()
        if self._is_casual_message(normalized):
            return {
                "source_mode": "local_fallback",
                "answer": (
                    "可以的，我可以围绕当前案例帮你继续分析。你可以直接问：核心机制是什么、"
                    "有哪些产业案例、需要哪些文献支撑、适合生成什么科研训练任务。"
                    f"{f' 当前上下文是「{case_title}」。' if case_title else ''}"
                ),
                "evidence_used": [item.get("id") for item in package.get("evidence_items", [])[:2] if item.get("id")],
                "suggested_next_questions": [
                    "这个案例背后的核心机制是什么？",
                    "有啥产业实例可以参考？",
                    "这个问题需要哪些文献支撑？",
                    "适合拆成哪些训练任务？",
                ],
                "boundary": "该回答用于科研训练和案例学习，不替代临床、监管或商业决策。",
            }

        if self._is_industry_case_question(normalized):
            cases = self._match_industry_cases_for_tutor(question, case_id, case_title, package)
            if cases:
                lines = [
                    "可以参考这些训练用产业案例：",
                    *[
                        f"{idx}. {case.case_key} {case.title}：{case.core_problem or case.industry_direction or '可用于产业应用讨论。'}"
                        for idx, case in enumerate(cases[:4], start=1)
                    ],
                    "建议你选择其中 1 个案例，再追问它的机制、证据边界或可生成的科研训练任务。",
                ]
                return {
                    "source_mode": "local_fallback",
                    "answer": "\n".join(lines),
                    "evidence_used": [f"case-detail-{case.case_key}" for case in cases[:4]],
                    "suggested_next_questions": [
                        "这些案例分别对应哪些生物学知识？",
                        "哪个案例最适合做文献支撑？",
                        "能把其中一个案例拆成训练任务吗？",
                    ],
                    "boundary": "这些是平台内置产业训练案例，用于学习展示，不等同于临床建议或监管结论。",
                }

        return None

    def _fallback_tutor(
        self,
        question: str,
        selected_task: dict[str, Any] | None,
        package: dict[str, Any],
        case_id: str | None = None,
        case_title: str | None = None,
    ) -> dict[str, Any]:
        task_title = selected_task.get("title") if selected_task else "当前问题"
        task_hint = f"当前可结合训练任务「{task_title}」。" if selected_task else ""
        return {
            "source_mode": "local_fallback",
            "answer": (
                f"{task_hint}可以先围绕「{case_title or task_title}」把你的问题「{question}」拆成研究方向、关键词、证据来源和训练任务四部分。"
                "如果当前资料不足以确认某个结论，也可以继续查看相关产业案例、补充关键词，或进入文献支撑区选择参考文献。"
            ),
            "evidence_used": [item.get("id") for item in package.get("evidence_items", [])[:2] if item.get("id")],
            "suggested_next_questions": ["有哪些产业案例可参考？", "哪些证据能直接支持这个判断？", "实验对照应该如何设置？", "当前资料还有哪些不能证明的部分？"],
            "boundary": "该回答用于科研训练，不替代真实实验设计审批。",
        }

    def _is_casual_message(self, text: str) -> bool:
        compact = re.sub(r"\s+", "", text or "")
        return compact in {"哈哈", "哈哈哈", "你好", "在吗", "ok", "hi", "hello", "随便问问"} or bool(
            re.fullmatch(r"[哈啊嘿]{2,}", compact)
        )

    def _is_industry_case_question(self, text: str) -> bool:
        return any(token in text for token in ["产业实例", "产业案例", "应用案例", "产业应用", "有啥案例", "有哪些例子", "有啥例子", "什么例子", "什么案例"])

    def _is_bare_insufficient_answer(self, answer: str, boundary: Any) -> bool:
        combined = f"{answer} {boundary or ''}".strip()
        return "当前证据不足，不能确认" in combined and len(combined) <= 40

    def _match_industry_cases_for_tutor(
        self,
        question: str,
        case_id: str | None,
        case_title: str | None,
        package: dict[str, Any],
    ) -> list[IndustryCase]:
        if self.db is None:
            return []

        cases = self.db.query(IndustryCase).all()
        if not cases:
            return []

        current = next((case for case in cases if case.case_key == case_id), None)
        seed_text = " ".join([
            question or "",
            case_title or "",
            current.title if current else "",
            current.industry_direction if current else "",
            current.category if current else "",
            current.core_problem if current else "",
            " ".join(current.knowledge_points or []) if current and isinstance(current.knowledge_points, list) else "",
            " ".join(current.recommended_keywords or []) if current and isinstance(current.recommended_keywords, list) else "",
            " ".join(str(item.get("title") or "") for item in package.get("evidence_items", [])[:3] if isinstance(item, dict)),
        ]).lower()

        boost_terms = {
            "pd-1": ["pd-1", "pd-l1", "免疫检查点", "肿瘤免疫", "car-t", "bcl-2", "venetoclax", "抗体"],
            "pd-l1": ["pd-1", "pd-l1", "免疫检查点", "肿瘤免疫", "car-t", "bcl-2", "venetoclax", "抗体"],
            "肿瘤免疫": ["pd-1", "pd-l1", "car-t", "免疫治疗", "抗体", "bcl-2"],
            "培养细胞食品": ["培养细胞食品", "cultured meat", "food safety", "alternative protein", "细胞培养"],
            "alphafold": ["alphafold", "蛋白结构预测", "蛋白工程"],
            "mrna": ["mrna", "lnp", "递送", "疫苗"],
        }
        query_terms = set(re.findall(r"[a-z0-9-]+|[\u4e00-\u9fff]{2,}", seed_text))
        for key, terms in boost_terms.items():
            if key in seed_text:
                query_terms.update(term.lower() for term in terms)

        scored: list[tuple[float, IndustryCase]] = []
        for case in cases:
            haystack = " ".join([
                case.case_key or "",
                case.title or "",
                case.subtitle or "",
                case.industry_direction or "",
                case.category or "",
                case.core_problem or "",
                " ".join(case.knowledge_points or []) if isinstance(case.knowledge_points, list) else "",
                " ".join(case.recommended_keywords or []) if isinstance(case.recommended_keywords, list) else "",
            ]).lower()
            score = 0.0
            if current and case.case_key == current.case_key:
                score += 3
            if current and case.category and current.category and case.category == current.category:
                score += 2
            for term in query_terms:
                if len(term) >= 2 and term in haystack:
                    score += 1.5
            if score > 0:
                scored.append((score, case))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [case for _, case in scored[:4]]

    def _format_ai_error(self, error_type: str | None, raw_text: str | None) -> str:
        mapping = {
            "not_configured": "GLM API key is not configured",
            "auth_error": "GLM authentication failed",
            "insufficient_balance": "GLM account balance or quota is insufficient",
            "rate_limited": "GLM provider rate-limited the request",
            "timeout": "GLM request timed out",
            "network_error": "GLM request failed due to a network error",
            "invalid_json": "GLM returned invalid JSON",
            "schema_invalid": "GLM returned incomplete structured content",
        }
        base = mapping.get(error_type or "", "GLM grounded generation failed")
        suffix = f": {raw_text[:200]}" if raw_text else ""
        return f"{base}{suffix}"

    def _note_summary(self, content: dict[str, Any]) -> str:
        lines = [
            f"直接回答：{content.get('direct_answer', '')}",
            f"证据如何支持：{content.get('case_connection', '')}",
            "每篇文献的作用：",
        ]
        for role in content.get("literature_roles", []):
            lines.append(
                f"- {role.get('title', '未提供标题')}：{role.get('role', '')} 限制：{role.get('limitation', '')}"
            )
        lines.extend(
            [
                f"可用于答辩的一句话：{content.get('seminar_quote', '')}",
                "下一步建议：" + "；".join(content.get("next_steps", [])),
                f"使用边界：{content.get('limitations', '')}",
            ]
        )
        return "\n".join(lines)

    def _compact_evidence_items(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        compact: list[dict[str, Any]] = []
        for item in items[:4]:
            compact.append(
                {
                    "id": item.get("id"),
                    "title": item.get("title"),
                    "source_type": item.get("source_type"),
                    "year": item.get("year"),
                    "pmid": item.get("pmid"),
                    "doi": item.get("doi"),
                    "snippet": item.get("snippet"),
                    "relevance_reason": item.get("relevance_reason"),
                    "trust_level": item.get("trust_level"),
                }
            )
        return compact
