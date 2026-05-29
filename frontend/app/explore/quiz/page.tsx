"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileQuestion,
  FileCheck,
  FileEdit,
  Target,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: number;
  type: "choice" | "judge" | "fill";
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isAnswered?: boolean;
  explanation: string;
}

interface QuizData {
  questions: Question[];
}

export default function QuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const storedData = localStorage.getItem("quizData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setQuizData(data);
      setQuestions(data.questions.map((q: Question) => ({ ...q, userAnswer: undefined, isAnswered: false })));
    }
  }, []);

  if (!quizData) {
    return (
      <div className="min-h-screen pt-[var(--nav-height)] px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent-amber/10 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-accent-amber" />
          </div>
          <h3 className="font-display font-bold text-brand-ink mb-2">暂无练习题</h3>
          <p className="text-brand-muted font-body mb-4">请先上传教材并生成练习题</p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-ink text-white font-medium font-body hover:bg-brand-ink/90 transition-all"
          >
            返回探索页面
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const allAnswered = questions.every((q) => q.isAnswered);

  const handleAnswer = (answer: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === currentQuestion.id ? { ...q, userAnswer: answer, isAnswered: true } : q
      )
    );
  };

  const handleFillAnswer = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === currentQuestion.id ? { ...q, userAnswer: e.target.value } : q
      )
    );
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowResult(true);
    }, 1500);
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "choice":
        return <FileQuestion className="w-4 h-4" />;
      case "judge":
        return <FileCheck className="w-4 h-4" />;
      case "fill":
        return <FileEdit className="w-4 h-4" />;
      default:
        return <FileQuestion className="w-4 h-4" />;
    }
  };

  const getQuestionTypeName = (type: string) => {
    switch (type) {
      case "choice":
        return "选择题";
      case "judge":
        return "判断题";
      case "fill":
        return "填空题";
      default:
        return "未知";
    }
  };

  if (showResult) {
    const correctCount = questions.filter((q) => {
      if (!q.userAnswer || !q.correctAnswer) return false;
      const userAnswer = String(q.userAnswer).trim().toUpperCase();
      const correctAnswer = String(q.correctAnswer).trim().toUpperCase();
      return userAnswer === correctAnswer || 
             userAnswer.startsWith(correctAnswer.charAt(0)) || 
             correctAnswer.startsWith(userAnswer.charAt(0));
    }).length;
    const score = Math.round((correctCount / questions.length) * 100);

    const resultData = {
      questions: questions.map(q => ({
        ...q,
        isCorrect: !q.userAnswer ? false : (() => {
          const userAnswer = String(q.userAnswer).trim().toUpperCase();
          const correctAnswer = String(q.correctAnswer).trim().toUpperCase();
          return userAnswer === correctAnswer || 
                 userAnswer.startsWith(correctAnswer.charAt(0)) || 
                 correctAnswer.startsWith(userAnswer.charAt(0));
        })()
      })),
      correctCount,
      score,
      totalQuestions: questions.length,
      timestamp: Date.now(),
    };

    localStorage.setItem("quizResult", JSON.stringify(resultData));

    const existingWrongQuestions = JSON.parse(localStorage.getItem("wrongQuestions") || "[]");
    const newWrongQuestions = questions.filter(q => {
      if (!q.userAnswer) return false;
      const userAnswer = String(q.userAnswer).trim().toUpperCase();
      const correctAnswer = String(q.correctAnswer).trim().toUpperCase();
      return !(userAnswer === correctAnswer || 
               userAnswer.startsWith(correctAnswer.charAt(0)) || 
               correctAnswer.startsWith(userAnswer.charAt(0)));
    });

    const mergedWrongQuestions = [...existingWrongQuestions, ...newWrongQuestions];
    const uniqueWrongQuestions = mergedWrongQuestions.filter((q, index, self) => 
      index === self.findIndex((t) => t.id === q.id && t.question === q.question)
    );

    localStorage.setItem("wrongQuestions", JSON.stringify(uniqueWrongQuestions));

    return (
      <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
        <section className="max-w-4xl mx-auto pt-8 md:pt-16">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/explore"
              className="flex items-center gap-2 text-brand-muted hover:text-brand-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-body">返回</span>
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-8 text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-display font-bold text-white">{score}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-ink mb-2">答题完成</h2>
            <p className="text-brand-muted font-body">
              共 {questions.length} 道题，答对 {correctCount} 道，正确率 {score}%
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="font-display font-bold text-brand-ink mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-electric" />
              答题详情
            </h3>
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`rounded-xl p-5 border transition-all ${
                    q.userAnswer === q.correctAnswer
                      ? "bg-accent-cyan/5 border-accent-cyan/20"
                      : "bg-accent-rose/5 border-accent-rose/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                      q.userAnswer === q.correctAnswer ? "bg-accent-cyan text-white" : "bg-accent-rose text-white"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="badge badge-electric flex items-center gap-1">
                      {getQuestionIcon(q.type)}
                      {getQuestionTypeName(q.type)}
                    </span>
                    {q.userAnswer === q.correctAnswer ? (
                      <CheckCircle className="w-4 h-4 text-accent-cyan ml-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-accent-rose ml-auto" />
                    )}
                  </div>
                  <p className="text-sm font-body text-brand-ink mb-3">{q.question}</p>
                  <div className="space-y-2 text-sm">
                    {q.userAnswer !== q.correctAnswer && (
                      <>
                        <p className="flex items-center gap-2">
                          <span className="text-brand-muted">你的答案：</span>
                          <span className="text-accent-rose font-medium">
                            {q.type === "judge" ? (q.userAnswer === "true" ? "正确" : "错误") : q.userAnswer}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-brand-muted">正确答案：</span>
                          <span className="text-accent-cyan font-medium">
                            {q.type === "judge" ? (q.correctAnswer === "true" ? "正确" : "错误") : q.correctAnswer}
                          </span>
                        </p>
                      </>
                    )}
                    <p className="text-brand-muted">
                      <span className="font-medium text-brand-ink">解析：</span>
                      {q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/explore/quiz"
              className="flex-1 h-12 rounded-xl glass-card text-brand-ink font-medium font-body hover:bg-white/80 transition-all duration-200 flex items-center justify-center"
            >
              重新练习
            </Link>
            <Link
              href="/explore/report"
              className="flex-1 h-12 rounded-xl bg-brand-ink text-white font-medium font-body hover:bg-brand-ink/90 transition-all duration-200 flex items-center justify-center"
            >
              查看学习报告
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <section className="max-w-3xl mx-auto pt-8 md:pt-16">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/explore"
            className="flex items-center gap-2 text-brand-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-body">返回</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-body text-brand-muted">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="w-24 h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-electric to-accent-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-electric flex items-center gap-1">
              {getQuestionIcon(currentQuestion.type)}
              {getQuestionTypeName(currentQuestion.type)}
            </span>
          </div>
          <p className="text-lg font-body text-brand-ink mb-6">{currentQuestion.question}</p>

          {currentQuestion.type === "choice" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    currentQuestion.userAnswer === opt
                      ? "bg-accent-electric/10 border border-accent-electric/30"
                      : "bg-white/40 border border-black/5 hover:border-accent-electric/20 hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      currentQuestion.userAnswer === opt
                        ? "bg-accent-electric text-white"
                        : "bg-black/5 text-brand-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-body text-brand-ink">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "judge" && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer("true")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                  currentQuestion.userAnswer === "true"
                    ? "bg-accent-cyan/10 border border-accent-cyan/30"
                    : "bg-white/40 border border-black/5 hover:border-accent-cyan/20"
                }`}
              >
                <CheckCircle className="w-5 h-5 text-accent-cyan" />
                <span className="text-sm font-medium font-body text-brand-ink">正确</span>
              </button>
              <button
                onClick={() => handleAnswer("false")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                  currentQuestion.userAnswer === "false"
                    ? "bg-accent-rose/10 border border-accent-rose/30"
                    : "bg-white/40 border border-black/5 hover:border-accent-rose/20"
                }`}
              >
                <XCircle className="w-5 h-5 text-accent-rose" />
                <span className="text-sm font-medium font-body text-brand-ink">错误</span>
              </button>
            </div>
          )}

          {currentQuestion.type === "fill" && (
            <input
              type="text"
              value={currentQuestion.userAnswer || ""}
              onChange={handleFillAnswer}
              onBlur={() => {
                if (currentQuestion.userAnswer) {
                  setQuestions((prev) =>
                    prev.map((q) =>
                      q.id === currentQuestion.id ? { ...q, isAnswered: true } : q
                    )
                  );
                }
              }}
              placeholder="请输入答案..."
              className="w-full h-14 px-4 rounded-xl bg-white/40 border border-black/5 text-sm font-body text-brand-ink placeholder:text-brand-muted/50 outline-none focus:border-accent-electric/20 transition-all duration-200"
            />
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1 h-12 rounded-xl glass-card text-brand-ink font-medium font-body hover:bg-white/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            上一题
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              className="flex-1 h-12 rounded-xl bg-brand-ink text-white font-medium font-body hover:bg-brand-ink/90 transition-all duration-200 cursor-pointer"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="flex-1 h-12 rounded-xl bg-accent-electric text-white font-medium font-body hover:bg-accent-electric/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交答案"
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}