import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const FASTAPI_BACKEND =
      process.env.FASTAPI_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:9090";

    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();

    const targetUrl = `${FASTAPI_BACKEND}/api/industry/cases${query ? `?${query}` : ""}`;

    const response = await fetch(targetUrl, {
      cache: "no-store",
    });

    const text = await response.text();

    const contentType = response.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("[industry/cases] Proxy error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { detail: "Failed to proxy industry cases request" },
      { status: 502 }
    );
  }
}