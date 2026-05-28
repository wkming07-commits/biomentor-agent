import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY 环境变量未配置");
    }

    let contextText = content;
    
    if (content && content.startsWith("data:image/")) {
      contextText = "用户上传了一张图片，图片内容待分析";
    } else if (content && content.startsWith("data:application/pdf;base64,")) {
      contextText = "用户上传了一个PDF文件，文件内容待分析";
    }

    const prompt = `基于以下教材内容生成10道练习题，包含选择题、判断题、填空题：

${contextText.length > 3000 ? contextText.substring(0, 3000) + "..." : contextText}

请按照以下JSON格式输出，不要包含任何额外文字：
{
  "questions": [
    {
      "id": 1,
      "type": "choice",
      "question": "问题内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "正确选项（如：A. 选项内容）",
      "explanation": "答案解析"
    },
    {
      "id": 2,
      "type": "judge",
      "question": "判断题内容",
      "correctAnswer": "true或false",
      "explanation": "答案解析"
    },
    {
      "id": 3,
      "type": "fill",
      "question": "填空题内容，空格用____表示",
      "correctAnswer": "正确答案",
      "explanation": "答案解析"
    }
  ]
}`;

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
            content: "你是一个专业的生物医学知识导师，擅长基于教材内容生成高质量的练习题。输出必须是纯JSON格式，不能包含任何额外文字。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;

    let quizData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析JSON");
      }
    } catch {
      quizData = {
        questions: [
          {
            id: 1,
            type: "choice",
            question: "根据上传的教材内容，以下哪个是核心概念？",
            options: ["选项A", "选项B", "选项C", "选项D"],
            correctAnswer: "选项A",
            explanation: "请参考上传教材内容进行解答。",
          },
          {
            id: 2,
            type: "judge",
            question: "根据教材内容判断此陈述是否正确",
            correctAnswer: "true",
            explanation: "请参考上传教材内容进行解答。",
          },
          {
            id: 3,
            type: "fill",
            question: "根据教材内容，____是重要的知识点。",
            correctAnswer: "答案",
            explanation: "请参考上传教材内容进行解答。",
          },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      data: quizData,
    });
  } catch (error) {
    console.error("Generate Quiz API error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
