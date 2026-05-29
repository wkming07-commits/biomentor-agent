export type DefenseSourceType =
  | "manual"
  | "file"
  | "knowledge_map"
  | "research"
  | "case"
  | "tool";

export interface DefenseBrief {
  id: string;
  title: string;
  mode: "proposal" | "paper_defense";
  sourceType: DefenseSourceType;
  sourceSummary: string;
  sourceRefs: Array<{ type: string; label: string; href?: string }>;
  background: string;
  researchQuestion: string;
  hypothesis: string;
  objectives: string[];
  methods: string[];
  evidence: string[];
  limitations: string[];
  innovationPoints: string[];
  applicationValue: string;
  keywords: string[];
  relatedKnowledgeNodes: string[];
  relatedTools: Array<{ label: string; href: string; reason: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface DefenseTranscriptItem {
  role: "committee" | "student";
  content: string;
  committeeRole?: string;
}

export function buildDefenseBriefFromText(input: {
  sourceType?: DefenseSourceType;
  sourceLabel?: string;
  text?: string;
  href?: string;
}): DefenseBrief;
export function normalizeDefenseBrief(raw: unknown, source: {
  sourceType?: DefenseSourceType;
  sourceLabel?: string;
  text?: string;
  href?: string;
}): DefenseBrief;
export function buildDefensePromptMessages(input: {
  action: "next_question" | "report" | "brief";
  brief: DefenseBrief;
  difficulty?: "basic" | "standard" | "challenge";
  turnLimit?: 3 | 5 | 8 | number;
  transcript?: DefenseTranscriptItem[];
}): Array<{ role: "system" | "user"; content: string }>;
export function generateLocalDefenseQuestion(input: {
  brief: DefenseBrief;
  difficulty?: "basic" | "standard" | "challenge";
  turnIndex?: number;
}): {
  committeeRole: string;
  question: string;
  intent: string;
  hiddenRubric: string[];
};
export function generateLocalDefenseReport(input: {
  brief: DefenseBrief;
  transcript: DefenseTranscriptItem[];
}): {
  totalScore: number;
  dimensions: Array<{ label: string; score: number; comment: string }>;
  committeeFeedback: string;
  weakPoints: string[];
  moduleRecommendations: Array<{ label: string; href: string; reason: string }>;
  nextDefenseTopics: string[];
};
export function extractPlainTextFromOfficeXml(xml: string): string;
export function normalizeDefenseAiJson(raw: string, fallback: unknown): unknown;
