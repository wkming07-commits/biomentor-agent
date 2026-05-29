// ============================================================
// BioMentor Agent — Knowledge Search
// 知识库检索：支持关键词搜索、ID 查找、关联查询
// ============================================================

import type {
  KnowledgePaper,
  KnowledgeConcept,
  KnowledgeResearchTask,
  KnowledgeSearchResult,
} from "@/lib/knowledgeTypes";
import {
  knowledgePapers,
  knowledgeConcepts,
  knowledgeResearchTasks,
  getPaperById,
  getConceptById,
} from "@/data/knowledgeBase";

/** 规范化关键词：去除首尾空格，转小写 */
export function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase();
}

/** 核心搜索函数 */
export function searchKnowledge(query: string): KnowledgeSearchResult {
  const q = normalizeKeyword(query);

  if (!q) {
    return {
      query,
      concepts: [],
      papers: [],
      tasks: [],
      suggestionTopics: [
        "Prime editing",
        "CRISPR-Cas12",
        "单细胞基础模型",
        "LNP mRNA递送",
        "TCR特异性",
        "TxPert",
      ],
    };
  }

  // 搜索 concepts：name、nameEn、shortDefinition、longExplanation
  const matchedConcepts = knowledgeConcepts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.shortDefinition.toLowerCase().includes(q) ||
      c.longExplanation.toLowerCase().includes(q),
  );

  // 搜索 papers：title、titleZh、direction、keywords
  const matchedPapers = knowledgePapers.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.titleZh.toLowerCase().includes(q) ||
      p.direction.toLowerCase().includes(q) ||
      p.keywords.some((k) => normalizeKeyword(k).includes(q)),
  );

  // 搜索 tasks：title、scenario、relatedConceptIds
  const matchedConceptIds = matchedConcepts.map((c) => c.id);
  const matchedTasks = knowledgeResearchTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.scenario.toLowerCase().includes(q) ||
      t.relatedConceptIds.some((cid) => matchedConceptIds.includes(cid)),
  );

  // 生成建议主题
  const allConcepts = new Set<string>();
  matchedPapers.forEach((p) =>
    p.relatedConceptIds.forEach((cid) => {
      const concept = getConceptById(cid);
      if (concept) allConcepts.add(concept.name);
    }),
  );
  matchedConcepts.forEach((c) => {
    c.relatedConceptIds.forEach((cid) => {
      const concept = getConceptById(cid);
      if (concept && !matchedConcepts.find((mc) => mc.id === cid)) {
        allConcepts.add(concept.name);
      }
    });
  });

  const suggestionTopics = Array.from(allConcepts).slice(0, 6);

  return {
    query,
    concepts: matchedConcepts,
    papers: matchedPapers,
    tasks: matchedTasks,
    suggestionTopics:
      suggestionTopics.length > 0
        ? suggestionTopics
        : [
            "Prime editing",
            "CRISPR-Cas12",
            "单细胞基础模型",
            "LNP mRNA递送",
            "TCR特异性",
            "TxPert",
          ],
  };
}

/** 获取关联论文 */
export function getRelatedPapers(conceptId: string): KnowledgePaper[] {
  const concept = getConceptById(conceptId);
  if (!concept) return [];
  return concept.relatedPaperIds
    .map((pid) => getPaperById(pid))
    .filter((p): p is KnowledgePaper => p !== undefined);
}

/** 获取关联概念 */
export function getRelatedConcepts(conceptId: string): KnowledgeConcept[] {
  const concept = getConceptById(conceptId);
  if (!concept) return [];
  return concept.relatedConceptIds
    .map((cid) => getConceptById(cid))
    .filter((c): c is KnowledgeConcept => c !== undefined);
}

/** 获取概念相关的科研任务 */
export function getResearchTasksByConcept(conceptId: string): KnowledgeResearchTask[] {
  return knowledgeResearchTasks.filter((t) =>
    t.relatedConceptIds.includes(conceptId),
  );
}

/** 获取paper相关的概念 */
export function getConceptsForPaper(paperId: string): KnowledgeConcept[] {
  const paper = getPaperById(paperId);
  if (!paper) return [];
  return paper.relatedConceptIds
    .map((cid) => getConceptById(cid))
    .filter((c): c is KnowledgeConcept => c !== undefined);
}
