export interface KnowledgeModuleLink {
  label: string;
  href: string;
}

export interface KnowledgeChildNode {
  id: string;
  label: string;
  summary: string;
  keyPoints: string[];
  importance: string;
  nextStep: string;
  moduleLinks: KnowledgeModuleLink[];
}

export interface KnowledgeDimension {
  id: string;
  label: string;
  accent: string;
  short: string;
  summary: string;
  children: KnowledgeChildNode[];
}

export interface KnowledgeDiscipline {
  id: string;
  label: string;
  group: string;
  summary: string;
  featured: boolean;
  color: string;
  x: number;
  y: number;
  related: string[];
  dimensions: KnowledgeDimension[];
}

export interface KnowledgePathItem {
  id: string;
  label: string;
  type: "discipline" | "dimension" | "node";
}

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
