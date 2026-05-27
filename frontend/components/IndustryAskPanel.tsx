"use client";

import { useState } from "react";
import { Send, Sparkles, RefreshCw, BookOpen, Lightbulb, Target, Compass, Search, Dna } from "lucide-react";
import type { IndustryAnswer } from "@/data/industryCases";

interface IndustryAskPanelProps {
  onQuery: (query: string) => Promise<IndustryAnswer>;
}

const quickTags = [
  "细胞凋亡",
  "CRISPR",
  "蛋白质工程",
  "合成生物学",
  "分子诊断",
  "细胞治疗",
  "酶工程",
];

export function IndustryAskPanel({ onQuery }: IndustryAskPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [answer, setAnswer] = useState<IndustryAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setAnswer(null);
    try {
      const result = await onQuery(q);
      setAnswer(result);
    } catch {
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(inputValue);
  };

  return (
    <div className="w-full">
      <div className="glass-card-iridescent rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/10 flex items-center justify-center">
            <Dna className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-brand-ink">智能知识导航</h3>
            <p className="text-[10px] text-brand-faint font-body">输入知识点 → 科研方向 → 产业场景 → 岗位路径</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入知识点或产业方向，如：细胞凋亡、CRISPR、蛋白质设计、发酵工程"
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

        <div className="flex flex-wrap gap-2 mt-3">
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setInputValue(tag);
                handleQuery(tag);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-body border border-black/5 bg-white/40 text-brand-muted hover:text-brand-ink hover:border-blue-400/20 hover:bg-white/70 transition-all cursor-pointer"
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

      {answer && !loading && (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-reveal-up">
          <div className="flex items-center gap-2 pb-3 border-b border-black/5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="font-display text-sm font-bold text-brand-ink">
              产业综合问答
            </span>
            <span className="text-xs text-brand-faint font-mono ml-auto">
              query: &quot;{answer.query}&quot;
            </span>
          </div>

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
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">岗位能力方向</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {answer.abilityDirections.map((ad, i) => (
                  <span key={i} className="badge badge-amber text-[10px]">{ad}</span>
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
                {answer.researchTasks.map((rt, i) => (
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
        </div>
      )}
    </div>
  );
}