import { NextRequest, NextResponse } from "next/server";

import {
  buildDefensePromptMessages,
  generateLocalDefenseQuestion,
  normalizeDefenseAiJson,
} from "@/lib/defense-flow.mjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fallback = (generateLocalDefenseQuestion as unknown as (input: Record<string, unknown>) => unknown)({
      brief: body.brief,
      difficulty: body.difficulty,
      turnIndex: Number(body.turnIndex || 0),
    });
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ success: true, data: fallback });

    const data = await callDefenseAi({
      messages: (buildDefensePromptMessages as unknown as (input: Record<string, unknown>) => unknown[])({
        action: "next_question",
        brief: body.brief,
        difficulty: body.difficulty,
        turnLimit: body.turnLimit,
        transcript: body.transcript || [],
      }),
      maxTokens: 900,
      fallback,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[defense/next-question]", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: "答辩问题生成失败，请稍后重试。" }, { status: 200 });
  }
}

async function callDefenseAi({ messages, maxTokens, fallback }: { messages: unknown[]; maxTokens: number; fallback: unknown }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.45, max_tokens: maxTokens, response_format: { type: "json_object" } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return fallback;
    const result = await response.json();
    return normalizeDefenseAiJson(result?.choices?.[0]?.message?.content || "", fallback);
  } catch {
    clearTimeout(timeout);
    return fallback;
  }
}
