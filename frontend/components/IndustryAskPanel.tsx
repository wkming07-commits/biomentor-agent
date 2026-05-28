"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Sparkles, RefreshCw, BookOpen, Lightbulb, Target, Search, Dna, Info, Building2, ChevronDown, ChevronUp, ArrowRight, FlaskConical, ExternalLink } from "lucide-react";
import type { IndustryAnswer } from "@/data/industryCases";

const QUICK_TAGS = [
  "Venetoclax 和 BCL-2 的关系？",
  "CAR-T 背后涉及哪些生物学知识？",
  "mRNA 疫苗为什么需要 LNP？",
  "CRISPR 现在有哪些真实治疗案例？",
  "细胞凋亡有哪些产业应用？",
];

interface IndustryAskPanelProps {
  onQuery: (query: string) => Promise<IndustryAnswer>;
}

export function IndustryAskPanel({ onQuery }: IndustryAskPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [answer, setAnswer] = useState<IndustryAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const handleQuery = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setAnswer(null);
    setError(null);
    setShowMore(false);
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
      case "extended_reasoning": return "拓展性分析";
      case "no_direct_match": return "暂无直接匹配";
      default: return "";
    }
  };

  const sourceScopeColor = (scope?: string) => {
    switch (scope) {
      case "based_on_local_cases": return "bg-emerald-50 text-emerald-700";
      case "extended_reasoning": return "bg-sky-50 text-sky-700";
      case "no_direct_match": return "bg-amber-50 text-amber-700";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  const matchedCases = answer?.matchedCases || [];

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
          <p className="text-sm text-brand-muted font-body">正在综合分析产业案例与科研前沿...</p>
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
        <div className="glass-card rounded-2xl p-6 space-y-4 animate-reveal-up">
          {/* Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-black/5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="font-display text-sm font-bold text-brand-ink">产业综合问答</span>
            {answer.sourceScope && (
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto ${sourceScopeColor(answer.sourceScope)}`}>
                {sourceScopeLabel(answer.sourceScope)}
              </span>
            )}
          </div>

          {/* 1. 综合回答 */}
          {answer.answer && (
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50/30 p-4">
              <p className="text-sm text-brand-muted font-body leading-relaxed">{answer.answer}</p>
            </div>
          )}

          {/* 2. 相关产业案例 */}
          {matchedCases.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">相关产业案例</h4>
              </div>
              <div className="space-y-2">
                {matchedCases.map((mc, i) => (
                  <div key={i} className="rounded-xl bg-blue-50/40 p-4">
                    <h5 className="text-sm font-semibold text-brand-ink mb-1">{mc.title}</h5>
                    <p className="text-[11px] text-brand-muted font-body mb-3">{mc.reason}</p>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/cases#cases-section`}
                        className="flex items-center gap-1 text-[11px] font-medium text-brand-muted hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        查看详情
                      </Link>
                      <Link
                        href={`/research?caseId=${mc.id}`}
                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <FlaskConical className="w-3 h-3" />
                        进入科研实战
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. 产业应用场景 */}
          {answer.industryApplications.length > 0 && (
            <section className="space-y-2">
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
            </section>
          )}

          {/* 4. 下一步操作 */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50/60 to-cyan-50/40 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-ink">下一步操作</p>
              <p className="text-[11px] text-brand-muted font-body mt-0.5">
                查看匹配案例的详细信息，或进入科研实战模块进行深入探索
              </p>
            </div>
            <Link
              href="/research"
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              进入科研实战
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 展开更多 */}
          <div className="pt-1">
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-brand-faint hover:text-blue-600 transition-colors cursor-pointer py-1"
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showMore ? "收起更多" : "展开更多"}
            </button>
          </div>

          {showMore && (
            <div className="space-y-4 animate-reveal-up">
              {/* 相关知识与技术点 */}
              {answer.relatedKnowledgePoints.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    <h4 className="text-[10px] font-bold text-brand-faint uppercase tracking-wider">相关知识与技术点</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {answer.relatedKnowledgePoints.map((kp, i) => (
                      <span key={i} className="badge badge-cyan text-[10px]">{kp}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* 科研前沿方向 */}
              {answer.researchFrontiers.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <h4 className="text-[10px] font-bold text-brand-faint uppercase tracking-wider">科研前沿方向</h4>
                  </div>
                  <ul className="space-y-0.5">
                    {answer.researchFrontiers.map((rf, i) => (
                      <li key={i} className="text-[11px] text-brand-muted font-body pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-1 before:rounded-full before:bg-blue-400/30">
                        {rf}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 训练能力 */}
              {(answer.requiredAbilities || answer.abilityDirections).length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-brand-faint uppercase tracking-wider">训练能力</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(answer.requiredAbilities || answer.abilityDirections).map((ab, i) => (
                      <span key={i} className="badge badge-amber text-[10px]">{ab}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* 推荐检索关键词 */}
              {answer.recommendedKeywords.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-brand-faint uppercase tracking-wider">推荐检索关键词</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {answer.recommendedKeywords.slice(0, 8).map((kw, i) => (
                      <code key={i} className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {kw}
                      </code>
                    ))}
                  </div>
                </section>
              )}

              {/* 科研实战任务 */}
              {(answer.nextTasks || answer.researchTasks).length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-[10px] font-bold text-brand-faint uppercase tracking-wider">科研实战任务</h4>
                  <ul className="space-y-1">
                    {(answer.nextTasks || answer.researchTasks).map((rt, i) => (
                      <li key={i} className="text-[11px] text-brand-muted font-body flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        {rt}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {answer.disclaimer && (
            <div className="pt-3 border-t border-black/5">
              <p className="text-[10px] text-brand-faint font-body italic">{answer.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}