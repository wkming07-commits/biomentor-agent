const defaultQuestions = [
  "讲得更简单",
  "生成学习路径",
  "推荐工具练习",
  "关联产业应用",
  "给我一个学习任务",
];

export function buildKnowledgeCacheKey(context) {
  return [
    context.mode || "tutor",
    context.action || "auto_explain",
    context.discipline?.id || "unknown-discipline",
    context.dimension?.id || "root",
    context.node?.id || "unknown-node",
  ].join(":");
}

export function buildKnowledgePromptMessages(context) {
  const modeName = context.mode === "research" ? "科研助手" : "教学导师";
  const modeGuidance = context.mode === "research"
    ? "强调研究问题、前沿趋势、实验设计、产业转化和文献阅读方向。语言专业但不要堆砌术语。"
    : "强调循序渐进的概念解释、前置知识、学习顺序和工具练习建议。适合本科生和初学者。";
  const latestUserQuestion = [...(context.history || [])]
    .reverse()
    .find((message) => message?.role === "user")?.content || "";

  return [
    {
      role: "system",
      content: [
        `你是 BioMentor Agent 的${modeName}。`,
        modeGuidance,
        "你必须只返回合法 JSON，不要返回 Markdown，不要包含代码块。",
        "JSON 字段固定为：title, answer, keyPoints, nextSteps, suggestedQuestions, moduleLinks。",
        "moduleLinks 只能使用用户提供的站内链接；不要编造外部链接。",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        task: context.action || "auto_explain",
        mode: context.mode || "tutor",
        currentContext: {
          discipline: context.discipline,
          dimension: context.dimension || null,
          node: context.node,
        },
        latestUserQuestion,
        history: (context.history || []).slice(-8),
        format: "JSON",
        outputFormat: {
          title: "简短标题",
          answer: "180-320 字中文解释",
          keyPoints: ["3-5 个关键点"],
          nextSteps: ["3-5 个下一步"],
          suggestedQuestions: ["4-5 个追问按钮文案"],
          moduleLinks: [{ label: "站内模块名称", href: "/path" }],
        },
        instruction:
          context.action === "chat"
            ? "先直接回答 latestUserQuestion，再结合 currentContext 补充解释；不要重复初始节点讲解，不要暴露 API、后端、fallback、debug 等开发信息。"
            : "围绕当前节点回答，不要暴露 API、后端、fallback、debug 等开发信息。",
      }, null, 2),
    },
  ];
}

export function normalizeKnowledgeAiResponse(raw, context) {
  const parsed = safeParseJson(raw);
  const fallback = createLocalKnowledgeAnswer(context);
  const title = cleanString(parsed?.title) || fallback.title;
  const answer = cleanString(parsed?.answer) || fallback.answer;
  const keyPoints = normalizeStringArray(parsed?.keyPoints, fallback.keyPoints);
  const nextSteps = normalizeStringArray(parsed?.nextSteps, fallback.nextSteps);
  const suggestedQuestions = normalizeStringArray(parsed?.suggestedQuestions, fallback.suggestedQuestions);
  const moduleLinks = normalizeLinks(parsed?.moduleLinks, fallback.moduleLinks);

  return {
    title,
    answer,
    keyPoints,
    nextSteps,
    suggestedQuestions,
    moduleLinks,
    source: "deepseek",
  };
}

export function createLocalKnowledgeAnswer(context) {
  const node = context.node || {};
  const disciplineName = context.discipline?.name || "当前学科";
  const dimensionName = context.dimension?.name || "知识图谱";
  const modePrefix = context.mode === "research" ? "科研视角" : "学习脉络";
  const keyPoints = normalizeStringArray(node.keyPoints, ["核心概念", "关联知识", "学习任务"]);
  const moduleLinks = normalizeLinks(node.moduleLinks, []);
  const latestUserQuestion = [...(context.history || [])]
    .reverse()
    .find((message) => message?.role === "user")?.content || "";
  const answer = context.action === "chat" && latestUserQuestion
    ? buildLocalKnowledgeChatAnswer(latestUserQuestion, node, disciplineName, dimensionName)
    : `${node.name || "这个节点"}位于${disciplineName}的${dimensionName}中。` +
      `${node.summary ? node.summary : "它可以帮助你把概念、科研问题和应用场景连接起来。"}` +
      "建议先理解它的基础定义，再观察它与相邻节点的关系，最后通过平台内工具或任务完成一次主动练习。";

  return {
    title: `${node.name || "当前节点"}：${modePrefix}`,
    answer,
    keyPoints,
    nextSteps: [
      `先复述“${node.name || "当前节点"}”的核心含义`,
      "沿着图谱查看前置知识和相关应用",
      moduleLinks.length ? `进入「${moduleLinks[0].label}」做一次练习` : "选择一个相关模块完成练习",
    ],
    suggestedQuestions: defaultQuestions,
    moduleLinks,
    source: "local_fallback",
  };
}

function buildLocalKnowledgeChatAnswer(question, node, disciplineName, dimensionName) {
  const nodeName = node.name || "当前节点";
  const contextText = `${nodeName} ${node.summary || ""}`;
  if (/实验解析|实验结构|区别|预测/i.test(question) && /AlphaFold|结构|预测/i.test(contextText)) {
    return `AlphaFold 与实验解析结构的核心区别是证据来源不同：AlphaFold 给出基于序列和模型学习得到的结构预测，适合快速提出结构假设；X 射线晶体学、冷冻电镜或 NMR 等实验结构来自真实样品测量，更适合支持高置信结论。围绕 ${nodeName} 学习时，可以先用预测结构定位可能的结构域或突变影响，再用实验结构、功能实验或文献证据验证。`;
  }
  return `针对“${question}”，可以先把它放回 ${disciplineName} / ${dimensionName} / ${nodeName} 这个上下文中理解。${node.summary || "当前节点提供了概念、前沿和应用之间的连接。"} 如果要继续深入，建议追问它的前置知识、证据来源和可用的站内工具练习。`;
}

function safeParseJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const text = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeLinks(value, fallback) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source
    .map((link) => ({
      label: cleanString(link?.label),
      href: cleanString(link?.href),
    }))
    .filter((link) => link.label && link.href && link.href.startsWith("/"))
    .slice(0, 4);
}
