"""
Research Task Generation Service — AI-powered structured research task generation.
Uses existing LLMService and IndustryCase data to generate scaffolded research training tasks.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import IndustryCase
from app.services.llm import get_llm
from app.schemas import TaskItem, TaskStep, ResearchTaskGenerateResponse


RESEARCH_TASK_SYSTEM = """你是一位资深的生物制造领域科研导师，擅长为研究生和科研人员设计结构化的科研训练任务。

你的任务是根据用户提供的科研主题或产业案例，生成一份完整的科研训练计划。

设计要求：
1. research_question 必须是清晰、可研究的具体科学问题，而非宽泛话题
2. background 需结合学科背景和产业现状，2-3段说明研究意义和当前进展
3. tasks 必须包含4个核心任务：
   - literature_review: 文献调研 — 检索和分析相关文献，构建研究框架
   - experiment_design: 实验设计 — 设计验证实验方案，包括对照、方法和预期结果
   - mechanism_explanation: 机制解释 — 深入分析分子机制或作用原理
   - evidence_judgement: 证据判断/数据分析 — 评估已有证据质量，设计数据分析策略
4. 每个 task 必须包含：type, title, goal, steps(每个step含title, description, expected_duration), output_requirement, suggested_keywords(5-8个), example_outline
5. matched_cases 列出案例标题和case_key，说明匹配原因
6. related_knowledge_points 列出8-12个核心知识点
7. expected_outputs 列出3-5个预期成果
8. mentor_advice 给出3-5条具体建议，包含常见误区和学习策略
9. seminar_topic 提出一个适合学术研讨的具体议题
10. source_scope 说明信息来源范围（仅限平台案例库和知识库，未搜索外部数据库）
11. disclaimer 必须标明信息来源限制

重要约束：
- 不得编造DOI、PMID或具体论文标题
- 不得声称搜索了PubMed、Google Scholar等外部数据库
- 基于给定案例和平台知识库内容生成
- 没有直接匹配案例时说明"当前平台知识库暂无直接匹配案例"，但仍生成通用科研训练框架"""

RESEARCH_TASK_USER_TEMPLATE = """科研主题：{topic}

{case_context}

请生成结构化的科研训练任务。"""


class ResearchService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()

    def generate_task(self, topic: str, case_key: str | None = None, mode: str = "independent") -> ResearchTaskGenerateResponse:
        if case_key and mode == "case_driven":
            return self._case_driven_task(topic, case_key)
        return self._independent_task(topic)

    def _case_driven_task(self, topic: str, case_key: str) -> ResearchTaskGenerateResponse:
        case = self.db.query(IndustryCase).filter(IndustryCase.case_key == case_key).first()
        if not case:
            raise ValueError(f"Industry case '{case_key}' not found")

        kp_list = case.knowledge_points if isinstance(case.knowledge_points, list) else []
        kw_list = case.recommended_keywords if isinstance(case.recommended_keywords, list) else []
        refs = case.references if isinstance(case.references, list) else []

        case_context = f"""
匹配产业案例：{case.title}（{case.case_key}）
副标题：{case.subtitle or ''}
产业方向：{case.industry_direction or ''}
核心问题：{case.core_problem or case.problem_statement or ''}
研究基础：{case.research_foundation or ''}
应用价值：{case.application_value or ''}
相关知识：{', '.join(kp_list[:10])}
推荐关键词：{', '.join(kw_list[:10])}
证据等级：{case.evidence_level.value if hasattr(case.evidence_level, 'value') else str(case.evidence_level)}
来源类型：{case.source_type.value if hasattr(case.source_type, 'value') else str(case.source_type)}
"""

        matched_cases = [{
            "case_key": case.case_key,
            "title": case.title,
            "reason": f"基于产业方向「{case.industry_direction or '生物制造'}」匹配"
        }]

        if self.llm.available:
            try:
                return self._llm_generate(topic, case_context, case.case_key, "case_driven",
                                          kp_list, kw_list, matched_cases)
            except Exception:
                pass

        return self._build_fallback_task(topic, case.case_key, "case_driven",
                                         kp_list, kw_list, matched_cases,
                                         case_context)

    def _independent_task(self, topic: str) -> ResearchTaskGenerateResponse:
        matched_cases, kp_list, kw_list = self._match_local_cases(topic)
        matched_case = matched_cases[0] if matched_cases else None

        if matched_case:
            case_context = f"""
匹配产业案例：{matched_case['title']}（{matched_case['case_key']}）
相关知识：{', '.join(kp_list[:10])}
推荐关键词：{', '.join(kw_list[:10])}
"""
        else:
            case_context = "当前平台知识库暂无直接匹配案例，以下基于通用生物制造科研方法论生成训练框架。"

        if self.llm.available:
            try:
                return self._llm_generate(topic, case_context, None, "independent",
                                          kp_list, kw_list, matched_cases)
            except Exception:
                pass

        return self._build_fallback_task(topic, None, "independent",
                                         kp_list, kw_list, matched_cases,
                                         case_context)

    def _llm_generate(self, topic: str, case_context: str, case_key: str | None, mode: str,
                      kp_list: list[str], kw_list: list[str],
                      matched_cases: list[dict[str, str]]) -> ResearchTaskGenerateResponse:
        user_prompt = RESEARCH_TASK_USER_TEMPLATE.format(topic=topic, case_context=case_context)

        schema = {
            "type": "object",
            "properties": {
                "research_question": {"type": "string"},
                "background": {"type": "string"},
                "matched_cases": {"type": "array", "items": {"type": "object",
                    "properties": {"case_key": {"type": "string"}, "title": {"type": "string"}, "reason": {"type": "string"}},
                    "required": ["case_key", "title", "reason"], "additionalProperties": False}},
                "related_knowledge_points": {"type": "array", "items": {"type": "string"}},
                "tasks": {"type": "array", "items": {"type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["literature_review", "experiment_design", "mechanism_explanation", "evidence_judgement"]},
                        "title": {"type": "string"},
                        "goal": {"type": "string"},
                        "steps": {"type": "array", "items": {"type": "object",
                            "properties": {"title": {"type": "string"}, "description": {"type": "string"}, "expected_duration": {"type": "string"}},
                            "required": ["title", "description"], "additionalProperties": False}},
                        "output_requirement": {"type": "string"},
                        "suggested_keywords": {"type": "array", "items": {"type": "string"}},
                        "example_outline": {"type": "string"},
                    },
                    "required": ["type", "title", "goal", "steps", "output_requirement", "suggested_keywords", "example_outline"],
                    "additionalProperties": False}},
                "expected_outputs": {"type": "array", "items": {"type": "string"}},
                "mentor_advice": {"type": "string"},
                "seminar_topic": {"type": "string"},
                "source_scope": {"type": "string"},
                "disclaimer": {"type": "string"},
            },
            "required": ["research_question", "background", "tasks", "expected_outputs", "mentor_advice", "seminar_topic", "source_scope", "disclaimer"],
            "additionalProperties": False,
        }

        parsed = self.llm.generate_json(
            system_prompt=RESEARCH_TASK_SYSTEM,
            user_prompt=user_prompt,
            schema=schema,
            temperature=0.4,
        )

        tasks = []
        for t in parsed.get("tasks", []):
            steps = [TaskStep(title=s.get("title", ""), description=s.get("description", ""), expected_duration=s.get("expected_duration", ""))
                     for s in t.get("steps", [])]
            tasks.append(TaskItem(
                type=t.get("type", ""),
                title=t.get("title", ""),
                goal=t.get("goal", ""),
                steps=steps,
                output_requirement=t.get("output_requirement", ""),
                suggested_keywords=t.get("suggested_keywords", []),
                example_outline=t.get("example_outline", ""),
            ))

        return ResearchTaskGenerateResponse(
            topic=topic,
            case_key=case_key,
            mode=mode,
            research_question=parsed.get("research_question", ""),
            background=parsed.get("background", ""),
            matched_cases=parsed.get("matched_cases", matched_cases),
            related_knowledge_points=parsed.get("related_knowledge_points", kp_list),
            tasks=tasks,
            expected_outputs=parsed.get("expected_outputs", []),
            mentor_advice=parsed.get("mentor_advice", ""),
            seminar_topic=parsed.get("seminar_topic", ""),
            source_scope=parsed.get("source_scope", "仅限平台案例库和知识库，未搜索外部数据库"),
            disclaimer=parsed.get("disclaimer", ""),
        )

    def _match_local_cases(self, topic: str) -> tuple[list[dict[str, str]], list[str], list[str]]:
        kp_list: list[str] = []
        kw_list: list[str] = []
        matched: list[dict[str, str]] = []

        topic_lower = topic.lower()
        topic_keywords = [w.strip().lower() for w in topic.replace("？", " ").replace("?", " ").replace("，", " ").split() if len(w.strip()) >= 2]
        cases = self.db.query(IndustryCase).all()
        scores: list[tuple[float, IndustryCase]] = []

        for case in cases:
            score = 0.0
            title = (case.title or "").lower()
            kps = [k.lower() for k in (case.knowledge_points or []) if isinstance(k, str)]
            kws = [k.lower() for k in (case.recommended_keywords or []) if isinstance(k, str)]
            direction = (case.industry_direction or "").lower()
            core = (case.core_problem or case.problem_statement or "").lower()
            category = (case.category or "").lower()

            if any(w in title for w in topic_keywords if len(w) >= 2):
                score += 3
            for kp in kps:
                if kp in topic_lower:
                    score += 1.5
            for kw in kws:
                if kw in topic_lower:
                    score += 1.5
            for tk in topic_keywords:
                for kp in kps:
                    if tk in kp:
                        score += 1.5
                for kw in kws:
                    if tk in kw:
                        score += 1.5
                if tk in direction:
                    score += 2
                if tk in category:
                    score += 1
            if core and any(w in core for w in topic_keywords if len(w) >= 3):
                score += 2

            if score > 0:
                scores.append((score, case))

        scores.sort(key=lambda x: x[0], reverse=True)
        for _, case in scores[:3]:
            matched.append({
                "case_key": case.case_key,
                "title": case.title,
                "reason": f"基于关键字匹配（产业方向: {case.industry_direction or '生物制造'}）"
            })
            if isinstance(case.knowledge_points, list):
                for kp in case.knowledge_points:
                    if isinstance(kp, str) and kp not in kp_list:
                        kp_list.append(kp)
            if isinstance(case.recommended_keywords, list):
                for kw in case.recommended_keywords:
                    if isinstance(kw, str) and kw not in kw_list:
                        kw_list.append(kw)

        return matched, kp_list[:10], kw_list[:8]

    def _build_fallback_task(self, topic: str, case_key: str | None, mode: str,
                             kp_list: list[str], kw_list: list[str],
                             matched_cases: list[dict[str, str]],
                             case_context: str = "") -> ResearchTaskGenerateResponse:
        default_kp = kp_list if kp_list else ["分子生物学基础", "细胞信号通路", "实验设计方法", "数据分析统计",
                                                "文献检索技巧", "科研伦理", "生物信息学工具", "产业转化路径"]
        default_kw = kw_list if kw_list else ["生物制造", "实验设计", "文献调研", "数据分析",
                                               "机制研究", "产业应用", "科研方法", "证据评估"]

        has_match = "当前平台知识库暂无直接匹配案例" not in case_context

        return ResearchTaskGenerateResponse(
            topic=topic,
            case_key=case_key,
            mode=mode,
            research_question=topic,
            background=f"围绕「{topic}」这一主题，本训练框架整合生物制造领域核心研究方法论。{'已匹配到平台相关产业案例，可提供具体背景参考。' if has_match else '当前平台知识库暂无直接匹配案例，以下基于通用生物制造科研方法论生成训练框架。'}",
            matched_cases=matched_cases,
            related_knowledge_points=default_kp,
            tasks=[
                TaskItem(
                    type="literature_review",
                    title="文献调研",
                    goal=f"系统检索和分析与「{topic}」相关的核心文献，梳理研究现状与知识空白",
                    steps=[
                        TaskStep(title="确定检索策略",
                                 description=f"围绕「{topic}」拆解核心概念，构建检索式，选择PubMed、CNKI等数据库",
                                 expected_duration="1-2天"),
                        TaskStep(title="文献筛选与分类",
                                 description="按纳入/排除标准筛选，分类整理高相关文献",
                                 expected_duration="2-3天"),
                        TaskStep(title="文献精读与信息提取",
                                 description="精读10-15篇核心文献，提取实验方法、关键发现、研究局限",
                                 expected_duration="3-5天"),
                        TaskStep(title="撰写文献综述",
                                 description="按主题组织综述框架，撰写文献调研报告",
                                 expected_duration="2-3天"),
                    ],
                    output_requirement="提交3000字以上文献综述，包含至少15篇参考文献，明确标注知识空白和研究方向",
                    suggested_keywords=default_kw[:8],
                    example_outline="1. 引言与研究背景\n2. 核心概念与理论基础\n3. 研究现状与进展\n4. 关键技术方法比较\n5. 知识空白与研究展望\n6. 参考文献",
                ),
                TaskItem(
                    type="experiment_design",
                    title="实验设计",
                    goal=f"围绕「{topic}」设计严谨的验证性实验方案",
                    steps=[
                        TaskStep(title="明确实验假设",
                                 description="基于文献调研，提炼可验证的科学假设",
                                 expected_duration="1天"),
                        TaskStep(title="实验方案设计",
                                 description="设计实验组和对照组，选择检测指标和方法，确定样本量",
                                 expected_duration="2-3天"),
                        TaskStep(title="预实验与方案优化",
                                 description="进行小规模预实验，验证可行性，优化实验条件",
                                 expected_duration="3-5天"),
                        TaskStep(title="完整实验Protocol撰写",
                                 description="撰写详细的实验操作流程文档",
                                 expected_duration="1-2天"),
                    ],
                    output_requirement="提交完整实验方案文档，包含假设、分组设计、方法描述、预期结果、潜在风险与应对策略",
                    suggested_keywords=default_kw[:8],
                    example_outline="1. 研究假设\n2. 实验分组设计\n3. 材料与设备\n4. 详细操作步骤\n5. 检测指标与分析方法\n6. 预期结果\n7. 风险与应对",
                ),
                TaskItem(
                    type="mechanism_explanation",
                    title="机制解释",
                    goal=f"深入分析「{topic}」涉及的分子机制和原理",
                    steps=[
                        TaskStep(title="梳理已知机制",
                                 description="整理文献中已报道的分子机制和信号通路",
                                 expected_duration="2天"),
                        TaskStep(title="构建机制模型",
                                 description="绘制分子机制示意图，标注关键节点和调控关系",
                                 expected_duration="2-3天"),
                        TaskStep(title="提出待验证假说",
                                 description="基于机制模型，提出需要进一步验证的分子假说",
                                 expected_duration="1-2天"),
                    ],
                    output_requirement="提交机制分析报告，包含分子通路图、关键节点说明、未解决问题列表",
                    suggested_keywords=default_kw[:8],
                    example_outline="1. 分子机制概述\n2. 关键信号通路分析\n3. 调控网络与互作关系\n4. 机制模型图\n5. 未解决问题与假说",
                ),
                TaskItem(
                    type="evidence_judgement",
                    title="证据判断与数据分析",
                    goal=f"系统评估「{topic}」相关研究的证据质量，设计数据采集与统计方案",
                    steps=[
                        TaskStep(title="证据分级评估",
                                 description="对已有研究按证据等级分类，评估偏倚风险",
                                 expected_duration="2天"),
                        TaskStep(title="数据统计方案设计",
                                 description="确定统计方法、样本量计算、数据可视化方案",
                                 expected_duration="2天"),
                        TaskStep(title="批判性分析",
                                 description="识别研究局限、矛盾结果和方法学差异",
                                 expected_duration="2天"),
                    ],
                    output_requirement="提交证据评估报告，包含证据分级表、统计方案、批判性分析",
                    suggested_keywords=default_kw[:8],
                    example_outline="1. 证据检索策略\n2. 证据等级分级表\n3. 偏倚风险评估\n4. 统计分析方法\n5. 研究局限性分析\n6. 数据可视化方案",
                ),
            ],
            expected_outputs=["文献综述报告", "实验设计方案", "机制分析报告", "证据评估报告"],
            mentor_advice="1. 从文献综述入手，建立扎实的理论基础\n2. 实验设计时注重对照组设置和样本量合理性\n3. 机制分析建议绘制可视化通路图辅助理解\n4. 定期与导师讨论研究进展，及时调整方向\n5. 注意区分相关性与因果性，避免过度推断",
            seminar_topic=topic if "研讨" in topic else f"「{topic}」的研究进展与方法论探讨",
            source_scope="仅限平台案例库和知识库内容，未使用外部搜索或数据库",
            disclaimer="当前使用本地模板生成。配置 LLM API Key 后可使用 AI 生成个性化科研任务。本训练框架仅供参考，具体研究设计请结合实际情况和导师指导。",
        )