import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefenseBriefFromText,
  buildDefensePromptMessages,
  extractPlainTextFromOfficeXml,
  generateLocalDefenseQuestion,
  generateLocalDefenseReport,
  normalizeDefenseBrief,
} from "./defense-flow.mjs";

const sourceText = `
题目：基于 CRISPR-Cas9 的胃癌相关基因调控研究
背景：胃癌发生与 TP53、EGFR 和细胞周期调控异常有关。
科学问题：如何利用 CRISPR-Cas9 验证候选基因对胃癌细胞增殖的影响？
方法：设计 sgRNA，构建表达载体，进行细胞转染、测序验证和增殖实验。
创新点：把基因编辑与通路图谱结合，形成可解释的机制链。
`;

test("builds an editable Defense Brief from pasted research text", () => {
  const brief = buildDefenseBriefFromText({
    sourceType: "manual",
    sourceLabel: "手动粘贴",
    text: sourceText,
  });

  assert.match(brief.title, /CRISPR|胃癌|基因/);
  assert.equal(brief.mode, "proposal");
  assert.match(brief.background, /胃癌|TP53|EGFR/);
  assert.match(brief.researchQuestion, /CRISPR|候选基因|增殖/);
  assert.ok(brief.methods.length >= 3);
  assert.ok(brief.keywords.includes("CRISPR-Cas9"));
  assert.ok(brief.relatedTools.some((tool) => tool.href === "/tools/protein" || tool.href === "/tools/sequence"));
});

test("normalizes partial AI Defense Brief JSON without losing required arrays", () => {
  const brief = normalizeDefenseBrief(
    {
      title: "AlphaFold 辅助蛋白突变解释",
      mode: "paper_defense",
      background: "利用结构预测解释突变效应。",
      methods: "结构比对、保守性分析",
    },
    { sourceType: "knowledge_map", sourceLabel: "结构生物学节点", text: "AlphaFold structure mutation" },
  );

  assert.equal(brief.mode, "paper_defense");
  assert.deepEqual(brief.methods, ["结构比对", "保守性分析"]);
  assert.ok(Array.isArray(brief.objectives));
  assert.ok(brief.sourceRefs[0].label.includes("结构生物学"));
});

test("extracts visible text from Office XML parts used by DOCX and PPTX", () => {
  const xml = `
    <w:document><w:t>研究背景</w:t><w:t>实验设计</w:t></w:document>
    <a:t>答辩问题</a:t>
  `;

  assert.equal(extractPlainTextFromOfficeXml(xml), "研究背景 实验设计 答辩问题");
});

test("defense prompts, local questions and reports follow the agreed first-version scope", () => {
  const brief = buildDefenseBriefFromText({
    sourceType: "manual",
    sourceLabel: "手动粘贴",
    text: sourceText,
  });
  const messages = buildDefensePromptMessages({
    action: "next_question",
    brief,
    difficulty: "challenge",
    turnLimit: 5,
    transcript: [{ role: "student", content: "我会从科学问题和技术路线展开。" }],
  });

  assert.match(messages[0].content, /严格评审/);
  assert.match(messages[1].content, /不要显示逐轮评分/);

  const question = generateLocalDefenseQuestion({ brief, difficulty: "standard", turnIndex: 2 });
  assert.match(question.question, /方法|证据|风险|局限|创新/);
  assert.ok(question.committeeRole);

  const report = generateLocalDefenseReport({
    brief,
    transcript: [
      { role: "committee", content: question.question },
      { role: "student", content: "我会用测序和细胞增殖实验验证，并设置阴性对照。" },
    ],
  });
  assert.ok(report.totalScore >= 60);
  assert.equal(report.dimensions.length, 6);
  assert.ok(report.moduleRecommendations.length >= 2);
});
