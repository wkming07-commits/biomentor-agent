const STRUCTURE_BASES = {
  rcsbPdb: "https://files.rcsb.org/download",
  alphaFoldFiles: "https://alphafold.ebi.ac.uk/files",
  alphaFoldApi: "https://alphafold.ebi.ac.uk/api/prediction",
  uniProtSearch: "https://rest.uniprot.org/uniprotkb/search",
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
    {
      keys: ["tp53", "p53", "tumor protein p53"],
      value: {
        id: "tp53",
        label: "肿瘤抑制蛋白 p53",
        accession: "P04637",
        pdbId: "1TUP",
        organism: "Homo sapiens",
        source: "AlphaFold DB + RCSB PDB",
        confidence: 88.6,
        teachingFocus: "DNA 结合结构域、四聚化、突变热点与细胞周期检查点",
      },
    },
    {
      keys: ["胃蛋白酶", "pepsin", "pepsin a", "pga3"],
      value: {
        id: "pepsin-a",
        label: "胃蛋白酶 Pepsin A",
        accession: "P00790",
        pdbId: "1PSO",
        organism: "Homo sapiens",
        source: "UniProtKB/Swiss-Prot + RCSB PDB",
        confidence: 92.4,
        teachingFocus: "酸性蛋白酶、催化天冬氨酸、胃内蛋白质消化与活性位点",
      },
    },
  ].flatMap(({ keys, value }) => keys.map((key) => [key, value])),
);

const proteinKeywordAliases = new Map([
  ["胃蛋白酶", "pepsin"],
  ["胰岛素", "insulin"],
  ["血红蛋白", "hemoglobin"],
  ["绿色荧光蛋白", "green fluorescent protein"],
  ["肿瘤抑制蛋白", "tumor protein p53"],
]);

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
  "dna-repair": {
    name: "DNA 修复",
    reactomeId: "R-HSA-73894",
    focus: "DNA 损伤识别、检查点激活、同源重组与切除修复",
    nodes: [
      { id: "damage", label: "DNA 损伤", type: "signal" },
      { id: "atm-atr", label: "ATM/ATR", type: "enzyme" },
      { id: "chk", label: "Chk1/2", type: "enzyme" },
      { id: "p53", label: "p53", type: "protein" },
      { id: "brca", label: "BRCA1/2", type: "protein" },
      { id: "hr", label: "同源重组", type: "process" },
      { id: "ner", label: "切除修复", type: "process" },
      { id: "stability", label: "基因组稳定", type: "process" },
    ],
    edges: [
      { from: "damage", to: "atm-atr", type: "activation" },
      { from: "atm-atr", to: "chk", type: "phosphorylation" },
      { from: "chk", to: "p53", type: "activation" },
      { from: "atm-atr", to: "brca", type: "phosphorylation" },
      { from: "brca", to: "hr", type: "activation" },
      { from: "damage", to: "ner", type: "activation" },
      { from: "hr", to: "stability", type: "activation" },
      { from: "ner", to: "stability", type: "activation" },
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

export function normalizeProteinKeyword(query) {
  const raw = String(query || "").trim();
  return proteinKeywordAliases.get(raw) || raw;
}

export function buildUniProtKeywordSearchUrl(query) {
  const keyword = normalizeProteinKeyword(query);
  const params = new URLSearchParams({
    query: `(${keyword}) AND (reviewed:true OR organism_id:9606)`,
    fields: "accession,id,protein_name,gene_names,organism_name,reviewed,structure_3d",
    format: "json",
    size: "8",
  });
  return `${STRUCTURE_BASES.uniProtSearch}?${params.toString()}`;
}

function isStrictUniProtAccession(value) {
  const raw = String(value || "").trim().toUpperCase();
  return /^[OPQ][0-9][A-Z0-9]{3}[0-9]$/.test(raw) || /^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/.test(raw);
}

export function mapUniProtEntryToProteinCandidate(entry) {
  const accession = String(entry?.primaryAccession || entry?.uniProtkbId || "").toUpperCase();
  const name =
    entry?.proteinDescription?.recommendedName?.fullName?.value ||
    entry?.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
    entry?.uniProtkbId ||
    accession;
  const gene = entry?.genes?.[0]?.geneName?.value || entry?.genes?.[0]?.orderedLocusNames?.[0]?.value || "";
  const organism = entry?.organism?.scientificName || entry?.organism?.commonName || "";
  const pdbRefs = Array.isArray(entry?.uniProtKBCrossReferences)
    ? entry.uniProtKBCrossReferences.filter((ref) => ref?.database === "PDB")
    : [];
  const pdbId = pdbRefs[0]?.id ? String(pdbRefs[0].id).toUpperCase() : "";
  const reviewed = String(entry?.entryType || "").toLowerCase().includes("reviewed") || entry?.reviewed === true;
  const hasExperimentalStructure = Boolean(pdbId);

  return {
    id: accession ? `uniprot-${accession.toLowerCase()}` : slugForProtein(name),
    label: name,
    geneName: gene,
    accession,
    pdbId: pdbId || undefined,
    organism,
    reviewed,
    source: hasExperimentalStructure ? "UniProtKB + RCSB PDB" : "UniProtKB + AlphaFold DB",
    sourceKind: hasExperimentalStructure ? "experimental" : "predicted",
    sourceLabel: hasExperimentalStructure ? "RCSB PDB 实验结构" : "AlphaFold 预测结构",
    confidence: null,
    teachingFocus: hasExperimentalStructure
      ? "该候选关联了实验解析结构，可直接进入三维结构观察。"
      : "该候选暂无 PDB 实验结构，将优先尝试 AlphaFold 预测模型。",
    structureUrl: hasExperimentalStructure ? buildRcsbPdbUrl(pdbId) : buildAlphaFoldPdbUrl(accession),
    alphaFoldUrl: accession ? buildAlphaFoldPdbUrl(accession) : "",
    alphaFoldApiUrl: accession ? buildAlphaFoldApiUrl(accession) : "",
    uniprotUrl: accession ? `https://www.uniprot.org/uniprotkb/${accession}/entry` : "",
    rcsbUrl: pdbId ? `https://www.rcsb.org/structure/${pdbId}` : "",
    matchType: "uniprot",
  };
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

export function searchProteinCandidates(query) {
  const raw = String(query || "").trim();
  if (!raw) return [];

  if (/^[0-9][A-Za-z0-9]{3}$/.test(raw)) {
    const pdbId = raw.toUpperCase();
    return [
      {
        id: pdbId.toLowerCase(),
        label: `PDB ${pdbId}`,
        accession: "",
        pdbId,
        organism: "RCSB PDB",
        source: "实验结构",
        sourceKind: "experimental",
        confidence: null,
        teachingFocus: "实验解析结构，适合观察链、配体、结构域和构象。",
        structureUrl: buildRcsbPdbUrl(pdbId),
        alphaFoldUrl: "",
        alphaFoldApiUrl: "",
        matchType: "pdb",
      },
    ];
  }

  const q = raw.toLowerCase();
  const unique = [...new Map([...proteinAliases.values()].map((value) => [value.id, value])).values()];
  const matches = unique.filter((record) => {
    const haystack = [
      record.id,
      record.label,
      record.accession,
      record.pdbId,
      record.organism,
      record.teachingFocus,
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  if (matches.length > 0) {
    return matches.map((record) => ({
      ...record,
      pdbId: record.pdbId.toUpperCase(),
      accession: record.accession.toUpperCase(),
      reviewed: record.reviewed ?? Boolean(record.accession),
      sourceKind: record.pdbId ? "experimental" : "predicted",
      sourceLabel: record.pdbId ? "RCSB PDB 实验结构" : "AlphaFold 预测结构",
      structureUrl: buildRcsbPdbUrl(record.pdbId),
      alphaFoldUrl: buildAlphaFoldPdbUrl(record.accession),
      alphaFoldApiUrl: buildAlphaFoldApiUrl(record.accession),
      matchType: "curated",
    }));
  }

  if (isStrictUniProtAccession(raw)) {
    const accession = raw.toUpperCase();
    const curated = [...new Map([...proteinAliases.values()].map((v) => [v.id, v])).values()]
      .find((record) => record.accession.toUpperCase() === accession);
    const base = curated || {
      id: accession.toLowerCase(),
      label: `UniProt ${accession}`,
      accession,
      pdbId: "",
      organism: "AlphaFold DB",
      source: "预测结构",
      confidence: null,
      teachingFocus: "预测结构，适合讲解 pLDDT 置信度和预测/实验结构差异。",
    };
    return [
      {
        ...base,
        accession,
        pdbId: curated?.pdbId ? curated.pdbId.toUpperCase() : base.pdbId,
        source: curated ? "UniProtKB/Swiss-Prot + RCSB PDB" : "预测结构",
        sourceKind: curated?.pdbId ? "experimental" : "predicted",
        sourceLabel: curated?.pdbId ? "RCSB PDB 实验结构" : "AlphaFold 预测结构",
        structureUrl: curated?.pdbId ? buildRcsbPdbUrl(curated.pdbId) : buildAlphaFoldPdbUrl(accession),
        alphaFoldUrl: buildAlphaFoldPdbUrl(accession),
        alphaFoldApiUrl: buildAlphaFoldApiUrl(accession),
        rcsbUrl: curated?.pdbId ? `https://www.rcsb.org/structure/${curated.pdbId.toUpperCase()}` : "",
        matchType: curated ? "curated" : "uniprot",
      },
    ];
  }

  return [];
}

function slugForProtein(value) {
  return String(value || "protein")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "") || "protein";
}

export function sanitizeSequence(input) {
  return String(input || "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\d+/g, "")
    .replace(/[^A-Z*]/g, "");
}

export function detectSequenceType(input) {
  const seq = sanitizeSequence(input);
  if (!seq) return "Invalid";
  const letters = seq.replace(/[^A-Z*]/g, "");
  if (!letters) return "Invalid";
  const dnaLike = /^[ATGCN]+$/.test(letters);
  const rnaLike = /^[AUGCN]+$/.test(letters) && letters.includes("U") && !letters.includes("T");
  const proteinLike = /^[ABCDEFGHIKLMNPQRSTVWXYZ*]+$/.test(letters) && /[EFILPQZ*]/.test(letters);
  if (rnaLike) return "RNA";
  if (dnaLike) return "DNA";
  if (proteinLike) return "Protein";
  return "Mixed";
}

export function transcribeDnaToRna(input) {
  return calculateNucleotideStats(input).sequence.replace(/T/g, "U");
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

export function findOpenReadingFrames(input, minCodons = 2) {
  const seq = calculateNucleotideStats(input).sequence;
  const stops = new Set(["TAA", "TAG", "TGA"]);
  const orfs = [];

  for (let frame = 0; frame < 3; frame += 1) {
    for (let i = frame; i + 2 < seq.length; i += 3) {
      if (seq.slice(i, i + 3) !== "ATG") continue;
      let end = seq.length - ((seq.length - i) % 3);
      let complete = false;
      for (let j = i + 3; j + 2 < seq.length; j += 3) {
        if (stops.has(seq.slice(j, j + 3))) {
          end = j + 3;
          complete = true;
          break;
        }
      }
      const length = end - i;
      if (length / 3 >= minCodons) {
        orfs.push({
          frame: frame + 1,
          start: i + 1,
          end,
          length,
          protein: translateDna(seq.slice(i, end)),
          complete,
        });
      }
    }
  }

  return orfs.sort((a, b) => b.length - a.length || a.start - b.start);
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
    { name: "NotI", motif: "GCGGCCGC" },
    { name: "SalI", motif: "GTCGAC" },
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

export function describeFeature(feature) {
  const token = `${feature?.type || ""} ${feature?.label || ""}`.toLowerCase();
  if (token.includes("ori") || token.includes("origin") || token.includes("rep_origin")) {
    return "复制起点决定质粒能否在宿主细胞中复制，以及常见情况下的拷贝数和宿主范围。";
  }
  if (token.includes("ampr") || token.includes("kanr") || token.includes("resistance") || token.includes("抗性")) {
    return "抗性基因用于在含抗生素培养基中筛选成功携带质粒的细胞。";
  }
  if (token.includes("promoter")) {
    return "启动子控制下游基因表达，是表达载体设计中决定表达强度和诱导方式的核心元件。";
  }
  if (token.includes("mcs") || token.includes("multiple cloning")) {
    return "多克隆位点包含多个限制性内切酶位点，方便插入外源片段并设计定向克隆。";
  }
  if (token.includes("tag") || token.includes("his") || token.includes("gst")) {
    return "标签序列常用于蛋白纯化、检测或定位，但需要注意是否影响目标蛋白功能。";
  }
  if (token.includes("terminator")) {
    return "终止子帮助转录正确结束，减少读穿转录对载体稳定性和表达结果的影响。";
  }
  if (token.includes("cds")) {
    return "编码序列会被转录和翻译为蛋白，需要检查读框、起止密码子和插入方向。";
  }
  return "该元件是质粒图谱中的功能区域，可结合坐标、方向和上下游元件判断其在实验设计中的作用。";
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

export function getPathwayLearningPath(pathwayKeyOrRecord) {
  const pathway =
    typeof pathwayKeyOrRecord === "string"
      ? pathwayCatalog[pathwayKeyOrRecord]
      : pathwayKeyOrRecord;
  if (!pathway) return [];

  const incoming = new Map(pathway.nodes.map((node) => [node.id, 0]));
  for (const edge of pathway.edges) {
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
  }

  const start = pathway.nodes.find((node) => (incoming.get(node.id) || 0) === 0) || pathway.nodes[0];
  const path = [];
  const visited = new Set();
  let current = start;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.push({
      id: current.id,
      label: current.label,
      reason: explainPathwayNode(current, pathway),
    });
    const nextEdge = pathway.edges.find((edge) => edge.from === current.id && !visited.has(edge.to));
    current = nextEdge ? pathway.nodes.find((node) => node.id === nextEdge.to) : null;
  }

  return path;
}

export function explainPathwayNode(node, pathway) {
  const label = node?.label || "该节点";
  if (/p53|p21|chk|checkpoint|检查点/i.test(label)) {
    return `${label} 是通路中的检查点/调控节点，适合优先理解信号如何转化为细胞命运决策。`;
  }
  if (/damage|损伤|death|死亡|gf|生长因子/i.test(label)) {
    return `${label} 是上游输入信号，先理解它能帮助判断通路为什么被启动。`;
  }
  if (/phase|凋亡|增殖|atp|稳定|process|执行|生成/i.test(label)) {
    return `${label} 是通路输出结果，适合用来连接表型、疾病和实验观察。`;
  }
  return `${label} 是 ${pathway?.name || "该通路"} 中的关键节点，建议结合上下游边理解激活、抑制或磷酸化关系。`;
}

export function calculateProteinStats(input) {
  const seq = sanitizeSequence(input);
  const standard = "ACDEFGHIKLMNPQRSTVWY";
  const hydrophobic = new Set(["A", "V", "I", "L", "M", "F", "W", "Y", "P"]);
  const weights = {
    A: 89.09, C: 121.15, D: 133.10, E: 147.13, F: 165.19,
    G: 75.07, H: 155.16, I: 131.17, K: 146.19, L: 131.17,
    M: 149.21, N: 132.12, P: 115.13, Q: 146.15, R: 174.20,
    S: 105.09, T: 119.12, V: 117.15, W: 204.23, Y: 181.19,
  };
  const composition = {};
  let length = 0;
  let invalidCount = 0;
  let hydrophobicCount = 0;
  let totalWeight = 0;

  for (const ch of seq) {
    if (standard.includes(ch)) {
      length += 1;
      composition[ch] = (composition[ch] || 0) + 1;
      totalWeight += weights[ch] || 0;
      if (hydrophobic.has(ch)) hydrophobicCount += 1;
    } else if (/[A-Z]/.test(ch)) {
      invalidCount += 1;
    }
  }

  return {
    sequence: seq,
    length,
    invalidCount,
    composition,
    molecularWeight: Math.round(totalWeight),
    hydrophobicPercent: length > 0 ? Math.round((hydrophobicCount / length) * 100 * 10) / 10 : 0,
  };
}

export function detectPlasmidInputKind(text) {
  const input = String(text || "").trim();
  if (!input) return "empty";
  if (/LOCUS\s+/i.test(input) && /FEATURES/i.test(input)) return "genbank";
  if (/^\s*>\s*\S/.test(input)) return "fasta";
  if (/^[ATGCNatgcn\s]+$/.test(input)) return "raw-sequence";
  return "unknown";
}

const commonPathwayCandidates = [
  {
    id: "common-pi3k-akt",
    name: "PI3K-AKT signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：覆盖 PI3K、AKT、mTOR、生长因子受体与细胞存活/代谢调控，适合作为机制解释和 Reactome 深入检索入口。",
    reactomeUrl: "https://reactome.org/content/query?q=PI3K%20AKT",
    aliases: ["pi3k", "akt", "pi3k-akt", "pi3k akt", "mtor", "pkb"],
  },
  {
    id: "common-wnt",
    name: "Wnt signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：围绕 Wnt、Frizzled、β-catenin 与发育/肿瘤相关转录调控展开。",
    reactomeUrl: "https://reactome.org/content/query?q=Wnt%20signaling",
    aliases: ["wnt", "beta-catenin", "β-catenin", "ctnnb1"],
  },
  {
    id: "common-notch",
    name: "Notch signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：围绕 Notch 受体、配体、剪切释放 NICD 和细胞命运决定展开。",
    reactomeUrl: "https://reactome.org/content/query?q=Notch%20signaling",
    aliases: ["notch", "nicd", "delta", "jagged"],
  },
  {
    id: "common-tca",
    name: "TCA / Citric acid cycle",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：连接丙酮酸、乙酰辅酶 A、柠檬酸循环、NADH/FADH2 与能量代谢。",
    reactomeUrl: "https://reactome.org/content/query?q=Citric%20acid%20cycle",
    aliases: ["tca", "citric acid", "citric acid cycle", "krebs", "krebs cycle", "三羧酸", "柠檬酸循环"],
  },
  {
    id: "common-jak-stat",
    name: "JAK-STAT signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：细胞因子受体、JAK 激酶和 STAT 转录因子构成的免疫/炎症信号轴。",
    reactomeUrl: "https://reactome.org/content/query?q=JAK%20STAT",
    aliases: ["jak", "stat", "jak-stat", "jak stat"],
  },
  {
    id: "common-tgf-beta",
    name: "TGF-beta signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：TGF-beta 受体、SMAD 转录调控和发育/纤维化/肿瘤微环境相关机制。",
    reactomeUrl: "https://reactome.org/content/query?q=TGF-beta%20signaling",
    aliases: ["tgf", "tgf-beta", "tgfb", "smad"],
  },
  {
    id: "common-nfkb",
    name: "NF-kB signaling pathway",
    species: "Homo sapiens",
    source: "reactome",
    description: "公共通路候选：炎症、免疫激活和细胞应激中的 NF-kB 转录调控网络。",
    reactomeUrl: "https://reactome.org/content/query?q=NF-kB%20signaling",
    aliases: ["nfkb", "nf-kb", "nf kappa b", "nuclear factor kappa"],
  },
];

export function getCommonPathwayCandidates(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return commonPathwayCandidates
    .filter((candidate) => {
      const text = [candidate.name, candidate.description, ...candidate.aliases].join(" ").toLowerCase();
      return text.includes(q) || candidate.aliases.some((alias) => alias.includes(q) || q.includes(alias));
    })
    .map(({ aliases, ...candidate }) => candidate);
}

export function matchLocalPathway(query) {
  const q = String(query || "").trim().toLowerCase();
  const aliases = {
    "cell-cycle": ["cell cycle", "细胞周期", "p53", "p21", "cdk", "cyclin"],
    apoptosis: ["apoptosis", "凋亡", "bax", "bcl2", "caspase"],
    mapk: ["mapk", "egfr", "erk", "mek", "ras", "raf", "rtk"],
    glycolysis: ["glycolysis", "糖酵解", "glucose", "pyruvate", "atp"],
    "dna-repair": ["dna repair", "dna修复", "dna 修复", "brca", "atm", "atr", "chk"],
  };
  for (const [key, keywords] of Object.entries(aliases)) {
    if (keywords.some((kw) => q.includes(kw) || kw.includes(q))) {
      return key;
    }
  }
  return null;
}
