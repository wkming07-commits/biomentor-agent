"use client";

import { useState } from "react";
import { Send, Sparkles, RefreshCw, BookOpen, Lightbulb, Target, Compass, Search, Dna, Info, FileText, Building2 } from "lucide-react";
import type { IndustryAnswer } from "@/data/industryCases";

const QUICK_TAGS = [
  "mRNA疫苗为什么需要LNP？",
  "CAR-T涉及哪些知识？",
  "Venetoclax和BCL-2的关系？",
  "细胞凋亡有哪些产业应用？",
  "CRISPR基因编辑治疗现状",
];

interface IndustryAskPanelProps {
  onQuery: (query: string) => Promise<IndustryAnswer>;
}

export function IndustryAskPanel({ onQuery }: IndustryAskPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [answer, setAnswer] = useState<IndustryAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const result = await onQuery(q);
      setAnswer(result);
    } catch {
      setError("暂时无法获取分析结果，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(inputValue);
  };

  const sourceScopeLabel = (scope?: string) => {
    switch (scope) {
      case "based_on_local_cases": return "基于本地案例库";
      case "extended_reasoning": return "智能推理扩展";
      case "no_direct_match": return "暂无直接匹配";
      default: return "";
    }
  };

  const sourceScopeColor = (scope?: string) => {
    switch (scope) {
      case "based_on_local_cases": return "bg-green-50 text-green-700";
      case "extended_reasoning": return "bg-blue-50 text-blue-700";
      case "no_direct_match": return "bg-amber-50 text-amber-700";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="w-full">
      <div className="glass-card-iridescent rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/10 flex items-center justify-center">
            <Dna className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-brand-ink">产业案例智能问答</h3>
            <p className="text-[10px] text-brand-faint font-body">
              输入知识点、产业方向、产品技术或具体问题，系统将结合当前案例库生成相关知识点、科研前沿、产业应用和学习任务。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="例如：mRNA 疫苗为什么需要 LNP？/ CAR-T 背后有哪些知识点？/ 细胞凋亡有哪些产业应用？"
              className="w-full h-12 pl-11 pr-28 rounded-2xl glass-card text-sm font-body text-brand-ink placeholder:text-brand-faint/50 outline-none focus:border-blue-400/30 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-ink text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-ink/90 transition-all cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              分析
            </button>
          </div>
        </form>

        <p className="text-[10px] text-brand-faint font-body mt-3 mb-2">试试这些问题：</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setInputValue(tag);
                handleQuery(tag);
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium font-body border border-black/5 bg-white/40 text-brand-muted hover:text-brand-ink hover:border-blue-400/20 hover:bg-white/70 transition-all cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-shimmer" />
          <p className="text-sm text-brand-muted font-body">
            正在综合分析产业案例与科研前沿...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <Info className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-brand-muted font-body mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              handleQuery(inputValue);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {answer && !loading && (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-reveal-up">
          <div className="flex items-center gap-2 pb-3 border-b border-black/5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="font-display text-sm font-bold text-brand-ink">
              产业综合问答
            </span>
            {answer.sourceScope && (
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto ${sourceScopeColor(answer.sourceScope)}`}>
                {sourceScopeLabel(answer.sourceScope)}
              </span>
            )}
          </div>

          {/* 综合回答 */}
          {answer.answer && (
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50/30 p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">综合回答</h4>
              </div>
              <p className="text-sm text-brand-muted font-body leading-relaxed">{answer.answer}</p>
            </div>
          )}

          {/* 匹配产业案例 */}
          {answer.matchedCases && answer.matchedCases.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">匹配产业案例</h4>
              </div>
              <div className="space-y-2">
                {answer.matchedCases.map((mc, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/30">
                    <span className="text-[10px] font-mono text-brand-faint shrink-0 mt-0.5">{mc.id}</span>
                    <div>
                      <span className="text-xs font-semibold text-brand-ink">{mc.title}</span>
                      <p className="text-[11px] text-brand-muted font-body mt-0.5">{mc.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">相关课程知识点</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {answer.relatedKnowledgePoints.map((kp, i) => (
                  <span key={i} className="badge badge-cyan text-[10px]">{kp}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">科研前沿方向</h4>
              </div>
              <ul className="space-y-0.5">
                {answer.researchFrontiers.map((rf, i) => (
                  <li key={i} className="text-xs text-brand-muted font-body pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-blue-400/40">
                    {rf}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">产业应用场景</h4>
              </div>
              <ul className="space-y-0.5">
                {answer.industryApplications.map((ia, i) => (
                  <li key={i} className="text-xs text-brand-muted font-body pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-cyan-400/40">
                    {ia}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">训练能力</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(answer.requiredAbilities || answer.abilityDirections).map((ab, i) => (
                  <span key={i} className="badge badge-amber text-[10px]">{ab}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-black/5 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">推荐检索关键词</h4>
              <div className="flex flex-wrap gap-1.5">
                {answer.recommendedKeywords.map((kw, i) => (
                  <code key={i} className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {kw}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1.5">可进入的科研实战任务</h4>
              <ul className="space-y-1">
                {(answer.nextTasks || answer.researchTasks).map((rt, i) => (
                  <li key={i} className="text-xs text-brand-muted font-body flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {rt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {answer.disclaimer && (
            <div className="pt-2 border-t border-black/5">
              <p className="text-[10px] text-brand-faint font-body italic">{answer.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}