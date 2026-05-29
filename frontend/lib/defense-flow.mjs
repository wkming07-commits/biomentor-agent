const DEFAULT_MODE = "proposal";
const nowIso = () => new Date().toISOString();

const DIFFICULTY_LABELS = {
  basic: "温和导师",
  standard: "标准答辩",
  challenge: "严格评审",
};

const COMMITTEE_ROLES = [
  { id: "mechanism", label: "机制委员", focus: "科学问题、机制链路和因果解释" },
  { id: "method", label: "方法委员", focus: "实验设计、技术路线、对照和可行性" },
  { id: "evidence", label: "证据委员", focus: "数据证据、替代解释和结论边界" },
  { id: "application", label: "应用委员", focus: "产业应用、转化价值、风险和伦理边界" },
];

const MODULE_RECOMMENDATIONS = [
  { label: "知识图谱", href: "/knowledge-map", reason: "补齐研究主题的前置概念和机制关系" },
  { label: "蛋白结构工具", href: "/tools/protein", reason: "围绕蛋白结构、突变或功能位点做可视化解释" },
  { label: "序列分析工具", href: "/tools/sequence", reason: "检查 sgRNA、ORF、酶切位点和引物设计思路" },
  { label: "通路图谱工具", href: "/tools/pathway", reason: "把候选基因放回上下游调控网络" },
];

export function buildDefenseBriefFromText({ sourceType = "manual", sourceLabel = "手动输入", text = "", href = "" } = {}) {
  const clean = compactText(text);
  const lines = clean.split(/(?<=。)|\n|；|;/).map((line) => line.trim()).filter(Boolean);
  const title = pickTitle(clean, lines);
  const mode = /论文|结果|数据|结论|discussion|result/i.test(clean) ? "paper_defense" : DEFAULT_MODE;
  const keywords = pickKeywords(clean);
  const methods = pickList(clean, ["方法", "技术路线", "实验", "method"], [
    "明确研究对象与关键变量",
    "设置阴性/阳性对照和重复",
    "用可量化读出验证假设",
  ]);

  return normalizeDefenseBrief(
    {
      title,
      mode,
      background: pickSection(clean, ["背景", "研究背景", "background"]) || summarize(clean, 150),
      researchQuestion: pickSection(clean, ["科学问题", "研究问题", "问题"]) || inferQuestion(clean, keywords),
      hypothesis: pickSection(clean, ["假设", "hypothesis"]) || `如果 ${keywords[0] || "核心变量"} 影响关键机制，则改变它应当带来可观测的表型或证据变化。`,
      objectives: pickList(clean, ["目标", "研究目标", "objectives"], [
        "凝练清晰的科学问题",
        "建立可验证的实验或分析路线",
        "形成可解释的证据链",
      ]),
      methods,
      evidence: pickList(clean, ["证据", "结果", "数据"], [
        "结构化文献或课程材料",
        "实验/分析结果与对照比较",
        "站内工具生成的可解释结果",
      ]),
      limitations: pickList(clean, ["局限", "风险", "不足"], [
        "样本量、模型系统和外推范围需要说明",
        "替代解释和潜在混杂因素需要排查",
      ]),
      innovationPoints: pickList(clean, ["创新", "创新点"], [
        "把生物机制、工具分析和应用场景连成一条证据链",
      ]),
      applicationValue: pickSection(clean, ["应用", "价值", "转化"]) || "可为课程研究训练、开题表达或后续实验设计提供结构化依据。",
      keywords,
    },
    { sourceType, sourceLabel, text: clean, href },
  );
}

export function normalizeDefenseBrief(raw = {}, source = {}) {
  const text = compactText(source.text || "");
  const keywords = normalizeStringArray(raw.keywords, pickKeywords(text)).slice(0, 8);
  const sourceType = raw.sourceType || source.sourceType || "manual";
  const sourceLabel = source.sourceLabel || raw.sourceSummary || "导入资料";
  const id = raw.id || `brief-${Date.now().toString(36)}`;
  const now = nowIso();

  return {
    id,
    title: cleanString(raw.title) || pickTitle(text, text.split(/\n/)) || "未命名答辩主题",
    mode: raw.mode === "paper_defense" ? "paper_defense" : "proposal",
    sourceType,
    sourceSummary: cleanString(raw.sourceSummary) || summarize(text, 120) || sourceLabel,
    sourceRefs: normalizeRefs(raw.sourceRefs, sourceLabel, source.href),
    background: cleanString(raw.background) || summarize(text, 180) || "请补充研究背景。",
    researchQuestion: cleanString(raw.researchQuestion) || inferQuestion(text, keywords),
    hypothesis: cleanString(raw.hypothesis) || "请补充可验证的研究假设。",
    objectives: normalizeStringArray(raw.objectives, ["说明研究目标", "解释证据链", "回答潜在质疑"]),
    methods: normalizeStringArray(raw.methods, ["文献梳理", "工具分析", "对照验证"]),
    evidence: normalizeStringArray(raw.evidence, ["已有资料与站内分析结果"]),
    limitations: normalizeStringArray(raw.limitations, ["证据范围和外推边界需要说明"]),
    innovationPoints: normalizeStringArray(raw.innovationPoints, ["把知识图谱、工具结果和科研表达联动起来"]),
    applicationValue: cleanString(raw.applicationValue) || "用于科研训练和答辩表达。",
    keywords,
    relatedKnowledgeNodes: normalizeStringArray(raw.relatedKnowledgeNodes, inferKnowledgeNodes(keywords)),
    relatedTools: normalizeRelatedTools(raw.relatedTools, inferRelatedTools(text, keywords)),
    createdAt: raw.createdAt || now,
    updatedAt: now,
  };
}

export function buildDefensePromptMessages({ action, brief, difficulty = "standard", turnLimit = 5, transcript = [] }) {
  const style = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.standard;
  const roleGuidance =
    difficulty === "basic"
      ? "温和导师：问题更清晰，允许提示方向。"
      : difficulty === "challenge"
        ? "严格评审：追问证据边界、替代解释、方法漏洞和创新性。"
        : "标准答辩：问题专业、具体，但保持教学性。";

  return [
    {
      role: "system",
      content: [
        "你是 BioMentor Agent 的科研开题/论文答辩委员会。",
        roleGuidance,
        "必须使用中文。",
        "不要显示逐轮评分、缺失点或内部评价；这些只用于最终闭环报告。",
        "不要暴露 API、模型、环境变量、fallback、debug 等开发者信息。",
        "只输出合法 JSON，不要 Markdown 代码块。",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          action,
          difficultyStyle: style,
          turnLimit,
          committeeRoles: COMMITTEE_ROLES,
          defenseBrief: brief,
          transcript: transcript.slice(-12),
          instruction:
            action === "report"
              ? "生成闭环报告：totalScore、dimensions(6项)、committeeFeedback、weakPoints、moduleRecommendations、nextDefenseTopics。"
              : "生成下一位委员的问题：committeeRole、question、intent、hiddenRubric。不要显示逐轮评分。",
        },
        null,
        2,
      ),
    },
  ];
}

export function generateLocalDefenseQuestion({ brief, difficulty = "standard", turnIndex = 0 } = {}) {
  const role = COMMITTEE_ROLES[turnIndex % COMMITTEE_ROLES.length];
  const title = brief?.title || "当前课题";
  const questionPool = {
    mechanism: `请你用一到两句话说明“${title}”背后的核心机制链路：关键变量如何影响表型或结论？`,
    method: `你的方法设计如何排除替代解释？请说明至少一个关键对照、一个读出指标和一个失败风险。`,
    evidence: `目前哪些证据最能支持你的结论？如果出现相反结果，你会优先检查哪一环？`,
    application: `这个研究如果要进入应用或产业场景，最大的转化价值和风险边界分别是什么？`,
  };
  const challengeTail = difficulty === "challenge" ? " 请特别注意不要只给结论，要说明证据边界。" : "";
  return {
    committeeRole: role.label,
    question: `${questionPool[role.id]}${challengeTail}`,
    intent: role.focus,
    hiddenRubric: ["问题聚焦", "证据意识", "方法严谨", "表达清晰"],
  };
}

export function generateLocalDefenseReport({ brief, transcript = [] } = {}) {
  const studentText = transcript
    .filter((item) => item.role === "student")
    .map((item) => item.content)
    .join(" ");
  const hasEvidence = /证据|数据|对照|测序|验证|实验|结果/i.test(studentText);
  const hasLimits = /局限|风险|不足|替代|边界|混杂/i.test(studentText);
  const base = 68 + (hasEvidence ? 8 : 0) + (hasLimits ? 6 : 0);
  const totalScore = Math.min(92, base);

  return {
    totalScore,
    dimensions: [
      scoreItem("科学问题", totalScore - 2, "科学问题是否聚焦、可研究"),
      scoreItem("背景理解", totalScore - 4, "能否把主题放回学科背景"),
      scoreItem("方法设计", totalScore + (hasEvidence ? 2 : -5), "技术路线、对照和可行性"),
      scoreItem("证据链", totalScore + (hasEvidence ? 1 : -6), "证据是否能支撑结论"),
      scoreItem("局限意识", totalScore + (hasLimits ? 2 : -8), "是否主动说明边界与替代解释"),
      scoreItem("表达组织", totalScore - 1, "回答结构和学术表达清晰度"),
    ],
    committeeFeedback: `围绕“${brief?.title || "当前主题"}”，你的回答已经能覆盖基本研究思路。下一轮应继续加强证据链、对照设置和局限性说明。`,
    weakPoints: hasLimits
      ? ["进一步量化关键证据", "把工具结果与研究假设对应起来"]
      : ["局限性和替代解释说明不足", "需要更清楚地区分结论与推测"],
    moduleRecommendations: MODULE_RECOMMENDATIONS.slice(0, 3),
    nextDefenseTopics: [
      "用 60 秒重述科学问题和假设",
      "专门练习方法设计与对照设置",
      "围绕证据边界进行挑战难度追问",
    ],
  };
}

export function extractPlainTextFromOfficeXml(xml = "") {
  return String(xml)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDefenseAiJson(raw, fallback) {
  const parsed = safeParseJson(raw);
  if (!parsed) return fallback;
  // Normalize committeeRole: if it's an object, extract label
  if (parsed.committeeRole && typeof parsed.committeeRole === "object") {
    parsed.committeeRole = parsed.committeeRole.label || parsed.committeeRole.id || String(parsed.committeeRole);
  }
  // Normalize content: if it's an object with question, extract it
  if (parsed.question && !parsed.content) {
    parsed.content = parsed.question;
  }
  return parsed;
}

export function normalizeDefenseReport(parsed, fallback) {
  if (!parsed || typeof parsed !== "object") return fallback;

  // Ensure totalScore is a number
  const totalScore = typeof parsed.totalScore === "number" ? parsed.totalScore
    : parseInt(String(parsed.totalScore), 10) || fallback.totalScore || 75;

  // Normalize dimensions: always convert to array
  let dimensions = [];
  const rawDims = parsed.dimensions;
  if (Array.isArray(rawDims)) {
    dimensions = rawDims.map((d) => ({
      label: String(d.label || d.name || d.dimension || ""),
      score: typeof d.score === "number" ? d.score : parseInt(String(d.score), 10) || 70,
      comment: String(d.comment || d.feedback || d.note || ""),
    }));
  } else if (rawDims && typeof rawDims === "object") {
    // Object format: { "科学问题": { score: 85, comment: "..." }, ... }
    dimensions = Object.entries(rawDims).map(([key, val]) => ({
      label: key,
      score: val && typeof val === "object" ? (typeof val.score === "number" ? val.score : 70) : 70,
      comment: val && typeof val === "object" ? String(val.comment || "") : "",
    }));
  }
  if (dimensions.length === 0) dimensions = fallback.dimensions || [];

  // Normalize string arrays
  const arr = (v, fb) => Array.isArray(v) ? v.map(String) : (fb || []);
  const str = (v, fb) => (typeof v === "string" && v) ? v : String(fb || "");

  return {
    totalScore,
    dimensions,
    committeeFeedback: str(parsed.committeeFeedback, fallback.committeeFeedback),
    weakPoints: arr(parsed.weakPoints, fallback.weakPoints),
    moduleRecommendations: Array.isArray(parsed.moduleRecommendations) && parsed.moduleRecommendations.length
      ? parsed.moduleRecommendations.map((m) => ({
          label: str(m?.label || m, ""),
          href: str(m?.href, "#"),
          reason: str(m?.reason, ""),
        }))
      : (fallback.moduleRecommendations || []),
    nextDefenseTopics: arr(parsed.nextDefenseTopics, fallback.nextDefenseTopics),
  };
}

function scoreItem(label, score, comment) {
  return { label, score: Math.max(50, Math.min(96, Math.round(score))), comment };
}

function pickTitle(text, lines = []) {
  const titleMatch = text.match(/(?:题目|标题|主题)[:：]\s*([^。；\n]+)/);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = lines.find((line) => line.length >= 8 && line.length <= 80);
  if (firstLine) return firstLine.replace(/^(题目|标题|主题)[:：]\s*/, "").trim();
  const keywords = pickKeywords(text);
  return keywords.length ? `${keywords.slice(0, 3).join(" / ")} 研究答辩` : "科研答辩主题";
}

function pickSection(text, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}[:：]\\s*([^\\n。；;]{8,220})`, "i");
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function pickList(text, labels, fallback) {
  for (const label of labels) {
    const section = pickSection(text, [label]);
    if (section) return normalizeStringArray(section, fallback);
  }
  return fallback;
}

function pickKeywords(text) {
  const candidates = [
    "CRISPR-Cas9",
    "AlphaFold",
    "TP53",
    "EGFR",
    "sgRNA",
    "胃癌",
    "细胞周期",
    "蛋白结构",
    "合成生物学",
    "通路图谱",
  ];
  const found = candidates.filter((item) => text.toLowerCase().includes(item.toLowerCase()));
  return found.length ? found : ["研究问题", "实验设计", "证据链"];
}

function inferQuestion(text, keywords) {
  const section = pickSection(text, ["科学问题", "研究问题", "问题"]);
  if (section) return section;
  return `如何围绕 ${keywords.slice(0, 2).join("、") || "当前主题"} 建立可验证的科学问题与证据链？`;
}

function inferKnowledgeNodes(keywords) {
  const nodes = [];
  if (keywords.some((kw) => /CRISPR|sgRNA/i.test(kw))) nodes.push("基因编辑", "序列设计");
  if (keywords.some((kw) => /AlphaFold|蛋白/i.test(kw))) nodes.push("结构生物学", "蛋白结构预测");
  if (keywords.some((kw) => /TP53|EGFR|细胞周期/i.test(kw))) nodes.push("细胞信号通路", "肿瘤生物学");
  return nodes.length ? nodes : ["科研问题", "实验设计", "证据链"];
}

function inferRelatedTools(text, keywords) {
  const tools = [];
  const haystack = `${text} ${keywords.join(" ")}`;
  if (/蛋白|AlphaFold|结构|突变/i.test(haystack)) tools.push(MODULE_RECOMMENDATIONS[1]);
  if (/序列|sgRNA|引物|CRISPR|克隆/i.test(haystack)) tools.push(MODULE_RECOMMENDATIONS[2]);
  if (/通路|TP53|EGFR|细胞周期|机制/i.test(haystack)) tools.push(MODULE_RECOMMENDATIONS[3]);
  tools.unshift(MODULE_RECOMMENDATIONS[0]);
  return dedupeByHref(tools).slice(0, 4);
}

function normalizeRelatedTools(value, fallback) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return dedupeByHref(
    source
      .map((tool) => ({
        label: cleanString(tool?.label),
        href: cleanString(tool?.href),
        reason: cleanString(tool?.reason) || "可用于继续训练",
      }))
      .filter((tool) => tool.label && tool.href?.startsWith("/")),
  );
}

function dedupeByHref(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function normalizeRefs(value, label, href) {
  const refs = Array.isArray(value) ? value : [];
  const normalized = refs
    .map((ref) => ({
      type: cleanString(ref?.type) || "source",
      label: cleanString(ref?.label),
      href: cleanString(ref?.href),
    }))
    .filter((ref) => ref.label);
  if (normalized.length) return normalized;
  return [{ type: "source", label: label || "导入资料", href: href || undefined }];
}

function normalizeStringArray(value, fallback = []) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[、,，；;\n]/) : fallback;
  return raw.map(cleanString).filter(Boolean).slice(0, 8);
}

function summarize(text, length) {
  return compactText(text).slice(0, length);
}

function compactText(text) {
  return String(text || "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeParseJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
