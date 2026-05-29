// ============================================================
// BioMentor Agent — Knowledge Graph
// 图谱转换：将 concepts/papers/tools/tasks 转成可视化 nodes/edges
// ============================================================

import type {
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeRelation,
} from "@/lib/knowledgeTypes";
import {
  knowledgePapers,
  knowledgeConcepts,
  knowledgeTools,
  knowledgeResearchTasks,
  getPaperById,
  getConceptById,
} from "@/data/knowledgeBase";
import { knowledgeRelations } from "@/data/knowledgeRelations";

/** 节点颜色映射 */
const CATEGORY_COLORS: Record<string, string> = {
  "前沿技术": "#2563eb",
  "AI模型": "#7c3aed",
  "实验方法": "#10b981",
  "基础概念": "#f59e0b",
  "应用方向": "#06b6d4",
  "工具平台": "#8b5cf6",
  default: "#4a4a6a",
};

/** 节点半径映射 */
function radiusForType(type: string): number {
  switch (type) {
    case "paper":
      return 26;
    case "concept":
      return 30;
    case "tool":
      return 22;
    case "task":
      return 24;
    default:
      return 24;
  }
}

/** 圆形布局计算 */
function circularLayout(
  nodes: KnowledgeGraphNode[],
  cx: number,
  cy: number,
  radius: number,
) {
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    node.x = cx + radius * Math.cos(angle);
    node.y = cy + radius * Math.sin(angle);
  });
}

/** 构建知识图谱 */
export function buildKnowledgeGraph(
  centerId?: string,
): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
  let filteredRelations: KnowledgeRelation[];

  if (centerId) {
    // 局部图谱：包含 centerId 及其直接关系的节点
    const relatedIds = new Set<string>();
    relatedIds.add(centerId);
    knowledgeRelations.forEach((r) => {
      if (r.fromId === centerId) relatedIds.add(r.toId);
      if (r.toId === centerId) relatedIds.add(r.fromId);
    });
    filteredRelations = knowledgeRelations.filter(
      (r) => relatedIds.has(r.fromId) || relatedIds.has(r.toId),
    );
  } else {
    // 全图谱
    filteredRelations = [...knowledgeRelations];
  }

  // 收集所有被引用的节点 ID
  const nodeIdSet = new Set<string>();
  filteredRelations.forEach((r) => {
    nodeIdSet.add(r.fromId);
    nodeIdSet.add(r.toId);
  });

  // 构建节点列表
  const nodes: KnowledgeGraphNode[] = [];

  nodeIdSet.forEach((id) => {
    let node: KnowledgeGraphNode | null = null;

    const paper = getPaperById(id);
    if (paper) {
      node = {
        id: paper.id,
        label: paper.titleZh.length > 15 ? paper.titleZh.slice(0, 15) + "..." : paper.titleZh,
        type: "paper",
        x: 0,
        y: 0,
        r: radiusForType("paper"),
        color: "#2563eb",
        category: paper.direction,
        description: paper.coreProblem,
      };
    }

    if (!node) {
      const concept = getConceptById(id);
      if (concept) {
        node = {
          id: concept.id,
          label: concept.name,
          type: "concept",
          x: 0,
          y: 0,
          r: radiusForType("concept"),
          color: CATEGORY_COLORS[concept.category] || CATEGORY_COLORS.default,
          category: concept.category,
          description: concept.shortDefinition,
        };
      }
    }

    if (!node) {
      const tool = knowledgeTools.find((t) => t.id === id);
      if (tool) {
        node = {
          id: tool.id,
          label: tool.name,
          type: "tool",
          x: 0,
          y: 0,
          r: radiusForType("tool"),
          color: CATEGORY_COLORS["工具平台"],
          category: tool.category,
          description: tool.description,
        };
      }
    }

    if (!node) {
      const task = knowledgeResearchTasks.find((t) => t.id === id);
      if (task) {
        node = {
          id: task.id,
          label: task.title.length > 12 ? task.title.slice(0, 12) + "..." : task.title,
          type: "task",
          x: 0,
          y: 0,
          r: radiusForType("task"),
          color: "#f43f5e",
          category: "科研任务",
          description: task.scenario,
        };
      }
    }

    if (node) {
      nodes.push(node);
    }
  });

  // 圆形布局
  const cx = 400;
  const cy = 260;
  const layoutRadius = Math.min(180, nodes.length * 14);
  circularLayout(nodes, cx, cy, layoutRadius);

  // 构建边
  const edges: KnowledgeGraphEdge[] = filteredRelations
    .filter((r) => nodeIdSet.has(r.fromId) && nodeIdSet.has(r.toId))
    .map((r) => ({
      from: r.fromId,
      to: r.toId,
      type: r.type,
      label: r.note,
    }));

  return { nodes, edges };
}

/** 获取图谱节点详情 */
export function getKnowledgeGraphNodeDetail(nodeId: string): {
  label: string;
  type: string;
  description: string;
  category: string;
  relatedPapers: { id: string; title: string }[];
  relatedConcepts: { id: string; name: string }[];
  nextRecommendation: string;
} {
  const paper = getPaperById(nodeId);
  if (paper) {
    const relatedConcepts = paper.relatedConceptIds
      .map((cid) => getConceptById(cid))
      .filter(Boolean)
      .map((c) => ({ id: c!.id, name: c!.name }));
    return {
      label: paper.titleZh,
      type: "文献",
      description: paper.coreProblem,
      category: paper.direction,
      relatedPapers: [],
      relatedConcepts,
      nextRecommendation: `探索关联概念：${relatedConcepts.map((c) => c.name).join("、")}`,
    };
  }

  const concept = getConceptById(nodeId);
  if (concept) {
    const relatedPapers = concept.relatedPaperIds
      .map((pid) => getPaperById(pid))
      .filter(Boolean)
      .map((p) => ({ id: p!.id, title: p!.titleZh }));
    const relatedConcepts = concept.relatedConceptIds
      .map((cid) => getConceptById(cid))
      .filter(Boolean)
      .map((c) => ({ id: c!.id, name: c!.name }));
    return {
      label: concept.name,
      type: "概念",
      description: concept.shortDefinition,
      category: concept.category,
      relatedPapers,
      relatedConcepts,
      nextRecommendation:
        relatedPapers.length > 0
          ? `推荐阅读：${relatedPapers.map((p) => p.title).join("、")}`
          : `探索关联概念：${relatedConcepts.map((c) => c.name).join("、")}`,
    };
  }

  const task = knowledgeResearchTasks.find((t) => t.id === nodeId);
  if (task) {
    return {
      label: task.title,
      type: "科研任务",
      description: task.scenario,
      category: "科研任务",
      relatedPapers: [],
      relatedConcepts: [],
      nextRecommendation: `难度：${task.difficulty}，共 ${task.steps.length} 个步骤`,
    };
  }

  const tool = knowledgeTools.find((t) => t.id === nodeId);
  if (tool) {
    return {
      label: tool.name,
      type: "工具",
      description: tool.description,
      category: tool.category,
      relatedPapers: [],
      relatedConcepts: [],
      nextRecommendation: "前往工具箱使用此工具",
    };
  }

  return {
    label: nodeId,
    type: "未知",
    description: "",
    category: "",
    relatedPapers: [],
    relatedConcepts: [],
    nextRecommendation: "",
  };
}
