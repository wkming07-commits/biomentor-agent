// ============================================================
// BioMentor Agent — Knowledge Base Type Definitions
// 知识库核心类型定义
// ============================================================

/** 知识关系类型 */
export type KnowledgeRelationType =
  | "属于"
  | "依赖"
  | "改进"
  | "应用于"
  | "解释"
  | "验证"
  | "关联文献"
  | "关联工具"
  | "关联产业案例";

/** 科研文献 */
export interface KnowledgePaper {
  id: string;
  title: string;
  titleZh: string;
  direction: string;
  venue: string;
  year: number;
  sourceType: "学术文献" | "综述" | "预印本" | "方法学";
  sourceNote: string;
  keywords: string[];
  relatedConceptIds: string[];
  relatedToolIds: string[];
  relatedCaseIds: string[];
  coreProblem: string;
  methodSummary: string;
  keyFinding: string;
  teachingValue: string;
  researchValue: string;
  demoScenario: string;
  demoQuestions: string[];
  discussionPrompts: string[];
  evidenceLevel: "高" | "中" | "发展中";
  copyrightNote: string;

  // ---- Selected Papers Workflow 新增字段 ----
  /** 这篇文献是否允许被加入后续学习/答辩 */
  selectable: boolean;
  /** 这篇文献适合用在哪些场景 */
  recommendedFor: Array<"实验学习" | "答辩材料" | "科研任务" | "知识图谱" | "产业案例">;
  /** 对实验设计、科研训练或学习任务的价值 */
  experimentLearningValue: string;
  /** 在答辩中能支撑什么亮点 */
  defenseValue: string;
  /** 学生研读难度 */
  readingDifficulty: "入门" | "中等" | "较难";
  /** 推荐阅读顺序（1-12） */
  suggestedReadingOrder: number;
  /** 是否适合周日展示使用 */
  canSupportDemo: boolean;
}

/** 知识概念 */
export interface KnowledgeConcept {
  id: string;
  name: string;
  nameEn: string;
  category: "前沿技术" | "AI模型" | "实验方法" | "基础概念" | "应用方向" | "工具平台";
  shortDefinition: string;
  longExplanation: string;
  prerequisites: string[];
  relatedConceptIds: string[];
  relatedPaperIds: string[];
  relatedToolIds: string[];
  learningPath: string[];
  commonMisunderstandings: string[];
  demoUse: string;
}

/** 生物工具映射 */
export interface KnowledgeTool {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: string;
  relatedConceptIds: string[];
  relatedPaperIds: string[];
}

/** 科研实战任务 */
export interface KnowledgeResearchTask {
  id: string;
  title: string;
  difficulty: "入门" | "进阶" | "挑战";
  scenario: string;
  inputKnowledge: string;
  expectedOutput: string;
  steps: string[];
  relatedPaperIds: string[];
  relatedConceptIds: string[];
  evaluationRubric: string[];
}

/** 知识关系 */
export interface KnowledgeRelation {
  id: string;
  fromId: string;
  toId: string;
  type: KnowledgeRelationType;
  note: string;
}

/** 知识图谱节点（可视化用） */
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: "paper" | "concept" | "tool" | "task";
  x: number;
  y: number;
  r: number;
  color: string;
  category: string;
  description: string;
}

/** 知识图谱边（可视化用） */
export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  type: KnowledgeRelationType;
  label?: string;
}

/** 搜索结果 */
export interface KnowledgeSearchResult {
  query: string;
  concepts: KnowledgeConcept[];
  papers: KnowledgePaper[];
  tasks: KnowledgeResearchTask[];
  suggestionTopics: string[];
}

// ============================================================
// Selected Papers Workflow 类型
// ============================================================

/** 已选文献条目 */
export interface SelectedPaperItem {
  paperId: string;
  selectedFor: Array<"实验学习" | "答辩材料" | "科研任务" | "知识图谱" | "研读清单">;
  note?: string;
  selectedAt: string;
}

/** 文献学习计划 */
export interface PaperLearningPlan {
  paperId: string;
  learningGoal: string;
  prerequisiteConcepts: string[];
  readingSteps: string[];
  experimentThinking: string[];
  defenseTalkingPoints: string[];
  possibleQuestions: string[];
}

// ============================================================
// Photo Learning 拍照学练 类型
// ============================================================

/** 拍照学练样例 */
export interface PhotoLearningSample {
  id: string;
  title: string;
  subject: string;
  mockOcrText: string;
  relatedCategoryId: string;
  relatedKnowledgeAnchorIds: string[];
}

/** 拍照学练结果 */
export interface PhotoLearningResult {
  rawText: string;
  extractedKeywords: string[];
  matchedConcepts: KnowledgeConcept[];
  matchedPapers: KnowledgePaper[];
  matchedTasks: KnowledgeResearchTask[];
  summary: string;
  questions: GeneratedQuestion[];
}

/** 出题类型 */
export type GeneratedQuestionType =
  | "选择题"
  | "判断题"
  | "简答题"
  | "科研拓展题"
  | "产业联系题";

/** 生成的题目 */
export interface GeneratedQuestion {
  id: string;
  type: GeneratedQuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  relatedConceptIds: string[];
  relatedPaperIds?: string[];
}
