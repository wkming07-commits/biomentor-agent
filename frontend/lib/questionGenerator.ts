// ============================================================
// BioMentor Agent — Question Generator
// 拍照学练：根据识别文本和知识库匹配结果生成题目
// ============================================================

import type { GeneratedQuestion, KnowledgeConcept, KnowledgePaper } from "@/lib/knowledgeTypes";
import { getConceptById, getPaperById } from "@/data/knowledgeBase";

let _questionCounter = 0;

function nextId(prefix = "q"): string {
  _questionCounter += 1;
  return `${prefix}-${Date.now()}-${_questionCounter}`;
}

// ---- 题目模板库 ----

interface QuestionTemplate {
  type: GeneratedQuestion["type"];
  condition: (ctx: QuestionContext) => boolean;
  generate: (ctx: QuestionContext) => GeneratedQuestion;
}

interface QuestionContext {
  rawText: string;
  extractedKeywords: string[];
  matchedConcepts: KnowledgeConcept[];
  matchedPapers: KnowledgePaper[];
}

/**
 * 生成选择题模板
 */
function generateChoiceQuestion(ctx: QuestionContext): GeneratedQuestion {
  const concept = ctx.matchedConcepts[0];
  const kw = ctx.extractedKeywords[0] || "CRISPR";

  if (concept && concept.id === "conc-004") {
    return {
      id: nextId("choice"),
      type: "选择题",
      question: "Prime Editing 与经典 CRISPR-Cas9 相比，以下哪项是其主要优势？",
      options: [
        "A. 不需要 gRNA",
        "B. 不产生 DNA 双链断裂，可实现精准碱基替换",
        "C. 编辑效率始终为 100%",
        "D. 可以在任意细胞中自主进入核内",
      ],
      answer: "B",
      explanation: "Prime Editing 使用 Cas9 切口酶和逆转录酶融合蛋白，不产生 DNA 双链断裂，避免了 NHEJ 修复引入的随机 indel，能够实现精准的碱基替换、小片段插入和删除。",
      relatedConceptIds: ["conc-004"],
      relatedPaperIds: ["paper-002", "paper-003"],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("Cas12") || k.includes("Cas9"))) {
    return {
      id: nextId("choice"),
      type: "选择题",
      question: "CRISPR-Cas 系统中负责识别靶序列的关键组成通常是？",
      options: [
        "A. gRNA",
        "B. 葡萄糖",
        "C. 脂滴",
        "D. 核糖体",
      ],
      answer: "A",
      explanation: "gRNA（引导 RNA）通过碱基互补配对识别目标 DNA 序列，将 Cas 蛋白引导到特定的基因组位点进行切割。葡萄糖、脂滴和核糖体均不参与 CRISPR 系统的靶向识别。",
      relatedConceptIds: ["conc-007"],
      relatedPaperIds: ["paper-005", "paper-006"],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("凋亡") || k.includes("caspase") || k.includes("Bcl"))) {
    return {
      id: nextId("choice"),
      type: "选择题",
      question: "以下哪个蛋白属于 Bcl-2 家族中的促凋亡成员？",
      options: [
        "A. Bcl-2",
        "B. Bcl-xL",
        "C. Bax",
        "D. Mcl-1",
      ],
      answer: "C",
      explanation: "Bax 和 Bak 是 Bcl-2 家族中的促凋亡蛋白，促进线粒体外膜通透化。Bcl-2、Bcl-xL 和 Mcl-1 均为抗凋亡蛋白。",
      relatedConceptIds: [],
      relatedPaperIds: [],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("mRNA") || k.includes("LNP"))) {
    return {
      id: nextId("choice"),
      type: "选择题",
      question: "脂质纳米颗粒（LNP）递送 mRNA 药物时，以下哪种组分在内涵体酸性环境中发挥关键作用？",
      options: [
        "A. PEG 化脂质",
        "B. 胆固醇",
        "C. 可电离阳离子脂质",
        "D. 辅助脂质",
      ],
      answer: "C",
      explanation: "可电离阳离子脂质在低 pH（内涵体环境）时质子化带正电，促进 LNP 膜与内涵体膜的融合，释放 mRNA 到细胞质中。这是 LNP 实现内涵体逃逸的关键步骤。",
      relatedConceptIds: ["conc-011", "conc-012"],
      relatedPaperIds: ["paper-007"],
    };
  }

  // fallback
  return {
    id: nextId("choice"),
    type: "选择题",
    question: `以下关于 ${kw} 的描述，正确的是？`,
    options: [
      "A. 它与细胞代谢无关",
      "B. 它是现代生命科学研究的重要方向",
      "C. 它只在植物中发挥作用",
      "D. 已被完全淘汰",
    ],
    answer: "B",
    explanation: `${kw} 是现代生命科学研究的前沿领域之一，在基础研究和临床应用中都有重要意义。`,
    relatedConceptIds: ctx.matchedConcepts.slice(0, 2).map((c) => c.id),
    relatedPaperIds: ctx.matchedPapers.slice(0, 2).map((p) => p.id),
  };
}

/**
 * 生成判断题模板
 */
function generateTrueFalseQuestion(ctx: QuestionContext): GeneratedQuestion {
  if (ctx.extractedKeywords.some((k) => k.includes("Cas12") || k.includes("CRISPR"))) {
    return {
      id: nextId("tf"),
      type: "判断题",
      question: "CRISPR-Cas12 只能靶向 DNA，无法靶向 RNA。（判断对错）",
      answer: "错误",
      explanation: "最新研究发现，经过工程改造的 Cas12 变体可以利用 DNA 引导链靶向和切割细胞内的 RNA，拓展了 CRISPR 系统的应用范围（见 paper-005 和 paper-006）。",
      relatedConceptIds: ["conc-007", "conc-008"],
      relatedPaperIds: ["paper-005", "paper-006"],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("mRNA") || k.includes("递送"))) {
    return {
      id: nextId("tf"),
      type: "判断题",
      question: "mRNA 药物进入体内后可能整合到宿主细胞基因组中。（判断对错）",
      answer: "错误",
      explanation: "mRNA 不进入细胞核，只在细胞质中进行翻译，因此不存在基因组整合的风险。这是 mRNA 药物相比 DNA 载体的重要安全优势之一。",
      relatedConceptIds: ["conc-012"],
      relatedPaperIds: [],
    };
  }

  return {
    id: nextId("tf"),
    type: "判断题",
    question: `在${ctx.extractedKeywords[0] || "生物学"}研究中，实验数据的可重复性是保证研究质量的关键因素。（判断对错）`,
    answer: "正确",
    explanation: "实验数据的可重复性是科学研究的基本原则之一，确保研究结果不是偶然或假阳性。",
    relatedConceptIds: [],
    relatedPaperIds: [],
  };
}

/**
 * 生成简答题模板
 */
function generateShortAnswerQuestion(ctx: QuestionContext): GeneratedQuestion {
  if (ctx.extractedKeywords.some((k) => k.includes("CRISPR") || k.includes("Cas"))) {
    return {
      id: nextId("sa"),
      type: "简答题",
      question: "请说明 CRISPR-Cas 技术为什么可以被用于基因编辑。",
      answer: "CRISPR-Cas 系统可通过设计特异性 gRNA 识别目标 DNA 序列，引导 Cas 蛋白在 PAM 序列附近进行定点切割。细胞修复 DNA 断裂时可通过 NHEJ 或 HDR 途径实现基因敲除或精准编辑。其核心优势在于 gRNA 的可编程性，使得靶向任意基因组位点成为可能。",
      explanation: "重点考察学生是否理解 gRNA 靶向识别、Cas 蛋白切割、DNA 修复三个核心环节及其连接关系。",
      relatedConceptIds: ["conc-004", "conc-007"],
      relatedPaperIds: ["paper-002", "paper-005"],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("凋亡"))) {
    return {
      id: nextId("sa"),
      type: "简答题",
      question: "简述 p53 在细胞凋亡调控中的作用。",
      answer: "p53 是关键的肿瘤抑制蛋白和转录因子。当细胞受到 DNA 损伤等应激信号时，p53 被激活并转录上调促凋亡基因（如 Bax），同时抑制抗凋亡蛋白（如 Bcl-2）的表达，从而启动线粒体凋亡途径。p53 的失活是肿瘤细胞逃避凋亡的常见机制。",
      explanation: "考查 p53 作为转录因子的上下游调控关系及其在凋亡决策中的枢纽作用。",
      relatedConceptIds: [],
      relatedPaperIds: [],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("mRNA") || k.includes("LNP"))) {
    return {
      id: nextId("sa"),
      type: "简答题",
      question: "为什么脂质纳米颗粒（LNP）天然倾向于在肝脏积累？",
      answer: "LNP 经静脉注射后，血液中的 ApoE 蛋白吸附到 LNP 表面。肝脏细胞表面高表达 LDL 受体（LDLR），通过识别 ApoE 介导 LNP 的内吞摄取。这一 ApoE-LDLR 途径是 LNP 肝脏偏向性的主要机制。",
      explanation: "考查学生对 LNP 体内命运和肝脏靶向生物机制的理解。",
      relatedConceptIds: ["conc-011"],
      relatedPaperIds: ["paper-007"],
    };
  }

  return {
    id: nextId("sa"),
    type: "简答题",
    question: `请简要说明${ctx.extractedKeywords[0] || "该生物学概念"}的基本原理及其在生物医学中的意义。`,
    answer: `需要从基本定义、作用机制和应用价值三个方面进行阐述。`,
    explanation: "考查学生对该知识点的整体理解和结构化表达能力。",
    relatedConceptIds: ctx.matchedConcepts.slice(0, 2).map((c) => c.id),
    relatedPaperIds: ctx.matchedPapers.slice(0, 1).map((p) => p.id),
  };
}

/**
 * 生成科研拓展题模板
 */
function generateResearchQuestion(ctx: QuestionContext): GeneratedQuestion {
  if (ctx.extractedKeywords.some((k) => k.includes("Prime editing") || k.includes("CRISPR"))) {
    return {
      id: nextId("research"),
      type: "科研拓展题",
      question: "如果要进一步提升 Prime editing 的编辑效率，可以从哪些分子元件或实验条件入手？请结合 paper-002 和 paper-003 的研究思路回答。",
      answer: "可以从以下维度入手：（1）逆转录酶改造——利用 AI 辅助蛋白质设计优化 RT 的催化效率和持续合成能力（paper-002）；（2）pegRNA 优化——通过定向进化筛选 RNA 稳定元件，延长 pegRNA 在细胞内的半衰期（paper-003）；（3）两者协同——改造型 RT + 稳定化 pegRNA 的组合有望产生叠加效应。",
      explanation: "考查学生能否将 paper-002 和 paper-003 的研究策略进行整合思考，提出系统性的优化方案。",
      relatedConceptIds: ["conc-004", "conc-005", "conc-006"],
      relatedPaperIds: ["paper-002", "paper-003"],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("单细胞"))) {
    return {
      id: nextId("research"),
      type: "科研拓展题",
      question: "单细胞基础模型如何自动学习基因重要性？这种方法相比传统差异表达分析有什么优势？",
      answer: "单细胞基础模型通过自监督预训练在海量数据中学习基因共表达模式。模型内部的注意力权重可反映基因在不同细胞状态下的相对重要性（paper-001）。相比传统差异表达分析仅比较表达水平，模型解释性方法能捕捉更复杂的基因间非线性关系和上下文依赖性。",
      explanation: "考查对 AI 模型在生物学发现中应用的理解，以及与传统方法的对比分析能力。",
      relatedConceptIds: ["conc-001", "conc-002", "conc-003"],
      relatedPaperIds: ["paper-001"],
    };
  }

  return {
    id: nextId("research"),
    type: "科研拓展题",
    question: `关于${ctx.extractedKeywords[0] || "该生物学领域"}，请设计一个简单的实验方案来验证你的假设。包括实验目的、材料、方法和预期结果。`,
    answer: "实验方案应包括：明确的实验目的、合适的模型系统（细胞系或模式生物）、清晰的对照组设计、可量化的检测指标、预期的结果及可能的替代解释。",
    explanation: "考查学生的实验设计能力和科学思维。",
    relatedConceptIds: [],
    relatedPaperIds: [],
  };
}

/**
 * 生成产业联系题模板
 */
function generateIndustryQuestion(ctx: QuestionContext): GeneratedQuestion {
  if (ctx.extractedKeywords.some((k) => k.includes("CRISPR") || k.includes("基因编辑"))) {
    return {
      id: nextId("industry"),
      type: "产业联系题",
      question: "基因编辑技术在基因治疗和作物改良中可能有哪些应用价值？请各举一个已有实际进展的例子。",
      answer: "基因治疗方面：CRISPR 编辑的 CAR-T 细胞（如 CTX001）已获批用于治疗镰刀型细胞贫血症和 β-地中海贫血。作物改良方面：利用 CRISPR 技术培育抗病、抗旱或营养增强的作物品种，如高油酸大豆和抗褐变蘑菇已获 USDA 商业化批准。Prime editing 等精准编辑技术有望进一步拓展这些应用。",
      explanation: "考查学生将基础研究技术连接到真实产业应用的能力，以及关注技术转化的意识。",
      relatedConceptIds: ["conc-004"],
      relatedPaperIds: [],
    };
  }

  if (ctx.extractedKeywords.some((k) => k.includes("mRNA") || k.includes("LNP") || k.includes("疫苗"))) {
    return {
      id: nextId("industry"),
      type: "产业联系题",
      question: "mRNA 技术在 COVID-19 疫苗成功后，正在向哪些疾病领域拓展？LNP 组织选择性递送对产业应用有什么意义？",
      answer: "mRNA 技术正向以下领域拓展：（1）癌症免疫治疗——编码肿瘤抗原或免疫调节因子（IRF8/NIK）重塑肿瘤微环境（paper-008）；（2）蛋白质替代治疗——编码缺失或缺陷的酶；（3）基因编辑——编码 CRISPR 组分。LNP 组织选择性递送使 mRNA 药物从'肝脏优先'进化为'器官定制'，可开发针对肺、脾、骨髓等不同器官的精准治疗。",
      explanation: "考查学生对 mRNA 技术平台的产业化理解和组织选择性递送的临床意义评估。",
      relatedConceptIds: ["conc-011", "conc-012", "conc-014"],
      relatedPaperIds: ["paper-007", "paper-008"],
    };
  }

  return {
    id: nextId("industry"),
    type: "产业联系题",
    question: `${ctx.extractedKeywords[0] || "该项生物技术"}在产业转化中面临哪些主要挑战？如何从基础研究走向实际应用？`,
    answer: "需要考虑技术成熟度、安全性、生产成本、监管审批和市场接受度等多个维度的挑战。",
    explanation: "考查学生的产业思维和技术转化意识。",
    relatedConceptIds: [],
    relatedPaperIds: [],
  };
}

// ---- 核心生成函数 ----

/**
 * 根据识别文本和知识库匹配结果生成题目
 * 至少生成：2 道选择题 + 1 道判断题 + 1 道简答题 + 1 道科研拓展题 + 1 道产业联系题
 */
export function generateQuestionsFromPhotoLearningResult(result: {
  rawText: string;
  extractedKeywords: string[];
  matchedConcepts: KnowledgeConcept[];
  matchedPapers: KnowledgePaper[];
}): GeneratedQuestion[] {
  const ctx: QuestionContext = {
    rawText: result.rawText,
    extractedKeywords: result.extractedKeywords,
    matchedConcepts: result.matchedConcepts,
    matchedPapers: result.matchedPapers,
  };

  const questions: GeneratedQuestion[] = [];

  // 2 道选择题
  const choice1 = generateChoiceQuestion(ctx);
  questions.push(choice1);

  // 第二道选择题：基于不同关键词或概念
  const altCtx: QuestionContext = {
    ...ctx,
    extractedKeywords: ctx.extractedKeywords.length > 1
      ? [ctx.extractedKeywords[1], ...ctx.extractedKeywords.slice(2)]
      : ctx.extractedKeywords,
    matchedConcepts: ctx.matchedConcepts.length > 1
      ? [ctx.matchedConcepts[1], ...ctx.matchedConcepts.slice(2)]
      : ctx.matchedConcepts,
  };
  const choice2 = generateChoiceQuestion(altCtx);
  // 确保不重复
  if (choice2.id !== choice1.id) {
    questions.push(choice2);
  } else {
    // 针对第二个关键词再生成一道
    const kw2 = ctx.extractedKeywords[1] || ctx.extractedKeywords[0];
    questions.push({
      id: nextId("choice"),
      type: "选择题",
      question: `以下关于 ${kw2} 的描述，哪项是正确的？`,
      options: [
        "A. 它仅存在于原核生物中",
        "B. 它是现代生物医学研究的核心概念之一",
        "C. 它已被证实与任何疾病无关",
        "D. 它只能在体外实验中研究",
      ],
      answer: "B",
      explanation: `${kw2} 是现代生命科学研究的重要组成部分，在基础研究和临床转化中都有重要地位。`,
      relatedConceptIds: ctx.matchedConcepts.slice(0, 1).map((c) => c.id),
      relatedPaperIds: ctx.matchedPapers.slice(0, 1).map((p) => p.id),
    });
  }

  // 1 道判断题
  questions.push(generateTrueFalseQuestion(ctx));

  // 1 道简答题
  questions.push(generateShortAnswerQuestion(ctx));

  // 1 道科研拓展题
  questions.push(generateResearchQuestion(ctx));

  // 1 道产业联系题
  questions.push(generateIndustryQuestion(ctx));

  return questions;
}
