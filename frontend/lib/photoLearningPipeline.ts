export const PHOTO_PIPELINE_BACKEND = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/gateway"
).replace(/\/+$/, "");

export interface BackendQuestionOption {
  label: string;
  text: string;
}

export interface BackendQuestion {
  id: string;
  type: string;
  question: string;
  options?: BackendQuestionOption[];
  answer: string;
  explanation: string;
}

export interface PhotoLearningAnalysis {
  raw_text: string;
  extracted_keywords: string[];
  domain?: string;
  source_kind?: string;
  matched_concepts: Array<{
    id: number;
    name: string;
    category?: string;
    definition?: string;
  }>;
  knowledge_points?: Array<{
    name: string;
    description?: string;
    category?: string;
  }>;
  matched_papers: Array<{
    id: number;
    title: string;
    title_zh?: string;
    direction?: string;
    core_problem?: string;
  }>;
  matched_tasks: Array<Record<string, unknown>>;
  summary: string;
  learning_suggestions?: string[];
  questions: BackendQuestion[];
  processing_engine?: string;
  processing_char_count?: number;
  processing_filename?: string;
  ocr_engine?: string;
  ocr_char_count?: number;
  ocr_filename?: string;
}

export interface QuizQuestion {
  id: number;
  type: "choice" | "judge" | "fill";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

function normalizeTrueFalse(answer: string): "true" | "false" {
  const normalized = answer.trim().toLowerCase();
  if (["true", "t", "yes", "1", "correct", "right"].includes(normalized)) {
    return "true";
  }
  return "false";
}

export function toDisplayOptions(
  options: BackendQuestionOption[] | undefined,
): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((option) => `${option.label}. ${option.text}`);
}

export function toQuizQuestions(
  questions: BackendQuestion[] | undefined,
): QuizQuestion[] {
  if (!Array.isArray(questions)) return [];

  return questions
    .map((question, index): QuizQuestion | null => {
      if (question.type === "choice") {
        return {
          id: index + 1,
          type: "choice",
          question: question.question,
          options: toDisplayOptions(question.options),
          correctAnswer: question.answer,
          explanation: question.explanation,
        };
      }

      if (question.type === "truefalse") {
        return {
          id: index + 1,
          type: "judge",
          question: question.question,
          correctAnswer: normalizeTrueFalse(question.answer),
          explanation: question.explanation,
        };
      }

      if (question.type === "short_answer") {
        return {
          id: index + 1,
          type: "fill",
          question: question.question,
          correctAnswer: question.answer,
          explanation: question.explanation,
        };
      }

      return null;
    })
    .filter((question): question is QuizQuestion => question !== null);
}
