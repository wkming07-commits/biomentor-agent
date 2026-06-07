import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_BASE = (
  process.env.FASTAPI_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:10087"
)
  .trim()
  .replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return NextResponse.json({ detail: "request body is required" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    const response = await fetch(`${BACKEND_BASE}/api/industry/answer`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: bodyText,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "X-Upstream-Duration-Ms": String(Date.now() - started),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Industry answer proxy failed";
    return NextResponse.json(
      {
        detail: message,
        backend: BACKEND_BASE,
        duration_ms: Date.now() - started,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "";
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ query }),
    }),
  );
}
