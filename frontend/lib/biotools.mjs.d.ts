export interface ProteinRecord {
  id: string;
  label: string;
  accession: string;
  pdbId: string;
  organism: string;
  source: string;
  confidence: number | null;
  teachingFocus: string;
  structureUrl: string;
  alphaFoldUrl: string;
  alphaFoldApiUrl: string;
}

export interface ProteinCandidate extends ProteinRecord {
  sourceKind: "experimental" | "predicted" | "curated";
  matchType: "pdb" | "uniprot" | "curated";
}

export interface NucleotideStats {
  sequence: string;
  length: number;
  invalidCount: number;
  bases: Record<"A" | "T" | "G" | "C", number>;
  gc: number;
  at: number;
  gcPercent: number;
  atPercent: number;
}

export interface PrimerInfo {
  sequence: string;
  tm: number;
  gcPercent: number;
  length: number;
  warning: string;
}

export interface PrimerPair {
  forward: PrimerInfo;
  reverse: PrimerInfo;
  productLength: number;
  tmDelta: number;
}

export interface PlasmidFeature {
  label: string;
  type: string;
  start: number;
  end: number;
  color: string;
  direction: "forward" | "reverse";
}

export interface PlasmidRecord {
  name: string;
  length: number;
  host: string;
  source: string;
  notes: string;
  features: PlasmidFeature[];
}

export interface PathwayNode {
  id: string;
  label: string;
  type?: string;
}

export interface PathwayEdge {
  from: string;
  to: string;
  type: "activation" | "inhibition" | "phosphorylation";
}

export interface PathwayRecord {
  name: string;
  reactomeId: string;
  focus: string;
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}

export interface OpenReadingFrame {
  frame: number;
  start: number;
  end: number;
  length: number;
  protein: string;
  complete: boolean;
}

export interface PathwayLearningStep {
  id: string;
  label: string;
  reason: string;
}

export const sampleDnaSequence: string;
export const plasmidExamples: Record<string, PlasmidRecord>;
export const pathwayCatalog: Record<string, PathwayRecord>;

export function buildRcsbPdbUrl(pdbId: string): string;
export function buildAlphaFoldPdbUrl(accession: string): string;
export function buildAlphaFoldApiUrl(accession: string): string;
export function buildReactomeQueryUrl(query: string): string;
export function buildReactomePathwayUrl(reactomeId: string): string;
export function resolveProteinQuery(query: string): ProteinRecord;
export function searchProteinCandidates(query: string): ProteinCandidate[];
export function sanitizeSequence(input: string): string;
export function detectSequenceType(input: string): "DNA" | "RNA" | "Protein" | "Mixed" | "Invalid";
export function transcribeDnaToRna(input: string): string;
export function calculateNucleotideStats(input: string): NucleotideStats;
export function translateDna(input: string, frame?: number): string;
export function findOpenReadingFrames(input: string, minCodons?: number): OpenReadingFrame[];
export function reverseComplement(input: string): string;
export function estimateTm(seq: string): number;
export function designPrimerPair(input: string, primerLength?: number): PrimerPair;
export function findRestrictionSites(input: string): Array<{
  name: string;
  motif: string;
  sites: number[];
  count: number;
}>;
export function predictBlastHits(input: string): Array<{
  gene: string;
  organism: string;
  identity: string;
  eValue: string;
  note: string;
}>;
export function parseGenBankFeatures(text: string, sequenceLength?: number): PlasmidFeature[];
export function describeFeature(feature: Partial<PlasmidFeature>): string;
export function circularFeaturePath(
  feature: Pick<PlasmidFeature, "start" | "end">,
  length: number,
  radius?: number,
  center?: number,
): string;
export function toCytoscapeElements(pathway: {
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}): Array<{ data: Record<string, string> }>;
export function getPathwayLearningPath(pathwayKeyOrRecord: string | PathwayRecord): PathwayLearningStep[];
export function explainPathwayNode(node: PathwayNode, pathway?: PathwayRecord): string;
