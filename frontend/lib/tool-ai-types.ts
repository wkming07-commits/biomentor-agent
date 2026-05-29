export type BioToolName = "protein" | "plasmid" | "sequence" | "pathway";

export type ToolAiMode = "initial" | "question";

export interface ToolChatMessage {
  role: "assistant" | "user";
  content: string;
  quickQuestions?: string[];
}

export interface ToolContextSummary {
  title: string;
  subtitle?: string;
  sourceLabel?: string;
  selectedItemLabel?: string;
  facts: { label: string; value: string }[];
  highlights: string[];
  warnings?: string[];
}

export interface ToolAiRequest {
  tool: BioToolName;
  mode: ToolAiMode;
  question?: string;
  history?: ToolChatMessage[];
  context: ToolContextSummary;
}

export interface ToolAiResponse {
  answer: string;
  quickQuestions: string[];
  disclaimer: string;
  source?: "deepseek" | "local_fallback";
}
