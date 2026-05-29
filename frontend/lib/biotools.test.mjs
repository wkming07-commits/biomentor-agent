import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAlphaFoldPdbUrl,
  buildRcsbPdbUrl,
  buildUniProtKeywordSearchUrl,
  calculateNucleotideStats,
  calculateProteinStats,
  describeFeature,
  detectPlasmidInputKind,
  detectSequenceType,
  designPrimerPair,
  findOpenReadingFrames,
  findRestrictionSites,
  getPathwayLearningPath,
  matchLocalPathway,
  parseGenBankFeatures,
  resolveProteinQuery,
  reverseComplement,
  sanitizeSequence,
  searchProteinCandidates,
  mapUniProtEntryToProteinCandidate,
  toCytoscapeElements,
  transcribeDnaToRna,
  translateDna,
} from "./biotools.mjs";

test("builds canonical structure provider URLs", () => {
  assert.equal(
    buildRcsbPdbUrl("4hhb"),
    "https://files.rcsb.org/download/4HHB.pdb",
  );
  assert.equal(
    buildAlphaFoldPdbUrl("p42212"),
    "https://alphafold.ebi.ac.uk/files/AF-P42212-F1-model_v4.pdb",
  );
});

test("resolves showcase protein names to teachable structure records", () => {
  const gfp = resolveProteinQuery("GFP");
  assert.equal(gfp.accession, "P42212");
  assert.equal(gfp.pdbId, "1GFL");
  assert.equal(gfp.source, "AlphaFold DB + RCSB PDB");

  const hemoglobin = resolveProteinQuery("4hhb");
  assert.equal(hemoglobin.pdbId, "4HHB");
  assert.equal(hemoglobin.structureUrl, "https://files.rcsb.org/download/4HHB.pdb");
});

test("returns searchable protein candidates instead of a single hardcoded result", () => {
  const cas9 = searchProteinCandidates("cas9");
  assert.ok(cas9.length >= 1);
  assert.equal(cas9[0].pdbId, "4OO8");
  assert.equal(cas9[0].matchType, "curated");

  const pdb = searchProteinCandidates("4hhb");
  assert.equal(pdb[0].sourceKind, "experimental");
  assert.equal(pdb[0].structureUrl, "https://files.rcsb.org/download/4HHB.pdb");

  const accession = searchProteinCandidates("P42212");
  assert.equal(accession[0].sourceKind, "predicted");
  assert.equal(accession[0].accession, "P42212");
});

test("supports Chinese protein aliases and does not fall back to unrelated demos", () => {
  const pepsin = searchProteinCandidates("胃蛋白酶");
  assert.ok(pepsin.length >= 1);
  assert.match(pepsin[0].label, /胃蛋白酶|Pepsin/i);
  assert.equal(pepsin[0].accession, "P00790");
  assert.equal(pepsin[0].sourceKind, "experimental");

  const unknown = searchProteinCandidates("not-a-real-protein-name-xyz");
  assert.deepEqual(unknown, []);
});

test("builds UniProt keyword search URLs and maps remote entries to structure candidates", () => {
  const url = buildUniProtKeywordSearchUrl("pepsin");
  assert.match(url, /^https:\/\/rest\.uniprot\.org\/uniprotkb\/search\?/);
  assert.match(url, /query=/);
  assert.match(url, /fields=/);

  const candidate = mapUniProtEntryToProteinCandidate({
    primaryAccession: "P00790",
    entryType: "UniProtKB reviewed (Swiss-Prot)",
    proteinDescription: {
      recommendedName: { fullName: { value: "Pepsin A" } },
    },
    genes: [{ geneName: { value: "PGA3" } }],
    organism: { scientificName: "Homo sapiens" },
    uniProtKBCrossReferences: [{ database: "PDB", id: "1PSO" }],
  });

  assert.equal(candidate.accession, "P00790");
  assert.equal(candidate.pdbId, "1PSO");
  assert.equal(candidate.sourceKind, "experimental");
  assert.equal(candidate.structureUrl, "https://files.rcsb.org/download/1PSO.pdb");
});

test("calculates nucleotide stats and translates coding DNA", () => {
  const stats = calculateNucleotideStats(">demo\nATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAGNN");
  assert.equal(stats.length, 39);
  assert.equal(stats.invalidCount, 2);
  assert.equal(stats.gcPercent, 56.41);
  assert.equal(translateDna("ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG"), "MAIVMGR*KGAR*");
});

test("detects sequence type and exposes common transformations", () => {
  assert.equal(detectSequenceType(">demo\nAUGGCCUUU"), "RNA");
  assert.equal(detectSequenceType("ATGGCCATTGTA"), "DNA");
  assert.equal(detectSequenceType("MKWVTFISLL"), "Protein");
  assert.equal(transcribeDnaToRna("ATGTTT"), "AUGUUU");
  assert.equal(reverseComplement("ATGC"), "GCAT");
});

test("finds explainable open reading frames across forward frames", () => {
  const orfs = findOpenReadingFrames("CCCATGAAATAGATGCCCCCTAA");
  assert.ok(orfs.length >= 2);
  assert.deepEqual(
    orfs[0],
    {
      frame: 1,
      start: 4,
      end: 12,
      length: 9,
      protein: "MK*",
      complete: true,
    },
  );
});

test("designs an explainable primer pair from a target sequence", () => {
  const seq = "ATGGCCGTGAAGCTGGAATCTTTCGTGCTGAGCTTCGTGCTGATCGCTAGCTAGCTAA";
  const pair = designPrimerPair(seq);
  assert.equal(pair.forward.sequence, "ATGGCCGTGAAGCTGGAATC");
  assert.equal(pair.reverse.sequence, reverseComplement(seq.slice(-20)));
  assert.equal(pair.productLength, seq.length);
  assert.ok(pair.forward.tm >= 50);
  assert.ok(pair.reverse.gcPercent >= 40);
});

test("parses GenBank feature ranges into plasmid annotations", () => {
  const gb = `FEATURES             Location/Qualifiers
     source          1..4361
     rep_origin      2530..3130
                     /label="pMB1 ori"
     CDS             complement(3290..4150)
                     /gene="AmpR"
     promoter        10..120
                     /label="T7 promoter"`;
  const features = parseGenBankFeatures(gb, 4361);
  assert.deepEqual(
    features.map((f) => [f.label, f.start, f.end, f.direction]),
    [
      ["pMB1 ori", 2530, 3130, "forward"],
      ["AmpR", 3290, 4150, "reverse"],
      ["T7 promoter", 10, 120, "forward"],
    ],
  );
});

test("describes plasmid features in teaching language", () => {
  assert.match(describeFeature({ label: "ori", type: "rep_origin" }), /复制/);
  assert.match(describeFeature({ label: "KanR", type: "CDS" }), /筛选/);
  assert.match(describeFeature({ label: "T7 promoter", type: "promoter" }), /表达/);
});

test("converts pathway nodes and edges to Cytoscape.js elements", () => {
  const elements = toCytoscapeElements({
    nodes: [
      { id: "p53", label: "p53" },
      { id: "p21", label: "p21" },
    ],
    edges: [{ from: "p53", to: "p21", type: "activation" }],
  });
  assert.deepEqual(elements.map((el) => el.data.id), ["p53", "p21", "p53-p21"]);
  assert.equal(elements[2].data.interaction, "activation");
});

test("builds pathway learning paths from pathway catalog metadata", () => {
  const steps = getPathwayLearningPath("cell-cycle");
  assert.deepEqual(steps.slice(0, 3).map((step) => step.label), ["DNA 损伤", "p53", "p21"]);
  assert.match(steps[1].reason, /检查点|调控/);
});

test("sanitizeSequence strips headers, spaces, digits and lowercases", () => {
  assert.equal(
    sanitizeSequence(">seq1\n1 atg gcc 2\nGAATTC"),
    "ATGGCCGAATTC",
  );
});

test("findRestrictionSites detects NotI, SalI and EcoRI in a test sequence", () => {
  const results = findRestrictionSites("GCGGCCGCGTCGACGAATTC");
  const notI = results.find((r) => r.name === "NotI");
  const salI = results.find((r) => r.name === "SalI");
  const ecoRI = results.find((r) => r.name === "EcoRI");
  assert.ok(notI.sites.includes(1));
  assert.ok(salI.sites.includes(9));
  assert.ok(ecoRI.sites.includes(15));
});

test("calculateProteinStats computes length, molecular weight, hydrophobicity and invalid count", () => {
  const stats = calculateProteinStats("MKWVTFISLLFLFSSAYSRGVFRRDTHKSEIAHRFKDLGE");
  assert.equal(stats.length, 40);
  assert.ok(stats.molecularWeight > 4000);
  assert.ok(stats.hydrophobicPercent > 0);
  assert.equal(stats.invalidCount, 0);
});

test("detectPlasmidInputKind classifies genbank, fasta and raw-sequence", () => {
  assert.equal(
    detectPlasmidInputKind("LOCUS   pBR322\nFEATURES"),
    "genbank",
  );
  assert.equal(
    detectPlasmidInputKind(">seq\nATGC"),
    "fasta",
  );
  assert.equal(
    detectPlasmidInputKind("ATGCATGC"),
    "raw-sequence",
  );
});

test("matchLocalPathway maps query strings to local pathway keys", () => {
  assert.equal(matchLocalPathway("MAPK"), "mapk");
  assert.equal(matchLocalPathway("glycolysis"), "glycolysis");
  assert.equal(matchLocalPathway("EGFR"), "mapk");
});
