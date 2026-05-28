export interface MigrationPath {
  textbookBase: string[];
  researchFrontier: string[];
  industryApplication: string[];
}

export interface Reference {
  title: string;
  url: string;
  type: "FDA" | "PubMed" | "DOI" | "NCI" | "Label" | "Review" | "Other";
}

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
  background: string;
  applicationScenario: string;
  displayFocus: string;
  migrationPath: MigrationPath;
  references: Reference[];
}

export interface MatchCase {
  id: string;
  title: string;
  reason: string;
}

export interface IndustryAnswer {
  query: string;
  answer?: string;
  relatedKnowledgePoints: string[];
  matchedCases?: MatchCase[];
  researchFrontiers: string[];
  industryApplications: string[];
  abilityDirections: string[];
  requiredAbilities?: string[];
  recommendedKeywords: string[];
  researchTasks: string[];
  nextTasks?: string[];
  sourceScope?: "based_on_local_cases" | "extended_reasoning" | "no_direct_match";
  disclaimer?: string;
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
    researchFoundation: "线粒体外膜通透化（MOMP）机制研究揭示Bcl-2家族蛋白在凋亡调控中的核心作用，抗凋亡蛋白BCL-2、BCL-XL、MCL-1通过结合并抑制促凋亡效应蛋白BAX/BAK维持线粒体完整性。结构生物学解析了BH3结构域与BCL-2疏水沟槽的结合模式，为BH3模拟物设计提供了分子蓝图。",
    applicationValue: "Venetoclax（ABT-199）作为首个获批的BCL-2选择性抑制剂，已用于慢性淋巴细胞白血病（CLL）和急性髓系白血病（AML）治疗，单药及联合方案均显示显著疗效，全球年销售额超20亿美元。",
    requiredAbilities: ["机制解释能力", "实验设计能力", "数据分析能力"],
    recommendedKeywords: ["apoptosis", "BH3 mimetics", "mitochondrial priming", "drug resistance", "combination therapy"],
    linkedResearchTask: "BH3 profiling实验设计",
    evidenceLevel: "高",
    sourceType: "学术文献",
    background: "细胞凋亡（apoptosis）是机体维持组织稳态的核心程序性死亡机制。线粒体途径（内源性凋亡通路）受Bcl-2家族蛋白精确调控：抗凋亡蛋白（BCL-2、BCL-XL、MCL-1）与促凋亡蛋白（BAX、BAK）之间的动态平衡决定细胞命运。在多种血液肿瘤中，肿瘤细胞通过高表达BCL-2来逃避凋亡，形成对BCL-2的「凋亡成瘾」。这一发现使BCL-2成为极具吸引力的抗肿瘤靶点。",
    applicationScenario: "Venetoclax研发历程是结构生物学驱动药物设计的经典范式：从Abbott实验室的片段筛选获得初始苗头化合物，通过基于NMR和X射线晶体学的结构优化（SAR by NMR）逐步提高亲和力和选择性，最终研发出口服生物利用度良好的BCL-2选择性抑制剂。临床应用前通过BH3 profiling检测肿瘤细胞的「凋亡启动」状态，预测治疗敏感性。",
    displayFocus: "BCL-2蛋白结构解析 → BH3模拟物分子设计 → 临床试验与伴随诊断",
    migrationPath: {
      textbookBase: ["细胞凋亡的分子机制", "线粒体结构与功能", "蛋白质-蛋白质相互作用"],
      researchFrontier: ["BCL-2家族蛋白结构解析", "BH3模拟物药物设计", "凋亡启动(mitochondrial priming)概念"],
      industryApplication: ["Venetoclax(ABT-199)获FDA批准", "BH3 profiling伴随诊断", "BCL-2/MCL-1双靶联合治疗"],
    },
    references: [
      { title: "Venetoclax FDA Approval (CLL)", url: "https://www.fda.gov/drugs/resources-information-approved-drugs/venetoclax", type: "FDA" },
      { title: "ABT-199, a potent and selective BCL-2 inhibitor, achieves antitumor activity while sparing platelets", url: "https://doi.org/10.1038/nm.3048", type: "DOI" },
      { title: "Mitochondrial priming and BH3 profiling in cancer therapy", url: "https://pubmed.ncbi.nlm.nih.gov/27767093/", type: "PubMed" },
      { title: "NCI Drug Dictionary: Venetoclax", url: "https://www.cancer.gov/publications/dictionaries/cancer-drug/def/venetoclax", type: "NCI" },
    ],
  },
  {
    id: "case-002",
    title: "CAR-T 细胞治疗与肿瘤免疫",
    subtitle: "从T细胞识别机制到工程化免疫细胞药物",
    relatedKnowledgePoints: ["T细胞受体", "免疫突触", "CAR结构域设计", "细胞因子信号", "肿瘤免疫微环境"],
    industryDirection: "细胞治疗",
    coreProblem: "如何设计和制备嵌合抗原受体T细胞（CAR-T）实现血液肿瘤的精准杀伤，并突破实体瘤治疗瓶颈",
    researchFoundation: "CAR结构从第一代（仅CD3ζ信号域）演进到第四代（TRUCK/装甲CAR），共刺激域（CD28、4-1BB）的引入显著增强了T细胞增殖和持久性。CAR-T制备涉及患者T细胞采集、体外激活、慢病毒载体转导和扩增、回输前清淋预处理等关键工艺环节。",
    applicationValue: "CD19 CAR-T产品（Kymriah、Yescarta、Tecartus、Breyanzi）已被FDA批准用于多种B细胞恶性肿瘤，总体缓解率达70-90%。BCMA CAR-T用于多发性骨髓瘤。全球CAR-T市场预计2030年超200亿美元。",
    requiredAbilities: ["机制解释能力", "实验设计能力", "证据判断能力"],
    recommendedKeywords: ["CAR-T", "immunotherapy", "chimeric antigen receptor", "CRS", "solid tumor", "allogeneic"],
    linkedResearchTask: "CAR结构域功能分析与优化",
    evidenceLevel: "高",
    sourceType: "临床试验",
    background: "T细胞通过TCR识别MHC呈递的抗原来杀伤靶细胞，但肿瘤细胞常下调MHC逃避免疫识别。CAR-T技术通过基因工程将抗体衍生的单链可变区（scFv）与T细胞激活信号域融合，使T细胞不依赖MHC即可识别肿瘤表面抗原。CD19因在B细胞谱系中特异性高表达而成为首个成功的CAR-T靶点。",
    applicationScenario: "CAR-T治疗流程：患者外周血分离T细胞 → 体外T细胞激活（抗CD3/CD28磁珠）→ 慢病毒载体转导CAR基因 → 体外扩增至治疗剂量 → 清淋预处理（氟达拉滨/环磷酰胺）→ CAR-T回输 → 监测细胞因子释放综合征（CRS）和神经毒性。当前前沿方向包括：通用型CAR-T（异体来源，基因敲除TCR/HLA）、双靶点CAR（防抗原逃逸）、CAR-NK、逻辑门控CAR等。",
    displayFocus: "CAR结构域工程 → 细胞制备工艺 → 临床疗效与安全性管理",
    migrationPath: {
      textbookBase: ["T细胞活化与信号转导", "抗原-抗体特异性识别", "细胞培养与基因转导"],
      researchFrontier: ["CAR结构域迭代优化(CD28/4-1BB)", "CRS机制与IL-6阻断策略", "实体瘤微环境免疫逃逸"],
      industryApplication: ["CD19 CAR-T(Kymriah/Yescarta)", "BCMA CAR-T治疗多发性骨髓瘤", "通用型CAR-T与CAR-NK研发"],
    },
    references: [
      { title: "Kymriah (tisagenlecleucel) FDA Approval", url: "https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/kymriah", type: "FDA" },
      { title: "Yescarta (axicabtagene ciloleucel) FDA Label", url: "https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/yescarta", type: "Label" },
      { title: "Chimeric Antigen Receptor T Cells for Sustained Remissions in Leukemia", url: "https://doi.org/10.1056/NEJMoa1407222", type: "DOI" },
      { title: "NCI: CAR T-Cell Therapy", url: "https://www.cancer.gov/about-cancer/treatment/research/car-t-cells", type: "NCI" },
      { title: "A Review of CAR-T Therapy: Current Status and Future Directions", url: "https://pubmed.ncbi.nlm.nih.gov/35030560/", type: "PubMed" },
    ],
  },
  {
    id: "case-003",
    title: "PD-1/PD-L1 免疫检查点抑制剂",
    subtitle: "从免疫耐受机制到广谱抗肿瘤免疫药物",
    relatedKnowledgePoints: ["T细胞活化", "共刺激信号", "免疫检查点", "肿瘤抗原呈递", "T细胞耗竭"],
    industryDirection: "药物研发",
    coreProblem: "如何通过阻断PD-1/PD-L1免疫检查点通路恢复肿瘤微环境中T细胞的杀伤功能",
    researchFoundation: "PD-1（Programmed Cell Death-1）是T细胞表面的免疫抑制性受体，其配体PD-L1/PD-L2在多种肿瘤细胞和肿瘤浸润免疫细胞上高表达。PD-1/PD-L1结合后通过SHP-2磷酸酶去磷酸化TCR信号通路关键分子，抑制T细胞增殖和效应功能。阻断这一相互作用的单克隆抗体可解除免疫抑制，恢复抗肿瘤免疫。",
    applicationValue: "PD-1抑制剂（Pembrolizumab/Keytruda、Nivolumab/Opdivo）和PD-L1抑制剂（Atezolizumab/Tecentriq）已被批准用于黑色素瘤、非小细胞肺癌、肾细胞癌、霍奇金淋巴瘤等20余种肿瘤适应症。Keytruda年销售额超250亿美元，成为全球最畅销药物之一。",
    requiredAbilities: ["机制解释能力", "文献检索能力", "证据判断能力"],
    recommendedKeywords: ["PD-1", "PD-L1", "immune checkpoint", "immunotherapy", "Keytruda", "TMB", "MSI-H"],
    linkedResearchTask: "肿瘤突变负荷（TMB）与免疫治疗响应预测",
    evidenceLevel: "高",
    sourceType: "学术文献",
    background: "免疫检查点是维持免疫耐受、防止自身免疫的关键机制。1992年日本科学家本庶佑（Tasuku Honjo）发现PD-1分子，后续研究揭示肿瘤细胞通过高表达PD-L1劫持这一通路来逃避免疫攻击。2018年本庶佑与James Allison（CTLA-4发现者）共同获得诺贝尔生理学或医学奖。PD-1抑制剂的成功标志着肿瘤治疗从化疗、靶向治疗迈入免疫治疗时代。",
    applicationScenario: "Keytruda从首个适应症（黑色素瘤）获批到覆盖MSI-H/dMMR泛实体瘤适应症，体现了生物标志物驱动的精准免疫治疗策略。MSI-H（微卫星高度不稳定）和TMB-H（高肿瘤突变负荷）因产生更多新抗原而预测更好的免疫治疗响应。当前挑战包括：原发性耐药（约60-70%患者）、获得性耐药机制、免疫相关不良反应（irAE）管理等。联合治疗（PD-1 + 化疗/CTLA-4/LAG-3）是提升响应率的主要方向。",
    displayFocus: "PD-1通路发现 → 抗体药物开发 → 生物标志物伴随诊断 → 泛癌种适应症扩展",
    migrationPath: {
      textbookBase: ["T细胞活化与共信号调控", "免疫耐受与自身免疫", "抗体结构与功能"],
      researchFrontier: ["PD-1/PD-L1结构解析与阻断", "肿瘤突变负荷(TMB)预测", "免疫联合治疗策略"],
      industryApplication: ["Keytruda获批MSI-H泛实体瘤", "PD-L1 IHC伴随诊断试剂", "LAG-3/TIGIT新一代靶点"],
    },
    references: [
      { title: "Keytruda (pembrolizumab) FDA Approval History", url: "https://www.fda.gov/drugs/resources-information-approved-drugs/pembrolizumab-keytruda", type: "FDA" },
      { title: "Nivolumab FDA Label (Opdivo)", url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/125554s128lbl.pdf", type: "Label" },
      { title: "Safety, Activity, and Immune Correlates of Anti–PD-1 Antibody in Cancer", url: "https://doi.org/10.1056/NEJMoa1200690", type: "DOI" },
      { title: "PD-1 Blockade in Tumors with Mismatch-Repair Deficiency", url: "https://doi.org/10.1056/NEJMoa1500596", type: "DOI" },
    ],
  },
  {
    id: "case-004",
    title: "mRNA 疫苗递送技术",
    subtitle: "从核酸化学修饰到脂质纳米颗粒疫苗平台",
    relatedKnowledgePoints: ["中心法则", "mRNA翻译", "核酸化学", "脂质纳米颗粒", "抗原呈递"],
    industryDirection: "疫苗研发",
    coreProblem: "如何设计稳定的mRNA分子和高效LNP递送系统，使外源mRNA在体内安全高效地表达抗原蛋白并诱导保护性免疫",
    researchFoundation: "mRNA疫苗技术的核心突破包括：(1) 假尿苷（Ψ）修饰降低mRNA的固有免疫刺激，提高翻译效率；(2) 可电离阳离子脂质设计使LNP在生理pH下呈中性（低毒性）而在内体酸性环境中质子化（促进内体逃逸）；(3) 5'帽结构和3' poly(A)尾优化增强mRNA稳定性和翻译。",
    applicationValue: "Pfizer-BioNTech和Moderna的COVID-19 mRNA疫苗在疫情中展现>90%保护效力，全球接种超百亿剂。mRNA技术平台正迅速拓展至流感、RSV、CMV等传染病疫苗以及个性化肿瘤疫苗领域，代表疫苗研发的范式变革。",
    requiredAbilities: ["机制解释能力", "文献检索能力", "数据分析能力"],
    recommendedKeywords: ["mRNA vaccine", "LNP", "lipid nanoparticle", "pseudouridine", "nucleoside modification", "ionizable lipid"],
    linkedResearchTask: "mRNA序列优化与抗原表达效率评估",
    evidenceLevel: "高",
    sourceType: "学术文献",
    background: "mRNA疫苗的概念早在1990年代即被提出，但长期受困于mRNA不稳定性和强免疫原性。Katalin Karikó和Drew Weissman在2005年发现将假尿苷（Ψ）掺入mRNA可显著降低TLR介导的固有免疫识别，这一突破性发现使他们获得2023年诺贝尔生理学或医学奖。与此同时，脂质纳米颗粒（LNP）递送技术的成熟解决了mRNA在体内快速降解的问题。",
    applicationScenario: "mRNA疫苗生产流程：抗原序列设计（基于病毒S蛋白结构）→ 质粒DNA模板制备 → 体外转录（IVT）合成mRNA → 加帽和poly(A)加尾 → LNP包封（微流控混合可电离脂质、胆固醇、辅助脂质、PEG-脂质与mRNA水相）→ 无菌灌装。整个流程无需细胞培养或病毒扩增，从序列设计到临床级生产可在数周内完成，远超传统疫苗的数月到数年周期。",
    displayFocus: "mRNA化学修饰(Ψ) → LNP递送系统 → 快速响应式疫苗平台 → 肿瘤新抗原疫苗",
    migrationPath: {
      textbookBase: ["中心法则与蛋白质翻译", "核酸结构与化学修饰", "脂质双分子层与纳米颗粒"],
      researchFrontier: ["假尿苷修饰降低免疫原性", "可电离脂质设计与内体逃逸", "自扩增RNA(saRNA)"],
      industryApplication: ["COVID-19 mRNA疫苗(Pfizer/Moderna)", "个性化肿瘤新抗原疫苗", "mRNA治疗性蛋白表达"],
    },
    references: [
      { title: "Comirnaty (COVID-19 mRNA Vaccine) FDA Approval", url: "https://www.fda.gov/vaccines-blood-biologics/comirnaty", type: "FDA" },
      { title: "Spikevax (COVID-19 mRNA Vaccine) FDA Approval", url: "https://www.fda.gov/vaccines-blood-biologics/spikevax", type: "FDA" },
      { title: "Suppression of RNA Recognition by Toll-like Receptors: The Impact of Nucleoside Modification", url: "https://doi.org/10.1016/j.immuni.2005.06.008", type: "DOI" },
      { title: "Lipid Nanoparticles for mRNA Delivery", url: "https://pubmed.ncbi.nlm.nih.gov/34408243/", type: "PubMed" },
      { title: "mRNA-based therapeutics — developing a new class of drugs", url: "https://doi.org/10.1038/nrd.2017.243", type: "DOI" },
    ],
  },
  {
    id: "case-005",
    title: "CRISPR 基因编辑治疗",
    subtitle: "从细菌适应性免疫到精准人类基因修复",
    relatedKnowledgePoints: ["CRISPR-Cas9", "DNA修复机制", "基因表达调控", "sgRNA设计", "脱靶效应"],
    industryDirection: "细胞治疗",
    coreProblem: "如何利用CRISPR基因编辑技术实现安全高效的人类细胞基因修复，治疗遗传性疾病和肿瘤",
    researchFoundation: "CRISPR-Cas9系统由sgRNA和Cas9核酸内切酶组成。sgRNA通过20nt的间隔序列与靶DNA互补配对，引导Cas9在PAM序列（5'-NGG-3'）上游3bp处产生DNA双链断裂（DSB），随后通过非同源末端连接（NHEJ）或同源定向修复（HDR）完成基因编辑。碱基编辑器（BE）和先导编辑器（PE）进一步实现了不依赖DSB的精准单碱基转换。",
    applicationValue: "CRISPR编辑的CTX001（Casgevy）用于镰刀细胞贫血和β地中海贫血的体外基因编辑疗法获FDA和EMA批准，是首个获批的CRISPR疗法。体内基因编辑（Intellia NTLA-2001治疗ATTR淀粉样变性）、CRISPR编辑CAR-T等数十项临床试验正在进行中。",
    requiredAbilities: ["文献检索能力", "实验设计能力", "证据判断能力"],
    recommendedKeywords: ["CRISPR-Cas9", "sgRNA design", "HDR", "prime editing", "off-target", "gene therapy", "base editor"],
    linkedResearchTask: "sgRNA靶点设计与脱靶分析",
    evidenceLevel: "高",
    sourceType: "临床试验",
    background: "CRISPR（Clustered Regularly Interspaced Short Palindromic Repeats）是细菌和古菌的适应性免疫系统。2012年Jennifer Doudna和Emmanuelle Charpentier证明CRISPR-Cas9可作为可编程的基因编辑工具，两人于2020年获诺贝尔化学奖。CRISPR技术相比ZFN和TALEN具有设计简便、效率高、可多路编辑等革命性优势，迅速成为生命科学的基础工具。",
    applicationScenario: "Casgevy（CTX001）治疗流程：患者造血干细胞采集 → 体外电转染CRISPR-Cas9核糖核蛋白（RNP）→ 编辑BCL11A增强子区域（重新激活胎儿血红蛋白HbF表达）→ 清髓预处理 → 编辑后干细胞回输 → 造血重建。体内基因编辑则通过LNP或AAV载体将CRISPR组分直接递送至靶器官。当前关键挑战：递送效率、脱靶风险评估、长期安全性监测、伦理监管等。",
    displayFocus: "Cas9-sgRNA复合体机制 → 递送策略(AAV/LNP) → 脱靶检测与安全性 → 临床适应症拓展",
    migrationPath: {
      textbookBase: ["DNA双链断裂与修复", "中心法则与基因表达", "核酸酶的结构与功能"],
      researchFrontier: ["CRISPR-Cas9机制与PAM识别", "碱基编辑器与先导编辑器", "脱靶检测方法(GUIDE-seq)"],
      industryApplication: ["Casgevy(CTX001)镰刀细胞贫血", "体内基因编辑(Intellia NTLA-2001)", "CRISPR编辑CAR-T实体瘤"],
    },
    references: [
      { title: "Casgevy (exagamglogene autotemcel) FDA Approval", url: "https://www.fda.gov/vaccines-blood-biologics/casgevy", type: "FDA" },
      { title: "A Programmable Dual-RNA–Guided DNA Endonuclease in Adaptive Bacterial Immunity", url: "https://doi.org/10.1126/science.1225829", type: "DOI" },
      { title: "CRISPR-Cas9 In Vivo Gene Editing for Transthyretin Amyloidosis", url: "https://doi.org/10.1056/NEJMoa2107454", type: "DOI" },
      { title: "NCI: CRISPR Gene Editing", url: "https://www.cancer.gov/news-events/cancer-currents-blog/2020/crispr-cancer-research-treatment", type: "NCI" },
      { title: "The CRISPR tool kit for genome editing and beyond", url: "https://pubmed.ncbi.nlm.nih.gov/29717225/", type: "PubMed" },
    ],
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
  const answer = buildMockAnswer(query.trim());

  const lower = query.toLowerCase();
  const matched: MatchCase[] = industryCases
    .filter((c) => {
      return (
        c.title.toLowerCase().includes(lower) ||
        c.industryDirection.toLowerCase().includes(lower) ||
        c.relatedKnowledgePoints.some((k) => k.toLowerCase().includes(lower)) ||
        c.recommendedKeywords.some((k) => k.toLowerCase().includes(lower))
      );
    })
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      title: c.title,
      reason: `匹配相关知识点：${c.relatedKnowledgePoints.slice(0, 2).join("、")}`,
    }));

  return {
    ...answer,
    answer: `根据当前产业案例库，为您匹配到 ${matched.length} 个相关案例及相关知识点和科研方向。`,
    matchedCases: matched,
    requiredAbilities: answer.abilityDirections,
    nextTasks: answer.researchTasks,
    sourceScope: matched.length > 0 ? "based_on_local_cases" : "extended_reasoning",
    disclaimer: "本回答基于当前产业案例库自动生成，用于课程学习和科研训练，不构成医疗或临床建议。",
  };
}