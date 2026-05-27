const STRUCTURE_BASES = {
  rcsbPdb: "https://files.rcsb.org/download",
  alphaFoldFiles: "https://alphafold.ebi.ac.uk/files",
  alphaFoldApi: "https://alphafold.ebi.ac.uk/api/prediction",
  reactomeContent: "https://reactome.org/ContentService",
};

const proteinAliases = new Map(
  [
    {
      keys: ["crispr-cas9", "cas9", "spcas9", "crispr"],
      value: {
        id: "cas9",
        label: "CRISPR-Cas9",
        accession: "Q99ZW2",
        pdbId: "4OO8",
        organism: "Streptococcus pyogenes",
        source: "AlphaFold DB + RCSB PDB",
        confidence: 91.8,
        teachingFocus: "RuvC 与 HNH 双核酸酶结构域、sgRNA 识别、DNA 切割机制",
      },
    },
    {
      keys: ["gfp", "egfp", "绿色荧光蛋白"],
      value: {
        id: "gfp",
        label: "绿色荧光蛋白 GFP",
        accession: "P42212",
        pdbId: "1GFL",
        organism: "Aequorea victoria",
        source: "AlphaFold DB + RCSB PDB",
        confidence: 94.2,
        teachingFocus: "β 桶结构、发色团形成、荧光报告基因应用",
      },
    },
    {
      keys: ["insulin", "胰岛素"],
      value: {
        id: "insulin",
        label: "胰岛素",
        accession: "P01308",
        pdbId: "4INS",
        organism: "Homo sapiens",
        source: "AlphaFold DB + RCSB PDB",
        confidence: 93.1,
        teachingFocus: "A/B 链、二硫键、激素受体识别",
      },
    },
    {
      keys: ["hemoglobin", "hb", "血红蛋白", "4hhb"],
      value: {
        id: "hemoglobin",
        label: "血红蛋白",
        accession: "P69905",
        pdbId: "4HHB",
        organism: "Homo sapiens",
        source: "AlphaFold DB + RCSB PDB",
        confidence: 96.5,
        teachingFocus: "四聚体装配、血红素结合、变构调控与氧运输",
      },
    },
  ].flatMap(({ keys, value }) => keys.map((key) => [key, value])),
);

export const sampleDnaSequence =
  "ATGGCCGTGAAGCTGGAATCTTTCGTGCTGAGCTTCGTGCTGATCGCTAGCTAGCTAAGGATCCGCTGAATTCTAA";

export const plasmidExamples = {
  pBR322: {
    name: "pBR322",
    length: 4361,
    host: "E. coli",
    source: "示例图谱 / pLannotate-ready",
    notes: "经典克隆载体，适合讲解 ori、抗性基因和插入失活筛选。",
    features: [
      { label: "ori", type: "rep_origin", start: 2530, end: 3130, color: "#f59e0b", direction: "forward" },
      { label: "AmpR", type: "CDS", start: 3290, end: 4150, color: "#10b981", direction: "reverse" },
      { label: "TetR", type: "CDS", start: 86, end: 1276, color: "#3b82f6", direction: "forward" },
      { label: "MCS", type: "misc_feature", start: 375, end: 650, color: "#6b7280", direction: "forward" },
      { label: "rop", type: "CDS", start: 1915, end: 2106, color: "#8b5cf6", direction: "forward" },
    ],
  },
  "pET-28a": {
    name: "pET-28a",
    length: 5369,
    host: "E. coli BL21(DE3)",
    source: "示例图谱 / pLannotate-ready",
    notes: "表达载体，适合讲解 T7 promoter、His-tag 与 KanR 筛选。",
    features: [
      { label: "T7 promoter", type: "promoter", start: 370, end: 450, color: "#2563eb", direction: "forward" },
      { label: "His-tag", type: "tag", start: 520, end: 590, color: "#06b6d4", direction: "forward" },
      { label: "MCS", type: "misc_feature", start: 590, end: 820, color: "#6b7280", direction: "forward" },
      { label: "KanR", type: "CDS", start: 3990, end: 4800, color: "#10b981", direction: "reverse" },
      { label: "ori", type: "rep_origin", start: 3000, end: 3600, color: "#f59e0b", direction: "forward" },
    ],
  },
  pUC19: {
    name: "pUC19",
    length: 2686,
    host: "E. coli",
    source: "示例图谱 / pLannotate-ready",
    notes: "高拷贝克隆载体，适合讲解 lacZα 蓝白斑筛选。",
    features: [
      { label: "lacZα", type: "CDS", start: 250, end: 720, color: "#2563eb", direction: "forward" },
      { label: "MCS", type: "misc_feature", start: 390, end: 470, color: "#6b7280", direction: "forward" },
      { label: "AmpR", type: "CDS", start: 1627, end: 2486, color: "#10b981", direction: "reverse" },
      { label: "pMB1 ori", type: "rep_origin", start: 900, end: 1500, color: "#f59e0b", direction: "forward" },
    ],
  },
  pGEX: {
    name: "pGEX",
    length: 4969,
    host: "E. coli",
    source: "示例图谱 / pLannotate-ready",
    notes: "GST 融合表达载体，适合讲解标签纯化和诱导表达。",
    features: [
      { label: "tac promoter", type: "promoter", start: 850, end: 940, color: "#2563eb", direction: "forward" },
      { label: "GST", type: "tag", start: 980, end: 1650, color: "#06b6d4", direction: "forward" },
      { label: "MCS", type: "misc_feature", start: 1651, end: 1810, color: "#6b7280", direction: "forward" },
      { label: "AmpR", type: "CDS", start: 3300, end: 4160, color: "#10b981", direction: "reverse" },
      { label: "ori", type: "rep_origin", start: 2450, end: 3100, color: "#f59e0b", direction: "forward" },
    ],
  },
};

export const pathwayCatalog = {
  "cell-cycle": {
    name: "细胞周期",
    reactomeId: "R-HSA-1640170",
    focus: "Cyclin/CDK、Rb/E2F、p53/p21 检查点",
    nodes: [
      { id: "dna-damage", label: "DNA 损伤", type: "signal" },
      { id: "p53", label: "p53", type: "protein" },
      { id: "p21", label: "p21", type: "inhibitor" },
      { id: "cyclin-d", label: "Cyclin D", type: "protein" },
      { id: "cdk46", label: "CDK4/6", type: "protein" },
      { id: "rb", label: "Rb", type: "protein" },
      { id: "e2f", label: "E2F", type: "tf" },
      { id: "s-phase", label: "S 期进入", type: "process" },
    ],
    edges: [
      { from: "dna-damage", to: "p53", type: "activation" },
      { from: "p53", to: "p21", type: "activation" },
      { from: "p21", to: "cdk46", type: "inhibition" },
      { from: "cyclin-d", to: "cdk46", type: "activation" },
      { from: "cdk46", to: "rb", type: "phosphorylation" },
      { from: "rb", to: "e2f", type: "inhibition" },
      { from: "e2f", to: "s-phase", type: "activation" },
    ],
  },
  apoptosis: {
    name: "细胞凋亡",
    reactomeId: "R-HSA-109581",
    focus: "Bax/Bcl-2、线粒体 Cyt c、Caspase 级联",
    nodes: [
      { id: "death-signal", label: "死亡信号", type: "signal" },
      { id: "bax", label: "Bax", type: "protein" },
      { id: "bcl2", label: "Bcl-2", type: "inhibitor" },
      { id: "cytc", label: "Cyt c", type: "protein" },
      { id: "apaf1", label: "Apaf-1", type: "protein" },
      { id: "casp9", label: "Caspase-9", type: "enzyme" },
      { id: "casp3", label: "Caspase-3", type: "enzyme" },
      { id: "apoptosis", label: "凋亡执行", type: "process" },
    ],
    edges: [
      { from: "death-signal", to: "bax", type: "activation" },
      { from: "bcl2", to: "bax", type: "inhibition" },
      { from: "bax", to: "cytc", type: "activation" },
      { from: "cytc", to: "apaf1", type: "activation" },
      { from: "apaf1", to: "casp9", type: "activation" },
      { from: "casp9", to: "casp3", type: "activation" },
      { from: "casp3", to: "apoptosis", type: "activation" },
    ],
  },
  mapk: {
    name: "MAPK 信号通路",
    reactomeId: "R-HSA-5673001",
    focus: "RTK-Ras-Raf-MEK-ERK 磷酸化级联",
    nodes: [
      { id: "gf", label: "生长因子", type: "signal" },
      { id: "rtk", label: "RTK", type: "receptor" },
      { id: "ras", label: "Ras", type: "protein" },
      { id: "raf", label: "Raf", type: "enzyme" },
      { id: "mek", label: "MEK", type: "enzyme" },
      { id: "erk", label: "ERK", type: "enzyme" },
      { id: "tf", label: "转录因子", type: "tf" },
      { id: "proliferation", label: "细胞增殖", type: "process" },
    ],
    edges: [
      { from: "gf", to: "rtk", type: "activation" },
      { from: "rtk", to: "ras", type: "activation" },
      { from: "ras", to: "raf", type: "activation" },
      { from: "raf", to: "mek", type: "phosphorylation" },
      { from: "mek", to: "erk", type: "phosphorylation" },
      { from: "erk", to: "tf", type: "activation" },
      { from: "erk", to: "proliferation", type: "activation" },
    ],
  },
  glycolysis: {
    name: "糖酵解",
    reactomeId: "R-HSA-70171",
    focus: "葡萄糖到丙酮酸、ATP/NADH 能量转换",
    nodes: [
      { id: "glucose", label: "葡萄糖", type: "metabolite" },
      { id: "g6p", label: "G-6-P", type: "metabolite" },
      { id: "f6p", label: "F-6-P", type: "metabolite" },
      { id: "fbp", label: "F-1,6-BP", type: "metabolite" },
      { id: "gap", label: "GAP", type: "metabolite" },
      { id: "pyruvate", label: "丙酮酸", type: "metabolite" },
      { id: "atp", label: "ATP 生成", type: "process" },
    ],
    edges: [
      { from: "glucose", to: "g6p", type: "activation" },
      { from: "g6p", to: "f6p", type: "activation" },
      { from: "f6p", to: "fbp", type: "phosphorylation" },
      { from: "fbp", to: "gap", type: "activation" },
      { from: "gap", to: "pyruvate", type: "activation" },
      { from: "pyruvate", to: "atp", type: "activation" },
    ],
  },
};

export function buildRcsbPdbUrl(pdbId) {
  return `${STRUCTURE_BASES.rcsbPdb}/${String(pdbId).trim().toUpperCase()}.pdb`;
}

export function buildAlphaFoldPdbUrl(accession) {
  const id = String(accession).trim().toUpperCase();
  return `${STRUCTURE_BASES.alphaFoldFiles}/AF-${id}-F1-model_v4.pdb`;
}

export function buildAlphaFoldApiUrl(accession) {
  return `${STRUCTURE_BASES.alphaFoldApi}/${String(accession).trim().toUpperCase()}`;
}

export function buildReactomeQueryUrl(query) {
  const q = encodeURIComponent(String(query).trim());
  return `${STRUCTURE_BASES.reactomeContent}/search/query?query=${q}&species=Homo%20sapiens&pageSize=8`;
}

export function buildReactomePathwayUrl(reactomeId) {
  return `${STRUCTURE_BASES.reactomeContent}/data/query/${String(reactomeId).trim()}`;
}

export function resolveProteinQuery(query) {
  const raw = String(query || "").trim();
  const normalized = raw.toLowerCase();
  const alias = proteinAliases.get(normalized);

  if (alias) {
    return {
      ...alias,
      pdbId: alias.pdbId.toUpperCase(),
      accession: alias.accession.toUpperCase(),
      structureUrl: buildRcsbPdbUrl(alias.pdbId),
      alphaFoldUrl: buildAlphaFoldPdbUrl(alias.accession),
      alphaFoldApiUrl: buildAlphaFoldApiUrl(alias.accession),
    };
  }

  if (/^[0-9][A-Za-z0-9]{3}$/.test(raw)) {
    const pdbId = raw.toUpperCase();
    return {
      id: pdbId.toLowerCase(),
      label: `PDB ${pdbId}`,
      accession: "",
      pdbId,
      organism: "RCSB PDB",
      source: "RCSB PDB",
      confidence: null,
      teachingFocus: "实验解析结构，适合观察链、配体和结构域。",
      structureUrl: buildRcsbPdbUrl(pdbId),
      alphaFoldUrl: "",
      alphaFoldApiUrl: "",
    };
  }

  if (/^[A-Za-z0-9]{5,10}$/.test(raw)) {
    const accession = raw.toUpperCase();
    return {
      id: accession.toLowerCase(),
      label: `UniProt ${accession}`,
      accession,
      pdbId: "",
      organism: "AlphaFold DB",
      source: "AlphaFold DB",
      confidence: null,
      teachingFocus: "预测结构，适合讲解 pLDDT 置信度和预测/实验结构差异。",
      structureUrl: buildAlphaFoldPdbUrl(accession),
      alphaFoldUrl: buildAlphaFoldPdbUrl(accession),
      alphaFoldApiUrl: buildAlphaFoldApiUrl(accession),
    };
  }

  return resolveProteinQuery("GFP");
}

export function sanitizeSequence(input) {
  return String(input || "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function calculateNucleotideStats(input) {
  const raw = sanitizeSequence(input);
  const normalized = raw.replace(/U/g, "T");
  const bases = { A: 0, T: 0, G: 0, C: 0 };
  let invalidCount = 0;

  for (const ch of normalized) {
    if (Object.prototype.hasOwnProperty.call(bases, ch)) {
      bases[ch] += 1;
    } else if (/[A-Z]/.test(ch)) {
      invalidCount += 1;
    }
  }

  const length = bases.A + bases.T + bases.G + bases.C;
  const gc = bases.G + bases.C;
  const at = bases.A + bases.T;
  return {
    sequence: normalized.replace(/[^ATGC]/g, ""),
    length,
    invalidCount,
    bases,
    gc,
    at,
    gcPercent: length ? Number(((gc / length) * 100).toFixed(2)) : 0,
    atPercent: length ? Number(((at / length) * 100).toFixed(2)) : 0,
  };
}

const codonTable = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",
  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",
  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

export function translateDna(input, frame = 0) {
  const seq = calculateNucleotideStats(input).sequence;
  let protein = "";
  for (let i = frame; i + 2 < seq.length; i += 3) {
    protein += codonTable[seq.slice(i, i + 3)] || "X";
  }
  return protein;
}

export function reverseComplement(input) {
  const complement = { A: "T", T: "A", U: "A", G: "C", C: "G", N: "N" };
  return String(input || "")
    .toUpperCase()
    .split("")
    .reverse()
    .map((ch) => complement[ch] || "N")
    .join("");
}

export function estimateTm(seq) {
  const s = calculateNucleotideStats(seq).sequence;
  const { bases, length, gc } = calculateNucleotideStats(s);
  if (!length) return 0;
  if (length < 14) return 2 * (bases.A + bases.T) + 4 * gc;
  return Number((64.9 + (41 * (gc - 16.4)) / length).toFixed(1));
}

export function designPrimerPair(input, primerLength = 20) {
  const seq = calculateNucleotideStats(input).sequence;
  if (seq.length < primerLength * 2) {
    throw new Error("Sequence is too short for primer design");
  }
  const forwardSeq = seq.slice(0, primerLength);
  const reverseSeq = reverseComplement(seq.slice(-primerLength));
  const describe = (sequence) => {
    const stats = calculateNucleotideStats(sequence);
    return {
      sequence,
      tm: estimateTm(sequence),
      gcPercent: stats.gcPercent,
      length: stats.length,
      warning:
        stats.gcPercent < 40
          ? "GC 偏低，可尝试延长 2-3 bp"
          : stats.gcPercent > 60
            ? "GC 偏高，注意二级结构"
            : "GC 与 Tm 位于教学演示推荐范围",
    };
  };
  return {
    forward: describe(forwardSeq),
    reverse: describe(reverseSeq),
    productLength: seq.length,
    tmDelta: Number(Math.abs(estimateTm(forwardSeq) - estimateTm(reverseSeq)).toFixed(1)),
  };
}

export function findRestrictionSites(input) {
  const seq = calculateNucleotideStats(input).sequence;
  const enzymes = [
    { name: "EcoRI", motif: "GAATTC" },
    { name: "BamHI", motif: "GGATCC" },
    { name: "HindIII", motif: "AAGCTT" },
    { name: "XhoI", motif: "CTCGAG" },
    { name: "NdeI", motif: "CATATG" },
  ];

  return enzymes.map((enzyme) => {
    const sites = [];
    let index = seq.indexOf(enzyme.motif);
    while (index !== -1) {
      sites.push(index + 1);
      index = seq.indexOf(enzyme.motif, index + 1);
    }
    return { ...enzyme, sites, count: sites.length };
  });
}

export function predictBlastHits(input) {
  const seq = calculateNucleotideStats(input).sequence;
  const hasGfpMotif = /ATG(GCC|GTG|AGT).{12,}GAATTC/.test(seq);
  return [
    {
      gene: hasGfpMotif ? "EGFP" : "putative coding sequence",
      organism: hasGfpMotif ? "Aequorea victoria" : "Synthetic construct",
      identity: hasGfpMotif ? "98.7%" : "87.4%",
      eValue: hasGfpMotif ? "0.0" : "3e-42",
      note: hasGfpMotif ? "命中 GFP 教学示例，可继续讨论荧光报告基因。" : "演示 BLAST+ 输出字段，生产环境可替换为本地 BLAST 数据库。",
    },
    {
      gene: hasGfpMotif ? "GFPuv" : "hypothetical protein",
      organism: hasGfpMotif ? "Aequorea victoria" : "Bacterial expression vector",
      identity: hasGfpMotif ? "95.2%" : "71.8%",
      eValue: hasGfpMotif ? "2e-180" : "2e-18",
      note: "用于课堂解释 identity、coverage、E-value 的意义。",
    },
  ];
}

export function parseGenBankFeatures(text, sequenceLength = 0) {
  const features = [];
  const lines = String(text || "").split(/\r?\n/);
  let current = null;
  const featureLine = /^\s{5}([A-Za-z_][\w-]*)\s+(.+)$/;
  const qualifierLine = /^\s+\/(label|gene|product|note)="?([^"]+)"?/;

  const flush = () => {
    if (!current || current.key === "source") return;
    if (!current.start || !current.end) return;
    const label = current.label || current.gene || current.product || current.key;
    features.push({
      label,
      type: current.key,
      start: current.start,
      end: current.end,
      direction: current.direction,
      color: colorForFeature(current.key, label),
    });
  };

  for (const line of lines) {
    const match = line.match(featureLine);
    if (match) {
      flush();
      const [, key, location] = match;
      const direction = location.includes("complement") ? "reverse" : "forward";
      const range = location.match(/(\d+)\.\.(\d+)/);
      current = {
        key,
        start: range ? Number(range[1]) : 0,
        end: range ? Number(range[2]) : 0,
        direction,
      };
      continue;
    }

    const q = line.match(qualifierLine);
    if (q && current) {
      current[q[1]] = q[2].trim();
    }
  }
  flush();

  if (features.length) return features;
  const length = sequenceLength || calculateNucleotideStats(text).length || 3000;
  return [
    { label: "uploaded sequence", type: "source", start: 1, end: length, direction: "forward", color: "#64748b" },
  ];
}

function colorForFeature(type, label) {
  const token = `${type} ${label}`.toLowerCase();
  if (token.includes("ori") || token.includes("origin")) return "#f59e0b";
  if (token.includes("ampr") || token.includes("kanr") || token.includes("resistance")) return "#10b981";
  if (token.includes("promoter")) return "#2563eb";
  if (token.includes("terminator")) return "#dc2626";
  if (token.includes("tag")) return "#06b6d4";
  if (token.includes("mcs")) return "#6b7280";
  if (type.toLowerCase() === "cds") return "#8b5cf6";
  return "#64748b";
}

export function circularFeaturePath(feature, length, radius = 140, center = 200) {
  const startAngle = ((feature.start - 1) / length) * 360 - 90;
  const endAngle = (feature.end / length) * 360 - 90;
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const start = polarToCartesian(center, center, radius, endAngle);
  const end = polarToCartesian(center, center, radius, startAngle);
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function toCytoscapeElements(pathway) {
  return [
    ...pathway.nodes.map((node) => ({
      data: { id: node.id, label: node.label, type: node.type || "node" },
    })),
    ...pathway.edges.map((edge) => ({
      data: {
        id: `${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        interaction: edge.type,
        label: edge.type === "phosphorylation" ? "磷酸化" : edge.type === "inhibition" ? "抑制" : "激活",
      },
    })),
  ];
}

