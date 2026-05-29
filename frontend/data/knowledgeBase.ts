// ============================================================
// BioMentor Agent — Knowledge Base Core Data
// 展示型本地知识库：12 篇文献、15 个概念、8 个科研任务、若干工具映射
// ============================================================

import type {
  KnowledgePaper,
  KnowledgeConcept,
  KnowledgeTool,
  KnowledgeResearchTask,
} from "@/lib/knowledgeTypes";

// ============================================================
// 12 篇核心文献
// ============================================================

export const knowledgePapers: KnowledgePaper[] = [
  {
    id: "paper-001",
    title: "Scoring Gene Importance by Interpreting Single-Cell Foundation Models",
    titleZh: "通过解释单细胞基础模型对基因重要性进行评分",
    direction: "单细胞基因组学 / 模型解释性",
    venue: "Nature Methods",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Nature Methods, 2025. DOI 待补。",
    keywords: ["单细胞", "基础模型", "基因重要性", "模型解释性", "scRNA-seq", "可解释AI"],
    relatedConceptIds: ["conc-001", "conc-002", "conc-003"],
    relatedToolIds: [],
    relatedCaseIds: ["case-005"],
    coreProblem: "如何从单细胞基础模型的内部表征中提取基因重要性的生物学可解释信号",
    methodSummary:
      "利用可解释性方法（如注意力权重分析和特征归因）解析单细胞基础模型的内部表征，将模型对基因的关注度映射为基因重要性评分，并与已知的功能基因组学数据进行交叉验证。",
    keyFinding:
      "单细胞基础模型在未明确训练的情况下自动学习到基因重要性的层次化表征，其评分与CRISPR筛选和GWAS结果高度一致。",
    teachingValue:
      "适合用于讲解'模型解释性'和'单细胞组学'交叉领域，帮助学生理解AI模型如何从数据中自动发现生物学规律。",
    researchValue:
      "为单细胞数据分析和基因功能注释提供了一种无需额外训练的计算方法，可直接集成到现有分析流程中。",
    demoScenario:
      "在课堂上用一张单细胞数据热图展示：模型如何自动识别出已知的关键标记基因，以及哪些基因的预测重要性最高但尚未被实验验证。",
    demoQuestions: [
      "为什么单细胞基础模型能够'学会'基因重要性？",
      "如何验证AI给出的基因重要性评分是可靠的？",
      "这种方法与传统差异表达分析有什么区别？",
    ],
    discussionPrompts: [
      "如果模型给出的高重要性基因在文献中没有报道，你会怎么做？",
      "模型解释性的局限在哪里？什么情况下可能给出误导性结果？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "答辩材料", "知识图谱"],
    experimentLearningValue:
      "适合用于模型解释性评估实验，学生可学习如何从AI模型中提取生物学信号并进行功能验证。",
    defenseValue:
      "展示了AI+生物学的交叉创新，从黑箱模型中提取生物学知识的方法学通用性强，可作为答辩中'AI驱动生物学发现'主题的核心案例。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 1,
    canSupportDemo: true,
  },
  {
    id: "paper-002",
    title:
      "AI-Guided Redesign of Laboratory-Evolved Reverse Transcriptases Enhances Prime Editing",
    titleZh: "AI引导的实验室进化逆转录酶重设计增强先导编辑效率",
    direction: "基因编辑 / 蛋白质工程",
    venue: "Nature Biotechnology",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Nature Biotechnology, 2025. DOI 待补。",
    keywords: ["Prime editing", "逆转录酶", "AI蛋白质设计", "定向进化", "基因编辑"],
    relatedConceptIds: ["conc-004", "conc-005"],
    relatedToolIds: [],
    relatedCaseIds: ["case-002"],
    coreProblem: "野生型MMLV逆转录酶在Prime editing中的效率限制了临床应用，如何通过AI辅助设计提升其性能",
    methodSummary:
      "结合实验室定向进化数据和AI蛋白质结构预测模型，对逆转录酶进行系统性重设计，在保持特异性的前提下显著提升其催化效率和持续合成能力。",
    keyFinding:
      "AI重设计的逆转录酶变体在Prime editing中的编辑效率提升了3-8倍，且在多种细胞系和靶位点中均表现一致。",
    teachingValue:
      "这是一个完美的'AI+实验'交叉案例：先有定向进化产生数据，再用AI模型指导理性设计，最后回到实验验证，完整展示了计算与实验的闭环。",
    researchValue:
      "不仅提升了Prime editing效率，还建立了一个通用的'AI辅助蛋白质工程'工作流程，可推广到其他酶家族。",
    demoScenario:
      "展示AI预测的逆转录酶三维结构变化，对比野生型和改造型在活性位点附近的构象差异，让学生直观理解蛋白质工程的逻辑。",
    demoQuestions: [
      "为什么提升逆转录酶活性就能提高Prime editing效率？",
      "AI在蛋白质设计中起什么作用？它替代了哪些传统实验步骤？",
      "定向进化和理性设计各自的优势和局限是什么？",
    ],
    discussionPrompts: [
      "如果AI建议的突变与进化保守性分析矛盾，你更相信谁？",
      "蛋白质工程的伦理边界在哪里？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "科研任务", "答辩材料"],
    experimentLearningValue:
      "AI辅助蛋白质工程的完整案例，可用于实验设计训练：从AI预测突变→实验验证→结构分析的全流程。",
    defenseValue:
      "AI+实验闭环的典型案例，体现了计算预测与实验验证的深度融合，是答辩中展示'计算驱动实验'理念的绝佳素材。",
    readingDifficulty: "较难",
    suggestedReadingOrder: 4,
    canSupportDemo: true,
  },
  {
    id: "paper-003",
    title:
      "Directed Evolution of Small RNA-Stabilizing Motifs That Improve Prime-Editing Efficiency",
    titleZh: "定向进化小RNA稳定元件提升先导编辑效率",
    direction: "基因编辑 / RNA工程",
    venue: "Nature Biotechnology",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Nature Biotechnology, 2025. DOI 待补。",
    keywords: ["Prime editing", "pegRNA", "RNA稳定元件", "定向进化", "RNA工程"],
    relatedConceptIds: ["conc-004", "conc-006"],
    relatedToolIds: [],
    relatedCaseIds: ["case-002"],
    coreProblem:
      "pegRNA在细胞内的不稳定性是Prime editing效率的主要瓶颈之一，如何获得高稳定性的RNA元件",
    methodSummary:
      "通过大规模文库筛选和定向进化，识别出能够显著提高pegRNA半衰期和编辑效率的RNA稳定基序，并揭示其结构基础。",
    keyFinding:
      "筛选出的RNA稳定元件可将pegRNA在细胞内的半衰期延长2-5倍，使Prime editing效率提升2-10倍，且与逆转录酶改造策略协同增效。",
    teachingValue:
      "展示RNA二级结构如何影响其功能稳定性，以及定向进化如何从海量随机序列中筛选出功能性元件。适合用于讲解RNA结构与功能关系。",
    researchValue:
      "提供了一套通用的pegRNA优化策略，可广泛应用于不同靶位点和细胞类型。",
    demoScenario:
      "用RNA二级结构预测图展示稳定元件如何形成特殊茎环结构抵抗核酸酶降解，对比有无稳定元件的pegRNA半衰期数据。",
    demoQuestions: [
      "为什么pegRNA比普通sgRNA更容易被降解？",
      "定向进化筛选RNA稳定元件的基本流程是怎样的？",
      "RNA稳定元件和逆转录酶改造可以叠加使用吗？",
    ],
    discussionPrompts: [
      "RNA药物的稳定性问题是mRNA疫苗和RNA疗法共同面临的挑战，pegRNA优化策略对其他RNA药物有什么启示？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "科研任务"],
    experimentLearningValue:
      "定向进化筛选RNA元件的实验流程，可作为实验方法学训练，适合设计RNA文库构建和功能筛选的课堂实验。",
    defenseValue:
      "展示了RNA工程在基因编辑中的关键作用，与paper-002形成互补，体现'蛋白+RNA双维度优化'的系统性思路。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 5,
    canSupportDemo: true,
  },
  {
    id: "paper-004",
    title:
      "Zero-Shot De Novo Peptide Sequencing with Open Posttranslational Modification Discovery",
    titleZh: "零样本从头肽段测序与开放翻译后修饰发现",
    direction: "蛋白质组学 / 深度学习",
    venue: "Nature Methods",
    year: 2025,
    sourceType: "方法学",
    sourceNote: "Nature Methods, 2025. DOI 待补。",
    keywords: [
      "de novo sequencing",
      "肽段测序",
      "翻译后修饰",
      "PTM",
      "深度学习",
      "蛋白质组学",
    ],
    relatedConceptIds: ["conc-009", "conc-010"],
    relatedToolIds: [],
    relatedCaseIds: ["case-005"],
    coreProblem:
      "传统肽段鉴定依赖已知序列数据库，无法发现新肽段和未知翻译后修饰",
    methodSummary:
      "提出一种基于深度学习的零样本方法，将de novo肽段测序与开放PTM发现统一到同一个端到端框架中，无需预先设定PTM类型即可自动发现和定位各种修饰。",
    keyFinding:
      "该模型在多个基准数据集上超越了现有的数据库依赖方法，且成功发现了多个先前未被报道的翻译后修饰类型。",
    teachingValue:
      "展示了深度学习如何突破传统生物信息学方法的局限，适合用于讲解'零样本学习'和'蛋白质组学'的交叉应用。",
    researchValue:
      "为免疫肽组学、肿瘤新抗原发现和蛋白质药物质量控制提供了强大的计算工具。",
    demoScenario:
      "输入一张质谱图，展示AI如何直接'读出'肽段序列，同时标记出哪些氨基酸残基上存在未知修饰。对比传统数据库搜索方法的局限性。",
    demoQuestions: [
      "什么是'零样本'？为什么de novo测序需要零样本能力？",
      "翻译后修饰为什么重要？举例说明一种PTM及其生物学功能。",
      "这种方法如何帮助肿瘤新抗原的发现？",
    ],
    discussionPrompts: [
      "当AI预测了一个从未被报道过的PTM类型时，如何验证它的真实性？",
      "零样本方法的潜在风险是什么？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["科研任务", "答辩材料"],
    experimentLearningValue:
      "深度学习在蛋白质组学中的应用案例，零样本学习方法的范式，适合用于计算生物学课程的方法学讨论。",
    defenseValue:
      "突破了传统数据库依赖方法的局限，方法学创新性强，适合在答辩中展示'AI如何超越传统方法的边界'。",
    readingDifficulty: "较难",
    suggestedReadingOrder: 6,
    canSupportDemo: true,
  },
  {
    id: "paper-005",
    title: "DNA-Guided CRISPR–Cas12 for Cellular RNA Targeting",
    titleZh: "DNA引导的CRISPR-Cas12用于细胞RNA靶向",
    direction: "基因编辑 / RNA生物学",
    venue: "Science",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Science, 2025. DOI 待补。",
    keywords: ["CRISPR-Cas12", "RNA靶向", "DNA引导", "基因调控", "RNA编辑"],
    relatedConceptIds: ["conc-007", "conc-008"],
    relatedToolIds: [],
    relatedCaseIds: ["case-004"],
    coreProblem:
      "传统CRISPR系统主要靶向DNA，如何在保持DNA引导简便性的同时实现高效RNA靶向",
    methodSummary:
      "通过对Cas12蛋白进行工程改造和筛选，实现了用DNA引导RNA（而非传统的RNA引导DNA）来靶向细胞内的RNA分子，拓展了CRISPR系统的应用范围。",
    keyFinding:
      "改造后的Cas12变体能够高效且特异性地结合和切割目标RNA，在活细胞内实现了可编程的RNA调控和编辑。",
    teachingValue:
      "帮助学生理解CRISPR系统的多样性和可塑性，以及核酸识别的基本原理（DNA-DNA配对 vs DNA-RNA配对）。适合用于讲解核酸化学和基因编辑工具。",
    researchValue:
      "为RNA靶向提供了一种新的工具选择，在RNA敲低、RNA编辑和RNA成像等方面具有广泛的应用前景。",
    demoScenario:
      "用分子动画展示：通常Cas12由RNA引导去切DNA，但改造后变成DNA引导去切RNA。对比这两种模式的区别和各自的应用场景。",
    demoQuestions: [
      "DNA引导和RNA引导有什么区别？各有什么优缺点？",
      "Cas12和Cas9在RNA靶向方面有什么不同？",
      "为什么要靶向RNA而不是DNA？有哪些应用场景？",
    ],
    discussionPrompts: [
      "RNA靶向相比DNA靶向的治疗安全性优势在哪里？",
      "如果能够同时靶向DNA和RNA，会带来哪些新的可能性？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "知识图谱", "答辩材料"],
    experimentLearningValue:
      "CRISPR系统的改造和应用验证实验，适合用于讲解核酸酶工程化和功能验证的实验设计。",
    defenseValue:
      "拓展了CRISPR工具箱，展示了从DNA靶向到RNA靶向的创新路径，体现'逆向思维'（用DNA引导替代RNA引导）的科研创新价值。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 7,
    canSupportDemo: true,
  },
  {
    id: "paper-006",
    title:
      "DNA-Guided CRISPR–Cas12a Effectors for Programmable RNA Recognition and Cleavage",
    titleZh: "DNA引导的CRISPR-Cas12a效应器实现可编程RNA识别与切割",
    direction: "基因编辑 / 合成生物学",
    venue: "Cell",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Cell, 2025. DOI 待补。",
    keywords: [
      "CRISPR-Cas12a",
      "RNA识别",
      "可编程",
      "效应器",
      "合成生物学",
    ],
    relatedConceptIds: ["conc-007", "conc-008"],
    relatedToolIds: [],
    relatedCaseIds: ["case-001"],
    coreProblem: "如何构建可编程的RNA识别与切割系统，实现对细胞内任意RNA靶标的精准调控",
    methodSummary:
      "系统性地表征了Cas12a家族多个成员对RNA底物的识别和切割活性，建立了DNA引导的RNA靶向系统，并展示了其在RNA敲低和RNA成像中的应用。",
    keyFinding:
      "部分Cas12a变体具有内源的RNA切割活性，配合DNA引导链可实现高度特异的RNA靶向，脱靶率极低。",
    teachingValue:
      "展示CRISPR效应器家族的多样性，以及如何从天然系统中挖掘和改造新的分子工具。适合用于讲解'合成生物学工具开发'。",
    researchValue:
      "扩展了CRISPR工具箱，提供了一个新的RNA操控平台，可作为RNA干扰（RNAi）的替代方案。",
    demoScenario:
      "展示Cas12a家族不同成员的进化树和功能差异，通过热图对比它们的RNA切割效率和特异性，让学生理解'从天然多样性中挖掘工具'的研究范式。",
    demoQuestions: [
      "Cas12a和Cas12有什么不同？为什么会存在这么多Cas蛋白变体？",
      "可编程RNA识别如何确保特异性？",
      "这个系统在临床诊断中有什么应用？",
    ],
    discussionPrompts: [
      "自然界中为什么存在如此多样的CRISPR系统？进化驱动力是什么？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "科研任务"],
    experimentLearningValue:
      "Cas12a家族的系统性功能表征实验，适合用于讲解'从天然多样性中挖掘和改造分子工具'的研究方法论。",
    defenseValue:
      "天然多样性挖掘+工程化改造的经典研究范式，可补充paper-005形成CRISPR RNA靶向的完整叙事。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 8,
    canSupportDemo: false,
  },
  {
    id: "paper-007",
    title:
      "A Multiobjective AI Model for LNP Engineering Enhances Tissue-Selective mRNA Delivery",
    titleZh: "多目标AI模型用于LNP工程增强组织选择性mRNA递送",
    direction: "药物递送 / AI辅助设计",
    venue: "Nature",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Nature, 2025. DOI 待补。",
    keywords: [
      "LNP",
      "脂质纳米颗粒",
      "mRNA递送",
      "多目标优化",
      "AI",
      "组织选择性",
    ],
    relatedConceptIds: ["conc-011", "conc-012"],
    relatedToolIds: [],
    relatedCaseIds: ["case-006"],
    coreProblem:
      "LNP-mRNA递送系统的组织选择性差，大部分药物聚集在肝脏，如何实现精准的器官靶向",
    methodSummary:
      "构建了一个多目标AI优化模型，同时优化LNP的多个性能指标（递送效率、组织选择性、安全性、稳定性），从数百万候选脂质中筛选出具有组织特异性的最优LNP配方。",
    keyFinding:
      "AI模型成功设计出能够选择性地靶向肺、脾和骨髓的LNP配方，在动物模型中验证了其组织选择性和高效递送能力。",
    teachingValue:
      "这是一个优秀的多目标优化案例：需要同时平衡效率、安全性和选择性，展示AI如何在复杂的多维参数空间中寻找最优解。",
    researchValue:
      "突破了LNP肝脏偏向性的长期瓶颈，为mRNA药物的精准组织靶向递送开辟了新路径。",
    demoScenario:
      "展示AI多目标优化的帕累托前沿图（Pareto front），让学生看到不同LNP配方在'肝靶向 vs 肺靶向'空间中的分布，理解多目标优化的概念。",
    demoQuestions: [
      "为什么LNP天然倾向于在肝脏积累？",
      "多目标优化是什么意思？为什么不能只优化一个指标？",
      "AI模型如何从数百万候选分子中挑选出最优的几个？",
    ],
    discussionPrompts: [
      "如果把LNP比作'快递包裹'，组织选择性就是'精准投递'。什么生物机制决定了包裹会被送到哪个器官？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["产业案例", "答辩材料", "科研任务"],
    experimentLearningValue:
      "多目标优化在LNP设计中的应用，可作为计算方法训练，适合设计AI辅助药物递送系统优化的课程项目。",
    defenseValue:
      "突破了LNP肝脏偏向性的长期瓶颈，产业转化潜力大，适合在答辩中阐述'AI如何解决产业级技术难题'。",
    readingDifficulty: "较难",
    suggestedReadingOrder: 9,
    canSupportDemo: true,
  },
  {
    id: "paper-008",
    title:
      "Immune-Remodeling mRNAs Expressing IRF8 or NIK Generate Durable Antitumor Immunity in Multiple Cancer Models",
    titleZh: "表达IRF8或NIK的免疫重塑mRNA在多种癌症模型中产生持久抗肿瘤免疫",
    direction: "免疫治疗 / mRNA药物",
    venue: "Nature",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Nature, 2025. DOI 待补。",
    keywords: [
      "mRNA治疗",
      "免疫重塑",
      "IRF8",
      "NIK",
      "抗肿瘤免疫",
      "癌症免疫治疗",
    ],
    relatedConceptIds: ["conc-012", "conc-014"],
    relatedToolIds: [],
    relatedCaseIds: ["case-001", "case-006"],
    coreProblem: "如何通过mRNA药物重塑肿瘤微环境的免疫状态，产生持久的抗肿瘤免疫应答",
    methodSummary:
      "设计了编码IRF8和NIK两种免疫调节因子的mRNA药物，利用LNP递送到肿瘤部位，通过重塑肿瘤微环境的免疫细胞组成和功能，激活持久的抗肿瘤免疫。",
    keyFinding:
      "IRF8 mRNA治疗将'冷肿瘤'（免疫细胞浸润少）转化为'热肿瘤'，NIK mRNA激活非经典NF-κB通路，两者协同在多种癌症模型中实现肿瘤消退和长期免疫记忆。",
    teachingValue:
      "展示mRNA药物如何通过调节免疫系统来治疗癌症。适合用于讲解肿瘤免疫学、mRNA药物设计和免疫治疗的原理。",
    researchValue:
      "提供了一种新的mRNA免疫治疗策略，可能适用于对现有免疫检查点抑制剂耐药的肿瘤类型。",
    demoScenario:
      "展示'冷肿瘤'和'热肿瘤'的免疫细胞浸润对比图，以及mRNA治疗后肿瘤微环境的变化过程。让学生直观感受'免疫重塑'的概念。",
    demoQuestions: [
      "什么是'冷肿瘤'和'热肿瘤'？这个分类对治疗有什么指导意义？",
      "IRF8和NIK分别通过什么机制来重塑免疫？",
      "mRNA药物与传统的蛋白质药物相比有什么优势？",
    ],
    discussionPrompts: [
      "免疫治疗的持久性记忆是如何建立的？这与疫苗的原理有什么异同？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["产业案例", "答辩材料"],
    experimentLearningValue:
      "免疫治疗中的mRNA药物设计思路，适合讨论免疫学原理与药物设计的交叉应用。",
    defenseValue:
      "mRNA技术的临床应用拓展——从疫苗到免疫治疗的跨越，体现了平台型技术的可扩展性，适合答辩中展示技术广度。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 10,
    canSupportDemo: true,
  },
  {
    id: "paper-009",
    title:
      "Deep Peptide Recognition Profiling Decodes TCR Specificity and Enables Disease-Associated Antigen Discovery",
    titleZh: "深度肽段识别分析解码TCR特异性并实现疾病相关抗原发现",
    direction: "免疫信息学 / 深度学习",
    venue: "Cell",
    year: 2025,
    sourceType: "学术文献",
    sourceNote: "Cell, 2025. DOI 待补。",
    keywords: [
      "TCR",
      "T细胞受体",
      "肽段识别",
      "抗原发现",
      "深度学习",
      "免疫组库",
    ],
    relatedConceptIds: ["conc-013", "conc-014"],
    relatedToolIds: [],
    relatedCaseIds: ["case-002", "case-005"],
    coreProblem:
      "TCR与抗原肽-MHC复合物的识别规则极其复杂，如何高通量解码TCR的特异性",
    methodSummary:
      "开发了深度学习方法，通过大规模TCR-肽段配对数据训练模型，学习TCR序列与其识别的抗原肽之间的映射关系，进而预测未知TCR的特异性和发现新的疾病相关抗原。",
    keyFinding:
      "该模型能从TCR序列直接预测其识别的抗原肽类型，准确率显著超过传统方法，并成功发现了多个自身免疫病和肿瘤相关的新抗原。",
    teachingValue:
      "展示深度学习如何破解免疫系统的'识别密码'。适合用于讲解TCR生物学、免疫信息学和AI驱动的生物医学发现。",
    researchValue:
      "为TCR-T细胞治疗、自身免疫病诊断和传染病疫苗设计提供了关键的抗原预测工具。",
    demoScenario:
      "展示一个TCR序列，让学生看到AI模型如何预测它可能识别哪种抗原肽，以及这个预测如何指导后续的实验验证流程。",
    demoQuestions: [
      "TCR如何识别抗原？为什么这种识别如此复杂？",
      "深度学习模型如何'学会'TCR和抗原肽的配对规则？",
      "这种方法与传统的MHC四聚体染色有什么区别和优势？",
    ],
    discussionPrompts: [
      "如果能预测任何人的TCR特异性，这对个性化医疗意味着什么？潜在风险有哪些？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "科研任务", "答辩材料"],
    experimentLearningValue:
      "免疫信息学+深度学习的前沿案例，适合用于TCR数据分析和抗原预测的计算实验设计。",
    defenseValue:
      "破解TCR特异性密码——AI驱动的免疫学研究范式变革，可作为答辩中'AI赋能基础科学发现'主题的核心案例。",
    readingDifficulty: "较难",
    suggestedReadingOrder: 11,
    canSupportDemo: true,
  },
  {
    id: "paper-010",
    title:
      "A Single-Cell Screening Platform Accelerates Functional Genetics in Plants",
    titleZh: "单细胞筛选平台加速植物功能基因组学研究",
    direction: "植物生物学 / 功能基因组学",
    venue: "Cell",
    year: 2025,
    sourceType: "方法学",
    sourceNote: "Cell, 2025. DOI 待补。",
    keywords: [
      "单细胞",
      "筛选平台",
      "功能基因组学",
      "植物",
      "高通量",
    ],
    relatedConceptIds: ["conc-001", "conc-003"],
    relatedToolIds: [],
    relatedCaseIds: ["case-004"],
    coreProblem:
      "植物功能基因组学受限于遗传转化效率低和表型筛选通量小，如何实现高通量的基因功能鉴定",
    methodSummary:
      "开发了一个基于微流控和单细胞测序的高通量筛选平台，能够在单细胞水平同时检测数千个基因扰动后的转录组变化，大幅加速植物基因功能的注释。",
    keyFinding:
      "平台在拟南芥和水稻中成功鉴定了数百个以前功能未知的基因，其中多个基因对逆境耐受和产量性状具有显著影响。",
    teachingValue:
      "展示单细胞技术如何从医学领域拓展到植物科学，以及高通量筛选在功能基因组学研究中的核心作用。",
    researchValue:
      "为作物分子育种和植物合成生物学提供了系统性的基因功能图谱和筛选工具。",
    demoScenario:
      "展示单细胞筛选平台的工作流程：从原生质体分离到微流控芯片、单细胞测序、基因功能注释的全链条，让学生理解高通量研究的基本逻辑。",
    demoQuestions: [
      "为什么植物功能基因组学比动物更难研究？",
      "单细胞筛选和传统遗传筛选有什么区别？",
      "这个平台如何帮助作物育种？",
    ],
    discussionPrompts: [
      "单细胞技术在植物科学中的应用前景是什么？还有哪些技术瓶颈？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["实验学习", "知识图谱"],
    experimentLearningValue:
      "高通量单细胞筛选平台的设计逻辑和应用，适合讲解技术平台开发与生物学发现的交叉。",
    defenseValue:
      "将单细胞技术从医学拓展到植物科学，跨学科应用范例，可补充知识库的应用广度。",
    readingDifficulty: "中等",
    suggestedReadingOrder: 2,
    canSupportDemo: false,
  },
  {
    id: "paper-011",
    title:
      "Digital Twins of Ex Vivo Human Lungs Enable Accurate and Personalized Evaluation of Therapeutic Efficacy",
    titleZh: "离体人肺数字孪生实现精准个性化疗效评估",
    direction: "数字孪生 / 精准医疗",
    venue: "Nature Medicine",
    year: 2025,
    sourceType: "方法学",
    sourceNote: "Nature Medicine, 2025. DOI 待补。",
    keywords: [
      "数字孪生",
      "离体肺",
      "个性化医疗",
      "疗效评估",
      "药物测试",
    ],
    relatedConceptIds: ["conc-011", "conc-012"],
    relatedToolIds: [],
    relatedCaseIds: ["case-001"],
    coreProblem:
      "传统药物测试难以准确预测个体患者的治疗反应，如何构建个性化的疗效评估系统",
    methodSummary:
      "利用离体人肺灌注系统和多模态实时监测数据，构建肺器官的数字孪生模型，在计算机中模拟药物在个体肺组织中的分布、代谢和效应，实现个性化疗效预测。",
    keyFinding:
      "数字孪生模型对药物疗效的预测与临床实际结局的吻合度超过85%，显著优于传统的体外细胞实验和动物模型。",
    teachingValue:
      "展示'数字孪生'概念在生物医学中的具体实现，帮助学生理解计算模型如何桥接基础研究和临床应用。适合用于讲解系统生物学和精准医疗。",
    researchValue:
      "提供了一个通用的个性化药物评估框架，可扩展到其他器官和疾病类型。",
    demoScenario:
      "展示一个交互式的3D肺数字孪生模型，模拟给药后药物在不同肺叶的分布动态，让学生直观感受'数字孪生'的优势。",
    demoQuestions: [
      "什么是数字孪生？它和传统计算机模拟有什么区别？",
      "离体人肺是如何维持存活的？这种模型有什么优势？",
      "数字孪生的预测结果如何验证？",
    ],
    discussionPrompts: [
      "数字孪生能否替代动物实验？技术和伦理上的障碍分别是什么？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["产业案例", "答辩材料"],
    experimentLearningValue:
      "数字孪生概念的生物医学落地案例，适合用于讲解计算建模与个性化医疗的交叉应用。",
    defenseValue:
      "数字孪生在精准医疗中的创新应用，代表了'计算驱动个性化医疗'的未来方向，答辩中可展示前瞻性思维。",
    readingDifficulty: "入门",
    suggestedReadingOrder: 12,
    canSupportDemo: true,
  },
  {
    id: "paper-012",
    title:
      "TxPert: Using Multiple Knowledge Graphs for Prediction of Transcriptomic Perturbation Effects",
    titleZh: "TxPert：利用多重知识图谱预测转录组扰动效应",
    direction: "生物信息学 / 知识图谱",
    venue: "Nature Biotechnology",
    year: 2025,
    sourceType: "方法学",
    sourceNote: "Nature Biotechnology, 2025. DOI 待补。",
    keywords: [
      "TxPert",
      "知识图谱",
      "转录组",
      "扰动预测",
      "药物发现",
      "系统生物学",
    ],
    relatedConceptIds: ["conc-015", "conc-001", "conc-002"],
    relatedToolIds: [],
    relatedCaseIds: ["case-003", "case-004"],
    coreProblem:
      "如何利用知识图谱中的多维度生物医学关系来预测基因扰动对转录组的全局影响",
    methodSummary:
      "整合多个生物医学知识图谱（基因-疾病、药物-靶点、通路、蛋白质相互作用），构建TxPert模型，利用图神经网络预测任意基因扰动（敲除、过表达、药物处理）后的转录组变化。",
    keyFinding:
      "TxPert在预测扰动效应方面的准确率比仅使用表达数据的模型提高了40%以上，且能泛化到训练中未见过的新基因和药物靶点。",
    teachingValue:
      "展示知识图谱和图神经网络在生物医学中的前沿应用，帮助学生理解'如何用图结构表示生物学知识以及如何从图中推理'。适合讲解系统生物学和AI药物发现。",
    researchValue:
      "为药物靶点发现、药物重定位和组合治疗策略设计提供了强大的预测工具。",
    demoScenario:
      "在知识图谱中可视化展示：从一个药物靶点出发，通过多层关系（靶点→基因→通路→转录因子→下游基因）传播，TxPert如何预测最终的转录组变化。",
    demoQuestions: [
      "什么是知识图谱？在生物学中如何使用知识图谱？",
      "TxPert如何利用知识图谱来改进预测？",
      "图神经网络和普通神经网络有什么区别？",
    ],
    discussionPrompts: [
      "如果知识图谱中缺少某些关系，TxPert的预测效果会受多大影响？如何持续更新和维护生物医学知识图谱？",
    ],
    evidenceLevel: "高",
    copyrightNote:
      "仅存储元数据、教学摘要和引用信息，不在仓库中存放受版权保护的全文 PDF。",
    selectable: true,
    recommendedFor: ["知识图谱", "科研任务", "答辩材料"],
    experimentLearningValue:
      "知识图谱和图神经网络在生物医学中的应用，适合设计计算实验：构建一个小型知识图谱并进行扰动预测。",
    defenseValue:
      "证明了结构化知识比纯数据驱动方法更强大，是系统生物学与AI融合的典范，答辩中可阐述'知识驱动的AI'理念。",
    readingDifficulty: "较难",
    suggestedReadingOrder: 3,
    canSupportDemo: true,
  },
];

// ============================================================
// 15 个知识概念
// ============================================================

export const knowledgeConcepts: KnowledgeConcept[] = [
  {
    id: "conc-001",
    name: "单细胞基础模型",
    nameEn: "Single-Cell Foundation Model",
    category: "AI模型",
    shortDefinition:
      "在大规模单细胞转录组数据上预训练的深度学习模型，能够学习细胞的通用表征。",
    longExplanation:
      "单细胞基础模型借鉴了自然语言处理中GPT等基础模型的理念，在上千万个单细胞转录组数据上进行自监督预训练。模型通过预测被遮蔽基因的表达值或区分不同细胞类型来学习基因之间的共表达关系和细胞状态的潜在表征。预训练完成后，模型可以通过微调（fine-tuning）或零样本推理来执行多种下游任务，如细胞类型注释、基因重要性评分、扰动响应预测和跨物种比较。核心优势在于：模型在预训练阶段已经学到了丰富的细胞生物学先验知识，因此即使在小样本场景下也能给出高质量的预测。",
    prerequisites: ["单细胞RNA测序原理", "深度学习基础概念", "转录组学基础"],
    relatedConceptIds: ["conc-002", "conc-003", "conc-015"],
    relatedPaperIds: ["paper-001", "paper-010", "paper-012"],
    relatedToolIds: [],
    learningPath: [
      "先理解scRNA-seq数据特征：稀疏性、批次效应、高维度",
      "再了解自监督学习的基本范式：掩码预测、对比学习",
      "然后学习单细胞基础模型的架构：Transformer、注意力机制",
      "最后实践：用预训练模型对你的数据进行微调",
    ],
    commonMisunderstandings: [
      "误区：单细胞基础模型可以直接替代所有传统分析方法 → 实际：它是对传统方法的增强，需要根据具体任务进行适配",
      "误区：模型越大越好 → 实际：模型规模需要与训练数据量和下游任务匹配",
    ],
    demoUse:
      "在课堂演示中输入一个基因列表，让单细胞基础模型预测这些基因在不同细胞类型中的重要性排名。",
  },
  {
    id: "conc-002",
    name: "模型解释性",
    nameEn: "Model Interpretability",
    category: "AI模型",
    shortDefinition:
      "理解和解释AI模型如何做出预测的方法和技术，是AI在科学中可信应用的基础。",
    longExplanation:
      "模型解释性（又称可解释AI，XAI）旨在揭示深度学习模型从输入到输出的决策过程。在生物医学领域，解释性方法尤为重要：如果AI模型预测某个基因对疾病至关重要，研究者需要知道模型是基于什么证据做出这个判断的——是因为该基因在疾病样本中高表达？还是因为它在已知通路中处于枢纽位置？常用方法包括：注意力权重可视化（显示模型关注哪些基因）、特征归因（SHAP、Integrated Gradients等计算每个输入特征对预测结果的贡献）、概念激活向量（测试模型是否学到了人类可理解的生物学概念）。解释性方法不仅能验证模型的可靠性，还能帮助发现新的生物学知识。",
    prerequisites: ["机器学习基础", "深度学习中的注意力机制", "统计学基本概念"],
    relatedConceptIds: ["conc-001", "conc-003"],
    relatedPaperIds: ["paper-001", "paper-012"],
    relatedToolIds: [],
    learningPath: [
      "先了解为什么需要模型解释性：案例研究（如医疗诊断中的黑箱风险）",
      "再学习方法分类：内在可解释 vs 事后解释、全局解释 vs 局部解释",
      "然后掌握常用工具：SHAP、LIME、注意力可视化",
      "最后在生物数据上实践：解释一个单细胞模型的预测",
    ],
    commonMisunderstandings: [
      "误区：注意力权重等于特征重要性 → 实际：高注意力不一定意味着因果关系",
      "误区：解释了就能完全信任模型 → 实际：解释方法本身也可能产生误导",
    ],
    demoUse:
      "在课堂展示一个基因重要性预测任务，对比模型给出的高重要性基因和SHAP解释结果，讨论哪些基因的预测是可信的、哪些需要进一步验证。",
  },
  {
    id: "conc-003",
    name: "基因重要性",
    nameEn: "Gene Essentiality / Gene Importance",
    category: "基础概念",
    shortDefinition:
      "衡量一个基因对细胞生存、增殖或特定功能的重要程度的量化指标。",
    longExplanation:
      "基因重要性是功能基因组学的核心概念之一。在实验层面，通过CRISPR全基因组敲除筛选或RNAi筛选来系统性地评估每个基因对细胞适应度（fitness）的贡献。在计算层面，可以通过分析基因的进化保守性、蛋白质相互作用网络中的拓扑位置、基因表达水平和共表达模式来预测基因重要性。近年来，单细胞基础模型提供了一种新的视角：模型在海量数据预训练中自动学到的基因注意力权重，可以反映基因在不同细胞状态下的相对重要性。基因重要性数据对于药物靶点选择（优先选择对肿瘤细胞重要但对正常细胞非必要的基因）、合成生物学底盘设计（确定哪些基因可以被敲除）和疾病基因发现都至关重要。",
    prerequisites: ["分子生物学中心法则", "基因表达与调控基础", "CRISPR筛选原理"],
    relatedConceptIds: ["conc-001", "conc-002"],
    relatedPaperIds: ["paper-001", "paper-010"],
    relatedToolIds: [],
    learningPath: [
      "先理解基因重要性的生物学定义和实验测定方法",
      "再学习计算方法：基于网络拓扑、基于表达数据、基于进化保守性",
      "然后了解单细胞模型中基因重要性的自动涌现",
      "最后实践：比较不同方法预测的基因重要性排序",
    ],
    commonMisunderstandings: [
      "误区：重要基因一定是高表达基因 → 实际：一些转录因子表达量很低但功能极其重要",
      "误区：基因重要性是固定不变的 → 实际：它高度依赖于细胞类型、环境和遗传背景",
    ],
    demoUse:
      "展示同一基因在不同细胞类型中的重要性评分差异，讨论基因重要性的上下文依赖性。",
  },
  {
    id: "conc-004",
    name: "Prime Editing",
    nameEn: "Prime Editing",
    category: "前沿技术",
    shortDefinition:
      "一种精准基因编辑技术，可以在不产生双链断裂的情况下实现碱基替换、小片段插入和删除。",
    longExplanation:
      "先导编辑（Prime Editing）由David Liu实验室于2019年在Nature首次报道，被称为'搜索-替换'基因编辑技术。其核心组件是一个融合蛋白（Cas9切口酶 + 工程化逆转录酶，即PE蛋白）和一条pegRNA（prime editing guide RNA）。pegRNA既含有引导Cas9到目标位点的spacer序列，又含有编码编辑信息（目标修改序列）的3'延伸段。工作流程：①pegRNA引导Cas9切口酶在目标链上产生单链切口；②pegRNA的3'延伸段与切口处的DNA互补配对，作为逆转录的引物；③逆转录酶以pegRNA延伸段为模板合成含有目标编辑的DNA；④细胞DNA修复机制将编辑后的序列整合到基因组中。相比CRISPR-Cas9和碱基编辑，Prime editing能实现所有12种点突变类型以及小片段的精准插入和删除，且不依赖双链断裂，因此脱靶效应和indel副产物更少。",
    prerequisites: ["CRISPR-Cas9基本机制", "DNA修复通路", "逆转录基本原理"],
    relatedConceptIds: ["conc-005", "conc-006"],
    relatedPaperIds: ["paper-002", "paper-003"],
    relatedToolIds: [],
    learningPath: [
      "先回顾CRISPR-Cas9和碱基编辑的原理和局限性",
      "再学习Prime editing的分子机制：PE蛋白 + pegRNA",
      "然后了解pegRNA设计的规则和优化策略",
      "最后实践：为一个给定的突变设计pegRNA",
    ],
    commonMisunderstandings: [
      "误区：Prime editing可以替换任意长度的DNA片段 → 实际：目前高效的编辑长度通常<50bp",
      "误区：Prime editing完全消除了脱靶效应 → 实际：虽然比CRISPR显著降低，但仍需评估",
    ],
    demoUse:
      "在课堂上对比Prime editing、碱基编辑和传统CRISPR-Cas9在同一个靶点上的编辑效率、精确度和副产物谱。",
  },
  {
    id: "conc-005",
    name: "逆转录酶改造",
    nameEn: "Reverse Transcriptase Engineering",
    category: "实验方法",
    shortDefinition:
      "通过蛋白质工程手段（定向进化、理性设计或AI辅助设计）改造逆转录酶的催化性能。",
    longExplanation:
      "逆转录酶（RT）以RNA为模板合成互补DNA（cDNA），是Prime editing核心组件之一。野生型MMLV逆转录酶在PE中的效率受限，主要原因包括：持续合成能力（processivity）不足、对修饰核苷酸的耐受性差、与Cas9切口酶的融合导致构象改变。改造策略分三类：①定向进化——通过易错PCR引入随机突变，在功能筛选压力下富集性能提升的变体，不依赖结构信息但通量受限；②理性设计——基于逆转录酶的三维结构和催化机制，在关键位点引入定点突变以优化底物结合或催化效率；③AI辅助设计——利用蛋白质语言模型（如ESM、ProteinMPNN）从序列空间中预测性能最优的突变组合，再通过实验验证。AI方法的关键优势是能从海量序列空间中高效探索，避免定向进化的局部最优陷阱。",
    prerequisites: ["蛋白质结构与功能", "酶动力学基础", "定向进化原理"],
    relatedConceptIds: ["conc-004"],
    relatedPaperIds: ["paper-002"],
    relatedToolIds: [],
    learningPath: [
      "先学习逆转录酶在分子生物学中的经典应用",
      "再理解蛋白质工程的三种策略及其适用场景",
      "然后分析paper-002中的AI辅助设计案例",
      "最后对比改造前后逆转录酶的关键性能指标",
    ],
    commonMisunderstandings: [
      "误区：定向进化就是随机突变加筛选 → 实际：文库设计、筛选策略和压力设置是成功的关键",
      "误区：AI设计不需要实验验证 → 实际：当前AI预测仍然需要实验闭环确认",
    ],
    demoUse:
      "展示AI预测的逆转录酶突变体与野生型的结构对比，标注活性位点附近的构象变化。",
  },
  {
    id: "conc-006",
    name: "RNA 稳定元件",
    nameEn: "RNA Stabilizing Motif",
    category: "前沿技术",
    shortDefinition:
      "能够保护RNA分子免受核酸酶降解、延长其在细胞内半衰期的特定RNA序列或结构。",
    longExplanation:
      "RNA分子在细胞内的稳定性是影响其功能持续时间的关键因素。未受保护的线性RNA（包括pegRNA）在血清和细胞质中极易被RNase降解，半衰期通常仅为数分钟到数小时。RNA稳定元件通过形成特定的二级结构（如茎环、假结、G-四链体）来抵抗核酸酶的攻击。获取稳定元件的方法包括：①从天然稳定RNA中借鉴——如tRNA、rRNA和病毒RNA中天然存在的稳定基序；②定向进化筛选——合成大规模随机RNA文库，在降解条件下筛选存活最久的序列；③计算设计——利用RNA二级结构预测算法（如ViennaRNA、CONTRAfold）设计热力学最稳定的结构。在Prime editing应用中，将稳定元件整合到pegRNA的3'延伸段或间隔区可显著延长pegRNA的半衰期，从而增加逆转录酶利用pegRNA模板进行编辑的时间窗口。",
    prerequisites: ["RNA结构与功能", "RNA二级结构预测", "核酸酶分类与机制"],
    relatedConceptIds: ["conc-004"],
    relatedPaperIds: ["paper-003"],
    relatedToolIds: [],
    learningPath: [
      "先理解RNA在细胞内的降解机制",
      "再学习RNA二级结构的预测和稳定性计算",
      "然后了解定向进化如何筛选功能性RNA",
      "最后在pegRNA设计工具中实践稳定元件的选择",
    ],
    commonMisunderstandings: [
      "误区：所有茎环结构都能稳定RNA → 实际：稳定效果取决于具体的序列和结构特征",
      "误区：越稳定越好 → 实际：过稳定可能影响pegRNA与目标DNA的杂交效率",
    ],
    demoUse:
      "输入一段pegRNA序列，展示折叠预测结果和稳定性评分，比较有无稳定元件的二级结构差异。",
  },
  {
    id: "conc-007",
    name: "CRISPR-Cas12",
    nameEn: "CRISPR-Cas12",
    category: "前沿技术",
    shortDefinition:
      "CRISPR-Cas系统中的一类效应蛋白，具有RNA引导的DNA切割活性和附属的非特异性ssDNA切割活性。",
    longExplanation:
      "Cas12（又称Cpf1）是第二类V型CRISPR系统中的效应核酸酶，与Cas9同属2类CRISPR系统但具有显著不同的特征：①Cas12只需要crRNA（不需要tracrRNA），简化了向导RNA设计；②Cas12识别富含T的PAM序列（如5'-TTTV-3'），与Cas9的富含G的PAM互补，扩展了可编辑的基因组靶点范围；③Cas12切割产生粘性末端（5'突出端），而非Cas9的平末端，可能有利于HDR修复途径；④Cas12具有附属切割活性——在识别目标DNA并被激活后，Cas12会非特异地切割周围的ssDNA，这一特性已被用于开发高灵敏度的核酸检测平台（如DETECTR）。最新研究发现，部分Cas12变体具有RNA靶向能力，且可通过DNA引导替代RNA引导，实现了引导模式和靶标类型的双重灵活性。",
    prerequisites: ["CRISPR-Cas系统分类", "核酸酶催化机制", "PAM序列概念"],
    relatedConceptIds: ["conc-008"],
    relatedPaperIds: ["paper-005", "paper-006"],
    relatedToolIds: [],
    learningPath: [
      "先回顾CRISPR-Cas系统的分类和进化",
      "再学习Cas12与Cas9的结构和机制差异",
      "然后了解Cas12附属切割活性的检测应用",
      "最后探索Cas12 RNA靶向的最新研究进展",
    ],
    commonMisunderstandings: [
      "误区：Cas12和Cas9的功能完全一样 → 实际：它们有不同的PAM要求、切割方式和附属活性",
      "误区：Cas12只能靶向DNA → 实际：工程化改造后也能高效靶向RNA",
    ],
    demoUse:
      "展示Cas12和Cas9的三维结构对比，标注关键的结构域差异（REC、NUC、PI等），解释功能差异的结构基础。",
  },
  {
    id: "conc-008",
    name: "RNA 靶向",
    nameEn: "RNA Targeting",
    category: "应用方向",
    shortDefinition:
      "设计分子工具（如CRISPR系统、反义寡核苷酸、小分子）特异性识别并结合目标RNA分子的技术。",
    longExplanation:
      "RNA靶向是一个快速发展的生物技术领域，其核心目标是实现对特定RNA分子的识别、结合和功能调控。与DNA靶向不同，RNA靶向具有几个独特优势：①RNA是动态分子，靶向RNA可以实现对基因表达的瞬时、可逆调控，而非永久性改变基因组；②RNA靶向避免了DNA编辑可能带来的不可逆脱靶风险，安全性更高；③许多疾病（如重复扩增疾病、异常剪接疾病）更适合在RNA层面而非DNA层面进行干预。主要技术路线包括：①CRISPR-Cas系统——Cas13直接靶向RNA，Cas12改造后也可靶向RNA；②反义寡核苷酸（ASO）——通过碱基互补结合目标RNA，诱导RNase H降解或调节剪接；③RNA干扰（RNAi）——利用siRNA/shRNA降解目标mRNA；④小分子——结合RNA特定结构改变其功能。CRISPR系统在RNA靶向中具有可编程性好、特异性高的优势。",
    prerequisites: ["RNA生物学基础", "RNA-蛋白质相互作用", "核酸杂交原理"],
    relatedConceptIds: ["conc-007"],
    relatedPaperIds: ["paper-005", "paper-006"],
    relatedToolIds: [],
    learningPath: [
      "先理解为什么需要靶向RNA（区别于靶向DNA）",
      "再学习不同RNA靶向技术的原理和比较",
      "然后聚焦CRISPR系统在RNA靶向中的应用",
      "最后了解RNA靶向在治疗和诊断中的临床进展",
    ],
    commonMisunderstandings: [
      "误区：RNA靶向可以替代DNA编辑 → 实际：两者是互补的，各有适用的疾病类型和应用场景",
      "误区：RNA靶向完全没有脱靶风险 → 实际：任何基于碱基互补的系统都存在一定程度的脱靶可能",
    ],
    demoUse:
      "比较DNA靶向和RNA靶向在治疗应用中的优缺点，用表格形式展示两种策略在不同疾病类型中的适用性。",
  },
  {
    id: "conc-009",
    name: "de novo peptide sequencing",
    nameEn: "De Novo Peptide Sequencing",
    category: "AI模型",
    shortDefinition:
      "不依赖已知蛋白质序列数据库，直接从质谱图中推导肽段氨基酸序列的计算方法。",
    longExplanation:
      "De novo（从头）肽段测序是蛋白质组学分析的终极挑战。传统数据库搜索方法（如Mascot、MaxQuant）将实验质谱图与已知蛋白质序列数据库的理论谱图进行匹配，但这一方法有根本性局限：只能发现数据库中已有的序列，无法鉴定新蛋白质、突变肽段或来自未测序物种的肽段。De novo测序直接解析质谱图中的碎片离子模式来重构肽段序列，不依赖数据库。深度学习极大地推动了de novo测序的进展——模型通过学习海量质谱图-肽段序列配对数据中的碎片规律，能够在仅有质谱图输入的情况下'读出'完整的氨基酸序列。最新的进展实现了'零样本'PTM发现：模型不仅能够识别标准氨基酸，还能检测到质量偏移位置并判断可能的新PTM类型。这对于免疫肽组学（鉴定MHC呈递的新抗原肽）和蛋白质药物质量控制尤为关键。",
    prerequisites: ["质谱原理", "蛋白质质谱数据分析", "深度学习序列模型概念"],
    relatedConceptIds: ["conc-010"],
    relatedPaperIds: ["paper-004"],
    relatedToolIds: [],
    learningPath: [
      "先学习质谱基础：母离子选择、碎片化、谱图解析",
      "再了解数据库搜索方法的原理和局限",
      "然后学习深度学习在序列预测中的应用范式",
      "最后实践：用de novo测序工具分析一张真实的质谱图",
    ],
    commonMisunderstandings: [
      "误区：de novo测序已经完全解决了肽段鉴定问题 → 实际：长肽段和低丰度肽段仍然是挑战",
      "误区：de novo结果不需要验证 → 实际：从头预测通常需要合成标准肽段进行谱图匹配确认",
    ],
    demoUse:
      "展示一张质谱图，标注b离子和y离子系列，逐步推导肽段序列，让学生体验手动de novo测序的过程。",
  },
  {
    id: "conc-010",
    name: "翻译后修饰",
    nameEn: "Post-Translational Modification (PTM)",
    category: "基础概念",
    shortDefinition:
      "蛋白质在翻译完成后发生的共价化学修饰，是调控蛋白质功能、定位和相互作用的关键机制。",
    longExplanation:
      "翻译后修饰（PTM）是蛋白质功能调控的核心机制之一，极大地扩展了蛋白质组的功能多样性。已知的PTM类型超过400种，最常见的包括：①磷酸化——最广泛研究的PTM，通过激酶和磷酸酶动态调控信号转导；②乙酰化——调控蛋白质稳定性、DNA结合和代谢酶活性；③泛素化——标记蛋白质进行降解或改变其功能；④糖基化——影响蛋白质折叠、稳定性和细胞识别；⑤甲基化——调控组蛋白功能和基因表达。PTM的失调与多种疾病（癌症、神经退行性疾病、代谢病）密切相关。近年来，质谱技术的发展使得大规模PTM组学分析成为可能，而深度学习方法的引入则实现了对未知PTM类型的自动发现和定量分析。理解PTM对于解释蛋白质的复杂行为和发现新的药物靶点至关重要。",
    prerequisites: ["蛋白质结构基础", "酶催化反应原理", "质谱分析基本概念"],
    relatedConceptIds: ["conc-009"],
    relatedPaperIds: ["paper-004"],
    relatedToolIds: [],
    learningPath: [
      "先了解常见PTM类型及其生物学功能",
      "再学习质谱如何检测PTM：质量偏移、富集策略",
      "然后了解计算方法如何预测PTM位点",
      "最后探索PTM在疾病中的作用和作为药物靶点的潜力",
    ],
    commonMisunderstandings: [
      "误区：一个蛋白质只有一种PTM → 实际：同一蛋白质可被多种PTM组合修饰，形成'PTM编码'",
      "误区：PTM总是改变蛋白质功能 → 实际：有些PTM是中性或仅仅是降解信号",
    ],
    demoUse:
      "展示一个蛋白质3D结构，标注已知的磷酸化、乙酰化和泛素化位点，讨论每种PTM可能对蛋白质功能产生的影响。",
  },
  {
    id: "conc-011",
    name: "LNP 递送",
    nameEn: "Lipid Nanoparticle (LNP) Delivery",
    category: "前沿技术",
    shortDefinition:
      "利用脂质纳米颗粒包裹和保护核酸药物（mRNA、siRNA等），实现体内高效递送的技术平台。",
    longExplanation:
      "脂质纳米颗粒（LNP）是mRNA疫苗和核酸药物成功的关键递送技术。LNP通常由四种脂质组分组成：①可电离阳离子脂质——在低pH时带正电以包裹带负电的核酸，在生理pH时为中性以减少毒性；②辅助脂质——促进膜的稳定性和融合；③胆固醇——增强LNP结构稳定性和膜融合能力；④PEG化脂质——提供空间稳定性和延长循环时间。LNP-mRNA药物在体内的命运决定了疗效：经静脉注射后，LNP主要通过ApoE蛋白吸附被肝细胞识别和摄取（这是肝脏偏向性的主要原因）。理解LNP的结构-活性关系和体内分布规律是实现器官选择性递送的基础。近期的研究已通过高通量筛选和AI优化指导脂质设计，实现了肺、脾和骨髓的靶向递送，使mRNA药物从'肝脏优先'进化为'器官定制'。",
    prerequisites: ["脂质化学基础", "纳米药物递送原理", "mRNA结构与功能"],
    relatedConceptIds: ["conc-012"],
    relatedPaperIds: ["paper-007", "paper-011"],
    relatedToolIds: [],
    learningPath: [
      "先学习LNP的四种核心组分及其各自功能",
      "再了解LNP-mRNA药物的体内过程（吸收、分布、代谢、排泄）",
      "然后理解为什么LNP天然偏向肝脏",
      "最后探索AI如何辅助设计组织特异性LNP",
    ],
    commonMisunderstandings: [
      "误区：所有LNP都是一样的 → 实际：脂质组成比例和化学结构决定了LNP的组织分布和递送效率",
      "误区：PEG化脂质越多越好 → 实际：过量的PEG可能引发抗PEG抗体反应并降低转染效率",
    ],
    demoUse:
      "展示LNP的截面结构图，标注四种脂质组分的位置和功能，以及在体内不同器官的分布热图。",
  },
  {
    id: "conc-012",
    name: "mRNA 治疗",
    nameEn: "mRNA Therapeutics",
    category: "应用方向",
    shortDefinition:
      "利用体外转录合成的mRNA在体内表达治疗性蛋白质，实现疾病治疗的新型药物模式。",
    longExplanation:
      "mRNA治疗是继小分子药物和蛋白质药物之后的第三波药物创新浪潮。其核心原理是将编码治疗性蛋白质的mRNA递送到目标细胞中，利用细胞的翻译机器在体内生产所需的蛋白质。相比传统药物，mRNA治疗具有独特优势：①平台性——改变编码序列即可生产针对不同疾病的mRNA药物，制造流程不变；②速度性——从基因序列确定到mRNA药物生产可短至数周；③胞内靶点可达性——mRNA表达的蛋白质可在胞内发挥功能，克服了单克隆抗体只能靶向胞外/膜蛋白的局限。目前mRNA治疗的前沿应用包括：①传染病疫苗（COVID-19 mRNA疫苗是标志性成功）；②癌症免疫治疗——编码肿瘤抗原或免疫调节因子（如paper-008中的IRF8/NIK）；③蛋白质替代治疗——编码缺失或缺陷的酶；④基因编辑——编码CRISPR组分进行体内基因编辑。LNP递送、mRNA序列优化和免疫原性控制是三大关键技术支柱。",
    prerequisites: ["mRNA结构与翻译机制", "免疫学基础", "药物递送原理"],
    relatedConceptIds: ["conc-011"],
    relatedPaperIds: ["paper-007", "paper-008", "paper-011"],
    relatedToolIds: [],
    learningPath: [
      "先理解mRNA药物的设计要素：Cap、UTR、CDS、PolyA",
      "再学习mRNA药物的生产工艺：体外转录、纯化、LNP包封",
      "然后了解不同治疗应用场景的mRNA设计要求",
      "最后讨论mRNA药物的安全性挑战和监管考量",
    ],
    commonMisunderstandings: [
      "误区：mRNA可以整合到基因组中 → 实际：mRNA不进入细胞核，无基因组整合风险",
      "误区：mRNA治疗只有疫苗应用 → 实际：mRNA在癌症、遗传病、再生医学中都有广泛的应用前景",
    ],
    demoUse:
      "展示一个mRNA药物的完整生命周期：从序列设计→体外转录→LNP包封→体内递送→蛋白质表达→治疗效果。",
  },
  {
    id: "conc-013",
    name: "TCR 特异性",
    nameEn: "TCR Specificity",
    category: "基础概念",
    shortDefinition:
      "T细胞受体（TCR）识别特定抗原肽-MHC复合物的精确分子配对关系。",
    longExplanation:
      "TCR特异性是适应性免疫的核心概念。每个T细胞表面表达一种独特的TCR，每个TCR由α链和β链（或γδ链）组成，其中互补决定区3（CDR3）是识别抗原肽-MHC复合物（pMHC）的关键区域。TCR特异性的复杂性来源于：①TCR多样性——通过V(D)J重组，理论上的TCR多样性可达10^15-10^20种；②MHC多态性——人类HLA基因高度多态，不同HLA等位基因呈递不同的肽段集合；③肽段空间——理论上9-15mer肽段序列的数量极为庞大。这种三维复杂性（TCR × pMHC × HLA）使得高通量解析TCR特异性成为极具挑战的生物学问题。深度学习方法通过学习大规模TCR-pMHC配对数据中的序列模式，正在逐步破解TCR特异性密码，这对于TCR-T细胞治疗和个性化的免疫监测具有深远意义。",
    prerequisites: ["T细胞发育与活化", "MHC分子结构与抗原呈递", "免疫组库概念"],
    relatedConceptIds: ["conc-014"],
    relatedPaperIds: ["paper-009"],
    relatedToolIds: [],
    learningPath: [
      "先学习TCR的结构和VDJ重组产生多样性的机制",
      "再理解TCR如何识别pMHC复合物：结构互补和亲和力",
      "然后了解TCR组库测序和分析方法",
      "最后探索AI预测TCR特异性的前沿方法",
    ],
    commonMisunderstandings: [
      "误区：TCR和抗体是一样的 → 实际：TCR识别的是加工后的肽段-MHC复合物，而B细胞受体/抗体直接识别天然抗原",
      "误区：一个TCR只识别一种pMHC → 实际：TCR具有交叉反应性，一个TCR可识别多种肽段",
    ],
    demoUse:
      "展示TCR-pMHC复合物的3D共晶结构，标注CDR3环与抗原肽的接触界面，让学生理解特异性识别的分子基础。",
  },
  {
    id: "conc-014",
    name: "抗原发现",
    nameEn: "Antigen Discovery",
    category: "应用方向",
    shortDefinition:
      "鉴定能够被免疫系统（T细胞或B细胞）特异性识别的抗原分子，是疫苗设计和免疫治疗的基石。",
    longExplanation:
      "抗原发现是连接基础免疫学与临床应用的桥梁。T细胞抗原发现的核心挑战在于：从肿瘤或病原体中成千上万的蛋白质序列中，找出哪些肽段可以被特定HLA等位基因呈递并被TCR识别。传统方法（如串联微肽色谱-质谱联用、MHC多聚体染色）通量低、耗时长。现代抗原发现策略整合了多维度信息：①计算预测——使用NetMHCpan等工具预测肽段-MHC结合亲和力；②质谱免疫肽组学——直接鉴定细胞表面MHC呈递的肽段；③TCR特异性预测——利用AI模型（如paper-009）预测TCR-抗原配对关系；④单细胞组学——分析肿瘤浸润T细胞的TCR克隆型和功能状态。这些方法的整合使得从'靶点猜测'到'证据驱动的抗原识别'成为可能，极大加速了个性化癌症疫苗和TCR-T细胞治疗靶点的发现。",
    prerequisites: ["抗原呈递通路", "MHC-I/MHC-II生物学", "免疫检测技术基础"],
    relatedConceptIds: ["conc-013"],
    relatedPaperIds: ["paper-008", "paper-009"],
    relatedToolIds: [],
    learningPath: [
      "先理解抗原的定义和分类：外源性、内源性、肿瘤特异性、肿瘤相关",
      "再学习MHC呈递和TCR识别的分子机制",
      "然后掌握计算抗原预测工具的使用",
      "最后通过案例学习抗原发现在个性化医疗中的应用流程",
    ],
    commonMisunderstandings: [
      "误区：预测的抗原肽一定是真实的T细胞靶点 → 实际：结合预测是必要条件而非充分条件，需要功能性验证",
      "误区：一个肿瘤只有一个优势抗原 → 实际：肿瘤的抗原呈递是高度异质性的",
    ],
    demoUse:
      "展示从患者肿瘤测序数据到个性化抗原疫苗设计的完整计算流程，让学生看到抗原发现的全景。",
  },
  {
    id: "conc-015",
    name: "知识图谱扰动预测",
    nameEn: "Knowledge Graph Perturbation Prediction",
    category: "AI模型",
    shortDefinition:
      "利用生物医学知识图谱和图神经网络预测基因扰动对细胞转录组的全局影响。",
    longExplanation:
      "知识图谱扰动预测将系统生物学与图机器学习融合，解决一个核心问题：如果给细胞一个扰动（敲除某个基因、加入某种药物），转录组会发生什么变化？传统的基因表达预测模型仅依赖表达数据的共变模式来推断基因间的关系，但它们缺少机制层面的约束。知识图谱扰动预测（如TxPert）的创新在于：①整合多源知识——将基因-疾病关联、药物-靶点相互作用、蛋白质-蛋白质相互作用、信号通路等不同来源的生物学知识整合成统一的知识图谱；②图神经网络编码——使用GNN在知识图谱上传播信号，学习每个节点的结构化表征；③因果推理——通过知识图谱中的方向性关系（如'激活'、'抑制'）引入因果约束，减少虚假关联。TxPert证明了有结构的知识比纯数据更强大，特别是在训练数据稀疏的场景下。这类方法对于药物重定位（预测现有药物对未知靶点的效果）和组合治疗设计尤为有价值。",
    prerequisites: ["图论基础概念", "基因表达调控网络", "机器学习中的图表示学习"],
    relatedConceptIds: ["conc-001", "conc-002"],
    relatedPaperIds: ["paper-012"],
    relatedToolIds: [],
    learningPath: [
      "先了解什么是知识图谱以及生物医学知识图谱的常见来源",
      "再学习图神经网络如何表示和推理关系数据",
      "然后理解为什么引入知识图谱能改进纯数据驱动方法",
      "最后实践：用知识图谱解释一个药物的多靶点效应",
    ],
    commonMisunderstandings: [
      "误区：知识图谱越大越好 → 实际：低质量的关系会引入噪声，降低预测准确度",
      "误区：图神经网络自动学会了因果推理 → 实际：GNN学到的主要是关联模式，因果关系需要额外约束",
    ],
    demoUse:
      "交互式展示：选择一个基因，在知识图谱中追踪其扰动信号如何通过多层生物关系（PPI→通路→转录因子→靶基因）传播，最终形成转录组变化的预测。",
  },
];

// ============================================================
// 工具映射
// ============================================================

export const knowledgeTools: KnowledgeTool[] = [
  {
    id: "tool-001",
    name: "序列分析工具",
    nameEn: "Sequence Analysis Tool",
    description: "DNA/RNA序列分析、ORF查找、引物设计、酶切位点检测",
    category: "序列分析",
    relatedConceptIds: ["conc-004", "conc-006"],
    relatedPaperIds: ["paper-003"],
  },
  {
    id: "tool-002",
    name: "蛋白结构查看器",
    nameEn: "Protein Structure Viewer",
    description: "3D蛋白质结构可视化、结构域标注、突变效应预测",
    category: "结构生物学",
    relatedConceptIds: ["conc-005"],
    relatedPaperIds: ["paper-002"],
  },
  {
    id: "tool-003",
    name: "质粒图谱查看器",
    nameEn: "Plasmid Map Viewer",
    description: "质粒图谱可视化、特征注释、克隆策略设计",
    category: "分子克隆",
    relatedConceptIds: ["conc-004"],
    relatedPaperIds: [],
  },
  {
    id: "tool-004",
    name: "通路知识图谱",
    nameEn: "Pathway Knowledge Graph",
    description: "信号通路可视化、通路富集分析、节点功能解释",
    category: "系统生物学",
    relatedConceptIds: ["conc-015"],
    relatedPaperIds: ["paper-012"],
  },
];

// ============================================================
// 8 个科研实战任务
// ============================================================

export const knowledgeResearchTasks: KnowledgeResearchTask[] = [
  {
    id: "task-001",
    title: "Prime Editing 效率优化：从 RT 改造到 pegRNA 稳定元件",
    difficulty: "挑战",
    scenario:
      "你在一个基因编辑实验室，导师给你一个编辑效率始终低于10%的靶点，要求你从逆转录酶改造和pegRNA稳定元件两个维度设计优化方案。",
    inputKnowledge:
      "Prime editing的工作原理、pegRNA结构、逆转录酶催化机制、蛋白质工程基本策略",
    expectedOutput:
      "一份完整的优化方案报告，包括：pegRNA重新设计方案（含稳定元件选择）、推荐的RT变体选择、预期效率提升的估算、实验验证流程设计",
    steps: [
      "用pegRNA设计工具分析当前pegRNA的结构缺陷（GC含量、二级结构、引物结合位点长度）",
      "从paper-003中选取2-3种验证过的RNA稳定元件，评估其适配性",
      "从paper-002中了解改造型RT变体的性能数据，选择最适合你靶点的变体",
      "设计对照实验：①原始pegRNA+野生型RT；②优化pegRNA+野生型RT；③原始pegRNA+改造RT；④优化pegRNA+改造RT",
      "估算每种组合的预期编辑效率，写出假设依据",
      "撰写完整的实验验证方案：细胞系选择、转染方法、效率检测时间点和检测方法（Sanger测序 vs NGS）",
    ],
    relatedPaperIds: ["paper-002", "paper-003"],
    relatedConceptIds: ["conc-004", "conc-005", "conc-006"],
    evaluationRubric: [
      "pegRNA设计是否合理（考虑了GC含量、二级结构、PBS和RTT长度）",
      "RT变体选择的依据是否充分（引用了paper-002的实验数据）",
      "实验设计是否包含正确的对照组",
      "预期效率估算是否有合理的推理链条",
      "方案的可操作性：是否可在4周内完成",
    ],
  },
  {
    id: "task-002",
    title: "CRISPR-Cas12 RNA 靶向：机制理解与工具设计",
    difficulty: "进阶",
    scenario:
      "你要设计一个基于Cas12a的RNA检测探针，用于快速检测细胞中特定mRNA的表达水平。你需要理解Cas12a的RNA靶向机制，并选择合适的向导系统。",
    inputKnowledge:
      "CRISPR-Cas12a的结构与催化机制、DNA引导 vs RNA引导的区别、核酸检测中的信号放大策略",
    expectedOutput:
      "一份工具设计方案：包括选择的Cas12a变体及其理由、向导序列设计（DNA引导还是RNA引导）、检测原理流程图、预期灵敏度和特异性分析",
    steps: [
      "比较Cas12和Cas12a在RNA靶向方面的异同（paper-005和paper-006）",
      "决定使用DNA引导还是RNA引导：列出各方案的优缺点",
      "选择目标mRNA：选一个在特定细胞类型中高表达的标记基因",
      "设计向导序列：考虑靶序列选择、引导链长度和特异性评估",
      "设计信号读出方案：利用Cas12a的附属切割活性，选择荧光报告系统",
      "评估潜在脱靶风险：BLAST搜索向导序列的同源序列",
    ],
    relatedPaperIds: ["paper-005", "paper-006"],
    relatedConceptIds: ["conc-007", "conc-008"],
    evaluationRubric: [
      "对Cas12a RNA靶向机制的理解准确",
      "引导策略（DNA vs RNA）的选择依据充分",
      "靶基因和向导序列的选择合理",
      "信号读出方案可行",
      "脱靶风险评估完整",
    ],
  },
  {
    id: "task-003",
    title: "单细胞基础模型解释性：基因重要性评分实验",
    difficulty: "进阶",
    scenario:
      "你拿到了一个已发表的单细胞基础模型，导师让你评估这个模型能否自动发现对某种细胞类型重要的基因。你需要设计一个系统性的基准测试方案。",
    inputKnowledge:
      "单细胞基础模型的架构和输出格式、基因重要性的生物学定义、已知的必需基因数据库（如DepMap）",
    expectedOutput:
      "一份评估报告：包括基准数据集构建方案、基因重要性提取方法、与金标准（DepMap、CRISPR筛选数据）的对比分析、模型在不同细胞类型中的表现差异",
    steps: [
      "选择一个公开的单细胞基础模型（如scGPT、Geneformer或scFoundation）",
      "确定评估策略：从模型的注意力权重或特征归因中提取基因重要性评分",
      "从DepMap等数据库构建金标准：选择3种以上细胞系的必需基因和非必需基因列表",
      "设计评估指标：AUROC、精确率-召回率曲线、top-k重叠率",
      "执行评估并分析结果：哪些类型的基因被模型高估了？哪些被低估了？",
      "讨论模型解释性方法的局限性：注意力权重真的反映基因重要性吗？",
    ],
    relatedPaperIds: ["paper-001", "paper-010"],
    relatedConceptIds: ["conc-001", "conc-002", "conc-003"],
    evaluationRubric: [
      "评估策略的技术合理性",
      "金标准数据集构建的全面性",
      "评估指标的恰当选择和使用",
      "对结果的批判性分析（不只是报数字）",
      "对解释性方法局限性的深入讨论",
    ],
  },
  {
    id: "task-004",
    title: "TxPert 扰动预测：知识图谱如何辅助转录组预测",
    difficulty: "挑战",
    scenario:
      "你是一家AI药物发现初创公司的计算生物学家，需要评估TxPert模型对你们正在开发的候选药物靶点的扰动效应预测是否可靠。",
    inputKnowledge:
      "知识图谱的基本概念、图神经网络基础、转录组学数据分析、药物靶点发现流程",
    expectedOutput:
      "一份技术评估报告：包括靶点在知识图谱中的邻居分析、TxPert预测的扰动效应解读、与公开表达数据（如LINCS L1000）的一致性检验、模型预测的置信度评估",
    steps: [
      "选择一个你感兴趣的药物靶点（如某个激酶或转录因子）",
      "在生物医学知识图谱中分析该靶点的1-hop和2-hop邻居节点",
      "模拟靶点抑制：预测下游基因的表达变化方向（上调/下调）和幅度",
      "在LINCS L1000或Connectivity Map中查找该靶点扰动的实际表达数据",
      "对比预测结果与实际数据的吻合度：哪些预测准确？哪些预测错误？分析原因",
      "讨论知识图谱不完整性对预测的影响：缺少哪些关系类型可能导致预测偏差？",
    ],
    relatedPaperIds: ["paper-012"],
    relatedConceptIds: ["conc-015", "conc-001", "conc-002"],
    evaluationRubric: [
      "知识图谱邻居分析的系统性",
      "预测结果解读的生物学合理性",
      "与实际数据对比的方法论严谨性",
      "对预测错误的根因分析深度",
      "对方法局限性的反思（不仅仅是复述论文结论）",
    ],
  },
  {
    id: "task-005",
    title: "LNP mRNA 递送优化：多目标 AI 模型与组织选择性",
    difficulty: "进阶",
    scenario:
      "你需要设计一个新的LNP配方，用于将治疗性mRNA递送到肺部（而非肝脏）。利用paper-007中的多目标优化思路，设计筛选策略。",
    inputKnowledge:
      "LNP的组成与结构、体内分布的影响因素、多目标优化的基本概念、高通量筛选原理",
    expectedOutput:
      "一份LNP设计策略书：包括目标产品概况（TPP）、关键质量属性（CQA）定义、脂质文库设计思路、体外和体内筛选级联方案、预期成功标准",
    steps: [
      "定义目标产品概况：肺部靶向mRNA-LNP的目标适应症、给药途径、剂量要求",
      "确定需要同时优化的参数：递送效率、肺/肝比、安全性（细胞毒性、免疫原性）、稳定性",
      "设计脂质组分的搜索空间：可电离脂质的头基、连接链和疏水尾的化学多样性范围",
      "设计筛选级联：第一步体外筛选（细胞摄取）→第二步体内器官分布（荧光成像）→第三步功能性mRNA表达验证",
      "制定成功标准：肺/肝递送比>5、目标蛋白表达水平>XXX pg/mg组织",
      "讨论多目标优化中的权衡（trade-off）：如果肺靶向和递送效率之间存在冲突，如何决策？",
    ],
    relatedPaperIds: ["paper-007"],
    relatedConceptIds: ["conc-011", "conc-012"],
    evaluationRubric: [
      "TPP和CQA的定义是否完整和合理",
      "搜索空间设计是否化学上可行",
      "筛选级联的逻辑顺序是否合理（从高通量到高内涵）",
      "对多目标优化中的权衡有深入思考",
      "成功标准的具体化和可测量性",
    ],
  },
  {
    id: "task-006",
    title: "TCR 特异性识别：抗原发现流程",
    difficulty: "入门",
    scenario:
      "你拿到了一份来自肿瘤浸润T细胞的TCR测序数据，需要预测这些TCR可能识别哪些肿瘤抗原，并设计验证实验。",
    inputKnowledge:
      "TCR结构与多样性、MHC-抗原肽呈递、TCR组库测序数据分析、抗原预测工具",
    expectedOutput:
      "一份TCR-抗原分析报告：包括优势TCR克隆型鉴定、候选抗原肽预测（使用计算工具）、优先级排序、实验验证方案",
    steps: [
      "从TCR测序数据中鉴定出频率最高的克隆型（top 10）",
      "提取每个优势克隆的CDR3α和CDR3β序列",
      "使用NetMHCpan预测肿瘤中高表达蛋白的候选抗原肽-MHC结合",
      "整合公共TCR-抗原数据库（如VDJdb），检查是否有已知的配对信息",
      "参考paper-009的深度学习方法思路，讨论AI预测可能如何改进你的结果",
      "设计实验验证方案：MHC多聚体染色或T细胞功能验证（IFN-γ ELISpot）",
    ],
    relatedPaperIds: ["paper-009"],
    relatedConceptIds: ["conc-013", "conc-014"],
    evaluationRubric: [
      "TCR克隆型选择的合理性",
      "抗原肽预测流程的完整性",
      "对计算预测局限性的认识（不是所有预测都是真实的）",
      "实验验证方案的技术可行性",
      "对AI方法改进潜力的独立见解",
    ],
  },
  {
    id: "task-007",
    title: "AI 肽段测序：开放 PTM 发现",
    difficulty: "进阶",
    scenario:
      "你分析了某肿瘤细胞系的免疫肽组学数据，发现多个谱图中存在无法用标准数据库解释的高质量肽段谱图。你需要用de novo测序方法鉴定这些'未知'肽段，并判断它们是否含有翻译后修饰。",
    inputKnowledge:
      "质谱数据分析基础、肽段鉴定原理、翻译后修饰类型、de novo测序概念",
    expectedOutput:
      "一份未知肽段鉴定报告：包括de novo测序结果、候选PTM类型判断、验证策略、如果鉴定为新抗原肽的后续研究计划",
    steps: [
      "选取3-5张高质量但数据库搜索未匹配的谱图",
      "使用公开的de novo测序工具（如pNovo、DeepNovo或Casanovo）获取候选序列",
      "对比候选序列与已知蛋白质数据库：是完全新序列还是含有突变/PTM的已知序列？",
      "如果质量偏移提示PTM：根据质量差值和序列上下文，推测可能的PTM类型",
      "参考paper-004的方法，讨论零样本PTM发现如何改进你的分析",
      "设计验证实验：合成候选肽段，比较合成肽和天然肽的谱图和保留时间",
    ],
    relatedPaperIds: ["paper-004"],
    relatedConceptIds: ["conc-009", "conc-010"],
    evaluationRubric: [
      "对未匹配谱图的质量评估",
      "de novo测序结果解读的准确性",
      "PTM类型推测的化学合理性",
      "验证策略的严谨性",
      "对未来方向的独立思考",
    ],
  },
  {
    id: "task-008",
    title: "植物单细胞筛选：功能基因组学加速",
    difficulty: "入门",
    scenario:
      "你刚加入一个植物功能基因组学课题组，导师希望你对200个候选基因进行功能初筛，找出哪些与干旱耐受相关。利用单细胞筛选平台的思路设计实验方案。",
    inputKnowledge:
      "植物分子生物学基础、单细胞RNA测序原理、功能基因组学概念、CRISPR筛选原理",
    expectedOutput:
      "一份功能筛选方案：包括细胞/组织选择、扰动策略（CRISPR还是过表达）、筛选指标、数据分析流程、候选基因优先级排序方法",
    steps: [
      "选择植物材料：拟南芥叶肉原生质体（为什么选这个？）",
      "选择扰动方式：CRISPR敲除还是过表达？（比较两种策略的优缺点）",
      "设计筛选表型：用哪些指标来评估干旱耐受？（如ABA响应、ROS水平、气孔导度）",
      "参考paper-010的方法：如何整合单细胞转录组数据与扰动表型",
      "设计数据分析流程：如何从200个基因中选出top 10候选基因？",
      "设计验证实验：如何确认top候选基因确实与干旱耐受相关？",
    ],
    relatedPaperIds: ["paper-010"],
    relatedConceptIds: ["conc-001", "conc-003"],
    evaluationRubric: [
      "植物材料选择的合理性",
      "扰动策略选择的论据充分性",
      "筛选表型设计的生物学相关性",
      "数据分析流程的逻辑性",
      "验证实验的独立性和严谨性",
    ],
  },
];

// ============================================================
// 工具函数：按 ID 查找
// ============================================================

export function getPaperById(id: string): KnowledgePaper | undefined {
  return knowledgePapers.find((p) => p.id === id);
}

export function getConceptById(id: string): KnowledgeConcept | undefined {
  return knowledgeConcepts.find((c) => c.id === id);
}

export function getTaskById(id: string): KnowledgeResearchTask | undefined {
  return knowledgeResearchTasks.find((t) => t.id === id);
}

export function getToolById(id: string): KnowledgeTool | undefined {
  return knowledgeTools.find((t) => t.id === id);
}
