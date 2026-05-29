import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY 环境变量未配置");
    }

    let contextText = context || "暂无教材内容";
    
    if (context && context.startsWith("data:image/")) {
      contextText = "用户上传了一张图片，图片内容待分析";
    } else if (context && context.startsWith("data:application/pdf;base64,")) {
      contextText = "用户上传了一个PDF文件，文件内容待分析";
    }

    const prompt = `基于以下教材内容回答问题：

${contextText.length > 3000 ? contextText.substring(0, 3000) + "..." : contextText}

问题：${message}

请给出详细的回答。`;

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
            content: "你是一个专业的生物医学知识导师，擅长解答学生的问题。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content.replace(/\*\*/g, "");

    return NextResponse.json({
      success: true,
      message: aiResponse,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
