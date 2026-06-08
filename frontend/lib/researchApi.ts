import { industryCases } from "@/data/industryCases";

export interface TaskStep {
  title: string;
  description: string;
  expected_duration: string;
}

export interface ResearchTaskItem {
  type: string;
  title: string;
  goal: string;
  steps: TaskStep[];
  output_requirement: string;
  suggested_keywords: string[];
  example_outline: string;
  why_this_task?: string;
  expected_output?: string;
  keywords?: string[];
  evidence_ids?: string[];
  difficulty?: string;
}

export interface MatchedCase {
  case_key: string;
  title: string;
  reason: string;
}

export interface ResearchTaskGenerateResponse {
  topic: string;
  case_key: string | null;
  mode: string;
  research_question: string;
  background: string;
  matched_cases: MatchedCase[];
  related_knowledge_points: string[];
  tasks: ResearchTaskItem[];
  expected_outputs: string[];
  mentor_advice: string;
  seminar_topic: string;
  source_scope: string;
  disclaimer: string;
  source_mode?: "ai_grounded" | "local_fallback" | string;
  evidence_mode?: string;
  debug_hint?: string;
  evidence_items?: Array<Record<string, unknown>>;
  limitations?: string;
}

export interface ResearchTaskGenerateRequest {
  topic?: string;
  case_key: string | null;
  case_title?: string;
  caseTitle?: string;
  core_question?: string;
  coreQuestion?: string;
  query?: string;
  mode: "independent" | "case_driven";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body?.error ||
        body?.detail ||
        (typeof body?.message === "string" ? body.message : "") ||
        `请求失败 (${response.status})`;
      throw new Error(message);
    }
    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("科研任务生成超时，请稍后重试");
    }
    throw error;
  }
}

function buildCaseTaskCopy(topic: string, caseDetail: (typeof industryCases)[number] | undefined) {
  const searchable = [
    topic,
    caseDetail?.id,
    caseDetail?.title,
    caseDetail?.subtitle,
    caseDetail?.coreProblem,
    caseDetail?.industryDirection,
    caseDetail?.realProductOrTechnology,
    ...(caseDetail?.relatedKnowledgePoints || []),
    ...(caseDetail?.recommendedKeywords || []),
    caseDetail?.displayFocus,
    caseDetail?.applicationScenario,
  ].filter(Boolean).join(" ").toLowerCase();

  if (caseDetail?.id === "case-036" || /培养细胞食品|cultured meat|cell-cultured|upside/.test(searchable)) {
    return {
      literatureTitle: "培养细胞食品生产流程梳理",
      literatureGoal: "梳理培养动物细胞制成食品原料的生产流程、关键控制点和公开证据边界。",
      experimentTitle: "食品安全性评价路径分析",
      experimentGoal: "围绕成分、污染控制、细胞培养过程和成品检测，设计食品安全性评价路径。",
      mechanismTitle: "规模化生产与质量控制方案",
      mechanismGoal: "分析细胞扩增、培养基、收获加工和质量一致性之间的关系。",
      evidenceTitle: "产业化边界与监管证据分析",
      evidenceGoal: "评估培养细胞食品从工艺可行性走向产业化时的监管、成本和证据边界。",
    };
  }

  if (caseDetail?.id === "case-035" || /alphafold|蛋白结构预测|structure prediction|蛋白工程/.test(searchable)) {
    return {
      literatureTitle: "AlphaFold DB 结构预测证据解读",
      literatureGoal: "梳理 AlphaFold DB 在蛋白结构预测中的证据来源、适用场景和使用边界。",
      experimentTitle: "结构预测结果实验验证方案",
      experimentGoal: "设计实验验证思路，比较预测结构、置信度指标和功能实验结果。",
      mechanismTitle: "模型置信度与结构功能关系分析",
      mechanismGoal: "解释 pLDDT、结构域、活性位点和蛋白功能假设之间的关系。",
      evidenceTitle: "蛋白工程应用与证据边界分析",
      evidenceGoal: "评估结构预测如何服务蛋白工程设计，并识别仍需实验确认的关键问题。",
    };
  }

  if (caseDetail?.id === "case-004" || /mrna|lnp|脂质纳米|递送|内体逃逸/.test(searchable)) {
    return {
      literatureTitle: "mRNA/LNP 递送机制文献梳理",
      literatureGoal: "围绕 mRNA 稳定性、LNP 递送、细胞摄取和免疫反应梳理核心文献。",
      experimentTitle: "LNP 递送效率与安全性评价设计",
      experimentGoal: "设计比较 LNP 组分、递送效率和安全性指标的训练性实验框架。",
      mechanismTitle: "内体逃逸与免疫反应机制解释",
      mechanismGoal: "解释 LNP 保护 mRNA、促进细胞摄取、内体逃逸和抗原表达之间的关系。",
      evidenceTitle: "递送系统证据边界与产业转化分析",
      evidenceGoal: "评估 LNP 递送证据能支持哪些判断，以及哪些结论仍需更多资料确认。",
    };
  }

  return {
    literatureTitle: "文献调研",
    literatureGoal: `系统检索和分析与「${topic}」相关的核心文献，梳理研究现状与知识空白`,
    experimentTitle: "实验设计",
    experimentGoal: `围绕「${topic}」设计严谨的验证性实验方案`,
    mechanismTitle: "机制解释",
    mechanismGoal: `深入分析「${topic}」涉及的分子机制和原理`,
    evidenceTitle: "研究引导 / 产业转化分析",
    evidenceGoal: `系统评估「${topic}」相关研究的证据质量，并梳理从机制理解到产业应用的转化路径`,
  };
}

export function generateLocalResearchTask(
  topic: string,
  caseKey: string | null,
  mode: "independent" | "case_driven",
): ResearchTaskGenerateResponse {
  const caseDetail = caseKey ? industryCases.find((item) => item.id === caseKey) : undefined;
  const caseKeywords = caseDetail?.recommendedKeywords || [];
  const caseKnowledge = caseDetail?.relatedKnowledgePoints || [];
  const defaultKnowledge = caseKnowledge.length > 0
    ? caseKnowledge
    : [
      "分子生物学基础",
      "细胞信号通路",
      "实验设计方法",
      "数据分析统计",
      "文献检索技巧",
      "科研伦理",
      "生物信息学工具",
      "产业转化路径",
    ];
  const defaultKeywords = caseKeywords.length > 0
    ? caseKeywords
    : ["生物制造", "实验设计", "文献调研", "数据分析", "机制研究", "产业应用", "科研方法", "证据评估"];
  const taskCopy = buildCaseTaskCopy(topic, caseDetail);
  const caseEvidence = caseDetail
    ? [{
      id: `case-detail-${caseDetail.id}`,
      title: `${caseDetail.title}：案例详情`,
      source_type: "local_case_detail",
      source_name: "本地产业案例详情",
      snippet: [
        `核心问题：${caseDetail.coreProblem}`,
        `科研基础：${caseDetail.researchFoundation}`,
        `应用场景：${caseDetail.applicationScenario}`,
      ].filter(Boolean).join("\n"),
      relevance_reason: "提供当前科研训练任务的案例背景和机制上下文。",
      trust_level: "curated",
    }]
    : [];
  const matchedCase = caseDetail
    ? [{ case_key: caseDetail.id, title: caseDetail.title, reason: `基于当前产业案例「${caseDetail.category || caseDetail.industryDirection}」生成训练任务` }]
    : [];
  const caseContextLine = caseDetail
    ? `已读取当前案例「${caseDetail.title}」：${caseDetail.coreProblem} ${caseDetail.researchFoundation.slice(0, 160)}`
    : "当前平台知识库暂无直接匹配案例，以下基于通用生物制造科研方法生成训练框架。";

  return {
    topic,
    case_key: caseKey,
    mode,
    research_question: topic,
    background: `测试提示：当前为本地训练框架生成。\n\n围绕「${topic}」这一主题，本训练框架整合生物制造领域核心研究方法、案例线索与文献阅读路径。${caseContextLine}`,
    matched_cases: matchedCase,
    related_knowledge_points: defaultKnowledge,
    tasks: [
      {
        type: "literature_review",
        title: taskCopy.literatureTitle,
        goal: taskCopy.literatureGoal,
        steps: [
          {
            title: "确定检索策略",
            description: `围绕「${topic}」拆解核心概念，构建检索式，选择PubMed、CNKI等数据库`,
            expected_duration: "1-2天",
          },
          {
            title: "文献筛选与分类",
            description: "按纳入/排除标准筛选，分类整理高相关文献",
            expected_duration: "2-3天",
          },
          {
            title: "文献精读与信息提取",
            description: "精读10-15篇核心文献，提取实验方法、关键发现、研究局限",
            expected_duration: "3-5天",
          },
          {
            title: "撰写文献综述",
            description: "按主题组织综述框架，撰写文献调研报告",
            expected_duration: "2-3天",
          },
        ],
        output_requirement: "提交3000字以上文献综述，包含至少15篇参考文献，明确标注知识空白和研究方向",
        suggested_keywords: defaultKeywords.slice(0, 8),
        example_outline: "1. 引言与研究背景\n2. 核心概念与理论基础\n3. 研究现状与进展\n4. 关键技术方法比较\n5. 知识空白与研究展望\n6. 参考文献",
        why_this_task: "先建立证据边界，避免直接进入实验设计时缺少文献依据。",
        expected_output: "一份文献证据表和一段 300 字研究现状摘要。",
        keywords: defaultKeywords.slice(0, 8),
        evidence_ids: caseEvidence.map((item) => item.id),
        difficulty: "中等",
      },
      {
        type: "experiment_design",
        title: taskCopy.experimentTitle,
        goal: taskCopy.experimentGoal,
        steps: [
          {
            title: "明确实验假设",
            description: "基于文献调研，提炼可验证的科学假设",
            expected_duration: "1天",
          },
          {
            title: "实验方案设计",
            description: "设计实验组和对照组，选择检测指标和方法，确定样本量",
            expected_duration: "2-3天",
          },
          {
            title: "预实验与方案优化",
            description: "进行小规模预实验，验证可行性，优化实验条件",
            expected_duration: "3-5天",
          },
          {
            title: "完整实验Protocol撰写",
            description: "撰写详细的实验操作流程文档",
            expected_duration: "1-2天",
          },
        ],
        output_requirement: "提交完整实验方案文档，包含假设、分组设计、方法描述、预期结果、潜在风险与应对策略",
        suggested_keywords: defaultKeywords.slice(0, 8),
        example_outline: "1. 研究假设\n2. 实验分组设计\n3. 材料与设备\n4. 详细操作步骤\n5. 检测指标与分析方法\n6. 预期结果\n7. 风险与应对",
        why_this_task: "把文献中提出的机制或现象转化为可验证问题。",
        expected_output: "一份包含对照、指标和风险边界的高层实验设计框架。",
        keywords: defaultKeywords.slice(0, 8),
        evidence_ids: caseEvidence.map((item) => item.id),
        difficulty: "中等",
      },
      {
        type: "mechanism_explanation",
        title: taskCopy.mechanismTitle,
        goal: taskCopy.mechanismGoal,
        steps: [
          {
            title: "梳理已知机制",
            description: "整理文献中已报道的分子机制和信号通路",
            expected_duration: "2天",
          },
          {
            title: "构建机制模型",
            description: "绘制分子机制示意图，标注关键节点和调控关系",
            expected_duration: "2-3天",
          },
          {
            title: "提出待验证假说",
            description: "基于机制模型，提出需要进一步验证的分子假说",
            expected_duration: "1-2天",
          },
        ],
        output_requirement: "提交机制分析报告，包含分子通路图、关键节点说明、未解决问题列表",
        suggested_keywords: defaultKeywords.slice(0, 8),
        example_outline: "1. 分子机制概述\n2. 关键信号通路分析\n3. 调控网络与互作关系\n4. 机制模型图\n5. 未解决问题与假说",
        why_this_task: "帮助学生把案例中的产品或技术还原到分子机制层面。",
        expected_output: "一张机制图和一份关键节点说明。",
        keywords: defaultKeywords.slice(0, 8),
        evidence_ids: caseEvidence.map((item) => item.id),
        difficulty: "中等",
      },
      {
        type: "evidence_judgement",
        title: taskCopy.evidenceTitle,
        goal: taskCopy.evidenceGoal,
        steps: [
          {
            title: "证据分级评估",
            description: "对已有研究按证据等级分类，评估偏倚风险",
            expected_duration: "2天",
          },
          {
            title: "数据与转化指标设计",
            description: "确定统计方法、关键评价指标、应用场景和转化风险观察点",
            expected_duration: "2天",
          },
          {
            title: "产业化边界分析",
            description: "识别研究局限、方法学差异、适用人群或应用场景边界",
            expected_duration: "2天",
          },
        ],
        output_requirement: "提交研究引导报告，包含证据分级表、数据分析方案、转化路径和风险边界",
        suggested_keywords: defaultKeywords.slice(0, 8),
        example_outline: "1. 证据检索策略\n2. 证据等级分级表\n3. 关键数据指标\n4. 转化路径分析\n5. 应用边界与风险\n6. 下一步研究建议",
        why_this_task: "训练从科研证据走向产业判断时识别适用范围和不确定性。",
        expected_output: "一份证据边界与转化风险分析表。",
        keywords: defaultKeywords.slice(0, 8),
        evidence_ids: caseEvidence.map((item) => item.id),
        difficulty: "中等",
      },
    ],
    expected_outputs: ["文献综述报告", "实验设计方案", "机制分析报告", "研究引导报告"],
    mentor_advice:
      "1. 从文献综述入手，建立扎实的理论基础\n2. 实验设计时注重对照组设置和样本量合理性\n3. 机制分析建议绘制可视化通路图辅助理解\n4. 定期与导师讨论研究进展，及时调整方向\n5. 注意区分相关性与因果性，避免过度推断",
    seminar_topic: topic.includes("研讨") ? topic : `「${topic}」的研究进展与方法论探讨`,
    source_scope: "测试提示：当前为本地训练框架生成",
    disclaimer:
      "本训练框架仅供学习参考，具体研究设计请结合实际条件、原始文献和导师指导。",
    source_mode: "local_fallback",
    evidence_mode: "local_only",
    debug_hint: "测试提示：当前为本地训练框架生成",
    evidence_items: caseEvidence,
    limitations: "生成内容用于科研训练，不等同于完整实验方案。",
  };
}

function resolveResearchTopic(params: ResearchTaskGenerateRequest): string {
  return [
    params.topic,
    params.case_title,
    params.caseTitle,
    params.core_question,
    params.coreQuestion,
    params.query,
  ].find((value) => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

export async function generateResearchTask(params: ResearchTaskGenerateRequest): Promise<ResearchTaskGenerateResponse> {
  const topic = resolveResearchTopic(params);
  const mode = params.mode === "case_driven" || params.case_key ? "case_driven" : "independent";
  const body = {
    ...params,
    topic,
    mode,
  };
  try {
    const data = await apiFetch<ResearchTaskGenerateResponse>("/api/research/generate-task", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (data) {
      return data;
    }
  } catch {
    return generateLocalResearchTask(topic, params.case_key, mode);
  }
  return generateLocalResearchTask(topic, params.case_key, mode);
}

export interface ResearchTutorResponse {
  source_mode: "ai_grounded" | "local_fallback" | string;
  answer: string;
  evidence_used: string[];
  suggested_next_questions: string[];
  boundary: string;
}

export async function askResearchTutor(input: {
  case_id?: string;
  case_title?: string;
  selected_task?: ResearchTaskItem | null;
  selected_literature?: Array<Record<string, unknown>>;
  question: string;
}): Promise<ResearchTutorResponse> {
  try {
    const data = await apiFetch<ResearchTutorResponse>("/api/research/tutor", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (data?.answer) {
      return data;
    }
  } catch {
    // Keep the tutor usable when the evidence/AI service is temporarily unavailable.
  }

  const taskTitle = input.selected_task?.title;
  const normalizedQuestion = input.question.trim().toLowerCase();
  const isCasual = ["哈哈", "哈哈哈", "你好", "在吗", "ok", "hi", "hello"].includes(normalizedQuestion) || /^哈{2,}$/.test(normalizedQuestion);
  const isIndustryCaseQuestion = ["产业实例", "产业案例", "应用案例", "产业应用", "有啥案例", "有哪些例子", "有啥例子"].some((item) => input.question.includes(item));
  const answer = isCasual
    ? `可以的，我可以围绕${input.case_title ? `「${input.case_title}」` : "当前案例"}帮你分析机制、文献、产业案例或科研训练任务。你可以问：这个案例有哪些产业应用？需要哪些文献支撑？`
    : isIndustryCaseQuestion
    ? `可以从当前案例出发查看相关产业案例。建议优先比较同一技术方向、相同知识点或相似应用场景的案例，再整理它们的机制、证据边界和训练任务。`
    : taskTitle
    ? `可以先围绕「${taskTitle}」把问题拆成研究目标、证据来源、方法设计和局限性四部分。当前问题是「${input.question}」，建议先明确要验证的核心假设，再选择可支撑判断的文献或案例证据。`
    : `可以先把你的问题「${input.question}」拆成研究方向、关键词、证据来源和可生成的训练任务。建议先确定核心概念，再补充本地精选文献或公开文献，最后形成一个可讨论的科研训练问题。`;

  return {
    source_mode: "local_fallback",
    answer,
    evidence_used: [],
    suggested_next_questions: [
      "有哪些产业案例可参考？",
      "这个问题适合先查哪些关键词？",
      "可以拆成哪几类科研训练任务？",
    ],
    boundary: "该回答用于科研训练，不替代真实实验设计审批。",
  };
}
