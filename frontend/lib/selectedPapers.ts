// ============================================================
// BioMentor Agent — Selected Papers Workflow
// 文献选择池：localStorage 驱动的前端状态管理
// ============================================================

import type {
  SelectedPaperItem,
  PaperLearningPlan,
  KnowledgeResearchTask,
} from "@/lib/knowledgeTypes";
import {
  knowledgePapers,
  knowledgeResearchTasks,
  getPaperById,
} from "@/data/knowledgeBase";

const STORAGE_KEY = "biomentor:selected-papers";

// ---- localStorage 安全读写 ----

function getStorage(): SelectedPaperItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SelectedPaperItem[]) : [];
  } catch {
    return [];
  }
}

function setStorage(items: SelectedPaperItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage 不可用时静默失败
  }
}

// ---- 公共 API ----

export function getSelectedPapers(): SelectedPaperItem[] {
  return getStorage();
}

export function addSelectedPaper(
  paperId: string,
  selectedFor: SelectedPaperItem["selectedFor"],
  note?: string,
): void {
  const items = getStorage();
  const existing = items.find((item) => item.paperId === paperId);

  if (existing) {
    // 合并用途，去重
    const merged = new Set([...existing.selectedFor, ...selectedFor]);
    existing.selectedFor = Array.from(merged);
    if (note) existing.note = note;
    existing.selectedAt = new Date().toISOString();
  } else {
    items.push({
      paperId,
      selectedFor,
      note: note || "",
      selectedAt: new Date().toISOString(),
    });
  }
  setStorage(items);
}

export function removeSelectedPaper(paperId: string): void {
  const items = getStorage().filter((item) => item.paperId !== paperId);
  setStorage(items);
}

export function clearSelectedPapers(): void {
  setStorage([]);
}

export function isPaperSelected(paperId: string): boolean {
  return getStorage().some((item) => item.paperId === paperId);
}

export function getSelectedPaperItem(paperId: string): SelectedPaperItem | undefined {
  return getStorage().find((item) => item.paperId === paperId);
}

// ---- 学习计划生成 ----

export function buildPaperLearningPlan(paperId: string): PaperLearningPlan | undefined {
  const paper = getPaperById(paperId);
  if (!paper) return undefined;

  const plan: PaperLearningPlan = {
    paperId,
    learningGoal: `深入理解《${paper.titleZh}》，掌握${paper.direction}领域的核心方法`,
    prerequisiteConcepts: paper.relatedConceptIds
      .map((cid) => {
        const { getConceptById } = require("@/data/knowledgeBase");
        const c = getConceptById(cid);
        return c ? c.name : cid;
      })
      .filter(Boolean),
    readingSteps: [
      `第一步：阅读摘要和引言（5-10 分钟）——理解这篇文献要解决什么问题`,
      `第二步：精读方法部分（15-20 分钟）——重点关注：${paper.methodSummary.slice(0, 80)}...`,
      `第三步：理解核心发现（10 分钟）——${paper.keyFinding.slice(0, 80)}...`,
      `第四步：思考教学和研究价值（10 分钟）——${paper.teachingValue.slice(0, 80)}...`,
      `第五步：阅读讨论部分，记录自己的疑问和思考`,
    ],
    experimentThinking: [
      `方法拆解：${paper.methodSummary.slice(0, 100)}...`,
      `关键技术步骤分析：这篇文献的核心实验/计算流程可以分成哪几个阶段？`,
      `如何复现？如果你要在实验室或课堂上复现这个方法，需要哪些资源和时间？`,
      `局限与改进：这篇文献的方法有什么局限性？你能否提出一个改进方案？`,
    ],
    defenseTalkingPoints: [
      `这篇文献的核心贡献：${paper.keyFinding.slice(0, 100)}...`,
      `这篇文献在知识库中的定位：属于${paper.direction}领域的${paper.sourceType}`,
      `与同类文献的比较优势：${paper.researchValue.slice(0, 100)}...`,
      `对教学的启示：${paper.teachingValue.slice(0, 100)}...`,
      `对未来研究的启发：基于这篇文献，下一个值得探索的方向是什么？`,
    ],
    possibleQuestions: [
      `这篇文献的研究动机是什么？`,
      `核心方法有哪些创新点？`,
      `${paper.discussionPrompts[0] || "这项研究的局限性是什么？"}`,
      `如果让你来改进这个方法，你会怎么做？`,
      `这篇文献的实验结果是否足以支持其结论？为什么？`,
      ...paper.demoQuestions.slice(0, 3),
    ],
  };

  return plan;
}

// ---- 答辩提纲生成 ----

export function buildDefenseOutlineFromSelectedPapers(paperIds: string[]): string[] {
  const papers = paperIds
    .map((id) => getPaperById(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (papers.length === 0) {
    return ["尚未选择文献，无法生成答辩提纲"];
  }

  const outline: string[] = [
    "一、为什么选择这些文献",
    ...papers.map(
      (p, i) =>
        `  ${i + 1}. 《${p.titleZh}》— ${p.direction} — 发表于 ${p.venue} (${p.year})`,
    ),
    `  这些文献覆盖了${new Set(papers.map((p) => p.direction)).size}个不同的生物学前沿方向`,
    "",
    "二、它们分别覆盖哪些生物学方向",
    ...papers.map((p) => `  · ${p.direction}：${p.coreProblem.slice(0, 60)}...`),
    "",
    "三、它们如何支撑 BioMentor 的知识库建设",
    ...papers.map((p) => `  · 《${p.titleZh.slice(0, 30)}》：${p.teachingValue.slice(0, 80)}...`),
    "",
    "四、它们如何转化为实验学习任务",
    ...papers
      .filter((p) => p.recommendedFor.includes("实验学习"))
      .map((p) => `  · ${p.titleZh.slice(0, 40)}：${p.experimentLearningValue.slice(0, 80)}...`),
    ...(papers.filter((p) => p.recommendedFor.includes("实验学习")).length === 0
      ? ["  （所选文献中暂无明确标注'实验学习'场景的文献）"]
      : []),
    "",
    "五、它们如何支撑知识图谱",
    ...papers
      .filter((p) => p.recommendedFor.includes("知识图谱"))
      .map((p) => `  · ${p.titleZh.slice(0, 40)}：关联概念 → ${p.relatedConceptIds.join(", ")}`),
    "",
    "六、它们如何体现 AI + 生物制造 / 生命科学教育创新",
    "  · AI方法在生物学研究中的应用：蛋白质设计、知识图谱推理、单细胞模型解释",
    "  · 计算与实验融合的新范式：从数据驱动到知识驱动",
    "  · 教育价值：将前沿科研文献转化为可教、可学、可练的教学资源",
    "",
    "七、当前版本限制",
    "  · 本版本为展示型本地知识库，文献数据为元数据和教学摘要",
    "  · 未接入实时文献检索API和全文PDF",
    "  · 答辩提纲基于模板生成，后续可接入LLM进行个性化深度分析",
    "",
    "八、后续如何扩展为 RAG 或真实智能体",
    "  · 接入 PubMed / Semantic Scholar API 实现实时文献检索",
    "  · 对接向量数据库（Milvus/Pinecone）实现语义检索",
    "  · 接入 LLM（Claude/GPT）实现文献智能摘要和问答",
    "  · 扩展知识图谱到更多生物医学实体和关系",
    "  · 支持自定义文献上传和团队协作",
  ];

  return outline;
}

// ---- 科研任务生成 ----

export function buildResearchTasksFromSelectedPapers(
  paperIds: string[],
): KnowledgeResearchTask[] {
  const papers = paperIds
    .map((id) => getPaperById(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (papers.length === 0) return [];

  // 从已存在的任务中找匹配的
  const taskIds = new Set<string>();
  papers.forEach((p) => {
    // 通过概念匹配找到相关任务
    p.relatedConceptIds.forEach((cid) => {
      knowledgeResearchTasks.forEach((t) => {
        if (t.relatedConceptIds.includes(cid)) {
          taskIds.add(t.id);
        }
      });
    });
  });

  const matchedTasks = Array.from(taskIds)
    .map((tid) => knowledgeResearchTasks.find((t) => t.id === tid))
    .filter(Boolean) as KnowledgeResearchTask[];

  // 如果没有匹配的任务，生成一个基于文献的通用任务
  if (matchedTasks.length === 0) {
    const firstPaper = papers[0];
    const genericTask: KnowledgeResearchTask = {
      id: "task-generated",
      title: `${firstPaper.titleZh.slice(0, 40)} 文献研读与实验设计`,
      difficulty: "进阶",
      scenario: `基于《${firstPaper.titleZh}》设计一个可操作的实验学习方案`,
      inputKnowledge: firstPaper.relatedConceptIds.join("、"),
      expectedOutput: `一份包含文献精读笔记、实验设计思路和答辩要点的综合报告`,
      steps: [
        "精读文献，整理核心方法和关键发现",
        "分析文献的实验/计算流程，拆解为可学习的步骤",
        "设计一个简化版的验证实验",
        "撰写学习心得和科研启示",
      ],
      relatedPaperIds: [firstPaper.id],
      relatedConceptIds: firstPaper.relatedConceptIds,
      evaluationRubric: [
        "文献理解的准确性",
        "实验设计的可行性",
        "创新性思考的深度",
      ],
    };
    return [genericTask];
  }

  return matchedTasks.slice(0, 5);
}

/** 获取按用途分组的已选文献 */
export function getSelectedPapersByCategory(): Record<
  string,
  { paperId: string; paperTitle: string; paperTitleZh: string; selectedAt: string; note?: string }[]
> {
  const items = getStorage();
  const grouped: Record<string, typeof items extends (infer T)[] ? { paperId: string; paperTitle: string; paperTitleZh: string; selectedAt: string; note?: string }[] : never> = {};

  items.forEach((item) => {
    const paper = getPaperById(item.paperId);
    if (!paper) return;
    const info = {
      paperId: item.paperId,
      paperTitle: paper.title,
      paperTitleZh: paper.titleZh,
      selectedAt: item.selectedAt,
      note: item.note,
    };
    item.selectedFor.forEach((cat) => {
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(info);
    });
  });

  return grouped;
}
