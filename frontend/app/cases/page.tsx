"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  ChevronDown,
  TrendingUp,
  Users,
  FileUp,
} from "lucide-react";
import { IndustryCaseCard } from "@/components/IndustryCaseCard";
import { IndustryCaseDetailModal } from "@/components/IndustryCaseDetailModal";
import { IndustryAskPanel } from "@/components/IndustryAskPanel";
import {
  industryCases,
  industryDirections,
} from "@/data/industryCases";
import { searchIndustryCases, getIndustryAnswer } from "@/lib/industryApi";
import type { IndustryCase } from "@/data/industryCases";

export default function CasesPage() {
  const [searchResults, setSearchResults] = useState<typeof industryCases>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCase, setSelectedCase] = useState<IndustryCase | null>(null);

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
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-24">
      <div className="max-w-6xl mx-auto">

        {/* ===== Hero ===== */}
        <section className="relative pt-8 md:pt-20 pb-12 md:pb-20 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 rounded-full bg-gradient-to-br from-cyan-400/6 to-blue-500/4 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-64 md:w-80 h-64 md:h-80 rounded-full bg-gradient-to-tl from-emerald-400/5 to-teal-500/3 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-56 md:w-72 h-56 md:h-72 rounded-full bg-gradient-to-tr from-blue-400/4 to-cyan-400/3 blur-3xl" />
            <div className="absolute top-10 right-1/3 w-1 h-1 rounded-full bg-cyan-400/20" />
            <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-blue-400/15" />
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full bg-teal-400/15" />
            <div className="absolute top-1/2 left-1/5 w-0.5 h-0.5 rounded-full bg-cyan-400/25" />
            <div className="absolute top-3/4 right-1/5 w-1 h-1 rounded-full bg-emerald-400/15" />
            <div className="absolute top-1/3 left-1/2 w-0.5 h-0.5 rounded-full bg-blue-400/20" />
          </div>

          <div className="relative z-10">
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

            <p className="text-brand-muted text-sm md:text-base font-body max-w-2xl mx-auto leading-relaxed mb-10">
              围绕生命科学与生物制造核心知识点，展示真实产业应用案例。
              每张卡片内置<span className="text-brand-ink font-semibold">知识迁移路径</span>和<span className="text-brand-ink font-semibold">训练能力标签</span>，
              点击详情可深入查看科研基础、应用场景与参考来源。
            </p>

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
                查看产业案例
                <ChevronDown className="w-4 h-4" />
              </button>
              <Link
                href="/seminar?source=产业案例&topic=产业转化案例答辩&summary=围绕真实产业案例、科研基础、应用价值、转化风险和岗位能力路径展开答辩。"
                className="btn-hero-secondary cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                带入答辩
              </Link>
            </div>
          </div>
        </section>

        {/* ===== AI 综合问答区 ===== */}
        <section id="ask-section" className="mb-20 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">AI 综合问答</span>
          </div>
          <h2 className="section-heading mb-3">产业智能分析与知识导航</h2>
          <p className="text-sm text-brand-muted font-body mb-2 max-w-2xl">
            输入一个知识点，系统将自动生成科研方向、产业场景和岗位能力路径，帮助你快速建立知识到产业的连接。
          </p>
          <p className="text-xs text-brand-faint font-body mb-6">
            支持关键词：细胞凋亡、CRISPR、蛋白质工程、合成生物学、分子诊断、细胞治疗、酶工程...
          </p>

          <IndustryAskPanel onQuery={handleAskQuery} />
        </section>

        {/* ===== 产业案例卡片 ===== */}
        <section id="cases-section" className="mb-20 scroll-mt-[calc(var(--nav-height)+24px)]">
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">产业案例</span>
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
          <h2 className="section-heading mb-2">真实产业应用案例</h2>
          <p className="text-sm text-brand-muted font-body mb-6 max-w-2xl">
            每张卡片聚焦一个真实产业问题，内置知识迁移路径与训练能力。点击详情查看深度内容，或进入科研实战探索。
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
                  onViewDetail={() => setSelectedCase(c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ===== 产业方向全景 ===== */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <span className="section-title">产业方向</span>
          </div>
          <h2 className="section-heading mb-2">覆盖产业方向</h2>
          <p className="text-sm text-brand-muted font-body mb-8 max-w-2xl">
            当前案例库覆盖生命科学领域 8 大核心产业方向，持续扩展中。
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {industryDirections.map((dir) => (
              <div key={dir.id} className="glass-card rounded-xl p-5 text-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/8 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-display text-sm font-bold text-brand-ink mb-1.5">{dir.name}</h4>
                <p className="text-[10px] text-brand-faint font-body leading-relaxed">
                  {dir.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA 底部 ===== */}
        <section className="text-center pt-10 border-t border-black/5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-faint" />
            <span className="text-xs text-brand-faint font-body uppercase tracking-wider">
              接入科研实战
            </span>
          </div>
          <p className="text-sm text-brand-muted font-body mb-5 max-w-md mx-auto">
            每个产业案例都配有对应的科研实战任务，可进入科研实战模块进行深入探索。
          </p>
          <Link
            href="/research"
            className="btn-hero inline-flex cursor-pointer"
          >
            进入科研实战
          </Link>
        </section>

        {/* ===== 案例详情弹窗 ===== */}
        {selectedCase && (
          <IndustryCaseDetailModal
            caseData={selectedCase}
            onClose={() => setSelectedCase(null)}
          />
        )}

      </div>
    </div>
  );
}
