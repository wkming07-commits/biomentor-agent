import type { KnowledgeModuleLink } from "./knowledge-map-data.mjs";

export type KnowledgeAiMode = "tutor" | "research";

export type KnowledgeAiAction =
  | "auto_explain"
  | "chat"
  | "learning_path"
  | "tool_practice";

export interface KnowledgeAiContextNode {
  id: string;
  name: string;
  summary?: string;
  keyPoints?: string[];
  moduleLinks?: KnowledgeModuleLink[];
}

export interface KnowledgeAiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KnowledgeAiRequest {
  mode: KnowledgeAiMode;
  action: KnowledgeAiAction;
  discipline: {
    id: string;
    name: string;
  };
  dimension?: {
    id: string;
    name: string;
  } | null;
  node: KnowledgeAiContextNode;
  history?: KnowledgeAiMessage[];
}

export interface KnowledgeAiResponse {
  title: string;
  answer: string;
  keyPoints: string[];
  nextSteps: string[];
  suggestedQuestions: string[];
  moduleLinks: KnowledgeModuleLink[];
  source?: "deepseek" | "local_fallback";
}

export function buildKnowledgeCacheKey(context: KnowledgeAiRequest): string;
export function buildKnowledgePromptMessages(context: KnowledgeAiRequest): Array<{ role: "system" | "user"; content: string }>;
export function normalizeKnowledgeAiResponse(raw: string, context: KnowledgeAiRequest): KnowledgeAiResponse;
export function createLocalKnowledgeAnswer(context: KnowledgeAiRequest): KnowledgeAiResponse;
