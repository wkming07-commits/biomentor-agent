import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BACKEND = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:9090";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.topic !== "string") {
      return NextResponse.json({ error: "缺少 topic 参数" }, { status: 400 });
    }

    const topic = body.topic.trim();
    if (!topic) {
      return NextResponse.json({ error: "topic 不能为空" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${FASTAPI_BACKEND}/api/research/generate-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          case_key: body.case_key || null,
          mode: body.mode || "independent",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "unknown");
        return NextResponse.json(
          { error: `后端返回错误 ${response.status}: ${errorText.slice(0, 200)}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error("[research/generate-task] 转发失败:", fetchError instanceof Error ? fetchError.message : fetchError);
      return NextResponse.json(
        { error: "后端服务不可用，请稍后重试" },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[research/generate-task] 未预期错误:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "内部服务错误" }, { status: 500 });
  }
}