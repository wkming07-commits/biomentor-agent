"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  ChevronDown,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Factory,
  Target,
  Users,
} from "lucide-react";
import { IndustryCaseCard } from "@/components/IndustryCaseCard";
import { IndustryAskPanel } from "@/components/IndustryAskPanel";
import {
  industryCases,
  industryDirections,
  abilityMappings,
  knowledgeTripleMap,
} from "@/data/industryCases";
import { searchIndustryCases, getIndustryAnswer } from "@/lib/industryApi";

export default function CasesPage() {
  const [searchResults, setSearchResults] = useState<typeof industryCases>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const displayCases = showSearch && searchQuery ? searchResults : industryCases;

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setShowSearch(false);
      setSearchResults([]);
      return;
    }
    const results = await searchIndustryCases(q);
    setSearchResults(results);
    setShowSearch(true);
  };

  const handleAskQuery = async (query: string) => {
    return getIndustryAnswer(query);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto">

        {/* ===== Hero ===== */}
        <section className="pt-8 md:pt-16 pb-10 md:pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-5">
            <Sparkles className="w-3 h-3" />
            Industry Case Lab
          </div>

          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-4"
            style={{ fontSize: "clamp(32px, 5vw, 52px)" }}
          >
            产业案例库
          </h1>

          <p className="text-brand-muted text-sm md:text-base font-body max-w-2xl mx-auto leading-relaxed mb-8">
            围绕生命科学与生物制造知识点，展示其在药物研发、细胞治疗、合成生物学、
            分子诊断、酶工程与生物制造中的真实应用，帮助学生建立
            <span className="text-brand-ink font-semibold">
              &ldquo;课本知识&mdash;科研问题&mdash;产业场景&mdash;岗位能力&rdquo;
            </span>
            的连接。
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-4 md:p-5 text-center">
              <div
                className="stat-number mb-1 text-brand-ink"
                style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
              >
                {industryDirections.length}
              </div>
              <div className="text-[10px] md:text-xs text-brand-faint font-body uppercase tracking-wider">
                产业方向
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-5 text-center">
              <div
                className="stat-number mb-1 text-brand-ink"
                style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
              >
                {industryCases.length}
              </div>
              <div className="text-[10px] md:text-xs text-brand-faint font-body uppercase tracking-wider">
                案例卡片
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-5 text-center">
              <div
                className="stat-number mb-1 text-brand-ink"
                style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
              >
                {abilityMappings.length}
              </div>
              <div className="text-[10px] md:text-xs text-brand-faint font-body uppercase tracking-wider">
                岗位能力
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => scrollToSection("ask-section")}
              className="btn-hero cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              开始产业问答
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("cases-section")}
              className="btn-hero-secondary cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              查看热门案例
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ===== AI 综合问答区 ===== */}
        <section id="ask-section" className="mb-16 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">AI 综合问答</span>
          </div>
          <h2 className="section-heading mb-2">产业智能分析与知识导航</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-xl">
            输入知识点或产业方向，获取课程知识点、科研前沿、产业应用场景与岗位能力的综合性分析。
          </p>

          <IndustryAskPanel onQuery={handleAskQuery} />
        </section>

        {/* ===== 热门案例卡片 ===== */}
        <section id="cases-section" className="mb-16 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">热门产业资料</span>
            <div className="hidden sm:flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索案例..."
                className="h-9 px-3.5 rounded-xl glass-card text-xs font-body text-brand-ink placeholder:text-brand-faint/50 outline-none focus:border-accent-electric/20 transition-all w-48"
              />
              {showSearch && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                  className="text-[10px] text-brand-faint hover:text-brand-ink transition-colors cursor-pointer"
                >
                  清除
                </button>
              )}
            </div>
          </div>
          <h2 className="section-heading mb-2">产业案例卡片</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-xl">
            每张卡片涵盖核心问题、科研基础、应用价值和所需能力，连接知识点与产业场景。
          </p>

          {displayCases.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-brand-faint/30 mx-auto mb-3" />
              <p className="text-sm text-brand-muted font-body">未找到匹配的案例</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayCases.map((c) => (
                <IndustryCaseCard
                  key={c.id}
                  caseData={c}
                  onViewKnowledge={() => {
                    scrollToSection("triple-section");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ===== 课本—科研—产业 三层映射 ===== */}
        <section id="triple-section" className="mb-16 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">三层映射</span>
          </div>
          <h2 className="section-heading mb-2">课本&mdash;科研&mdash;产业</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-xl">
            从基础知识出发，经过科研前沿探索，最终落地到产业应用场景。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-electric/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-accent-electric" />
                </div>
                <h3 className="font-display text-base font-bold text-brand-ink">基础知识</h3>
              </div>
              <p className="text-xs text-brand-faint font-body mb-3">
                课程核心概念与分子机制
              </p>
              <div className="flex flex-wrap gap-1.5">
                {knowledgeTripleMap.basic.map((item, i) => (
                  <span key={i} className="badge badge-electric text-[10px]">{item}</span>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-accent-cyan" />
                </div>
                <h3 className="font-display text-base font-bold text-brand-ink">科研前沿</h3>
              </div>
              <p className="text-xs text-brand-faint font-body mb-3">
                当前研究热点与技术突破方向
              </p>
              <div className="flex flex-wrap gap-1.5">
                {knowledgeTripleMap.frontier.map((item, i) => (
                  <span key={i} className="badge badge-cyan text-[10px]">{item}</span>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                  <Factory className="w-4 h-4 text-accent-amber" />
                </div>
                <h3 className="font-display text-base font-bold text-brand-ink">产业应用</h3>
              </div>
              <p className="text-xs text-brand-faint font-body mb-3">
                技术转化与商业化落地场景
              </p>
              <div className="flex flex-wrap gap-1.5">
                {knowledgeTripleMap.application.map((item, i) => (
                  <span key={i} className="badge badge-amber text-[10px]">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== 岗位能力映射 ===== */}
        <section id="ability-section" className="mb-16 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">能力映射</span>
          </div>
          <h2 className="section-heading mb-2">岗位能力培养</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-xl">
            通过产业案例训练，学生将逐步建立从文献检索到产业迁移的核心科研能力。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {abilityMappings.map((ability) => (
              <div key={ability.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-electric/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-accent-electric" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-brand-ink">{ability.name}</h4>
                </div>
                <p className="text-xs text-brand-muted font-body leading-relaxed mb-3">
                  {ability.description}
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-brand-faint font-body uppercase tracking-wider">
                      掌握程度
                    </span>
                    <span className="text-[10px] font-mono font-bold text-brand-ink">
                      {ability.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-electric to-accent-cyan transition-all duration-700"
                      style={{ width: `${ability.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 产业方向全景 ===== */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">产业方向</span>
          </div>
          <h2 className="section-heading mb-2">覆盖产业方向</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-xl">
            当前案例库覆盖生命科学领域 8 大核心产业方向，持续扩展中。
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {industryDirections.map((dir) => (
              <div key={dir.id} className="glass-card rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-accent-electric/8 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-5 h-5 text-accent-electric" />
                </div>
                <h4 className="font-display text-sm font-bold text-brand-ink mb-1">{dir.name}</h4>
                <p className="text-[10px] text-brand-faint font-body leading-relaxed">
                  {dir.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA 底部 ===== */}
        <section className="text-center pt-8 border-t border-black/5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-faint" />
            <span className="text-xs text-brand-faint font-body uppercase tracking-wider">
              接入科研实战
            </span>
          </div>
          <p className="text-sm text-brand-muted font-body mb-4 max-w-md mx-auto">
            每个产业案例都配有对应的科研实战任务，可进入科研实战模块进行深入探索。
          </p>
          <Link
            href="/research"
            className="btn-hero inline-flex cursor-pointer"
          >
            进入科研实战
          </Link>
        </section>

      </div>
    </div>
  );
}