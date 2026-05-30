import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FASTAPI_BACKEND = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9090";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseKey: string }> }
) {
  const { caseKey } = await params;

  if (!caseKey) {
    return NextResponse.json({ error: "缺少 caseKey 参数" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${FASTAPI_BACKEND}/api/industry/cases/${encodeURIComponent(caseKey)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (response.status === 404) {
      const errorText = await response.text().catch(() => "not found");
      return NextResponse.json(
        { error: errorText || "案例不存在" },
        { status: 404 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      return NextResponse.json(
        { error: `后端返回错误 ${response.status}: ${errorText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (fetchError) {
    clearTimeout(timeout);
    console.error(
      "[industry/cases/[caseKey]] 转发失败:",
      fetchError instanceof Error ? fetchError.message : fetchError
    );
    return NextResponse.json(
      { error: "后端服务不可用" },
      { status: 502 }
    );
  }
}