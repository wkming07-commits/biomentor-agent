import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const content = body.content || "";
    const fileName = body.fileName || "";

    if (!content) {
      return NextResponse.json({ success: false, error: "请提供教材内容" }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ success: false, error: "AI 服务未配置" }, { status: 503 });
    }

    let subject = "生物学";
    
    if (fileName) {
      if (fileName.includes("运动") || fileName.includes("物理") || fileName.includes("力学")) {
        subject = "物理学";
      } else if (fileName.includes("化学") || fileName.includes("反应")) {
        subject = "化学";
      } else if (fileName.includes("数学") || fileName.includes("方程")) {
        subject = "数学";
      } else if (fileName.includes("生物") || fileName.includes("细胞")) {
        subject = "生物学";
      }
    }

    let textContent = "";

    if (content.startsWith("data:image/")) {
      const prompt = `请分析以下图片内容，假设这是${subject}教材内容，描述图片中的文字信息并总结核心知识点：

图片已上传，内容待分析。

请按照以下格式输出：
1. 知识点标题：详细内容描述
2. 知识点标题：详细内容描述
...

关键词：关键词1, 关键词2, 关键词3...

学习建议：
- 建议内容1
- 建议内容2
- 建议内容3`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `你是一个专业的${subject}知识导师，擅长分析教材内容、总结教材要点、提取核心知识点。`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.status}`);
      }

      const result = await response.json();
      textContent = result.choices[0].message.content;
    } else if (content.startsWith("data:application/pdf;base64,")) {
      const prompt = `请分析以下PDF文件内容，假设这是${subject}教材内容，文件名为：${fileName || "未知"}，提取核心知识点、关键词和学习建议：

请按照以下格式输出：
1. 知识点标题：详细内容描述
2. 知识点标题：详细内容描述
...

关键词：关键词1, 关键词2, 关键词3...

学习建议：
- 建议内容1
- 建议内容2
- 建议内容3`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `你是一个专业的${subject}知识导师，擅长分析教材内容、总结教材要点、提取核心知识点。`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.status}`);
      }

      const result = await response.json();
      textContent = result.choices[0].message.content.replace(/\*\*/g, "");
    } else {
      const prompt = `请深度分析以下${subject}教材内容，提供系统化、模块化的知识总结：

${content.length > 5000 ? content.substring(0, 5000) + "..." : content}

请按照以下结构化要求输出：

【核心知识点】
请将内容拆解为多个独立的知识点（建议8-15个），每个知识点聚焦一个具体概念或机制，确保内容精炼、重点突出、易于理解和记忆。

每个知识点应包含：
- 明确定义
- 核心内容
- 关键特征
- 实际意义

输出格式：
核心知识点：
1. 具体知识点1：简要阐述该知识点的核心内容，包括定义、特征、机制或功能等，条理清晰（30-60字）
2. 具体知识点2：简要阐述该知识点的核心内容，包括定义、特征、机制或功能等，条理清晰（30-60字）
3. 具体知识点3：简要阐述该知识点的核心内容，包括定义、特征、机制或功能等，条理清晰（30-60字）
4. 具体知识点4：简要阐述该知识点的核心内容，包括定义、特征、机制或功能等，条理清晰（30-60字）
5. 具体知识点5：简要阐述该知识点的核心内容，包括定义、特征、机制或功能等，条理清晰（30-60字）
...

【重点概念】
提取最关键的专业术语和核心概念，用逗号分隔

【学习建议】
提供具体、可操作的学习方法，帮助扎实基础：
- 概念理解技巧：如何准确把握核心概念
- 知识巩固方法：如何有效记忆和复习
- 实践应用建议：如何联系实际案例
- 常见问题提示：学习中需要注意的关键点

注意事项：
- 使用专业、严谨的学术语言
- 不要提及"高中"、"中学生"、"大学生"等词汇
- 不要使用任何Markdown格式（如**加粗**、#标题、列表符号等）
- 知识点要模块化，每个知识点独立完整
- 覆盖所有重要内容，包括组织结构、生理功能、生化机制等
- 内容精炼，避免冗长，便于学习和记忆`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `你是一位专业的${subject}大学课程导师，擅长深入分析专业教材内容，提取核心知识点，提供适合大学生的专业学习建议。请使用专业、严谨的学术语言，不要提及高中或中学生相关内容。`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.status}`);
      }

      const result = await response.json();
      textContent = result.choices[0].message.content.replace(/\*\*/g, "");
    }

    textContent = textContent.replace(/\*\*/g, "");

    const knowledgePoints: { id: number; title: string; content: string }[] = [];
    const keywords: string[] = [];
    const studyTips: { id: number; title: string; content: string }[] = [];

    textContent = textContent.replace(/\*\*/g, "").replace(/#+/g, "").replace(/【|】/g, "");

    const corePointsMatch = textContent.match(/核心知识点：\s*(.+?)(?=\n重点概念：|\n学习建议：|$)/is);
    const keywordMatch = textContent.match(/重点概念：\s*(.+?)(?=\n学习建议：|$)/is);
    const tipMatch = textContent.match(/学习建议：\s*(.+)/is);

    let pointId = 1;
    if (corePointsMatch) {
      const pointsText = corePointsMatch[1].trim();
      const pointLines = pointsText.split("\n").filter(line => line.trim() && line.match(/^\d+[\.\-]\s/));
      pointLines.forEach((line) => {
        const cleaned = line.trim().replace(/^\d+[\.\-]\s*/, "");
        if (cleaned.length > 10) {
          const parts = cleaned.split(/[:：]/);
          if (parts.length >= 2) {
            knowledgePoints.push({
              id: pointId++,
              title: parts[0].trim(),
              content: parts.slice(1).join("：").trim(),
            });
          } else {
            knowledgePoints.push({
              id: pointId++,
              title: `知识点${pointId - 1}`,
              content: cleaned,
            });
          }
        }
      });
    }

    if (keywordMatch) {
      const keywordText = keywordMatch[1].trim().replace(/[，,、]/g, ",").replace(/\s+/g, "");
      keywords.push(...keywordText.split(",").map((k: string) => k.trim()).filter(Boolean));
    }

    if (tipMatch) {
      const tipText = tipMatch[1].trim();
      const tipLines = tipText.split("\n").filter(line => line.trim() && !line.match(/^\d+[\.\-]\s*/) && !line.match(/^学习建议/));
      const tipTitles = ["深度理解", "学习方法", "易错辨析", "拓展延伸", "复习策略"];
      tipLines.forEach((tip, i) => {
        const cleanedTip = tip.trim().replace(/^[\d\.\-\*]+\s*/, "").replace(/^[-•●]\s*/, "");
        if (cleanedTip.length > 10) {
          studyTips.push({
            id: i + 1,
            title: tipTitles[i % tipTitles.length],
            content: cleanedTip,
          });
        }
      });
    }

    if (knowledgePoints.length === 0) {
      knowledgePoints.push({
        id: 1,
        title: "核心知识点",
        content: textContent.substring(0, 500) + "...",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        knowledgePoints,
        keywords,
        studyTips,
        rawResponse: textContent,
      },
    });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
