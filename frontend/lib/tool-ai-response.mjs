const TOOL_LABELS = {
  protein: "蛋白结构",
  plasmid: "质粒图谱",
  sequence: "序列分析",
  pathway: "代谢通路",
};

const DEFAULT_DISCLAIMER = "本回答用于课程学习和科研训练，不构成医疗、临床或未经验证的实验操作建议。";

export function extractToolJson(raw) {
  const trimmed = String(raw || "").trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
}

export function createHelpfulToolFallback(tool, request) {
  const label = TOOL_LABELS[tool] || tool;
  const context = request?.context || {};
  const facts = Array.isArray(context.facts) ? context.facts.filter((item) => item?.label && item?.value) : [];
  const highlights = Array.isArray(context.highlights) ? context.highlights.filter(Boolean) : [];
  const warnings = Array.isArray(context.warnings) ? context.warnings.filter(Boolean) : [];
  const factText = facts.length
    ? `已知信息包括：${facts.map((item) => `${item.label} 为 ${item.value}`).join("；")}。`
    : "当前工具已经提供了结构化结果，可以先从名称、来源和图谱/结构特征入手理解。";
  const highlightText = highlights.length
    ? `学习时重点看 ${highlights.slice(0, 4).join("、")}。`
    : `学习时可以先观察${label}中的核心组成、关键位置和功能关系。`;
  const warningText = warnings.length ? `注意：${warnings.slice(0, 2).join("；")}` : "";

  return {
    answer: `围绕“${context.title || label}”，可以先按“事实识别 → 结构/组成 → 功能机制 → 应用场景”的顺序理解。${factText}${highlightText}${warningText}`,
    quickQuestions: [
      `这个${label}最关键的功能是什么？`,
      `这些结果应该按什么顺序解读？`,
      `它和实验设计或科研问题有什么关系？`,
    ],
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

export function normalizeToolAiResponse(raw, tool, request) {
  const fallback = createHelpfulToolFallback(tool, request);
  const text = String(raw || "").trim();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(extractToolJson(text));
    return {
      answer: typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : fallback.answer,
      quickQuestions: Array.isArray(parsed.quickQuestions)
        ? parsed.quickQuestions.filter((q) => typeof q === "string" && q.trim()).map((q) => q.trim()).slice(0, 4)
        : fallback.quickQuestions,
      disclaimer: typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : DEFAULT_DISCLAIMER,
    };
  } catch {
    return {
      answer: text.slice(0, 1200),
      quickQuestions: fallback.quickQuestions,
      disclaimer: DEFAULT_DISCLAIMER,
    };
  }
}
