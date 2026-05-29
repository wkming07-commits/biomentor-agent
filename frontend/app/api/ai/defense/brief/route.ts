import { NextRequest, NextResponse } from "next/server";

import {
  buildDefenseBriefFromText,
  extractPlainTextFromOfficeXml,
  normalizeDefenseBrief,
} from "@/lib/defense-flow.mjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let sourceType = "manual";
    let sourceLabel = "手动输入";
    let href = "";
    let text = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      sourceType = String(form.get("sourceType") || "file");
      sourceLabel = String(form.get("sourceLabel") || (file instanceof File ? file.name : "上传文件"));
      href = String(form.get("href") || "");
      if (file instanceof File) {
        text = await extractUploadedFileText(file);
      } else {
        text = String(form.get("text") || "");
      }
    } else {
      const body = await request.json().catch(() => ({}));
      sourceType = String(body.sourceType || "manual");
      sourceLabel = String(body.sourceLabel || "手动输入");
      href = String(body.href || "");
      text = String(body.text || "");
    }

    if (!text.trim()) {
      return NextResponse.json({ success: false, message: "没有读取到可用于答辩的文本内容。" }, { status: 400 });
    }

    const localBrief = buildDefenseBriefFromText({ sourceType, sourceLabel, text, href });
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ success: true, data: localBrief });

    const aiBrief = await generateBriefWithDeepSeek({ text, sourceType, sourceLabel, href, fallback: localBrief });
    return NextResponse.json({ success: true, data: aiBrief });
  } catch (error) {
    console.error("[defense/brief]", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: "资料包生成失败，请换一种导入方式再试。" }, { status: 200 });
  }
}

async function generateBriefWithDeepSeek({
  text,
  sourceType,
  sourceLabel,
  href,
  fallback,
}: {
  text: string;
  sourceType: string;
  sourceLabel: string;
  href: string;
  fallback: unknown;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
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
          {
            role: "system",
            content:
              "你是 BioMentor Agent 的科研答辩资料整理助手。请把用户资料凝练为 Defense Brief JSON，不要输出 Markdown，不要暴露 API、模型或调试信息。",
          },
          {
            role: "user",
            content: JSON.stringify({
              sourceType,
              sourceLabel,
              text: text.slice(0, 16000),
              requiredFields: [
                "title",
                "mode",
                "background",
                "researchQuestion",
                "hypothesis",
                "objectives",
                "methods",
                "evidence",
                "limitations",
                "innovationPoints",
                "applicationValue",
                "keywords",
                "relatedKnowledgeNodes",
                "relatedTools",
              ],
            }),
          },
        ],
        temperature: 0.25,
        max_tokens: 2200,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return fallback;
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(extractJson(raw));
    return normalizeDefenseBrief(parsed, { sourceType: sourceType as never, sourceLabel, text, href });
  } catch {
    clearTimeout(timeout);
    return fallback;
  }
}

async function extractUploadedFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (/\.(txt|md|csv)$/i.test(name)) return buffer.toString("utf8");
  if (/\.pdf$/i.test(name)) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || "";
  }
  if (/\.docx$/i.test(name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  if (/\.pptx$/i.test(name)) {
    return extractPptxText(buffer);
  }
  if (/\.ppt$/i.test(name)) {
    return buffer.toString("utf8").replace(/[^\x20-\x7E\u4e00-\u9fa5。，“”！？；：、\n]/g, " ");
  }

  return buffer.toString("utf8");
}

async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const parts = Object.keys(zip.files)
    .filter((name) => /^ppt\/(slides|notesSlides)\/.*\.xml$/i.test(name))
    .sort();
  const texts = await Promise.all(parts.map(async (name) => extractPlainTextFromOfficeXml(await zip.files[name].async("string"))));
  return texts.join("\n");
}

function extractJson(raw: string): string {
  const text = String(raw || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  return first >= 0 && last > first ? text.slice(first, last + 1) : text;
}
