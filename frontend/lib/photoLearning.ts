// ============================================================
// BioMentor Agent — Photo Learning Core Logic
// 拍照学练：OCR 文本处理、关键词提取、知识库匹配、学习摘要生成
// ============================================================

import type { PhotoLearningResult } from "@/lib/knowledgeTypes";
import { searchKnowledge } from "@/lib/knowledgeSearch";
import { knowledgeConcepts, knowledgePapers, getPaperById, getConceptById } from "@/data/knowledgeBase";

// ---- 内置关键词表 ----
const KEYWORD_DICT = [
  // CRISPR 相关
  "CRISPR", "Cas", "Cas9", "Cas12", "Cas12a", "gRNA", "sgRNA", "PAM",
  "Prime editing", "pegRNA", "碱基编辑", "基因编辑", "基因敲除",
  "CRISPR-Cas", "CRISPR-Cas9", "CRISPR-Cas12", "CRISPR-Cas12a",

  // 细胞凋亡相关
  "细胞凋亡", "caspase", "caspase-3", "caspase-9",
  "Bcl-2", "Bax", "Bak", "Bcl-xL", "p53",
  "线粒体途径", "死亡受体", "凋亡小体",
  "程序性细胞死亡", "肿瘤抑制",

  // mRNA 递送相关
  "mRNA", "LNP", "脂质纳米颗粒", "递送", "翻译",
  "Cap", "UTR", "polyA", "核糖体", "蛋白表达",
  "mRNA疫苗", "mRNA药物", "mRNA治疗",
  "可电离阳离子脂质", "PEG化脂质",

  // 蛋白质相关
  "蛋白质结构", "一级结构", "二级结构", "三级结构", "四级结构",
  "α螺旋", "β折叠", "活性位点", "结构域",
  "翻译后修饰", "PTM", "磷酸化", "乙酰化", "泛素化", "糖基化", "甲基化",
  "蛋白质工程", "定向进化", "理性设计",
  "结构预测", "AlphaFold",

  // 其他知识库关键词
  "单细胞", "TCR", "T细胞受体", "抗原", "抗原发现",
  "知识图谱", "转录组", "TxPert", "扰动预测",
  "数字孪生", "功能基因组", "植物",
  "逆转录酶", "RNA稳定元件", "RNA靶向",
  "免疫重塑", "IRF8", "NIK", "肿瘤微环境",
  "de novo", "肽段测序", "零样本",
  "NHEJ", "HDR", "DNA修复", "非同源末端连接", "同源定向修复",
  "基因治疗", "作物改良", "药物研发", "免疫治疗",
  "癌症", "肿瘤", "CAR-T",
];

/**
 * 从文本中提取生物学关键词
 * 使用内置关键词表进行简单规则匹配
 */
export function extractKeywordsFromText(text: string): string[] {
  const found = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const keyword of KEYWORD_DICT) {
    // 对短关键词（<=3 字符）必须完全匹配单词边界
    if (keyword.length <= 3) {
      // 使用单词边界匹配避免误提取
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) {
        found.add(keyword);
      }
    } else {
      // 长关键词直接包含匹配
      if (lowerText.includes(keyword.toLowerCase())) {
        found.add(keyword);
      }
    }
  }

  // 排序：长关键词在前，更具体的匹配优先
  return Array.from(found).sort((a, b) => b.length - a.length);
}

/**
 * 分析文本并与知识库匹配
 * 复用 searchKnowledge 进行知识库检索
 */
export function analyzeTextWithKnowledgeBase(text: string): PhotoLearningResult {
  const extractedKeywords = extractKeywordsFromText(text);

  // 对每个提取的关键词搜索知识库
  const allConcepts = new Map<string, (typeof knowledgeConcepts)[0]>();
  const allPapers = new Map<string, (typeof knowledgePapers)[0]>();
  const allTasks = new Set<string>();

  // 用前 6 个最相关的关键词搜索
  const searchKeywords = extractedKeywords.slice(0, 6).length > 0
    ? extractedKeywords.slice(0, 6)
    : ["CRISPR", "基因"]; // fallback

  for (const kw of searchKeywords) {
    const result = searchKnowledge(kw);
    result.concepts.forEach((c) => allConcepts.set(c.id, c));
    result.papers.forEach((p) => allPapers.set(p.id, p));
    result.tasks.forEach((t) => allTasks.add(t.id));
  }

  const matchedConcepts = Array.from(allConcepts.values());
  const matchedPapers = Array.from(allPapers.values());
  const matchedTasks = Array.from(allTasks)
    .map((tid) => {
      const { knowledgeResearchTasks } = require("@/data/knowledgeBase");
      return knowledgeResearchTasks.find((t: { id: string }) => t.id === tid);
    })
    .filter(Boolean);

  const summary = buildLearningSummary({
    rawText: text,
    extractedKeywords,
    matchedConcepts,
    matchedPapers,
  });

  const questions: import("@/lib/knowledgeTypes").GeneratedQuestion[] = [];
  // questions will be generated separately by questionGenerator

  return {
    rawText: text,
    extractedKeywords,
    matchedConcepts: matchedConcepts.slice(0, 8),
    matchedPapers: matchedPapers.slice(0, 6),
    matchedTasks: matchedTasks.slice(0, 4),
    summary,
    questions,
  };
}

/**
 * 生成学习摘要
 */
export function buildLearningSummary(result: {
  rawText: string;
  extractedKeywords: string[];
  matchedConcepts: { name: string; category: string }[];
  matchedPapers: { titleZh: string; direction: string }[];
}): string {
  const kwList = result.extractedKeywords.slice(0, 6).join("、") || "生物学";
  const categories = new Set(result.matchedConcepts.map((c) => c.category));
  const categoryStr = categories.size > 0
    ? Array.from(categories).join("、")
    : "生命科学";
  const conceptNames = result.matchedConcepts
    .slice(0, 4)
    .map((c) => c.name)
    .join("、");
  const frontierNames = result.matchedPapers
    .slice(0, 3)
    .map((p) => p.titleZh.slice(0, 20))
    .join("、");
  const industryHints =
    result.matchedConcepts.some((c) =>
      ["应用方向", "前沿技术"].includes(c.category),
    )
      ? "，可进一步连接到 mRNA 治疗、基因编辑治疗和分子诊断等产业应用"
      : "";

  return `系统从上传内容中识别到 ${kwList} 等关键词，这些内容主要属于 ${categoryStr} 大类，涉及 ${conceptNames || "基础生物学"} 等基础知识。可进一步连接到 ${frontierNames || "前沿科研方向"} 等科研前沿${industryHints}。`;
}
