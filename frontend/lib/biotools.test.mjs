import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAlphaFoldPdbUrl,
  buildRcsbPdbUrl,
  calculateNucleotideStats,
  designPrimerPair,
  parseGenBankFeatures,
  resolveProteinQuery,
  reverseComplement,
  toCytoscapeElements,
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

test("calculates nucleotide stats and translates coding DNA", () => {
  const stats = calculateNucleotideStats(">demo\nATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAGNN");
  assert.equal(stats.length, 39);
  assert.equal(stats.invalidCount, 2);
  assert.equal(stats.gcPercent, 56.41);
  assert.equal(translateDna("ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG"), "MAIVMGR*KGAR*");
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
