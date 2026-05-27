export interface IndustryCase {
  id: string;
  title: string;
  subtitle: string;
  relatedKnowledgePoints: string[];
  industryDirection: string;
  coreProblem: string;
  researchFoundation: string;
  applicationValue: string;
  requiredAbilities: string[];
  recommendedKeywords: string[];
  linkedResearchTask: string;
  evidenceLevel: "高" | "中" | "发展中";
  sourceType: "学术文献" | "产业报告" | "专利文献" | "临床试验";
}

export interface IndustryAnswer {
  query: string;
  relatedKnowledgePoints: string[];
  researchFrontiers: string[];
  industryApplications: string[];
  abilityDirections: string[];
  recommendedKeywords: string[];
  researchTasks: string[];
}

export interface AbilityMapping {
  id: string;
  name: string;
  description: string;
  progress: number;
}

export interface IndustryDirection {
  id: string;
  name: string;
  description: string;
}

export const industryCases: IndustryCase[] = [
  {
    id: "case-001",
    title: "细胞凋亡与抗肿瘤药物研发",
    subtitle: "从线粒体凋亡通路到靶向抗癌药物",
    relatedKnowledgePoints: ["细胞凋亡", "caspase家族", "线粒体途径", "Bcl-2家族", "p53信号通路"],
    industryDirection: "药物研发",
    coreProblem: "如何基于凋亡信号通路开发选择性诱导肿瘤细胞凋亡的小分子药物",
    researchFoundation: "线粒体外膜通透化（MOMP）机制研究揭示Bcl-2家族蛋白在凋亡调控中的核心作用，为BH3模拟物设计提供结构基础",
    applicationValue: "Venetoclax等BCL-2抑制剂已获批用于慢性淋巴细胞白血病治疗，年销售额超20亿美元",
    requiredAbilities: ["机制解释能力", "实验设计能力", "数据分析能力"],
    recommendedKeywords: ["apoptosis", "BH3 mimetics", "mitochondrial priming", "drug resistance", "combination therapy"],
    linkedResearchTask: "BH3 profiling实验设计",
    evidenceLevel: "高",
    sourceType: "学术文献",
  },
  {
    id: "case-002",
    title: "CRISPR基因编辑与细胞治疗",
    subtitle: "从细菌免疫系统到精准基因治疗",
    relatedKnowledgePoints: ["CRISPR-Cas9", "DNA修复机制", "基因表达调控", "sgRNA设计", "脱靶效应"],
    industryDirection: "细胞治疗",
    coreProblem: "如何利用CRISPR技术实现安全高效的体外基因编辑T细胞用于肿瘤免疫治疗",
    researchFoundation: "CRISPR-Cas9系统的分子机制阐明，包括PAM识别、DNA切割和HDR/NHEJ修复通路选择",
    applicationValue: "CRISPR编辑的CAR-T细胞已进入临床试验，CTX001治疗镰刀细胞贫血获FDA批准",
    requiredAbilities: ["文献检索能力", "实验设计能力", "证据判断能力"],
    recommendedKeywords: ["CRISPR-Cas9", "CAR-T", "gene editing", "off-target", "sgRNA design", "HDR"],
    linkedResearchTask: "sgRNA靶点设计与脱靶分析",
    evidenceLevel: "高",
    sourceType: "临床试验",
  },
  {
    id: "case-003",
    title: "蛋白质结构设计与酶改造",
    subtitle: "从蛋白质折叠原理到工业酶定制",
    relatedKnowledgePoints: ["蛋白质结构", "酶动力学", "定向进化", "理性设计", "分子动力学模拟"],
    industryDirection: "酶工程",
    coreProblem: "如何结合计算设计和定向进化改造工业用酶的热稳定性和底物特异性",
    researchFoundation: "蛋白质折叠能量景观理论和过渡态稳定化原理为酶改造提供了理论基础；AlphaFold2等结构预测工具显著加速设计流程",
    applicationValue: "工程化脂肪酶在洗涤剂、生物柴油、手性药物合成等领域广泛应用，全球工业酶市场规模超60亿美元",
    requiredAbilities: ["机制解释能力", "数据分析能力", "产业迁移能力"],
    recommendedKeywords: ["protein engineering", "directed evolution", "enzyme kinetics", "thermostability", "AlphaFold"],
    linkedResearchTask: "酶热稳定性突变体设计与活性测定",
    evidenceLevel: "高",
    sourceType: "专利文献",
  },
  {
    id: "case-004",
    title: "合成生物学与高价值化合物生产",
    subtitle: "从代谢通路设计到生物制造工厂",
    relatedKnowledgePoints: ["代谢工程", "合成生物学", "基因回路设计", "底盘细胞", "发酵优化"],
    industryDirection: "合成生物制造",
    coreProblem: "如何设计和优化微生物细胞工厂实现高价值天然产物的异源高效合成",
    researchFoundation: "合成生物学DBTL循环（设计-构建-测试-学习）为代谢通路工程提供了系统方法论；基因组规模代谢模型（GEM）指导靶点预测",
    applicationValue: "青蒿素前体在酵母中的合成将成本降低约90%；大麻素、人参皂苷等多种天然产物已实现微生物合成",
    requiredAbilities: ["实验设计能力", "数据分析能力", "产业迁移能力"],
    recommendedKeywords: ["metabolic engineering", "synthetic biology", "DBTL cycle", "genome-scale model", "fermentation"],
    linkedResearchTask: "代谢通路瓶颈分析与基因敲除靶点预测",
    evidenceLevel: "高",
    sourceType: "产业报告",
  },
  {
    id: "case-005",
    title: "分子诊断与肿瘤标志物检测",
    subtitle: "从分子识别原理到液体活检技术",
    relatedKnowledgePoints: ["分子杂交", "PCR技术", "NGS测序", "生物标志物", "液体活检"],
    industryDirection: "分子诊断",
    coreProblem: "如何开发高灵敏度液体活检技术实现肿瘤早期筛查和治疗监测",
    researchFoundation: "ctDNA甲基化模式和突变谱系研究为癌症早筛提供了分子靶标；数字PCR和NGS技术大幅提升检测灵敏度",
    applicationValue: "Guardant360等液体活检产品已获FDA批准；癌症早筛市场预计2030年达200亿美元",
    requiredAbilities: ["文献检索能力", "证据判断能力", "数据分析能力"],
    recommendedKeywords: ["liquid biopsy", "ctDNA", "methylation", "NGS", "digital PCR", "biomarker"],
    linkedResearchTask: "肿瘤突变负荷（TMB）计算方法评估",
    evidenceLevel: "高",
    sourceType: "临床试验",
  },
  {
    id: "case-006",
    title: "疫苗研发与免疫应答机制",
    subtitle: "从抗原呈递原理到新型疫苗设计",
    relatedKnowledgePoints: ["免疫应答", "抗原呈递", "B细胞活化", "免疫记忆", "佐剂机制"],
    industryDirection: "疫苗研发",
    coreProblem: "如何基于结构免疫学设计能诱导广谱中和抗体的疫苗抗原",
    researchFoundation: "病毒表面蛋白结构解析和B细胞谱系追踪为抗原设计提供了分子蓝图；mRNA递送技术突破加速疫苗研发周期",
    applicationValue: "基于结构设计的RSV疫苗和新冠变异株疫苗已获批上市；mRNA疫苗平台使研发周期从数年缩短至数月",
    requiredAbilities: ["机制解释能力", "文献检索能力", "证据判断能力"],
    recommendedKeywords: ["vaccine design", "neutralizing antibody", "antigen presentation", "mRNA vaccine", "immunogen"],
    linkedResearchTask: "抗原表位预测与免疫原性评估",
    evidenceLevel: "高",
    sourceType: "学术文献",
  },
  {
    id: "case-007",
    title: "发酵工程与工业菌株优化",
    subtitle: "从微生物生理学到工业规模生产",
    relatedKnowledgePoints: ["发酵工程", "微生物生理", "过程控制", "代谢流分析", "高通量筛选"],
    industryDirection: "发酵工程",
    coreProblem: "如何结合适应性进化与代谢工程构建高产、高耐受性工业发酵菌株",
    researchFoundation: "ALE（适应性实验室进化）与合成生物学工具结合可从基因组尺度优化菌株；在线代谢流分析实现发酵过程精准控制",
    applicationValue: "优化后的氨基酸生产菌株产率提升3-5倍；工业发酵在全球氨基酸（年产量>800万吨）和有机酸生产中占主导地位",
    requiredAbilities: ["实验设计能力", "数据分析能力", "产业迁移能力"],
    recommendedKeywords: ["fermentation", "strain engineering", "ALE", "metabolic flux", "process control", "scale-up"],
    linkedResearchTask: "发酵过程参数优化与代谢流分析",
    evidenceLevel: "高",
    sourceType: "产业报告",
  },
  {
    id: "case-008",
    title: "质粒载体设计与基因表达调控",
    subtitle: "从分子克隆原理到重组蛋白表达系统",
    relatedKnowledgePoints: ["质粒结构", "启动子工程", "操纵子调控", "密码子优化", "蛋白分泌"],
    industryDirection: "生物制药",
    coreProblem: "如何设计高效表达载体实现重组蛋白在特定宿主系统中的高产量可溶性表达",
    researchFoundation: "启动子强度和调控机制的定量表征为表达载体理性设计提供了参数；密码子偏好性和mRNA二级结构影响翻译效率",
    applicationValue: "优化的表达系统使重组胰岛素、生长激素、抗体片段等生物药的工业化生产成本大幅降低",
    requiredAbilities: ["机制解释能力", "实验设计能力", "产业迁移能力"],
    recommendedKeywords: ["plasmid design", "promoter engineering", "codon optimization", "recombinant protein", "expression system"],
    linkedResearchTask: "表达载体构建与蛋白表达条件优化",
    evidenceLevel: "高",
    sourceType: "专利文献",
  },
];

export const industryDirections: IndustryDirection[] = [
  { id: "drug-rnd", name: "药物研发", description: "靶点发现、先导化合物优化到临床前研究" },
  { id: "cell-therapy", name: "细胞治疗", description: "CAR-T、干细胞治疗与基因修饰细胞" },
  { id: "enzyme-eng", name: "酶工程", description: "工业酶设计、定向进化与催化优化" },
  { id: "synbio-mfg", name: "合成生物制造", description: "代谢通路设计与高价值产物生物合成" },
  { id: "mol-dx", name: "分子诊断", description: "液体活检、NGS检测与精准诊断" },
  { id: "vaccine-rnd", name: "疫苗研发", description: "抗原设计、递送系统与免疫评估" },
  { id: "ferment-eng", name: "发酵工程", description: "工业发酵过程优化与放大" },
  { id: "biopharma", name: "生物制药", description: "重组蛋白、抗体药物与生物类似药" },
];

export const abilityMappings: AbilityMapping[] = [
  { id: "lit-search", name: "文献检索能力", description: "高效检索PubMed、Web of Science等数据库，筛选高质量文献证据", progress: 75 },
  { id: "mech-explain", name: "机制解释能力", description: "从分子层面解释生物学现象，建立因果机制链条", progress: 68 },
  { id: "exp-design", name: "实验设计能力", description: "设计合理的对照实验，选择适当的检测方法和技术路线", progress: 72 },
  { id: "data-analysis", name: "数据分析能力", description: "处理高通量数据，进行统计分析和可视化呈现", progress: 65 },
  { id: "evidence-judge", name: "证据判断能力", description: "评估文献证据等级，识别研究局限性与偏倚风险", progress: 70 },
  { id: "industry-transfer", name: "产业迁移能力", description: "将基础研究发现转化为产业应用场景，理解技术转化路径", progress: 60 },
];

export const knowledgeTripleMap = {
  basic: [
    "细胞凋亡与caspase家族",
    "线粒体途径与信号转导",
    "基因表达调控",
    "蛋白质结构与酶动力学",
    "代谢通路与免疫应答",
  ],
  frontier: [
    "肿瘤耐药与免疫检查点治疗",
    "基因编辑精准修复",
    "酶定向进化与合成基因回路",
    "液体活检与mRNA疫苗平台",
    "蛋白质理性设计与单细胞组学",
  ],
  application: [
    "抗肿瘤药物筛选与CAR-T制备",
    "工业酶制剂与高价值产物合成",
    "肿瘤早筛试剂盒开发",
    "广谱疫苗与发酵工艺放大",
    "分子诊断POCT与基因治疗",
  ],
};

const quickTags = [
  "细胞凋亡",
  "CRISPR",
  "蛋白质工程",
  "合成生物学",
  "分子诊断",
  "细胞治疗",
  "酶工程",
];

function buildMockAnswer(query: string): IndustryAnswer {
  const lower = query.toLowerCase();

  if (lower.includes("凋亡") || lower.includes("apoptosis")) {
    return {
      query,
      relatedKnowledgePoints: ["细胞凋亡通路", "caspase家族蛋白酶", "线粒体外膜通透化（MOMP）", "Bcl-2家族蛋白调控", "p53介导的凋亡信号"],
      researchFrontiers: ["肿瘤选择性凋亡诱导策略", "凋亡与免疫原性细胞死亡（ICD）的交叉", "BH3 profiling指导精准用药", "凋亡抵抗机制与耐药逆转", "坏死性凋亡与焦亡的调控网络"],
      industryApplications: ["BCL-2抑制剂（Venetoclax）用于血液肿瘤", "IAP拮抗剂（SMAC mimetics）临床试验", "基于凋亡标志物的伴随诊断试剂开发", "凋亡成像探针用于药效评估"],
      abilityDirections: ["机制解释能力", "实验设计能力", "证据判断能力"],
      recommendedKeywords: ["apoptosis", "BH3 mimetics", "MOMP", "caspase activation", "venetoclax", "drug resistance", "BH3 profiling"],
      researchTasks: ["BH3 profiling实验设计与数据分析", "凋亡通路文献系统回顾", "凋亡诱导药物筛选方案设计"],
    };
  }

  if (lower.includes("crispr") || lower.includes("基因编辑")) {
    return {
      query,
      relatedKnowledgePoints: ["CRISPR-Cas9系统结构", "sgRNA设计与PAM序列", "DNA双链断裂修复（NHEJ/HDR）", "碱基编辑器与先导编辑", "脱靶效应与安全性评估"],
      researchFrontiers: ["先导编辑（Prime Editing）精准修复", "表观基因组编辑（CRISPRoff/on）", "CRISPR筛选用于功能基因组学", "体内递送系统（LNP/AAV）优化", "CRISPR诊断（SHERLOCK/DETECTR）"],
      industryApplications: ["CRISPR编辑CAR-T（CTX001等）", "体内基因编辑治疗（Intellia NTLA-2001）", "农业基因编辑育种", "CRISPR诊断试剂盒"],
      abilityDirections: ["文献检索能力", "实验设计能力", "证据判断能力"],
      recommendedKeywords: ["CRISPR-Cas9", "sgRNA design", "HDR", "prime editing", "off-target", "gene therapy", "base editor"],
      researchTasks: ["sgRNA靶点设计与脱靶预测", "CRISPR筛选数据分析", "基因编辑效率评估方法比较"],
    };
  }

  if (lower.includes("蛋白质") || lower.includes("酶") || lower.includes("protein")) {
    return {
      query,
      relatedKnowledgePoints: ["蛋白质一级到四级结构", "酶动力学（Km, kcat, Vmax）", "蛋白质折叠热力学", "活性位点与催化机制", "翻译后修饰"],
      researchFrontiers: ["AI驱动蛋白质设计（AlphaFold/RFdiffusion）", "非天然氨基酸引入与功能拓展", "多酶级联催化系统", "无细胞蛋白合成系统", "蛋白质相分离与功能调控"],
      industryApplications: ["工业酶制剂（洗涤剂/纺织/食品）", "固定化酶催化手性药物合成", "蛋白类药物设计与优化", "诊断用酶开发"],
      abilityDirections: ["机制解释能力", "数据分析能力", "产业迁移能力"],
      recommendedKeywords: ["protein engineering", "directed evolution", "enzyme kinetics", "AlphaFold", "catalytic mechanism", "thermostability"],
      researchTasks: ["酶热稳定性突变设计与活性预测", "同源建模与分子对接分析", "定向进化文库设计与筛选策略"],
    };
  }

  if (lower.includes("合成生物学") || lower.includes("synbio")) {
    return {
      query,
      relatedKnowledgePoints: ["中心法则与基因表达调控", "操纵子模型与转录调控", "代谢通路与限速酶", "质粒与基因表达载体", "底盘微生物生理学"],
      researchFrontiers: ["基因回路设计与正交化", "无细胞合成生物学", "人工染色体与最小基因组", "机器学习辅助代谢通路优化", "合成微生物群落"],
      industryApplications: ["微生物合成天然产物（青蒿素/大麻素）", "合成生物材料（PHA/蛛丝蛋白）", "生物燃料与绿色化学品", "合成细胞传感器"],
      abilityDirections: ["实验设计能力", "数据分析能力", "产业迁移能力"],
      recommendedKeywords: ["synthetic biology", "DBTL cycle", "metabolic engineering", "genome-scale model", "biosensor", "cell factory"],
      researchTasks: ["代谢通路瓶颈分析与靶点预测", "启动子文库构建策略设计", "基因组规模代谢模型（GEM）应用"],
    };
  }

  if (lower.includes("分子诊断") || lower.includes("诊断")) {
    return {
      query,
      relatedKnowledgePoints: ["核酸分子杂交原理", "PCR与qPCR技术", "NGS测序技术流程", "生物标志物概念与分类", "探针设计与信号放大"],
      researchFrontiers: ["单分子测序与甲基化检测", "外泌体与液体活检新技术", "CRISPR诊断平台", "多组学联合诊断", "AI辅助影像与分子诊断融合"],
      industryApplications: ["肿瘤早筛（ctDNA甲基化）", "伴随诊断（CDx）试剂开发", "感染性疾病快速诊断", "无创产前筛查（NIPT）"],
      abilityDirections: ["文献检索能力", "证据判断能力", "数据分析能力"],
      recommendedKeywords: ["liquid biopsy", "ctDNA", "NGS", "digital PCR", "biomarker", "companion diagnostics", "early detection"],
      researchTasks: ["肿瘤突变负荷（TMB）计算方法评估", "液体活检灵敏度与特异性分析", "NGS数据分析流程搭建"],
    };
  }

  if (lower.includes("细胞治疗") || lower.includes("car-t")) {
    return {
      query,
      relatedKnowledgePoints: ["T细胞受体结构与信号", "免疫突触形成", "CAR结构域设计", "细胞因子信号通路", "免疫排斥与GVHD"],
      researchFrontiers: ["通用型CAR-T（UCAR-T）", "CAR-NK与CAR-M", "体内CAR-T生成技术", "合成生物学调控开关", "实体瘤CAR-T突破"],
      industryApplications: ["CD19 CAR-T（Kymriah/Yescarta）上市", "BCMA CAR-T治疗多发性骨髓瘤", "TCR-T个性化治疗实体瘤", "CAR-T自动化生产设备"],
      abilityDirections: ["机制解释能力", "实验设计能力", "证据判断能力"],
      recommendedKeywords: ["CAR-T", "immunotherapy", "chimeric antigen receptor", "cytokine release syndrome", "solid tumor", "allogeneic"],
      researchTasks: ["CAR结构域功能分析与优化", "CAR-T杀伤活性评估实验设计", "免疫治疗耐药机制文献综述"],
    };
  }

  return {
    query,
    relatedKnowledgePoints: ["分子生物学中心法则", "信号转导通路", "基因表达调控", "蛋白质结构与功能", "代谢与能量转换"],
    researchFrontiers: ["多组学整合分析", "AI驱动的生物学发现", "单细胞技术前沿", "基因编辑新工具", "合成生物学新范式"],
    industryApplications: ["精准医疗诊断与治疗", "生物制造与绿色化学", "创新药物研发管线", "农业生物技术改良"],
    abilityDirections: ["文献检索能力", "机制解释能力", "产业迁移能力"],
    recommendedKeywords: ["life sciences", "biomanufacturing", "drug discovery", "precision medicine", "biotechnology"],
    researchTasks: ["科研文献检索与系统综述", "实验方案设计与可行性评估", "产业技术路线图分析"],
  };
}

export function getMockAnswer(query: string): IndustryAnswer {
  return buildMockAnswer(query.trim());
}