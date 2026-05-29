import test from "node:test";
import assert from "node:assert/strict";

import {
  createHelpfulToolFallback,
  normalizeToolAiResponse,
} from "./tool-ai-response.mjs";

const context = {
  title: "胃蛋白酶",
  subtitle: "PGA3 · Homo sapiens",
  facts: [
    { label: "UniProt", value: "P00790" },
    { label: "PDB", value: "1PSO" },
  ],
  highlights: ["酸性蛋白酶", "消化系统", "活性位点"],
  warnings: ["该回答仅用于课程学习。"],
};

test("tool AI fallback remains useful when remote model is unavailable", () => {
  const fallback = createHelpfulToolFallback("protein", { context });

  assert.match(fallback.answer, /胃蛋白酶/);
  assert.match(fallback.answer, /UniProt/);
  assert.equal(fallback.source, "local_fallback");
  assert.ok(fallback.quickQuestions.length >= 3);
  assert.doesNotMatch(fallback.answer, /无法生成|API|fallback|环境变量/i);
});

test("tool AI fallback answers a follow-up question instead of repeating the initial template", () => {
  const fallback = createHelpfulToolFallback("protein", {
    mode: "question",
    question: "胃蛋白酶的活性 pH 是多少？",
    context,
  });

  assert.match(fallback.answer, /pH|酸性|1\.5|2\.5/);
  assert.doesNotMatch(fallback.answer, /^围绕/);
  assert.doesNotMatch(fallback.answer, /事实识别 → 结构\/组成 → 功能机制/);
});

test("tool AI response normalizer accepts fenced JSON and plain text", () => {
  const json = normalizeToolAiResponse(
    "```json\n{\"answer\":\"胃蛋白酶是一类酸性蛋白酶。\",\"quickQuestions\":[\"它的活性位点是什么？\"]}\n```",
    "protein",
    { context },
  );

  assert.equal(json.answer, "胃蛋白酶是一类酸性蛋白酶。");
  assert.deepEqual(json.quickQuestions, ["它的活性位点是什么？"]);
  assert.equal(json.source, "deepseek");

  const plain = normalizeToolAiResponse(
    "胃蛋白酶在酸性环境中切割蛋白质，适合观察活性位点与底物结合。",
    "protein",
    { context },
  );

  assert.match(plain.answer, /酸性环境/);
  assert.ok(plain.quickQuestions.length >= 3);
});
