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
}

export interface ResearchTaskGenerateRequest {
  topic: string;
  case_key: string | null;
  mode: "independent" | "case_driven";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function generateFallbackResearchTask(
  topic: string,
  caseKey: string | null,
  mode: "independent" | "case_driven",
): ResearchTaskGenerateResponse {
  return {
    topic,
    case_key: caseKey,
    mode,
    research_question: topic,
    background: `围绕「${topic}」这一主题，本训练框架整合生物制造领域核心研究方法论。当前使用本地模板生成，配置 LLM API Key 后可获得 AI 生成的个性化科研任务。`,
    matched_cases: [],
    related_knowledge_points: [
      "分子生物学基础",
      "细胞信号通路",
      "实验设计方法",
      "数据分析统计",
      "文献检索技巧",
      "科研伦理",
      "生物信息学工具",
      "产业转化路径",
    ],
    tasks: [
      {
        type: "literature_review",
        title: "文献调研",
        goal: `系统检索和分析与「${topic}」相关的核心文献，梳理研究现状与知识空白`,
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
        suggested_keywords: ["文献调研", "综述撰写", "检索策略", "研究现状", "知识空白"],
        example_outline: "1. 引言与研究背景\n2. 核心概念与理论基础\n3. 研究现状与进展\n4. 关键技术方法比较\n5. 知识空白与研究展望\n6. 参考文献",
      },
      {
        type: "experiment_design",
        title: "实验设计",
        goal: `围绕「${topic}」设计严谨的验证性实验方案`,
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
        suggested_keywords: ["实验设计", "对照设置", "预实验", "方法优化", "Protocol"],
        example_outline: "1. 研究假设\n2. 实验分组设计\n3. 材料与设备\n4. 详细操作步骤\n5. 检测指标与分析方法\n6. 预期结果\n7. 风险与应对",
      },
      {
        type: "mechanism_explanation",
        title: "机制解释",
        goal: `深入分析「${topic}」涉及的分子机制和原理`,
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
        suggested_keywords: ["机制分析", "信号通路", "分子互作", "模型构建", "假说验证"],
        example_outline: "1. 分子机制概述\n2. 关键信号通路分析\n3. 调控网络与互作关系\n4. 机制模型图\n5. 未解决问题与假说",
      },
      {
        type: "evidence_judgement",
        title: "证据判断与数据分析",
        goal: `系统评估「${topic}」相关研究的证据质量，设计数据采集与统计方案`,
        steps: [
          {
            title: "证据分级评估",
            description: "对已有研究按证据等级分类，评估偏倚风险",
            expected_duration: "2天",
          },
          {
            title: "数据统计方案设计",
            description: "确定统计方法、样本量计算、数据可视化方案",
            expected_duration: "2天",
          },
          {
            title: "批判性分析",
            description: "识别研究局限、矛盾结果和方法学差异",
            expected_duration: "2天",
          },
        ],
        output_requirement: "提交证据评估报告，包含证据分级表、统计方案、批判性分析",
        suggested_keywords: ["证据等级", "统计分析", "偏倚评估", "数据可视化", "批判性思维"],
        example_outline: "1. 证据检索策略\n2. 证据等级分级表\n3. 偏倚风险评估\n4. 统计分析方法\n5. 研究局限性分析\n6. 数据可视化方案",
      },
    ],
    expected_outputs: ["文献综述报告", "实验设计方案", "机制分析报告", "证据评估报告"],
    mentor_advice:
      "1. 从文献综述入手，建立扎实的理论基础\n2. 实验设计时注重对照组设置和样本量合理性\n3. 机制分析建议绘制可视化通路图辅助理解\n4. 定期与导师讨论研究进展，及时调整方向\n5. 注意区分相关性与因果性，避免过度推断",
    seminar_topic: topic.includes("研讨") ? topic : `「${topic}」的研究进展与方法论探讨`,
    source_scope: "仅限平台案例库和知识库内容，未使用外部搜索或数据库",
    disclaimer:
      "当前使用本地模板生成。配置 LLM API Key 后可使用 AI 生成个性化科研任务。本训练框架仅供参考，具体研究设计请结合实际情况和导师指导。",
  };
}

export async function generateResearchTask(params: ResearchTaskGenerateRequest): Promise<ResearchTaskGenerateResponse> {
  const data = await apiFetch<ResearchTaskGenerateResponse>("/api/research/generate-task", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (data) {
    return data;
  }
  return generateFallbackResearchTask(params.topic, params.case_key, params.mode);
}