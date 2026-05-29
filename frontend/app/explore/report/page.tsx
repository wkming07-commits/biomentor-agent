"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  FileText,
  Download,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Award,
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: number;
  type: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResult {
  questions: Question[];
  correctCount: number;
  score: number;
  totalQuestions: number;
}

export default function ReportPage() {
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "wrong" | "suggestions">("overview");
  const [persistentWrongQuestions, setPersistentWrongQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const storedResult = localStorage.getItem("quizResult");
    if (storedResult) {
      const data = JSON.parse(storedResult);
      setQuizResult({
        ...data,
        questions: data.questions.map((q: Question) => ({
          ...q,
          isCorrect: q.userAnswer === q.correctAnswer,
        })),
      });
    }

    const storedWrongQuestions = localStorage.getItem("wrongQuestions");
    if (storedWrongQuestions) {
      setPersistentWrongQuestions(JSON.parse(storedWrongQuestions));
    }
  }, []);

  if (!quizResult) {
    return (
      <div className="min-h-screen pt-[var(--nav-height)] px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent-amber/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-accent-amber" />
          </div>
          <h3 className="font-display font-bold text-brand-ink mb-2">暂无学习报告</h3>
          <p className="text-brand-muted font-body mb-4">请先完成练习题</p>
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

  const wrongQuestions = quizResult.questions.filter((q) => !q.isCorrect);
  
  const weakPoints = [
    { id: 1, title: "DNA复制模式", accuracy: 67, suggestion: "建议复习半保留复制的概念，理解每个新DNA分子的组成结构。" },
    { id: 2, title: "DNA修复机制", accuracy: 50, suggestion: "区分NHEJ和HDR两种修复方式的特点和适用场景。" },
    { id: 3, title: "复制叉结构", accuracy: 80, suggestion: "理解前导链和后随链的合成差异，以及冈崎片段的形成原因。" },
  ];

  const studySuggestions = [
    "建议重点复习DNA复制的基本概念，特别是半保留复制模型。理解每个新DNA分子都包含一条原始母链和一条新合成子链的特点，这是遗传信息准确传递的关键机制。",
    "深入理解DNA修复机制的两种主要方式：NHEJ（非同源末端连接）是快速但易错的修复方式，而HDR（同源定向修复）是精确的修复方式。建议对比学习这两种机制的适用场景和生物学意义。",
    "通过绘制流程图梳理DNA复制的完整过程，包括解旋酶解开双链、DNA聚合酶合成新链、RNA引物的作用、冈崎片段的形成与连接等关键步骤，强化记忆和理解。",
    "重点关注复制叉结构的详细描述，理解前导链和后随链的不对称合成机制，以及拓扑异构酶如何缓解复制过程中产生的DNA超螺旋应力。",
    "建议结合实际案例理解DNA复制的生物学意义，例如为什么DNA复制的准确性对生物体至关重要，以及复制错误可能导致的遗传疾病。",
    "针对薄弱知识点，可以通过查阅相关学术文献、观看教学视频等方式进行补充学习，多角度理解复杂概念。",
  ];

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <section className="max-w-4xl mx-auto pt-8 md:pt-16">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/explore/quiz"
            className="flex items-center gap-2 text-brand-muted hover:text-brand-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-body">返回</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-black/5 text-sm font-body text-brand-ink hover:bg-white/80 transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center mx-auto mb-4">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-ink mb-2">学习报告</h1>
            <p className="text-brand-muted font-body">DNA复制机制 - 章节测试</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/40 text-center">
              <div className="text-3xl font-display font-bold text-accent-electric mb-1">
                {quizResult.score}
              </div>
              <div className="text-xs text-brand-muted font-body">总分</div>
            </div>
            <div className="p-4 rounded-xl bg-white/40 text-center">
              <div className="text-3xl font-display font-bold text-accent-cyan mb-1">
                {Math.round((quizResult.correctCount / quizResult.totalQuestions) * 100)}%
              </div>
              <div className="text-xs text-brand-muted font-body">正确率</div>
            </div>
            <div className="p-4 rounded-xl bg-white/40 text-center">
              <div className="text-3xl font-display font-bold text-accent-amber mb-1">
                {quizResult.totalQuestions - quizResult.correctCount}
              </div>
              <div className="text-xs text-brand-muted font-body">错题数</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/40 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-brand-ink text-white"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            成绩概览
          </button>
          <button
            onClick={() => setActiveTab("wrong")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all cursor-pointer ${
              activeTab === "wrong"
                ? "bg-brand-ink text-white"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            错题集
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all cursor-pointer ${
              activeTab === "suggestions"
                ? "bg-brand-ink text-white"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            学习建议
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-brand-ink mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-electric" />
              知识点掌握情况
            </h3>
            <div className="space-y-4">
              {weakPoints.map((point) => (
                <div key={point.id} className="p-4 rounded-xl bg-white/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-brand-ink">{point.title}</span>
                    <span
                      className={`text-sm font-bold ${
                        point.accuracy >= 60 ? "text-accent-cyan" : point.accuracy >= 40 ? "text-accent-amber" : "text-accent-rose"
                      }`}
                    >
                      {point.accuracy}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        point.accuracy >= 60 ? "bg-accent-cyan" : point.accuracy >= 40 ? "bg-accent-amber" : "bg-accent-rose"
                      }`}
                      style={{ width: `${point.accuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-brand-muted font-body mt-2">{point.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "wrong" && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-brand-ink flex items-center gap-2">
                <XCircle className="w-5 h-5 text-accent-rose" />
                错题集
              </h3>
              <button
                onClick={() => {
                  localStorage.removeItem("wrongQuestions");
                  setPersistentWrongQuestions([]);
                }}
                className="text-xs text-brand-muted hover:text-accent-rose transition-colors cursor-pointer"
              >
                清空错题
              </button>
            </div>
            {persistentWrongQuestions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-accent-cyan/50 mx-auto mb-4" />
                <p className="text-brand-muted font-body">太棒了！没有错题</p>
              </div>
            ) : (
              <div className="space-y-4">
                {persistentWrongQuestions.map((q, index) => (
                  <div key={`${q.id}-${index}`} className="p-4 rounded-xl bg-accent-rose/5 border border-accent-rose/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-rose">{q.type === "choice" ? "选择题" : q.type === "judge" ? "判断题" : "填空题"}</span>
                      <XCircle className="w-4 h-4 text-accent-rose" />
                    </div>
                    <p className="text-sm font-body text-brand-ink mb-3">{q.question}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-brand-muted">你的答案：</span>
                        <span className="text-accent-rose font-medium">
                          {q.type === "judge" ? (q.userAnswer === "true" ? "正确" : "错误") : q.userAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="text-brand-muted">正确答案：</span>
                        <span className="text-accent-cyan font-medium">
                          {q.type === "judge" ? (q.correctAnswer === "true" ? "正确" : "错误") : q.correctAnswer}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-brand-muted mt-2">
                      <span className="font-medium text-brand-ink">解析：</span>
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-brand-ink mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-electric" />
              AI 学习建议
            </h3>
            <div className="space-y-4">
              {studySuggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/40">
                  <div className="w-6 h-6 rounded-lg bg-accent-electric/10 flex items-center justify-center text-accent-electric text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm font-body text-brand-muted">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/explore"
            className="flex-1 h-12 rounded-xl glass-card text-brand-ink font-medium font-body hover:bg-white/80 transition-all duration-200 flex items-center justify-center"
          >
            返回首页
          </Link>
          <Link
            href="/explore/quiz"
            className="flex-1 h-12 rounded-xl bg-brand-ink text-white font-medium font-body hover:bg-brand-ink/90 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重新练习
          </Link>
        </div>
      </section>
    </div>
  );
}