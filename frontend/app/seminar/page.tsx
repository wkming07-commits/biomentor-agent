"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileUp,
  Loader2,
  MessageSquare,
  PenLine,
  Send,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";

import { industryCases } from "@/data/industryCases";
import type { DefenseBrief, DefenseTranscriptItem } from "@/lib/defense-flow";

type Difficulty = "basic" | "standard" | "challenge";
type Stage = "source" | "brief" | "defense" | "report";

interface DefenseQuestion {
  committeeRole: string;
  question: string;
  intent?: string;
}

interface DefenseReport {
  totalScore: number;
  dimensions: Array<{ label: string; score: number; comment: string }>;
  committeeFeedback: string;
  weakPoints: string[];
  moduleRecommendations: Array<{ label: string; href: string; reason: string }>;
  nextDefenseTopics: string[];
}

const seedText = `题目：基于 CRISPR-Cas9 的胃癌相关基因调控研究
背景：胃癌发生与 TP53、EGFR 和细胞周期调控异常有关。
科学问题：如何利用 CRISPR-Cas9 验证候选基因对胃癌细胞增殖的影响？
方法：设计 sgRNA，构建表达载体，进行细胞转染、测序验证和增殖实验。
创新点：把基因编辑与通路图谱结合，形成可解释的机制链。`;

// Safe type helpers — handle any shape from AI API
function safeStr(v: unknown, fb = ""): string { return typeof v === "string" ? v : fb; }
function safeNum(v: unknown, fb = 0): number { return typeof v === "number" ? v : (typeof v === "string" ? (parseInt(v, 10) || fb) : fb); }
function safeArr<T>(v: unknown, fb: T[]): T[] { return Array.isArray(v) ? v as T[] : fb; }
function safeDim(v: unknown) { const o = v && typeof v === "object" ? v as Record<string,unknown> : {}; return { label: safeStr(o.label || o.name || o.dimension, ""), score: safeNum(o.score, 70), comment: safeStr(o.comment || o.feedback || o.note, "") }; }
function safeMod(v: unknown) { const o = v && typeof v === "object" ? v as Record<string,unknown> : {}; return { label: safeStr(o.label, ""), href: safeStr(o.href, "#"), reason: safeStr(o.reason, "") }; }
const defaultModules = [{ label: "知识图谱", href: "/knowledge-map", reason: "补齐前置概念" }, { label: "科研实战", href: "/research", reason: "完成科研任务训练" }, { label: "文献工作台", href: "/paper-workbench", reason: "管理答辩文献" }];

function normalizeDefenseReport(value: Partial<DefenseReport> | null | undefined): DefenseReport {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const dimensions = safeArr(source.dimensions, []).length > 0
    ? safeArr(source.dimensions, []).map(safeDim).filter((item) => item.label)
    : [
        { label: "问题意识", score: 70, comment: "当前答辩记录较短，建议继续补充研究问题和假设。" },
        { label: "方法设计", score: 70, comment: "需要进一步说明实验路线、对照和可重复性。" },
        { label: "证据表达", score: 68, comment: "建议补充关键证据、预期结果和判断标准。" },
      ];
  const moduleRecommendations = safeArr(source.moduleRecommendations, []).map(safeMod).filter((item) => item.label) || [];

  return {
    totalScore: safeNum(source.totalScore, 70),
    dimensions,
    committeeFeedback: safeStr(source.committeeFeedback, "已生成阶段性报告。由于答辩轮次较少，建议继续完成更多追问以获得更稳定的训练反馈。"),
    weakPoints: safeArr<string>(source.weakPoints, []).length > 0
      ? safeArr<string>(source.weakPoints, [])
      : ["答辩轮次较少，薄弱点需要更多回答样本才能稳定判断。"],
    moduleRecommendations: moduleRecommendations.length > 0 ? moduleRecommendations : defaultModules,
    nextDefenseTopics: safeArr<string>(source.nextDefenseTopics, []).length > 0
      ? safeArr<string>(source.nextDefenseTopics, [])
      : ["补充研究背景、方法路线和预期结果后再次答辩"],
  };
}

export default function SeminarPage() {
  const [stage, setStage] = useState<Stage>("source");
  const [sourceText, setSourceText] = useState(seedText);
  const [sourceLabel, setSourceLabel] = useState("手动粘贴");
  const [brief, setBrief] = useState<DefenseBrief | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [turnLimit, setTurnLimit] = useState<3 | 5 | 8>(5);
  const [turnIndex, setTurnIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<DefenseQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<DefenseTranscriptItem[]>([]);
  const [report, setReport] = useState<DefenseReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canStartDefense = Boolean(brief?.title && brief?.researchQuestion && brief?.methods.length);
  const progress = stage === "source" ? 1 : stage === "brief" ? 2 : stage === "defense" ? 3 : 4;

  const modeLabel = brief?.mode === "paper_defense" ? "论文答辩" : "开题答辩";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get("caseId");
    const topic = params.get("topic");
    const source = params.get("source");
    const summary = params.get("summary");

    if (caseId) {
      const caseData = industryCases.find((item) => item.id === caseId);
      if (!caseData) {
        setStatusText("未找到对应产业案例，你可以继续粘贴材料生成答辩资料包。");
        return;
      }

      const label = `站内导入：产业案例`;
      setSourceLabel(label);
      setSourceText(
        [
          `题目：${caseData.title}`,
          `来源：${label}`,
          `背景：${caseData.background || caseData.subtitle}`,
          `核心问题：${caseData.coreProblem}`,
          `研究基础：${caseData.researchFoundation}`,
          `应用价值：${caseData.applicationValue}`,
          `产业方向：${caseData.industryDirection}`,
          `证据等级：${caseData.evidenceLevel}`,
          `来源类型：${caseData.sourceType}`,
          `相关知识点：${caseData.relatedKnowledgePoints.join("、")}`,
          `推荐检索词：${caseData.recommendedKeywords.join("、")}`,
          `方法：结合机制解释、证据判断、实验设计与产业转化路径，组织为可答辩的研究主题。`,
        ].join("\n"),
      );
      return;
    }

    if (!topic && !summary) return;
    const label = source ? `站内导入：${source}` : "站内导入";
    setSourceLabel(label);
    setSourceText(
      [
        `题目：${topic || "站内模块导入主题"}`,
        `来源：${label}`,
        summary ? `背景：${summary}` : "背景：该主题来自 BioMentor Agent 站内模块，可围绕概念理解、工具结果、研究问题和应用价值展开答辩。",
        "科学问题：如何把该主题转化为清晰、可验证、可表达的科研问题？",
        "方法：结合知识图谱、生物工具箱和文献证据，组织机制解释、验证路线和局限性说明。",
      ].join("\n"),
    );
  }, []);

  async function createBriefFromText() {
    setIsLoading(true);
    setStatusText("正在凝练答辩资料包");
    try {
      const res = await fetch("/api/ai/defense/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: "manual", sourceLabel, text: sourceText }),
      });
      const result = await res.json();
      if (!result?.data) throw new Error("empty brief");
      setBrief(result.data);
      setStage("brief");
    } catch {
      setStatusText("资料包生成失败，请补充文本后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setStatusText("正在读取文件并生成资料包");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sourceType", "file");
      form.append("sourceLabel", file.name);
      const res = await fetch("/api/ai/defense/brief", { method: "POST", body: form });
      const result = await res.json();
      if (!result?.data) throw new Error("empty brief");
      setSourceLabel(file.name);
      setBrief(result.data);
      setStage("brief");
    } catch {
      setStatusText("文件解析失败。建议先导出为 PDF、DOCX、PPTX 或粘贴正文。");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  }

  async function startDefense() {
    if (!brief) return;
    setStage("defense");
    setTranscript([]);
    setTurnIndex(0);
    setReport(null);
    await fetchNextQuestion([], 0);
  }

  async function fetchNextQuestion(nextTranscript: DefenseTranscriptItem[], nextTurn: number) {
    if (!brief) return;
    setIsLoading(true);
    setStatusText("答辩委员会正在生成下一问");
    try {
      const res = await fetch("/api/ai/defense/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, difficulty, turnLimit, turnIndex: nextTurn, transcript: nextTranscript }),
      });
      const result = await res.json();
      if (!result?.data) throw new Error("empty question");
      setCurrentQuestion(result.data);
      setTranscript([
        ...nextTranscript,
        {
          role: "committee",
          committeeRole: result.data.committeeRole,
          content: result.data.question,
        },
      ]);
    } catch {
      setStatusText("下一问生成失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer() {
    if (!brief || !answer.trim() || !currentQuestion) return;
    const studentMessage: DefenseTranscriptItem = { role: "student", content: answer.trim() };
    const nextTranscript = [...transcript, studentMessage];
    setTranscript(nextTranscript);
    setAnswer("");

    const answeredTurns = turnIndex + 1;
    setTurnIndex(answeredTurns);
    if (answeredTurns >= turnLimit) {
      await finishReport(nextTranscript);
      return;
    }
    await fetchNextQuestion(nextTranscript, answeredTurns);
  }

  async function finishReport(finalTranscript = transcript) {
    if (!brief || isLoading) return;
    setIsLoading(true);
    setStatusText("正在生成闭环答辩报告");
    try {
      const res = await fetch("/api/ai/defense/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, difficulty, turnLimit, transcript: finalTranscript }),
      });
      const result = await res.json();
      if (!result?.data) throw new Error("empty report");
      setReport(normalizeDefenseReport(result.data));
      setStage("report");
    } catch {
      setStatusText("报告生成失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  const briefSections = useMemo(
    () =>
      brief
        ? [
            { key: "background", label: "研究背景" },
            { key: "researchQuestion", label: "科学问题" },
            { key: "hypothesis", label: "研究假设" },
            { key: "applicationValue", label: "应用价值" },
          ] as const
        : [],
    [brief],
  );

  return (
    <div className="min-h-screen pt-[var(--nav-height)] font-body text-[#111827]">
      <section className="relative overflow-hidden px-5 py-8 md:px-10 md:py-12">
        <div className="absolute inset-0 liquid-hero-bg" />
        <div className="bio-network opacity-50" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <header className="mb-6 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-black text-[#2563eb] shadow-sm">
                <Users className="h-4 w-4" />
                科研答辩工作台
              </div>
              <h1 className="mt-5 font-display text-[clamp(36px,6vw,72px)] font-black leading-none tracking-[-0.06em]">
                模拟学术答辩
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                导入开题材料、论文摘要或站内工具结果，先生成可编辑的 Defense Brief，再进入多角色文字答辩，最后输出闭环训练报告。
              </p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white/58 p-4 shadow-[0_18px_55px_rgba(67,106,160,.12)] backdrop-blur-2xl">
              <div className="mb-3 flex items-center justify-between text-xs font-black text-slate-500">
                <span>训练进度</span>
                <span>{progress}/4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["资料", "Brief", "答辩", "报告"].map((item, index) => (
                  <div key={item} className="space-y-2">
                    <div className={`h-2 rounded-full ${index < progress ? "bg-[#2563eb]" : "bg-slate-200"}`} />
                    <div className={index < progress ? "text-xs font-black text-[#2563eb]" : "text-xs font-bold text-slate-400"}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {statusText && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-slate-500">
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {statusText}
            </div>
          )}

          {stage === "source" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <main className="rounded-[32px] border border-white/85 bg-white/58 p-5 shadow-[0_24px_72px_rgba(67,106,160,.13)] backdrop-blur-2xl md:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111827] text-white">
                    <PenLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-black">导入答辩材料</h2>
                    <p className="text-sm text-slate-500">支持粘贴文本，也支持 PDF / DOCX / PPT / PPTX 上传。</p>
                  </div>
                </div>
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  className="h-[420px] w-full resize-none rounded-[24px] border border-white/85 bg-white/70 p-5 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100/70"
                  placeholder="粘贴论文摘要、开题报告、实验方案或课程任务要求..."
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={createBriefFromText}
                    disabled={isLoading || !sourceText.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    生成 Defense Brief
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.ppt,.pptx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-white disabled:opacity-45"
                  >
                    <Upload className="h-4 w-4" />
                    上传文件
                  </button>
                </div>
              </main>
              <aside className="space-y-4">
                {[
                  ["站内模块导入", "知识图谱、科研实战、产业案例和四个工具都可以作为答辩主题来源。"],
                  ["AI 凝练资料包", "把长材料整理成标题、背景、科学问题、假设、方法、证据和局限性。"],
                  ["闭环训练报告", "答辩中不显示逐轮评分，结束后统一输出六维评分与下一轮建议。"],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-[28px] border border-white/80 bg-white/58 p-5 shadow-[0_14px_44px_rgba(67,106,160,.1)] backdrop-blur-2xl">
                    <div className="mb-2 font-display text-base font-black">{title}</div>
                    <p className="text-sm leading-7 text-slate-500">{desc}</p>
                  </div>
                ))}
              </aside>
            </div>
          )}

          {stage === "brief" && brief && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <main className="rounded-[32px] border border-white/85 bg-white/60 p-5 shadow-[0_24px_72px_rgba(67,106,160,.13)] backdrop-blur-2xl md:p-7">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 pr-0 lg:pr-4">
                    <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563eb]">{modeLabel}</div>
                    <textarea
                      value={brief.title}
                      onChange={(event) => setBrief({ ...brief, title: event.target.value })}
                      rows={2}
                      className="block min-h-[92px] w-full resize-none bg-transparent font-display text-3xl font-black leading-tight tracking-[-0.04em] text-[#111827] outline-none md:text-4xl"
                    />
                  </div>
                  <button
                    onClick={startDefense}
                    disabled={!canStartDefense || isLoading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(17,24,39,.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    确认并开始答辩
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {briefSections.map((section) => (
                    <label key={section.key} className="block rounded-[24px] border border-white/80 bg-white/60 p-4">
                      <span className="text-xs font-black text-slate-400">{section.label}</span>
                      <textarea
                        value={String(brief[section.key] || "")}
                        onChange={(event) => setBrief({ ...brief, [section.key]: event.target.value })}
                        className="mt-2 h-28 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
                      />
                    </label>
                  ))}
                </div>
                <EditableList title="研究目标" items={brief.objectives} onChange={(items) => setBrief({ ...brief, objectives: items })} />
                <EditableList title="方法路线" items={brief.methods} onChange={(items) => setBrief({ ...brief, methods: items })} />
                <EditableList title="证据与局限" items={[...brief.evidence, ...brief.limitations]} onChange={(items) => setBrief({ ...brief, evidence: items.slice(0, Math.ceil(items.length / 2)), limitations: items.slice(Math.ceil(items.length / 2)) })} />
              </main>
              <aside className="h-fit rounded-[30px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_70px_rgba(67,106,160,.13)] backdrop-blur-2xl transition-all duration-500 ease-out xl:sticky xl:top-24">
                <h3 className="font-display text-lg font-black">答辩设置</h3>
                <div className="mt-4 space-y-4">
                  <OptionGroup
                    label="难度"
                    value={difficulty}
                    options={[
                      ["basic", "基础"],
                      ["standard", "标准"],
                      ["challenge", "挑战"],
                    ]}
                    onChange={(value) => setDifficulty(value as Difficulty)}
                  />
                  <OptionGroup
                    label="轮数"
                    value={String(turnLimit)}
                    options={[
                      ["3", "3 轮"],
                      ["5", "5 轮"],
                      ["8", "8 轮"],
                    ]}
                    onChange={(value) => setTurnLimit(Number(value) as 3 | 5 | 8)}
                  />
                  <div className="rounded-2xl bg-slate-50/80 p-4 text-sm leading-7 text-slate-500">
                    答辩过程中只显示评委问题和你的回答，不展示逐轮评分；评分和缺失点会在最终报告里统一呈现。
                  </div>
                </div>
              </aside>
            </div>
          )}

          {stage === "defense" && brief && (
            <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
              <aside className="h-fit rounded-[30px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_70px_rgba(67,106,160,.13)] backdrop-blur-2xl xl:sticky xl:top-24">
                <div className="text-xs font-black text-slate-400">Defense Brief</div>
                <h2 className="mt-2 font-display text-xl font-black">{brief.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">{brief.researchQuestion}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {brief.keywords.map((keyword) => {
                    const text = typeof keyword === "string" ? keyword : (keyword as Record<string,unknown>)?.label as string || (keyword as Record<string,unknown>)?.id as string || JSON.stringify(keyword);
                    return <span key={text} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563eb]">{text}</span>;
                  })}
                </div>
              </aside>

              <main className="flex min-h-[680px] flex-col rounded-[32px] border border-white/85 bg-white/62 p-5 shadow-[0_24px_72px_rgba(67,106,160,.13)] backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 pb-4">
                  <div>
                    <div className="text-xs font-black text-slate-400">第 {Math.min(turnIndex + 1, turnLimit)} / {turnLimit} 轮</div>
                    <h2 className="font-display text-xl font-black">答辩室</h2>
                  </div>
                  <button
                    onClick={() => finishReport()}
                    disabled={isLoading}
                    className="rounded-2xl border border-white/80 bg-white/70 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isLoading ? "等待追问生成" : "提前生成报告"}
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  {transcript.map((item, index) => (
                    <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === "student" ? "flex-row-reverse" : ""}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.role === "student" ? "bg-[#2563eb] text-white" : "bg-[#111827] text-white"}`}>
                        {item.role === "student" ? <PenLine className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      </div>
                      <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-7 ${item.role === "student" ? "rounded-tr-sm bg-[#2563eb] text-white" : "rounded-tl-sm bg-white/85 text-slate-700"}`}>
                        {item.committeeRole && <div className="mb-1 text-xs font-black text-slate-400">{typeof item.committeeRole === "string" ? item.committeeRole : (item.committeeRole as Record<string,unknown>).label as string || ""}</div>}
                        {typeof item.content === "string" ? item.content : (item.content as Record<string,unknown>)?.question as string || JSON.stringify(item.content)}
                      </div>
                    </div>
                  ))}
                  {isLoading && <LoadingBubble text="正在等待评委追问" />}
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-200/60 pt-4">
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="输入你的答辩回答..."
                    className="h-20 min-w-0 flex-1 resize-none rounded-2xl border border-white/85 bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-100/70"
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={isLoading || !answer.trim()}
                    className="flex w-14 items-center justify-center rounded-2xl bg-[#111827] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </main>

              <aside className="h-fit rounded-[30px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_70px_rgba(67,106,160,.13)] backdrop-blur-2xl xl:sticky xl:top-24">
                <h3 className="font-display text-lg font-black">委员会视角</h3>
                <div className="mt-4 space-y-3">
                  {["机制委员", "方法委员", "证据委员", "应用委员"].map((role) => (
                    <div key={role} className="rounded-2xl bg-white/60 p-3 text-sm font-bold text-slate-600">{role}</div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {stage === "report" && report && (
            <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="rounded-[32px] border border-white/85 bg-white/62 p-6 text-center shadow-[0_24px_72px_rgba(67,106,160,.13)] backdrop-blur-2xl">
                <Award className="mx-auto h-10 w-10 text-[#2563eb]" />
                <div className="mt-4 text-xs font-black text-slate-400">综合评分</div>
                <div className="stat-number mt-2 text-6xl text-[#2563eb]">{safeNum(report.totalScore, 75)}</div>
                <p className="mt-4 text-sm leading-7 text-slate-500">{safeStr(report.committeeFeedback, "答辩训练完成，请查看详细分析。")}</p>
              </aside>
              <main className="space-y-5">
                <section className="rounded-[32px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_60px_rgba(67,106,160,.11)] backdrop-blur-2xl">
                  <h2 className="font-display text-xl font-black">六维评分</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {safeArr(report.dimensions, []).map((item, i) => {
                      const d = safeDim(item);
                      return (
                        <div key={d.label || i} className="rounded-2xl bg-white/64 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold">{d.label}</span>
                            <span className="font-display text-xl font-black text-[#2563eb]">{d.score}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{d.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="grid gap-5 lg:grid-cols-2">
                  <ReportPanel icon={BrainCircuit} title="薄弱点" items={safeArr(report.weakPoints, ["请继续练习以提高答辩能力"])} />
                  <ReportPanel icon={BookOpen} title="下一轮主题" items={safeArr(report.nextDefenseTopics, ["重新练习科学问题表达", "加强证据链训练", "补充方法设计细节"])} />
                </section>
                <section className="rounded-[32px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_60px_rgba(67,106,160,.11)] backdrop-blur-2xl">
                  <h2 className="font-display text-xl font-black">模块联动建议</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {safeArr(report.moduleRecommendations, defaultModules).map((item, i) => {
                      const m = safeMod(item);
                      return (
                        <Link key={m.href || i} href={m.href || "#"} className="rounded-2xl bg-[#111827] p-4 text-white transition hover:-translate-y-0.5">
                          <div className="font-black">{m.label}</div>
                          <p className="mt-2 text-xs leading-5 text-white/70">{m.reason}</p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              </main>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EditableList({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <label className="mt-4 block rounded-[24px] border border-white/80 bg-white/60 p-4">
      <span className="text-xs font-black text-slate-400">{title}</span>
      <textarea
        value={items.join("\n")}
        onChange={(event) => onChange(event.target.value.split(/\n/).map((item) => item.trim()).filter(Boolean))}
        className="mt-2 h-28 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
      />
    </label>
  );
}

function OptionGroup({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  const activeIndex = Math.max(0, options.findIndex(([id]) => id === value));

  return (
    <div>
      <div className="mb-2 text-xs font-black text-slate-400">{label}</div>
      <div className="relative grid grid-cols-3 gap-2 overflow-hidden rounded-2xl bg-slate-100/70 p-1.5">
        <span
          data-defense-option-slider="true"
          className="absolute bottom-1.5 top-1.5 rounded-xl bg-white shadow-[0_10px_26px_rgba(37,99,235,.12)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{
            width: `calc((100% - 12px - ${(options.length - 1) * 8}px) / ${options.length})`,
            transform: `translateX(calc(${activeIndex} * (100% + 8px)))`,
          }}
        />
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative z-10 rounded-xl px-3 py-2 text-xs transition-colors duration-300 ${
              value === id
                ? "font-black text-[#2563eb]"
                : "font-bold text-slate-500 hover:text-[#111827]"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white">
        <MessageSquare className="h-4 w-4" />
      </div>
      <div className="rounded-3xl rounded-tl-sm bg-white/85 px-4 py-3 text-sm font-semibold text-slate-500">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        {text}
      </div>
    </div>
  );
}

function ReportPanel({ icon: Icon, title, items }: { icon: typeof FileUp; title: string; items: string[] }) {
  return (
    <div className="rounded-[32px] border border-white/85 bg-white/62 p-5 shadow-[0_20px_60px_rgba(67,106,160,.11)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#2563eb]" />
        <h2 className="font-display text-xl font-black">{title}</h2>
      </div>
      <ul className="space-y-3 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
