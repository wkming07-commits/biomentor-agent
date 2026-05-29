import test from "node:test";
import assert from "node:assert/strict";

import {
  featuredDisciplineIds,
  findKnowledgeNode,
  getDisciplineById,
  getGalaxyEdges,
  getKnowledgePath,
  knowledgeDimensions,
  knowledgeDisciplines,
} from "./knowledge-map-data.mjs";

import {
  buildKnowledgeCacheKey,
  buildKnowledgePromptMessages,
  createLocalKnowledgeAnswer,
  normalizeKnowledgeAiResponse,
} from "./knowledge-ai-types.mjs";

const expectedDimensionIds = [
  "bio-category",
  "fundamentals",
  "frontier",
  "industry",
  "literature",
  "tasks",
];

test("knowledge map exposes 12 discipline branches and six standard dimensions", () => {
  assert.equal(knowledgeDisciplines.length, 12);
  assert.deepEqual(knowledgeDimensions.map((dimension) => dimension.id), expectedDimensionIds);
  assert.deepEqual(
    featuredDisciplineIds,
    [
      "molecular-biology",
      "cell-biology",
      "structural-biology",
      "synthetic-biology",
      "bioinformatics",
    ],
  );

  for (const discipline of knowledgeDisciplines) {
    assert.deepEqual(discipline.dimensions.map((dimension) => dimension.id), expectedDimensionIds);
  }
});

test("featured disciplines are deep while the other disciplines are still substantial", () => {
  for (const discipline of knowledgeDisciplines) {
    const minimumPerDimension = discipline.featured ? 3 : 2;
    for (const dimension of discipline.dimensions) {
      assert.ok(
        dimension.children.length >= minimumPerDimension,
        `${discipline.label}/${dimension.label} should have enough child nodes`,
      );
    }
  }
});

test("structural biology contains an AlphaFold node with platform links and a resolvable path", () => {
  const discipline = getDisciplineById("structural-biology");
  assert.equal(discipline.label, "结构生物学");

  const node = findKnowledgeNode("structural-biology", "alphafold");
  assert.equal(node?.label, "AlphaFold");
  assert.ok(node?.moduleLinks.some((link) => link.href === "/tools/protein"));

  const path = getKnowledgePath("structural-biology", "alphafold");
  assert.deepEqual(path.map((item) => item.label), ["结构生物学", "科研前沿", "AlphaFold"]);
});

test("galaxy edges connect related life-science disciplines without dangling ids", () => {
  const disciplineIds = new Set(knowledgeDisciplines.map((discipline) => discipline.id));
  const edges = getGalaxyEdges();
  assert.ok(edges.length >= 14);
  for (const edge of edges) {
    assert.ok(disciplineIds.has(edge.from), `missing source ${edge.from}`);
    assert.ok(disciplineIds.has(edge.to), `missing target ${edge.to}`);
  }
});

test("AI helper builds stable cache keys and mode-specific prompt messages", () => {
  const context = {
    mode: "research",
    action: "auto_explain",
    discipline: { id: "structural-biology", name: "结构生物学" },
    dimension: { id: "frontier", name: "科研前沿" },
    node: {
      id: "alphafold",
      name: "AlphaFold",
      summary: "利用深度学习预测蛋白质三维结构。",
      keyPoints: ["蛋白结构预测", "深度学习"],
    },
    history: [],
  };

  assert.equal(buildKnowledgeCacheKey(context), "research:auto_explain:structural-biology:frontier:alphafold");
  const messages = buildKnowledgePromptMessages(context);
  assert.match(messages[0].content, /科研助手/);
  assert.match(messages[1].content, /AlphaFold/);
  assert.match(messages[1].content, /JSON/);
});

test("knowledge AI chat prompts and local answers prioritize the latest user question", () => {
  const context = {
    mode: "tutor",
    action: "chat",
    discipline: { id: "structural-biology", name: "结构生物学" },
    dimension: { id: "frontier", name: "科研前沿" },
    node: {
      id: "alphafold",
      name: "AlphaFold",
      summary: "利用深度学习预测蛋白质三维结构。",
      keyPoints: ["蛋白结构预测", "深度学习"],
      moduleLinks: [{ label: "蛋白结构工具", href: "/tools/protein" }],
    },
    history: [
      { role: "assistant", content: "AlphaFold 可用于结构预测。" },
      { role: "user", content: "它和实验解析结构有什么区别？" },
    ],
  };

  const messages = buildKnowledgePromptMessages(context);
  assert.match(messages[1].content, /它和实验解析结构有什么区别/);
  assert.match(messages[1].content, /先直接回答 latestUserQuestion/);

  const local = createLocalKnowledgeAnswer(context);
  assert.match(local.answer, /实验解析结构|区别|AlphaFold/);
  assert.equal(local.source, "local_fallback");
});

test("AI response normalizer accepts fenced JSON and fills safe defaults", () => {
  const context = {
    mode: "tutor",
    action: "auto_explain",
    discipline: { id: "synthetic-biology", name: "合成生物学" },
    dimension: { id: "fundamentals", name: "基础知识" },
    node: {
      id: "plasmid-vector",
      name: "质粒载体",
      summary: "常用于克隆和表达的环状 DNA 载体。",
      keyPoints: ["ori", "筛选标记"],
      moduleLinks: [{ label: "质粒图谱工具", href: "/tools/plasmid" }],
    },
    history: [],
  };

  const raw = "```json\n{\"title\":\"质粒载体学习脉络\",\"answer\":\"质粒载体用于承载和表达目标基因。\"}\n```";
  const normalized = normalizeKnowledgeAiResponse(raw, context);
  assert.equal(normalized.title, "质粒载体学习脉络");
  assert.match(normalized.answer, /目标基因/);
  assert.equal(normalized.source, "deepseek");
  assert.ok(normalized.keyPoints.length >= 2);
  assert.ok(normalized.suggestedQuestions.length >= 4);
  assert.deepEqual(normalized.moduleLinks, [{ label: "质粒图谱工具", href: "/tools/plasmid" }]);
});
