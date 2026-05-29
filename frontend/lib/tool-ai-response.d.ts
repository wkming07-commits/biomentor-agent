import type { ToolAiRequest, ToolAiResponse } from "./tool-ai-types";

export function extractToolJson(raw: string): string;
export function createHelpfulToolFallback(
  tool: string,
  request: Pick<ToolAiRequest, "context">,
): ToolAiResponse;
export function normalizeToolAiResponse(
  raw: string,
  tool: string,
  request: Pick<ToolAiRequest, "context">,
): ToolAiResponse;
