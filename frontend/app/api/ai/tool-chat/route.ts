import { NextRequest, NextResponse } from "next/server";
import type { ToolAiRequest, ToolAiResponse } from "@/lib/tool-ai-types";
import {
  createHelpfulToolFallback,
  normalizeToolAiResponse,
} from "@/lib/tool-ai-response.mjs";

const TOOL_LABELS: Record<string, string> = {
  protein: "蛋白结构",
  plasmid: "质粒图谱",
  sequence: "序列分析",
  pathway: "代谢通路",
};

function buildSystemPrompt(tool: string): string {
  const label = TOOL_LABELS[tool] || tool;
  return `你是 BioMentor Agent 的${label}教学助手。你的职责是用中文帮助学生理解${label}相关的科学概念和实验原理。

你必须：
- 使用中文回答
- 面向学生解释，语言通俗易懂但保持科学严谨
- 只基于用户提供的工具上下文（当前蛋白/质粒/序列/通路的结构化数据）进行解释
- 不确定的事情就说明不确定，不要编造
- 不要输出医疗建议、临床建议和未经验证的湿实验 SOP
- 不要暴露 API、模型、环境变量、服务器、fallback、调试日志等开发者信息
- 不要暴露你接入了什么外部服务

输出必须是纯 JSON，不要有 markdown 代码块：
{
  "answer": "中文回答内容（作为教学引导，可包括结构/功能/机制解释、教学要点提示、引导性问题）",
  "quickQuestions": ["学生可以追问的快捷问题1", "问题2", "问题3"],
  "disclaimer": "本回答用于课程学习和科研训练，不构成医疗、临床或未经验证的实验操作建议。"
}`;
}

function buildUserPrompt(request: ToolAiRequest): string {
  const { mode, question, context } = request;
  const facts = context.facts.map((f) => `${f.label}: ${f.value}`).join("\n");
  const highlights = context.highlights.join("\n");

  if (mode === "initial") {
    return `当前工具上下文：
标题: ${context.title}
${context.subtitle ? `副标题: ${context.subtitle}` : ""}
${context.sourceLabel ? `数据来源: ${context.sourceLabel}` : ""}
${context.selectedItemLabel ? `当前选中: ${context.selectedItemLabel}` : ""}

关键事实:
${facts || "(暂无)"}

教学要点:
${highlights || "(暂无)"}
${context.warnings?.length ? `\n注意事项:\n${context.warnings.join("\n")}` : ""}

请根据以上上下文，生成一段初始教学讲解，帮助学生理解${context.title}的结构、功能和相关机制。`;
  }

  return `当前工具上下文：
标题: ${context.title}
${context.subtitle ? `副标题: ${context.subtitle}` : ""}

关键事实:
${facts || "(暂无)"}

教学要点:
${highlights || "(暂无)"}
${context.warnings?.length ? `\n注意事项:\n${context.warnings.join("\n")}` : ""}

学生追问：${question}

请回答学生的问题，尽量结合当前上下文中的事实和教学要点。如果问题超出当前上下文范围，请诚实说明你可以基于什么范围回答。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ToolAiRequest | null;
    if (!body || !body.tool || !body.context?.title) {
      return NextResponse.json(
        { error: "缺少必要参数 tool 和 context.title" },
        { status: 400 },
      );
    }

    const tool = body.tool;
    const mode = body.mode;
    if (mode !== "initial" && mode !== "question") {
      return NextResponse.json({ error: "mode 必须为 initial 或 question" }, { status: 400 });
    }
    if (mode === "question" && (!body.question || !body.question.trim())) {
      return NextResponse.json({ error: "question 模式需要提供 question 参数" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

    if (!apiKey) {
      return NextResponse.json(createHelpfulToolFallback(tool, body));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: buildSystemPrompt(tool) },
            { role: "user", content: buildUserPrompt(body) },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`[tool-chat] API 返回错误 ${response.status}`);
        return NextResponse.json(createHelpfulToolFallback(tool, body));
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        console.error("[tool-chat] API 返回内容为空");
        return NextResponse.json(createHelpfulToolFallback(tool, body));
      }

      const result: ToolAiResponse = normalizeToolAiResponse(content, tool, body);

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error("[tool-chat] API 调用异常:", fetchError instanceof Error ? fetchError.message : fetchError);
      return NextResponse.json(createHelpfulToolFallback(tool, body));
    }
  } catch (err) {
    console.error("[tool-chat] 未预期错误:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "内部服务错误" }, { status: 500 });
  }
}
