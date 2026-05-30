"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Building2,
  ChevronRight,
  FlaskConical,
  GitBranch,
  MessageCircle,
  Network,
  Sparkles,
} from "lucide-react";
import { IndustryCaseCard } from "@/components/IndustryCaseCard";
import { industryCases } from "@/data/industryCases";

const modules = [
  {
    href: "/explore",
    title: "知识探索",
    desc: "从一个知识点出发，获得结构化解释、关联概念和 AI 导师引导。",
    tags: ["知识点", "AI 讲解", "关联学习"],
    icon: BookOpen,
    accent: "#60a5fa",
  },
  {
    href: "/research",
    title: "科研实战",
    desc: "围绕真实科研任务，训练文献阅读、实验设计和数据分析能力。",
    tags: ["文献", "实验设计", "数据分析"],
    icon: FlaskConical,
    accent: "#22d3ee",
  },
  {
    href: "/tools",
    title: "生物工具箱",
    desc: "提供蛋白结构、质粒图谱、序列分析和通路探索等动手工具。",
    tags: ["蛋白结构", "质粒图谱", "序列分析"],
    icon: BrainCircuit,
    accent: "#34d399",
  },
  {
    href: "/cases",
    title: "产业案例",
    desc: "通过真实应用场景理解生物技术从研究到转化的路径。",
    tags: ["转化应用", "案例分析", "产业视角"],
    icon: Building2,
    accent: "#fbbf24",
  },
  {
    href: "/knowledge-map",
    title: "知识图谱",
    desc: "以可视化网络呈现概念、通路和知识之间的结构关系。",
    tags: ["关系网络", "学习路径", "结构认知"],
    icon: Network,
    accent: "#a78bfa",
  },
  {
    href: "/seminar",
    title: "学术研讨",
    desc: "模拟学术讨论、汇报和答辩场景，训练科研表达能力。",
    tags: ["讨论", "汇报", "答辩表达"],
    icon: MessageCircle,
    accent: "#fb7185",
  },
];

const expansionSteps = [
  { title: "输入知识点", desc: "例如 CRISPR-Cas9、质粒载体、细胞凋亡。" },
  { title: "结构化展开", desc: "概念解释、关键关系、常见误区被组织成可学习路径。" },
  { title: "进入任务", desc: "关联科研问题、实验设计、产业案例和讨论题。" },
  { title: "调用工具", desc: "需要时进入蛋白、质粒、序列或通路工具辅助理解。" },
];

const valueCards = [
  {
    title: "AI 导师引导",
    desc: "从问题出发，引导理解知识点、拆解研究任务、形成表达，而不是只给一个结论。",
    icon: Sparkles,
  },
  {
    title: "结构化知识网络",
    desc: "不把知识做成孤立条目，而是连接概念、通路、实验和案例之间的关系。",
    icon: GitBranch,
  },
  {
    title: "专业工具联动",
    desc: "学习过程中可以进入蛋白、质粒、序列和通路工具，把抽象概念变成可观察结果。",
    icon: BrainCircuit,
  },
];

const featuredCases = industryCases.slice(0, 4);

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-screen overflow-hidden pt-[var(--nav-height)] liquid-hero-bg flex items-center justify-center px-6">
        <div className="liquid-blob" />
        <div className="bio-network" />
        <div className="absolute left-[12%] top-[30%] h-2.5 w-2.5 rounded-full bg-blue-400/50 shadow-[0_0_0_8px_rgba(96,165,250,.1),0_0_28px_rgba(96,165,250,.28)] animate-float" />
        <div className="absolute right-[16%] top-[28%] h-3 w-3 rounded-full bg-violet-400/45 shadow-[0_0_0_8px_rgba(167,139,250,.1),0_0_28px_rgba(167,139,250,.24)] animate-float" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-[22%] left-[23%] h-2.5 w-2.5 rounded-full bg-emerald-400/45 shadow-[0_0_0_8px_rgba(52,211,153,.1),0_0_28px_rgba(52,211,153,.24)] animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <h1 className="font-display font-black leading-[0.9] tracking-[-0.07em] text-[#101827] reveal-soft text-[clamp(56px,10vw,132px)] drop-shadow-[0_18px_54px_rgba(45,84,145,.12)]">
            BioMentor Agent
          </h1>
          <div className="mt-8 inline-flex rounded-full border border-white/90 bg-white/45 px-6 py-3 text-sm md:text-lg font-semibold tracking-[0.08em] text-[#33445f] shadow-[inset_0_1px_0_rgba(255,255,255,.86),0_14px_38px_rgba(70,110,180,.1)] backdrop-blur-2xl reveal-soft" style={{ animationDelay: ".35s" }}>
            面向生命科学的智能学习平台
          </div>
          <button
            onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute left-1/2 -translate-x-1/2 -bottom-32 hidden md:inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#748196] hover:text-[#111827] transition-colors"
          >
            探索学习系统 <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </section>

      <section id="modules" className="relative px-6 md:px-10 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="section-title">核心功能</p>
          <h2 className="section-heading">六个模块，组成完整学习入口</h2>
          <p className="mt-4 text-brand-muted max-w-2xl mx-auto leading-relaxed">
            保持清晰的六宫格结构：学习、研究、工具、案例、图谱和研讨各自独立，又能在学习路径中互相连接。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="liquid-card group relative overflow-hidden p-6 min-h-[238px] reveal-soft" style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-[45%_55%_62%_38%/45%_48%_52%_55%] blur-[2px] opacity-20 transition-opacity group-hover:opacity-30" style={{ background: module.accent }} />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/90 bg-white/60 shadow-[0_10px_24px_rgba(67,106,160,.09)]" style={{ color: module.accent }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-[#111827] mb-3">{module.title}</h3>
                  <p className="text-sm leading-relaxed text-brand-muted mb-5">{module.desc}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {module.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/80 bg-white/45 px-2.5 py-1 text-[11px] font-bold text-[#64708a]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-all group-hover:opacity-100" style={{ color: module.accent }}>
                    进入 <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-6 md:px-10 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="liquid-card p-6 md:p-10 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-8 items-center">
            <div>
              <p className="section-title">学习体验</p>
              <h2 className="section-heading">一个知识点，可以被展开成完整学习路径</h2>
              <p className="mt-5 text-brand-muted leading-relaxed">
                BioMentor Agent 不只是给出答案，而是把概念、关系、任务、工具和案例连接起来。
              </p>
              <div className="mt-7 rounded-3xl border border-white/80 bg-white/50 p-5 backdrop-blur-xl">
                <div className="text-xs font-bold text-brand-faint mb-2">示例知识点</div>
                <div className="font-display text-3xl font-black tracking-[-0.04em] text-[#111827]">CRISPR-Cas9</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expansionSteps.map((step, index) => (
                <div key={step.title} className="rounded-3xl border border-white/80 bg-white/50 p-5 shadow-[0_12px_34px_rgba(67,106,160,.08)] backdrop-blur-xl">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#111827] text-sm font-black text-white">{index + 1}</div>
                  <h3 className="font-display text-lg font-extrabold text-[#111827] mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-brand-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-title">产品价值</p>
          <h2 className="section-heading">它不是普通知识库</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {valueCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="liquid-card p-7">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-[0_14px_32px_rgba(17,24,39,.16)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#111827] mb-3">{card.title}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 md:px-10 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="section-title">精选案例</p>
          <h2 className="section-heading">产业案例精选</h2>
          <p className="mt-4 text-brand-muted max-w-2xl mx-auto leading-relaxed">
            从真实产业场景理解生物技术从研究到转化的完整路径，覆盖药物研发、细胞治疗、疫苗研发等核心方向。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {featuredCases.map((c) => (
            <IndustryCaseCard key={c.id} caseData={c} />
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/cases"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-[15px] text-[#0d0d1a] bg-white/60 backdrop-blur-xl border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,.86),0_12px_34px_rgba(67,106,160,.1)] hover:bg-white/85 hover:border-[#fbbf24]/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_18px_44px_rgba(251,191,36,.14)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#fbbf24]" />
            查看全部 23 个产业案例
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/5 px-6 md:px-10 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-brand-muted">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-2xl bg-[#111827] flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-white" /></span>
            <span className="font-display font-extrabold text-[#111827]">BioMentor Agent</span>
            <span>面向生命科学的智能学习平台</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
            {modules.map((module) => <Link key={module.href} href={module.href} className="hover:text-[#111827]">{module.title}</Link>)}
          </div>
        </div>
      </footer>
    </>
  );
}