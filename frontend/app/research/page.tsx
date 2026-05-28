"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  ArrowRight,
  Search,
  FlaskConical,
  BarChart3,
  Send,
  Bot,
  User,
  Sparkles,
  Target,
  Play,
  CheckCircle2,
  Clock,
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
} from "lucide-react";
import Link from "next/link";
import { industryCases, type IndustryCase } from "@/data/industryCases";

interface Message {
  role: "user" | "ai";
  content: string;
}

const phases = [
  {
    num: 1,
    title: "文献调研",
    icon: <BookOpen className="w-5 h-5" />,
    description:
      "AI 助手帮你检索相关文献，提取关键信息，构建研究框架与知识图谱",
    accent: "accent-electric",
  },
  {
    num: 2,
    title: "实验设计",
    icon: <FlaskConical className="w-5 h-5" />,
    description:
      "基于文献调研结果，AI 辅助设计实验方案、优化参数、预测潜在风险",
    accent: "accent-cyan",
  },
  {
    num: 3,
    title: "数据分析",
    icon: <BarChart3 className="w-5 h-5" />,
    description:
      "AI 辅助处理实验数据、可视化展示、统计分析与报告撰写",
    accent: "accent-amber",
  },
];

const milestoneChecks = [
  { label: "文献调研完成", done: true },
  { label: "实验方案设计", done: true },
  { label: "预实验验证", done: false },
  { label: "正式实验进行中", done: false },
  { label: "数据分析与论文撰写", done: false },
];

const demoMessages: Message[] = [
  {
    role: "ai",
    content:
      "欢迎进入科研实战训练营！我们将围绕 CRISPR-Cas9 在 CHO 细胞中的基因敲除效率研究，逐步推进文献调研、实验设计和数据分析全流程。你准备好开始了吗？",
  },
  {
    role: "user",
    content: "好的！我该从哪里开始？",
  },
  {
    role: "ai",
    content:
      "建议从文献调研入手。首先检索 CHO 细胞表达系统和 CRISPR-Cas9 递送方式的相关文献，重点关注脂质体转染和电穿孔两种方法的效率差异。我们可以先整理近5年的高被引论文。",
  },
];

interface ResearchTask {
  type: "literature" | "experiment" | "mechanism";
  title: string;
  description: string;
  icon: React.ReactNode;
}

function generateStaticTasks(caseData: IndustryCase): ResearchTask[] {
  const kp = caseData.relatedKnowledgePoints.slice(0, 3).join("、");
  const kw = caseData.recommendedKeywords.slice(0, 4).join(", ");

  return [
    {
      type: "literature",
      title: "文献调研任务",
      description: `围绕"${caseData.coreProblem}"，检索近5年关键文献，梳理研究现状与技术进展。推荐检索关键词：${kw}。`,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      type: "experiment",
      title: "实验设计任务",
      description: `基于${kp}等核心知识点，设计验证"${caseData.coreProblem}"的实验方案，包括对照组设置、检测方法选择和技术路线规划。`,
      icon: <FlaskConical className="w-4 h-4" />,
    },
    {
      type: "mechanism",
      title: "机制解释与证据判断",
      description: `结合${caseData.evidenceLevel}等级证据和${caseData.sourceType}来源，系统分析相关研究证据链，评估研究结论的可靠性与局限性。`,
      icon: <Brain className="w-4 h-4" />,
    },
  ];
}

function generateResearchGuidance(caseData: IndustryCase) {
  const kpPreview = caseData.relatedKnowledgePoints.slice(0, 4).join("、");
  const kw = caseData.recommendedKeywords.join(", ");

  const expDesignIdeas =
    caseData.migrationPath?.researchFrontier?.length
      ? `以 ${caseData.migrationPath.researchFrontier[0]} 为切入点，结合 ${kpPreview} 等基础知识，设计合理的实验方案。`
      : `围绕 ${caseData.coreProblem}，设计验证性实验方案，确保实验组与对照组的可比性。`;

  const dataAnalysisDir =
    caseData.migrationPath?.industryApplication?.length
      ? `参考已获批或临床阶段应用（如 ${caseData.migrationPath.industryApplication[0]}），确定关键评估指标和数据分析策略。`
      : `对实验数据进行统计分析和可视化呈现，评估结果的显著性和可重复性。`;

  const limitations = [
    "文献检索范围和时间跨度可能影响结论的全面性",
    "实验条件与真实产业环境存在差异，需要进一步验证",
    "学科交叉领域需关注不同研究方向的方法学差异",
  ];

  return {
    researchQuestion: caseData.coreProblem,
    literatureKeywords: kw,
    experimentalDesignIdeas: expDesignIdeas,
    dataAnalysisDirection: dataAnalysisDir,
    possibleLimitations: limitations,
  };
}

function DefaultResearchPage() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setTimeout(() => {
      const aiMsg: Message = {
        role: "ai",
        content:
          "好问题！CHO 细胞（中国仓鼠卵巢细胞）是生物制药领域最常用的表达宿主之一。CRISPR-Cas9 的高效递送是关键瓶颈，目前主流方法包括脂质纳米颗粒（LNP）递送和核转染技术。我建议我们先锁定3-5篇关键文献，然后对比不同递送策略的效率数据。",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  const completedCount = milestoneChecks.filter((m) => m.done).length;
  const progressPercent = Math.round(
    (completedCount / milestoneChecks.length) * 100
  );

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-12">
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            科研实战训练营
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-xl mx-auto">
            AI 导师全程陪伴式指导，从文献调研到实验设计再到数据分析，系统培养科研能力
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {phases.map((phase) => (
            <div
              key={phase.num}
              className="glass-card rounded-2xl p-6 md:p-7 flex flex-col group cursor-default"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-brand-ink/5 flex items-center justify-center text-lg font-bold font-display text-brand-ink">
                  {phase.num}
                </span>
                <div className="w-9 h-9 rounded-xl bg-brand-ink/5 flex items-center justify-center group-hover:bg-brand-ink/10 transition-colors">
                  {phase.icon}
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-brand-ink mb-2">
                {phase.title}
              </h3>
              <p className="text-sm text-brand-muted font-body leading-relaxed flex-1">
                {phase.description}
              </p>
              <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-1 text-sm font-medium text-brand-muted group-hover:text-accent-electric transition-colors">
                <span>进入阶段</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3">
            <div className="glass-card-iridescent rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-brand-ink">
                    当前课题
                  </h2>
                  <p className="text-xs text-brand-muted font-body">
                    进行中的研究项目
                  </p>
                </div>
              </div>

              <h3 className="font-display text-xl font-bold text-brand-ink mb-4 leading-snug">
                探究 CRISPR-Cas9 在 CHO 细胞中的基因敲除效率
              </h3>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold font-body text-brand-muted uppercase tracking-wider">
                  研究进度
                </span>
                <span className="text-xs font-bold font-display text-brand-ink">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/5 mb-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-electric via-accent-cyan to-accent-amber transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-3">
                {milestoneChecks.map((milestone, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-black/5"
                  >
                    {milestone.done ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-electric shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-brand-muted/40 shrink-0" />
                    )}
                    <span
                      className={`text-sm font-body ${
                        milestone.done ? "text-brand-ink font-medium" : "text-brand-muted"
                      }`}
                    >
                      {milestone.label}
                    </span>
                    {milestone.done && (
                      <span className="ml-auto badge badge-electric text-[10px]">
                        已完成
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full btn-hero justify-center cursor-pointer">
                <Play className="w-4 h-4" />
                继续当前课题
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col h-full min-h-[420px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-brand-ink">
                    AI 科研导师
                  </h3>
                  <p className="text-xs text-brand-muted font-body">
                    实时指导与答疑
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 max-h-[340px]">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
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
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                        msg.role === "ai"
                          ? "bg-white/60 border border-black/5 rounded-tl-md text-brand-ink"
                          : "bg-brand-ink text-white rounded-tr-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="向AI科研导师提问..."
                  className="flex-1 h-10 px-4 rounded-xl bg-white/40 border border-black/5 text-sm font-body text-brand-ink placeholder:text-brand-muted/50 outline-none focus:border-accent-amber/20 transition-all duration-200"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-ink text-white disabled:opacity-30 transition-all duration-200 hover:bg-brand-ink/90 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="btn-hero-secondary cursor-pointer">
            <Lightbulb className="w-4 h-4" />
            开始新课题
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseDrivenResearchPage({ caseData }: { caseData: IndustryCase }) {
  const tasks: ResearchTask[] = generateStaticTasks(caseData);
  const guidance = generateResearchGuidance(caseData);

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
        <p className="text-brand-muted text-sm md:text-base font-body mb-10">
          {caseData.subtitle}
        </p>

        <div className="space-y-6">
          <section className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-electric to-accent-cyan flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-brand-ink">
                  当前科研案例
                </h2>
                <p className="text-xs text-brand-muted font-body">
                  产业案例基础信息与核心问题
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
            <div className="flex items-center gap-2.5 mb-4">
              <BookOpen className="w-4 h-4 text-accent-cyan" />
              <h2 className="font-display font-bold text-base text-brand-ink">
                相关知识点
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {caseData.relatedKnowledgePoints.map((kp, i) => (
                <span key={i} className="badge badge-cyan text-xs">{kp}</span>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center">
                <Microscope className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-brand-ink">
                  科研训练任务
                </h2>
                <p className="text-xs text-brand-muted font-body">
                  基于案例核心问题与知识点生成
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/60 border border-black/5 p-5 flex flex-col"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-electric/10 flex items-center justify-center mb-3 text-accent-electric">
                    {task.icon}
                  </div>
                  <h4 className="font-display font-bold text-sm text-brand-ink mb-2">
                    {task.title}
                  </h4>
                  <p className="text-xs text-brand-muted font-body leading-relaxed flex-1">
                    {task.description}
                  </p>
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <span className="text-[10px] font-semibold text-brand-faint uppercase tracking-wider">
                      任务类型：{task.type === "literature" ? "文献调研" : task.type === "experiment" ? "实验设计" : "机制分析"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-amber flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-brand-ink">
                  研究引导
                </h2>
                <p className="text-xs text-brand-muted font-body">
                  基于案例字段模板化生成的研究框架
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3.5 h-3.5 text-accent-electric" />
                  <h4 className="text-sm font-bold text-brand-ink">研究问题</h4>
                </div>
                <p className="text-[13px] text-brand-ink font-body leading-relaxed">{guidance.researchQuestion}</p>
              </div>

              <div className="rounded-xl bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3.5 h-3.5 text-accent-cyan" />
                  <h4 className="text-sm font-bold text-brand-ink">文献检索关键词</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {caseData.recommendedKeywords.map((kw, i) => (
                    <span key={i} className="text-xs text-brand-muted bg-white/60 px-2 py-0.5 rounded-md font-mono">{kw}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-3.5 h-3.5 text-accent-amber" />
                  <h4 className="text-sm font-bold text-brand-ink">实验设计思路</h4>
                </div>
                <p className="text-[13px] text-brand-muted font-body leading-relaxed">{guidance.experimentalDesignIdeas}</p>
              </div>

              <div className="rounded-xl bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-3.5 h-3.5 text-accent-electric" />
                  <h4 className="text-sm font-bold text-brand-ink">数据分析方向</h4>
                </div>
                <p className="text-[13px] text-brand-muted font-body leading-relaxed">{guidance.dataAnalysisDirection}</p>
              </div>

              <div className="rounded-xl bg-amber-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <h4 className="text-sm font-bold text-brand-ink">可能局限性</h4>
                </div>
                <ul className="space-y-1.5">
                  {guidance.possibleLimitations.map((lim, i) => (
                    <li key={i} className="text-[12px] text-brand-muted font-body leading-relaxed flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                      {lim}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href="/cases"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/60 border border-black/5 text-sm font-semibold text-brand-ink hover:bg-white hover:border-black/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回产业案例库
            </Link>
            <Link
              href={`/seminar?caseId=${caseData.id}`}
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
        <h2 className="font-display font-bold text-xl text-brand-ink mb-2">
          未找到对应产业案例
        </h2>
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("caseId");
    if (id) {
      setCaseId(id);
      const found = industryCases.find((c) => c.id === id);
      if (found) {
        setCaseData(found);
      } else {
        setCaseNotFound(true);
      }
    } else {
      setCaseId(null);
    }
  }, []);

  if (caseId === undefined) {
    return null;
  }

  if (caseNotFound) {
    return <InvalidCasePage />;
  }

  if (caseData) {
    return <CaseDrivenResearchPage caseData={caseData} />;
  }

  return <DefaultResearchPage />;
}