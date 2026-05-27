export type MindMapStatus = "mastered" | "review" | "weak" | "recommended" | "new";

export interface MindMapNode {
  id: string;
  label: string;
  summary: string;
  keyPoints: string[];
  practice: string;
  next: string;
  status: MindMapStatus;
  tool?: {
    label: string;
    href: string;
  };
  children?: MindMapNode[];
}

export const mindMapRoot: MindMapNode = {
  id: "bio-manufacturing",
  label: "生物制造基础",
  summary: "围绕分子、工具、序列、结构、通路和实验设计组织生命科学学习路径。",
  keyPoints: ["先建立核心概念", "再连接工具和实验", "最后形成科研表达"],
  practice: "选择一个你正在学习的主题，展开它的一级和二级节点。",
  next: "从分子生物学基础或合成生物学工具开始。",
  status: "recommended",
  children: [
    {
      id: "molecular-biology",
      label: "分子生物学基础",
      summary: "理解 DNA、RNA、蛋白质和中心法则，是后续工具和实验设计的基础。",
      keyPoints: ["遗传信息如何存储", "信息如何转录和翻译", "表达调控如何影响表型"],
      practice: "解释 DNA、RNA 和蛋白质之间的关系。",
      next: "中心法则 → 基因表达调控 → 序列分析",
      status: "mastered",
      children: [
        node("dna", "DNA", "遗传信息的主要载体，由碱基序列编码可遗传信息。", ["双螺旋", "互补配对", "复制"], "写出一段 DNA 的互补链。", "RNA"),
        node("rna", "RNA", "RNA 负责转录信息，并参与翻译、调控和催化等过程。", ["mRNA", "tRNA", "rRNA"], "把 DNA 序列转录成 RNA。", "蛋白质", "new", { label: "序列分析工具", href: "/tools/sequence" }),
        node("protein-basic", "蛋白质", "蛋白质执行结构、催化、运输、信号等功能。", ["氨基酸", "折叠", "功能域"], "判断一个突变可能影响哪个结构区域。", "蛋白结构与功能", "recommended", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("central-dogma", "中心法则", "遗传信息通常从 DNA 流向 RNA，再流向蛋白质。", ["复制", "转录", "翻译"], "画出中心法则的信息流。", "基因表达调控"),
        node("gene-regulation", "基因表达调控", "细胞通过启动子、转录因子和表观调控控制基因表达。", ["启动子", "转录因子", "表达强度"], "解释启动子为什么会影响蛋白表达量。", "合成生物学工具"),
      ],
    },
    {
      id: "synthetic-tools",
      label: "合成生物学工具",
      summary: "学习质粒、启动子、筛选标记和 CRISPR 等工程化工具。",
      keyPoints: ["元件功能", "载体设计", "编辑与表达"],
      practice: "指出 pET-28a 中 T7 promoter、His-tag 和 KanR 的作用。",
      next: "质粒载体 → 启动子 → CRISPR-Cas",
      status: "recommended",
      children: [
        node("plasmid-vector", "质粒载体", "质粒是常用于克隆和表达的环状 DNA 载体。", ["ori", "抗性基因", "MCS"], "判断一个载体适合克隆还是表达。", "启动子", "recommended", { label: "质粒图谱查看器", href: "/tools/plasmid" }),
        node("promoter", "启动子", "启动子控制下游基因转录起始和表达强度。", ["组成型", "诱导型", "宿主兼容"], "比较 T7 promoter 和 lac promoter。", "终止子", "new", { label: "质粒图谱查看器", href: "/tools/plasmid" }),
        node("terminator", "终止子", "终止子帮助转录正确结束，减少读穿。", ["转录终止", "稳定性", "表达单元"], "解释为什么表达载体需要终止子。", "筛选标记"),
        node("selection-marker", "筛选标记", "抗性基因等标记帮助筛选成功携带载体的细胞。", ["AmpR", "KanR", "培养基筛选"], "选择合适抗生素筛选转化子。", "报告基因", "review", { label: "质粒图谱查看器", href: "/tools/plasmid" }),
        node("crispr-cas", "CRISPR-Cas", "利用 Cas 蛋白和向导 RNA 实现靶向基因编辑。", ["sgRNA", "Cas9", "PAM"], "解释 Cas9 为什么需要 sgRNA 和 PAM。", "蛋白结构与功能", "recommended", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("reporter-gene", "报告基因", "报告基因把表达或调控事件转化为可观测信号。", ["GFP", "荧光", "定量检测"], "设计一个 GFP 报告实验。", "序列分析与设计", "new", { label: "蛋白结构查看器", href: "/tools/protein" }),
      ],
    },
    {
      id: "sequence-design",
      label: "序列分析与设计",
      summary: "围绕序列质量、ORF、引物和酶切位点开展实验前检查。",
      keyPoints: ["GC 含量", "读框", "克隆位点"],
      practice: "输入一段 DNA，检查 ORF 和 EcoRI/BamHI 位点。",
      next: "GC 含量 → ORF → 引物设计",
      status: "review",
      tool: { label: "序列分析工具", href: "/tools/sequence" },
      children: [
        node("gc-content", "GC 含量", "GC 比例影响退火稳定性和 PCR 条件。", ["退火温度", "二级结构", "扩增效率"], "判断 GC 过高或过低的风险。", "ORF", "review", { label: "序列分析工具", href: "/tools/sequence" }),
        node("orf", "ORF", "开放阅读框表示可能编码蛋白的连续阅读区。", ["ATG", "终止密码子", "读框"], "找出一段序列中最长 ORF。", "引物设计", "recommended", { label: "序列分析工具", href: "/tools/sequence" }),
        node("primer-design", "引物设计", "引物需要合适长度、GC 和 Tm，并避免明显二级结构。", ["Tm", "GC%", "产物长度"], "设计一对 PCR 引物并解释风险。", "酶切位点", "weak", { label: "序列分析工具", href: "/tools/sequence" }),
        node("restriction-sites", "酶切位点", "限制性内切酶位点用于克隆设计和片段验证。", ["EcoRI", "BamHI", "HindIII"], "判断目标片段内部是否含有克隆酶切位点。", "序列比对", "recommended", { label: "序列分析工具", href: "/tools/sequence" }),
        node("alignment", "序列比对", "比对帮助判断序列相似性、突变和保守区域。", ["identity", "coverage", "E-value"], "解释 BLAST 中 identity 和 E-value 的意义。", "蛋白结构与功能"),
      ],
    },
    {
      id: "protein-structure",
      label: "蛋白结构与功能",
      summary: "从一级序列到三维结构，理解结构域、活性位点和突变效应。",
      keyPoints: ["结构层级", "功能区域", "结构-功能关系"],
      practice: "搜索 GFP 或 Cas9，观察结构域和功能区域。",
      next: "一级结构 → 三级结构 → 活性位点",
      status: "new",
      tool: { label: "蛋白结构查看器", href: "/tools/protein" },
      children: [
        node("primary-structure", "一级结构", "氨基酸序列决定折叠和潜在功能区域。", ["氨基酸", "序列", "突变"], "判断一个点突变可能改变什么。", "二级结构"),
        node("secondary-structure", "二级结构", "α 螺旋和 β 折叠是常见局部结构。", ["α helix", "β sheet", "loop"], "在蛋白结构中识别二级结构。", "三级结构", "new", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("tertiary-structure", "三级结构", "三级结构描述整条多肽链的空间折叠。", ["折叠", "疏水核心", "构象"], "解释为什么三维结构决定功能。", "活性位点", "recommended", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("active-site", "活性位点", "活性位点直接参与底物结合或催化。", ["底物", "催化", "保守残基"], "猜测哪些区域可能是活性位点。", "结构域", "weak", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("domain", "结构域", "结构域是相对独立折叠并承担功能的结构单元。", ["功能模块", "保守结构", "相互作用"], "识别 Cas9 的 HNH 和 RuvC 结构域。", "突变效应", "recommended", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("mutation-effect", "突变效应", "突变可能影响稳定性、结合能力或催化效率。", ["稳定性", "功能缺失", "获得功能"], "解释一个活性位点突变的可能后果。", "细胞通路与调控"),
      ],
    },
    {
      id: "pathway-regulation",
      label: "细胞通路与调控",
      summary: "理解细胞周期、凋亡、MAPK 和 DNA 修复等机制网络。",
      keyPoints: ["上下游", "激活/抑制", "关键节点"],
      practice: "点击 p53 或 ERK，解释上下游影响。",
      next: "细胞周期 → 凋亡 → MAPK",
      status: "recommended",
      tool: { label: "通路知识图谱", href: "/tools/pathway" },
      children: [
        node("cell-cycle", "细胞周期", "细胞周期由 Cyclin/CDK 和检查点协调控制。", ["Cyclin/CDK", "p53/p21", "G1/S"], "解释 p53 激活后为何抑制周期推进。", "细胞凋亡", "recommended", { label: "通路知识图谱", href: "/tools/pathway" }),
        node("apoptosis", "细胞凋亡", "凋亡是受调控的程序性细胞死亡过程。", ["Bax/Bcl-2", "Caspase", "线粒体"], "解释 Bax 和 Bcl-2 的拮抗关系。", "MAPK 通路", "new", { label: "通路知识图谱", href: "/tools/pathway" }),
        node("mapk", "MAPK 通路", "MAPK 级联把外界信号传递到转录和增殖反应。", ["Ras", "Raf", "MEK", "ERK"], "说明磷酸化级联如何放大信号。", "DNA 修复", "recommended", { label: "通路知识图谱", href: "/tools/pathway" }),
        node("dna-repair", "DNA 修复", "DNA 修复维持基因组稳定并影响细胞命运。", ["ATM/ATR", "BRCA", "检查点"], "解释 DNA 损伤如何激活 p53。", "代谢通路", "review", { label: "通路知识图谱", href: "/tools/pathway" }),
        node("metabolism", "代谢通路", "代谢通路连接能量、物质和工程化生产目标。", ["糖酵解", "ATP", "通量"], "分析一个代谢瓶颈可能影响什么。", "实验设计与验证", "new", { label: "通路知识图谱", href: "/tools/pathway" }),
      ],
    },
    {
      id: "experiment-design",
      label: "实验设计与验证",
      summary: "把知识转化为 PCR、克隆、表达、纯化和数据分析等实验行动。",
      keyPoints: ["实验目的", "变量控制", "结果验证"],
      practice: "设计一个从克隆到蛋白表达的验证流程。",
      next: "PCR → 分子克隆 → 蛋白表达",
      status: "new",
      children: [
        node("pcr", "PCR", "PCR 用于扩增目标 DNA 片段。", ["模板", "引物", "退火温度"], "判断一对引物是否适合 PCR。", "分子克隆", "recommended", { label: "序列分析工具", href: "/tools/sequence" }),
        node("cloning", "分子克隆", "分子克隆把目标片段插入载体并转入宿主。", ["载体", "插入片段", "筛选"], "选择合适质粒和酶切方案。", "蛋白表达", "recommended", { label: "质粒图谱查看器", href: "/tools/plasmid" }),
        node("protein-expression", "蛋白表达", "蛋白表达关注宿主、诱导条件和产物可溶性。", ["宿主", "诱导", "标签"], "解释 His-tag 如何帮助纯化。", "纯化检测", "new", { label: "蛋白结构查看器", href: "/tools/protein" }),
        node("purification", "纯化检测", "纯化检测验证目标蛋白是否被正确表达和富集。", ["SDS-PAGE", "Western", "亲和纯化"], "判断条带大小是否符合预期。", "数据分析"),
        node("data-analysis", "数据分析", "数据分析把实验结果转化为证据和结论。", ["对照", "重复", "统计"], "解释为什么需要阴性和阳性对照。", "学术表达"),
      ],
    },
  ],
};

function node(
  id: string,
  label: string,
  summary: string,
  keyPoints: string[],
  practice: string,
  next: string,
  status: MindMapStatus = "new",
  tool?: MindMapNode["tool"],
): MindMapNode {
  return { id, label, summary, keyPoints, practice, next, status, tool };
}

export function flattenMindMap(root: MindMapNode = mindMapRoot): MindMapNode[] {
  return [root, ...(root.children || []).flatMap((child) => flattenMindMap(child))];
}

export function findMindMapNode(id: string, root: MindMapNode = mindMapRoot): MindMapNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children || []) {
    const found = findMindMapNode(id, child);
    if (found) return found;
  }
  return undefined;
}

export function findMindMapPath(id: string, root: MindMapNode = mindMapRoot, path: MindMapNode[] = []): MindMapNode[] {
  const nextPath = [...path, root];
  if (root.id === id) return nextPath;
  for (const child of root.children || []) {
    const found = findMindMapPath(id, child, nextPath);
    if (found.length) return found;
  }
  return [];
}
