"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  ArrowRight,
  Search,
  FlaskConical,
  BarChart3,
  Sparkles,
  Lightbulb,
  ChevronRight,
  Building2,
  Microscope,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Brain,
  Hash,
  Presentation,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Send,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { IndustryCase } from "@/data/industryCases";
import { getIndustryCaseById } from "@/lib/industryApi";
import {
  generateResearchTask,
  generateFallbackResearchTask,
  type ResearchTaskGenerateResponse,
  type ResearchTaskItem,
} from "@/lib/researchApi";

interface Message { role: "user" | "ai"; content: string; }

const phases = [
  {
    num: 1,
    title: "文献调研",
    icon: <BookOpen className="w-5 h-5" />,
    description:
      "基于本地知识库和已接入资料，辅助整理关键词、研究问题和证据线索；当前版本优先使用本地知识库。",
  },
  {
    num: 2,
    title: "实验设计",
    icon: <FlaskConical className="w-5 h-5" />,
    description:
      "基于研究问题生成高层实验设计框架，包括变量、对照、指标和风险提醒；不生成具体湿实验操作步骤。",
  },
  {
    num: 3,
    title: "数据分析",
    icon: <BarChart3 className="w-5 h-5" />,
    description:
      "用于后续接入数据上传、统计分析、图表和报告生成；当前版本主要生成数据分析任务建议。",
  },
];

const exampleTopics = [
  "CAR-T 细胞治疗为什么会出现抗原逃逸？",
  "mRNA 疫苗为什么需要 LNP？",
  "Venetoclax 和 BCL-2 的关系？",
  "CRISPR 基因编辑治疗有哪些产业应用？",
];

const taskTypeLabels: Record<string, string> = {
  literature_review: "文献调研",
  experiment_design: "实验设计",
  mechanism_explanation: "机制解释",
  evidence_judgement: "证据判断/数据分析",
};

const taskTypeIcons: Record<string, React.ReactNode> = {
  literature_review: <BookOpen className="w-4 h-4" />,
  experiment_design: <FlaskConical className="w-4 h-4" />,
  mechanism_explanation: <Brain className="w-4 h-4" />,
  evidence_judgement: <BarChart3 className="w-4 h-4" />,
};

const PY = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9090";

function TaskCard({ task, index, defaultExpanded }: { task: ResearchTaskItem; index: number; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl bg-white/60 border border-black/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-accent-electric/10 flex items-center justify-center shrink-0 mt-0.5">
          {taskTypeIcons[task.type] || <Target className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-accent-electric uppercase tracking-wider bg-accent-electric/10 px-2 py-0.5 rounded-full">
              {taskTypeLabels[task.type] || task.type}
            </span>
            <span className="text-[10px] text-brand-muted">任务 {index + 1}</span>
          </div>
          <h3 className="font-display font-bold text-sm text-brand-ink">{task.title}</h3>
          <p className="text-xs text-brand-muted mt-1 line-clamp-2">{task.goal}</p>
        </div>
        <div className="shrink-0 text-brand-muted">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-black/5 pt-4 space-y-3">
          <div>
            <h4 className="text-[11px] font-bold text-brand-ink mb-1.5 uppercase tracking-wider">任务目标</h4>
            <p className="text-sm text-brand-muted leading-relaxed">{task.goal}</p>
          </div>

          {task.steps && task.steps.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-brand-ink mb-1.5 uppercase tracking-wider">操作步骤</h4>
              <div className="space-y-2">
                {task.steps.map((step: any, i: number) => {
                  const title = typeof step === "string" ? step : step?.title || "";
                  const desc = typeof step === "string" ? "" : step?.description || "";
                  const duration = typeof step === "string" ? "" : step?.expected_duration || "";
                  return (
                    <div key={i} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-accent-electric/10 text-accent-electric flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-brand-ink">{title}</p>
                        {desc && <p className="text-xs text-brand-muted">{desc}</p>}
                        {duration && (
                          <span className="text-[10px] text-brand-faint mt-0.5 inline-block">
                            预计时长：{duration}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[11px] font-bold text-brand-ink mb-1.5 uppercase tracking-wider">输出要求</h4>
            <p className="text-sm text-brand-muted leading-relaxed">{task.output_requirement}</p>
          </div>

          {task.suggested_keywords && task.suggested_keywords.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-brand-ink mb-1.5 uppercase tracking-wider">推荐关键词</h4>
              <div className="flex flex-wrap gap-1">
                {task.suggested_keywords.map((kw, i) => (
                  <span key={i} className="text-[11px] text-brand-muted bg-white/60 px-1.5 py-0.5 rounded-md font-mono">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.example_outline && (
            <div>
              <h4 className="text-[11px] font-bold text-brand-ink mb-1.5 uppercase tracking-wider">示例提纲</h4>
              <pre className="text-xs text-brand-muted bg-white/40 rounded-lg p-3 font-body leading-relaxed whitespace-pre-wrap">
                {task.example_outline}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DefaultResearchPage() {
  const [topicInput, setTopicInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchTaskGenerateResponse | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "欢迎使用 AI 科研导师！输入研究主题生成训练任务后，你可以向我提问。" },
  ]);
  const [tasks, setTasks] = useState<{ id: string; title: string; difficulty: string; knowledge_point: string; steps: string[] }[]>([]);
  const [papers, setPapers] = useState<{ id: number; title_zh: string; venue: string; year: number; reading_difficulty: string }[]>([]);
  const [kbLoading, setKbLoading] = useState(true);
  const [kbError, setKbError] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const generatingRef = useRef(false);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    Promise.all([
      fetch(`${PY}/api/research/tasks`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("fail"); return r.json(); }),
      fetch(`${PY}/api/research/papers?page_size=6`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("fail"); return r.json(); }),
    ]).then(([t, p]) => {
      if (!cancelled) {
        setTasks(Array.isArray(t) ? t.slice(0, 8) : []);
        setPapers((p.items || []).slice(0, 6));
      }
    }).catch(() => {
      if (!cancelled) setKbError(true);
    }).finally(() => {
      if (!cancelled) setKbLoading(false);
      clearTimeout(timeout);
    });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const um: Message = { role: "user", content: chatInput.trim() };
    setMessages(p => [...p, um]); setChatInput("");
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: um.content, context: "科研实战训练" }) })
      .then(r => r.json()).then(d => setMessages(p => [...p, { role: "ai", content: d.success ? d.message : "回答失败" }]))
      .catch(() => setMessages(p => [...p, { role: "ai", content: "网络错误，请稍后重试" }]));
  };

  const handleGenerate = useCallback(async () => {
    const topic = topicInput.trim();
    if (!topic || generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);
    setResult(null);

    try {
      const data = await generateResearchTask({
        topic,
        case_key: null,
        mode: "independent",
      });
      setResult(data);
    } catch {
      setResult(
        generateFallbackResearchTask(topic, null, "independent")
      );
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  }, [topicInput]);

  const handleExampleClick = (topic: string) => {
    setTopicInput(topic);
  };

  const sourceScopeLabel = (scope: string) => {
    if (scope.includes("案例库")) return "基于本地案例库生成";
    if (scope.includes("产业案例")) return "基于当前产业案例生成";
    if (scope.includes("模板") || scope.includes("template")) return "基于本地模板生成，建议补充文献材料";
    return scope || "基于本地模板生成，建议补充文献材料";
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-14">

        {/* ===== Hero ===== */}
        <div className="text-center mb-10">
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            科研实战训练营
          </h1>
          <p className="text-brand-muted text-sm md:text-base font-body max-w-xl mx-auto">
            研究主题生成 · 文献检索入口 · 实验设计框架 · 证据判断 · 科研训练任务
          </p>
        </div>

        {/* ===== 第一块：开始科研训练输入区 ===== */}
        <div className="glass-card-iridescent rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-brand-ink">开始科研训练</h2>
              <p className="text-xs text-brand-muted font-body">输入研究主题，AI 为你生成结构化科研训练任务</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
              placeholder="请输入研究主题，例如：mRNA 疫苗为什么需要 LNP？"
              className="flex-1 h-12 px-4 rounded-xl bg-white/60 border border-black/5 text-sm font-body text-brand-ink placeholder:text-brand-muted/50 outline-none focus:border-accent-electric/30 focus:bg-white/80 transition-all duration-200"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topicInput.trim()}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-accent-electric to-accent-cyan text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2 justify-center shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "生成中..." : "生成科研任务"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-brand-muted font-body">示例主题：</span>
            {exampleTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleExampleClick(topic)}
                className="text-xs text-accent-electric bg-accent-electric/5 hover:bg-accent-electric/10 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 第二块：生成结果区 ===== */}
        <div className="mb-10">
          {loading && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-accent-electric" />
              <p className="text-sm text-brand-muted font-body">正在生成科研训练任务...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-electric/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-brand-faint/60" />
              </div>
              <p className="text-sm text-brand-muted font-body max-w-sm mx-auto leading-relaxed">
                输入主题后，AI 将生成研究问题、背景说明、匹配案例、相关知识点、实验设计框架、证据判断和科研训练任务。当前版本提供关键词和检索策略建议，不涉及真实文献检索。
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              {/* 来源提示 */}
              {(result.source_scope || result.disclaimer) && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-xs text-brand-muted font-body">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{sourceScopeLabel(result.source_scope)}</span>
                  <span className="text-brand-faint">· {result.disclaimer?.slice(0, 60) || ""}...</span>
                </div>
              )}

              {/* 研究问题与背景 */}
              <section className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-brand-ink">研究问题</h2>
                    <p className="text-[10px] text-brand-muted font-body">AI 生成的核心研究框架</p>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50/40 p-4 mb-4">
                  <h3 className="font-display font-bold text-lg text-brand-ink mb-2">{result.research_question}</h3>
                  <p className="text-sm text-brand-muted font-body leading-relaxed">{result.background}</p>
                </div>

                {result.matched_cases && result.matched_cases.length > 0 && (
                  <div className="rounded-xl bg-green-50/40 p-4 mb-4">
                    <h4 className="text-xs font-bold text-brand-ink mb-2">匹配产业案例</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.matched_cases.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 border border-black/5 text-xs text-brand-ink cursor-default"
                          title={c.reason}
                        >
                          <Building2 className="w-3 h-3 text-accent-electric" />
                          {c.title}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/cases"
                      className="inline-flex items-center gap-1 text-xs text-accent-electric hover:text-accent-electric/80 transition-colors"
                    >
                      查看案例库 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {result.related_knowledge_points && result.related_knowledge_points.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.related_knowledge_points.map((kp, i) => (
                      <span key={i} className="badge badge-cyan text-[11px]">{kp}</span>
                    ))}
                  </div>
                )}
              </section>

              {/* 科研训练任务卡片 */}
              <section className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-brand-ink">科研训练任务</h2>
                    <p className="text-[10px] text-brand-muted font-body">
                      {result.mode === "case_driven" ? "基于产业案例生成" : "基于研究主题生成"} · {result.tasks.length} 个任务
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {result.tasks.map((task, i) => (
                    <TaskCard key={i} task={task} index={i} defaultExpanded={i === 0} />
                  ))}
                </div>
              </section>

              {/* 研究引导 + 导师建议 */}
              <section className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-amber flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-brand-ink">研究引导</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.expected_outputs && result.expected_outputs.length > 0 && (
                    <div className="rounded-xl bg-blue-50/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="w-3.5 h-3.5 text-accent-electric" />
                        <h4 className="text-sm font-bold text-brand-ink">预期输出</h4>
                      </div>
                      <ul className="space-y-1">
                        {result.expected_outputs.map((o, i) => (
                          <li key={i} className="text-[13px] text-brand-muted flex items-start gap-1.5">
                            <span className="text-accent-electric mt-1 shrink-0">•</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl bg-purple-50/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-accent-amber" />
                      <h4 className="text-sm font-bold text-brand-ink">AI 科研导师建议</h4>
                    </div>
                    <p className="text-[13px] text-brand-muted font-body leading-relaxed whitespace-pre-wrap">
                      {result.mentor_advice}
                    </p>
                  </div>
                </div>
              </section>

              {/* 底部操作 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/cases"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/60 border border-black/5 text-sm font-semibold text-brand-ink hover:bg-white hover:border-black/10 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回产业案例库
                </Link>
                <Link
                  href={`/seminar?topic=${encodeURIComponent(result.seminar_topic || result.research_question)}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-cyan text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer flex-1 sm:flex-none"
                >
                  <Presentation className="w-4 h-4" />
                  进入学术研讨
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ===== 第三块：训练流程说明 ===== */}
        <section className="mb-10">
          <h2 className="section-heading mb-2">科研训练流程</h2>
          <p className="text-sm text-brand-muted font-body mb-5 max-w-xl">
            以下描述当前版本各阶段的能力边界和后续规划。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {phases.map((p) => (
              <div key={p.num} className="glass-card rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-ink/5 flex items-center justify-center text-base font-bold font-display text-brand-ink">
                    {p.num}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-brand-ink/5 flex items-center justify-center">
                    {p.icon}
                  </div>
                </div>
                <h3 className="font-display text-base font-bold text-brand-ink mb-2">{p.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed flex-1">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 第四块：辅助区 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* 已接入文献材料 + 科研任务卡 */}
          <div className="lg:col-span-3 space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-base font-bold text-brand-ink mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-electric" />
                已接入文献材料
                <span className="text-xs text-brand-muted font-normal ml-1">({papers.length} 篇)</span>
              </h2>
              {kbLoading ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />
                  <span className="text-xs text-brand-muted">加载中...</span>
                </div>
              ) : kbError || papers.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="w-5 h-5 text-brand-faint/30 mx-auto mb-2" />
                  <p className="text-xs text-brand-muted leading-relaxed max-w-xs mx-auto">当前暂无已接入文献材料。后续可在科研实战中发起文献检索，或上传论文/课程资料作为本地知识来源。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {papers.map((p) => (
                    <Link
                      key={p.id}
                      href="/explore"
                      className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-black/5 hover:border-accent-electric/20 transition-all"
                    >
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">{p.title_zh}</p>
                        <p className="text-xs text-brand-muted">
                          {p.venue} · {p.year} · {p.reading_difficulty}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-faint" />
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                <p className="text-[11px] text-brand-muted font-body leading-relaxed">
                  <span className="font-semibold text-brand-ink">AI 文献检索：接口预留 / 开发中</span>
                  <br />
                  当前版本提供关键词和检索策略建议，真实文献结果需接入外部检索 API 后生成。
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-base font-bold text-brand-ink mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-cyan" />
                科研任务卡
                <span className="text-xs text-brand-muted font-normal ml-1">({tasks.length} 个)</span>
              </h2>
              {kbLoading ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />
                  <span className="text-xs text-brand-muted">加载中...</span>
                </div>
              ) : kbError || tasks.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-5 h-5 text-brand-faint/30 mx-auto mb-2" />
                  <p className="text-xs text-brand-muted">暂无任务卡</p>
                  <p className="text-[10px] text-brand-faint mt-0.5">生成科研任务后将在此显示</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white/40 border border-black/5 hover:border-accent-cyan/20 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-brand-ink">{t.title}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            t.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : t.difficulty === "hard"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {t.difficulty === "easy" ? "入门" : t.difficulty === "hard" ? "挑战" : "进阶"}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted">知识点：{t.knowledge_point}</p>
                      {t.steps?.length > 0 && (
                        <p className="text-[11px] text-brand-faint mt-1">步骤：{t.steps.slice(0, 3).join(" → ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI 科研导师 */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-5 flex flex-col sticky top-[calc(var(--nav-height)+1.5rem)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-brand-ink">AI 科研导师</h3>
                  <p className="text-[10px] text-brand-muted">实时指导与答疑</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 max-h-[320px]" style={{ scrollbarWidth: "thin" }}>
                {messages.length === 1 && messages[0].role === "ai" ? (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-white/60 border border-black/5 rounded-tl-md text-sm text-brand-muted leading-relaxed">
                      {messages[0].content}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === "ai"
                            ? "bg-gradient-to-br from-accent-amber to-accent-electric"
                            : "bg-brand-ink"
                        }`}
                      >
                        {msg.role === "ai" ? (
                          <Bot className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "ai"
                            ? "bg-white/60 border border-black/5 rounded-tl-md text-brand-ink"
                            : "bg-brand-ink text-white rounded-tr-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="向AI导师提问..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-white/40 border border-black/5 text-sm outline-none focus:border-accent-electric/20 transition-colors"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-ink text-white disabled:opacity-30 transition-opacity cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseDrivenResearchPage({ caseData, caseKey }: { caseData: IndustryCase; caseKey: string }) {
  const [result, setResult] = useState<ResearchTaskGenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const lastCaseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastCaseKeyRef.current === caseKey) return;
    lastCaseKeyRef.current = caseKey;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await generateResearchTask({
          topic: caseData.coreProblem || caseData.title,
          case_key: caseKey,
          mode: "case_driven",
        });
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) {
          setResult(
            generateFallbackResearchTask(
              caseData.coreProblem || caseData.title,
              caseKey,
              "case_driven"
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [caseData, caseKey]);

  const sourceScopeLabel = (scope: string) => {
    if (scope.includes("案例库")) return "基于本地案例库生成";
    if (scope.includes("产业案例")) return "基于当前产业案例生成";
    if (scope.includes("模板") || scope.includes("template")) return "基于本地模板生成，建议补充文献材料";
    return scope || "基于本地模板生成，建议补充文献材料";
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-5xl mx-auto pt-8 md:pt-14">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-electric text-[11px] font-semibold">案例驱动科研实战</span>
        </div>

        <h1
          className="font-display font-extrabold text-brand-ink leading-[1.15] tracking-[-0.03em] mb-2"
          style={{ fontSize: "clamp(24px, 3.5vw, 40px)" }}
        >
          {caseData.title}
        </h1>
        <p className="text-brand-muted text-sm md:text-base font-body mb-10">{caseData.subtitle}</p>

        <div className="space-y-5">
          <section className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-brand-ink">当前科研案例</h2>
                <p className="text-xs text-brand-muted font-body">产业案例基础信息与核心问题</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl bg-blue-50/50 p-3">
                <p className="text-[10px] font-bold text-brand-faint uppercase tracking-wider mb-0.5">产业方向</p>
                <p className="text-sm font-semibold text-brand-ink">{caseData.industryDirection}</p>
              </div>
              <div className="rounded-xl bg-blue-50/50 p-3">
                <p className="text-[10px] font-bold text-brand-faint uppercase tracking-wider mb-0.5">证据等级</p>
                <p className="text-sm font-semibold text-brand-ink">{caseData.evidenceLevel}</p>
              </div>
              <div className="rounded-xl bg-blue-50/50 p-3">
                <p className="text-[10px] font-bold text-brand-faint uppercase tracking-wider mb-0.5">来源类型</p>
                <p className="text-sm font-semibold text-brand-ink">{caseData.sourceType}</p>
              </div>
              <div className="rounded-xl bg-blue-50/50 p-3">
                <p className="text-[10px] font-bold text-brand-faint uppercase tracking-wider mb-0.5">科研任务</p>
                <p className="text-sm font-semibold text-brand-ink">{caseData.linkedResearchTask}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white/60 border border-black/5 p-4">
              <p className="text-xs font-bold text-brand-faint uppercase tracking-wider mb-1">核心问题</p>
              <p className="text-sm font-body text-brand-ink leading-relaxed">{caseData.coreProblem}</p>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-3">
              <BookOpen className="w-4 h-4 text-accent-cyan" />
              <h2 className="font-display font-bold text-base text-brand-ink">相关知识点</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {caseData.relatedKnowledgePoints.map((kp, i) => (
                <span key={i} className="badge badge-cyan text-[11px]">{kp}</span>
              ))}
            </div>
          </section>

          {loading && (
            <section className="glass-card rounded-2xl p-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-accent-electric" />
              <p className="text-sm text-brand-muted font-body">正在生成科研训练任务...</p>
            </section>
          )}

          {result && !loading && (
            <>
              {(result.source_scope || result.disclaimer) && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-xs text-brand-muted font-body">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{sourceScopeLabel(result.source_scope)}</span>
                </div>
              )}

              <section className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-brand-ink">科研训练任务</h2>
                    <p className="text-xs text-brand-muted font-body">
                      基于案例核心问题与知识点生成 · {result.tasks.length} 个任务
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-4">
                  {result.tasks.map((task, i) => (
                    <TaskCard key={i} task={task} index={i} defaultExpanded={i === 0} />
                  ))}
                </div>
              </section>

              <section className="glass-card rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-amber flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-brand-ink">研究引导</h2>
                    <p className="text-xs text-brand-muted font-body">基于案例字段生成的研究框架</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-blue-50/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-3.5 h-3.5 text-accent-electric" />
                      <h4 className="text-sm font-bold text-brand-ink">研究问题</h4>
                    </div>
                    <p className="text-[13px] text-brand-ink font-body leading-relaxed">{result.research_question}</p>
                    {result.background && (
                      <p className="text-xs text-brand-muted mt-2 leading-relaxed">{result.background}</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-blue-50/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-3.5 h-3.5 text-accent-cyan" />
                      <h4 className="text-sm font-bold text-brand-ink">推荐关键词</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.related_knowledge_points.map((kw, i) => (
                        <span key={i} className="text-xs text-brand-muted bg-white/60 px-2 py-0.5 rounded-md font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result.expected_outputs && result.expected_outputs.length > 0 && (
                    <div className="rounded-xl bg-blue-50/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-3.5 h-3.5 text-accent-amber" />
                        <h4 className="text-sm font-bold text-brand-ink">预期输出</h4>
                      </div>
                      <ul className="space-y-1">
                        {result.expected_outputs.map((o, i) => (
                          <li key={i} className="text-[13px] text-brand-muted flex items-start gap-1.5">
                            <span className="text-accent-amber mt-1 shrink-0">•</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl bg-purple-50/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-accent-amber" />
                      <h4 className="text-sm font-bold text-brand-ink">AI 科研导师建议</h4>
                    </div>
                    <p className="text-[13px] text-brand-muted font-body leading-relaxed whitespace-pre-wrap">
                      {result.mentor_advice}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Link
              href="/cases"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/60 border border-black/5 text-sm font-semibold text-brand-ink hover:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回产业案例库
            </Link>
            <Link
              href={`/seminar?caseId=${caseKey}`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-cyan text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <Presentation className="w-4 h-4" />
              进入学术研讨
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvalidCasePage() {
  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="font-display font-bold text-xl text-brand-ink mb-2">未找到对应产业案例</h2>
        <p className="text-sm text-brand-muted font-body leading-relaxed mb-6">
          该案例可能已被移除或 ID 无效。您可以返回产业案例库重新选择感兴趣的案例进行科研实战训练。
        </p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-cyan text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回产业案例库
        </Link>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  const [caseId, setCaseId] = useState<string | null | undefined>(undefined);
  const [caseData, setCaseData] = useState<IndustryCase | null>(null);
  const [caseNotFound, setCaseNotFound] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("caseId");
    if (id) {
      setCaseId(id);
      setLoadingCase(true);
      getIndustryCaseById(id).then((found) => {
        if (found) {
          setCaseData(found);
        } else {
          setCaseNotFound(true);
        }
        setLoadingCase(false);
      });
    } else {
      setCaseId(null);
    }
  }, []);

  if (caseId === undefined || loadingCase) {
    return null;
  }

  if (caseNotFound) {
    return <InvalidCasePage />;
  }

  if (caseData && caseId) {
    return <CaseDrivenResearchPage caseData={caseData} caseKey={caseId} />;
  }

  return <DefaultResearchPage />;
}