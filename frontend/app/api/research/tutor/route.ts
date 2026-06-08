import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BACKEND =
  process.env.FASTAPI_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${FASTAPI_BACKEND}/api/research/tutor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(buildLocalTutorFallback(body, question));
    }

    const data = await response.json();
    if (!data?.answer) {
      return NextResponse.json(buildLocalTutorFallback(body, question));
    }

    return NextResponse.json(data);
  } catch (error) {
    clearTimeout(timeout);
    return NextResponse.json(buildLocalTutorFallback(body, question));
  }
}

function buildLocalTutorFallback(body: Record<string, unknown>, question: string) {
  const caseTitle = typeof body.case_title === "string"
    ? body.case_title
    : typeof body.caseTitle === "string"
    ? body.caseTitle
    : "";
  const normalized = question.trim().toLowerCase();
  const isCasual = ["哈哈", "哈哈哈", "你好", "在吗", "ok", "hi", "hello"].includes(normalized) || /^哈{2,}$/.test(normalized);
  const isIndustry = ["产业实例", "产业案例", "应用案例", "产业应用", "有啥案例", "有哪些例子", "有啥例子"].some((item) => question.includes(item));
  const answer = isCasual
    ? `可以的，我可以围绕${caseTitle ? `「${caseTitle}」` : "当前案例"}继续帮你分析机制、文献、产业案例或科研训练任务。你可以问：这个案例有哪些产业应用？需要哪些文献支撑？`
    : isIndustry
    ? `可以从当前案例出发查找相关产业案例。建议优先查看同一技术方向、相同知识点或相似应用场景的案例，再比较它们的核心机制、证据边界和训练任务。`
    : `可以先把你的问题「${question}」拆成研究方向、关键词、证据来源和训练任务。若当前资料不足，可补充关键词、选择训练任务或进入文献支撑区。`;

  return {
    source_mode: "local_fallback",
    answer,
    evidence_used: [],
    suggested_next_questions: ["有哪些产业案例可参考？", "这个案例的核心机制是什么？", "需要哪些文献支撑？"],
    boundary: "该回答用于科研训练，不替代真实实验设计审批。",
  };
}
