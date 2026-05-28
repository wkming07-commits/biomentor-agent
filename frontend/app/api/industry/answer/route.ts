import { NextRequest, NextResponse } from "next/server";
import { industryCases } from "@/data/industryCases";

interface MatchCase {
  id: string;
  title: string;
  reason: string;
}

interface IndustryAnswerResponse {
  query: string;
  answer: string;
  relatedKnowledgePoints: string[];
  matchedCases: MatchCase[];
  researchFrontiers: string[];
  industryApplications: string[];
  requiredAbilities: string[];
  recommendedKeywords: string[];
  nextTasks: string[];
  sourceScope: "based_on_local_cases" | "extended_reasoning" | "no_direct_match";
  disclaimer: string;
}

function buildCasesContext(): string {
  return industryCases
    .map(
      (c, i) => `
案例 ${i + 1}: [${c.id}] ${c.title}
- 副标题: ${c.subtitle}
- 产业方向: ${c.industryDirection}
- 核心问题: ${c.coreProblem}
- 相关知识: [${c.relatedKnowledgePoints.join(", ")}]
- 科研基础: ${c.researchFoundation}
- 应用价值: ${c.applicationValue}
- 所需能力: [${c.requiredAbilities.join(", ")}]
- 推荐关键词: [${c.recommendedKeywords.join(", ")}]
- 训练任务: ${c.linkedResearchTask}
- 证据等级: ${c.evidenceLevel}
- 来源类型: ${c.sourceType}`
    )
    .join("\n");
}

const SYSTEM_PROMPT = `你是 BioMentor Agent 的产业案例导师。你的职责是帮助学生理解生命科学知识点、科研前沿和产业应用之间的关系。

你必须围绕以下维度回答用户问题：
1. 综合回答：用 2-5 句中文简要回答用户问题，结合当前案例库知识
2. 相关课程知识点：列出与问题相关的核心生物学/生物技术知识点
3. 匹配的产业案例：从给定案例库中找出最相关的案例（1-3个），说明匹配原因
4. 科研前沿方向：列出相关的研究热点和技术突破方向
5. 产业应用场景：列出相关的真实产业应用场景
6. 训练能力：推荐学生需要培养的能力（从以下选择：文献检索能力、机制解释能力、实验设计能力、数据分析能力、证据判断能力、产业迁移能力）
7. 推荐关键词：列出建议检索的关键词（中英文）
8. 下一步科研实战任务：推荐 2-3 个可进行的科研训练任务
9. sourceScope：声明知识来源范围（based_on_local_cases / extended_reasoning / no_direct_match）
10. disclaimer：必须包含免责声明

约束：
- 不要给患者治疗建议
- 不要编造临床结论
- 不要编造销售额或商业数据
- 如果当前案例库没有直接覆盖，sourceScope 设为 "extended_reasoning" 或 "no_direct_match"
- 如果基于当前案例库回答，sourceScope 设为 "based_on_local_cases"
- 必须输出纯 JSON，不要输出 markdown 代码块
- JSON 顶层字段必须完整`;

function buildUserPrompt(query: string): string {
  return `当前案例库包含以下产业案例：
${buildCasesContext()}

用户问题：${query}

请根据以上案例库内容和你的知识，输出如下 JSON 格式的回答（必须是纯 JSON，不要有 markdown 标记）：

{
  "answer": "综合回答（2-5句中文）",
  "relatedKnowledgePoints": ["知识点1", "知识点2", ...],
  "matchedCases": [
    {
      "id": "案例ID（如 case-001）",
      "title": "案例标题",
      "reason": "匹配原因"
    }
  ],
  "researchFrontiers": ["科研方向1", "科研方向2", ...],
  "industryApplications": ["产业应用1", "产业应用2", ...],
  "requiredAbilities": ["能力1", "能力2", ...],
  "recommendedKeywords": ["关键词1", "关键词2", ...],
  "nextTasks": ["任务1", "任务2", ...],
  "sourceScope": "based_on_local_cases / extended_reasoning / no_direct_match",
  "disclaimer": "本回答用于课程学习和科研训练，不构成医疗或临床建议。"
}`;
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function buildFallbackResponse(query: string): IndustryAnswerResponse {
  const relevantCases = industryCases
    .filter((c) => {
      const lower = query.toLowerCase();
      return (
        c.title.toLowerCase().includes(lower) ||
        c.industryDirection.toLowerCase().includes(lower) ||
        c.relatedKnowledgePoints.some((k) => k.toLowerCase().includes(lower)) ||
        c.recommendedKeywords.some((k) => k.toLowerCase().includes(lower))
      );
    })
    .slice(0, 3);

  const matchedCases: MatchCase[] = relevantCases.map((c) => ({
    id: c.id,
    title: c.title,
    reason: `匹配到相关知识点：${c.relatedKnowledgePoints.slice(0, 2).join("、")}`,
  }));

  const allAbilities = relevantCases.flatMap((c) => c.requiredAbilities);
  const uniqueAbilities = [...new Set(allAbilities)].slice(0, 4);

  const allKeywords = relevantCases.flatMap((c) => c.recommendedKeywords);
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 8);

  return {
    query,
    answer: `根据当前产业案例库，找到 ${matchedCases.length} 个可能与您问题相关的案例。建议点击案例卡片查看详情，或使用"查看详情"按钮深入阅读科研基础和产业应用信息。`,
    relatedKnowledgePoints: relevantCases.flatMap((c) => c.relatedKnowledgePoints).slice(0, 8),
    matchedCases,
    researchFrontiers: [],
    industryApplications: [],
    requiredAbilities: uniqueAbilities.length > 0 ? uniqueAbilities : ["文献检索能力", "机制解释能力"],
    recommendedKeywords: uniqueKeywords,
    nextTasks: relevantCases.map((c) => c.linkedResearchTask),
    sourceScope: matchedCases.length > 0 ? "based_on_local_cases" : "no_direct_match",
    disclaimer: "本回答基于当前产业案例库自动生成，用于课程学习和科研训练，不构成医疗或临床建议。",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.query !== "string") {
      return NextResponse.json({ error: "缺少 query 参数" }, { status: 400 });
    }

    const query = body.query.trim();
    if (!query) {
      return NextResponse.json({ error: "query 不能为空" }, { status: 400 });
    }
    if (query.length > 2000) {
      return NextResponse.json({ error: "query 超过最大长度限制 (2000)" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

    if (!apiKey) {
      console.warn("[industry/answer] DEEPSEEK_API_KEY 未配置，使用本地 fallback");
      return NextResponse.json(buildFallbackResponse(query));
    }

    console.log(`[industry/answer] Calling ${model} at ${baseUrl} for query: "${query.slice(0, 80)}..."`);

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(query) },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "unknown");
        console.error(`[industry/answer] API 返回错误 ${response.status}: ${errorText.slice(0, 200)}`);
        return NextResponse.json(buildFallbackResponse(query));
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        console.error("[industry/answer] API 返回内容为空");
        return NextResponse.json(buildFallbackResponse(query));
      }

      const jsonStr = extractJson(content);
      let parsed: Partial<IndustryAnswerResponse>;

      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("[industry/answer] JSON 解析失败，尝试提取");
        const fallback = buildFallbackResponse(query);
        fallback.answer = typeof content === "string" ? content.slice(0, 500) : fallback.answer;
        return NextResponse.json(fallback);
      }

      const result: IndustryAnswerResponse = {
        query,
        answer: typeof parsed.answer === "string" ? parsed.answer : buildFallbackResponse(query).answer,
        relatedKnowledgePoints: Array.isArray(parsed.relatedKnowledgePoints) ? parsed.relatedKnowledgePoints : [],
        matchedCases: Array.isArray(parsed.matchedCases)
          ? parsed.matchedCases.filter(
              (m: unknown): m is MatchCase =>
                typeof m === "object" && m !== null && "id" in (m as Record<string, unknown>) && "title" in (m as Record<string, unknown>)
            )
          : [],
        researchFrontiers: Array.isArray(parsed.researchFrontiers) ? parsed.researchFrontiers : [],
        industryApplications: Array.isArray(parsed.industryApplications) ? parsed.industryApplications : [],
        requiredAbilities: Array.isArray(parsed.requiredAbilities) ? parsed.requiredAbilities : [],
        recommendedKeywords: Array.isArray(parsed.recommendedKeywords) ? parsed.recommendedKeywords : [],
        nextTasks: Array.isArray(parsed.nextTasks) ? parsed.nextTasks : [],
        sourceScope: ["based_on_local_cases", "extended_reasoning", "no_direct_match"].includes(
          parsed.sourceScope as string
        )
          ? (parsed.sourceScope as "based_on_local_cases" | "extended_reasoning" | "no_direct_match")
          : "based_on_local_cases",
        disclaimer:
          typeof parsed.disclaimer === "string"
            ? parsed.disclaimer
            : "本回答用于课程学习和科研训练，不构成医疗或临床建议。",
      };

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error("[industry/answer] API 调用异常:", fetchError instanceof Error ? fetchError.message : fetchError);
      return NextResponse.json(buildFallbackResponse(query));
    }
  } catch (err) {
    console.error("[industry/answer] 未预期错误:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "内部服务错误" },
      { status: 500 }
    );
  }
}