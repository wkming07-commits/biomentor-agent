"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, BarChart3, ChevronDown, ChevronUp, Scissors, Search, Send, Sparkles, User } from "lucide-react";

import { analyzeSequenceViaApi } from "@/lib/bioToolApi";
import {
  calculateNucleotideStats,
  designPrimerPair,
  findRestrictionSites,
  predictBlastHits,
  sampleDnaSequence,
  translateDna,
} from "@/lib/biotools.mjs";

type ToolMode = "gc" | "translate" | "primer" | "blast" | "sites";

const tools: { key: ToolMode; label: string; icon: typeof ArrowRightLeft }[] = [
  { key: "gc", label: "GC 含量", icon: BarChart3 },
  { key: "translate", label: "翻译", icon: ArrowRightLeft },
  { key: "primer", label: "引物设计", icon: Scissors },
  { key: "blast", label: "BLAST 比对", icon: Search },
  { key: "sites", label: "酶切位点", icon: Scissors },
];

export default function SequencePage() {
  const [sequence, setSequence] = useState(sampleDnaSequence);
  const [activeTool, setActiveTool] = useState<ToolMode>("gc");
  const [chatInput, setChatInput] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("后端 API 未连接时使用前端备用分析");

  const stats = useMemo(() => calculateNucleotideStats(sequence), [sequence]);
  const protein = useMemo(() => translateDna(sequence), [sequence]);
  const primers = useMemo(() => {
    try {
      return designPrimerPair(sequence);
    } catch {
      return null;
    }
  }, [sequence]);
  const blastHits = useMemo(() => predictBlastHits(sequence), [sequence]);
  const sites = useMemo(() => findRestrictionSites(sequence), [sequence]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      analyzeSequenceViaApi(sequence).then((result) => {
        setApiStatus(result ? "已连接后端 /api/bio-tools/sequence/analyze" : "后端不可用，使用前端备用分析");
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [sequence]);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] flex flex-col px-6 md:px-10 pb-10 font-body">
      <div className="flex flex-col lg:flex-row flex-1 gap-6" style={{ minHeight: 0 }}>
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          <div className="flex flex-col gap-3">
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              placeholder="粘贴 DNA/RNA 序列，支持 FASTA header"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all h-28 resize-none font-mono"
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => setActiveTool(tool.key)}
                    className={isActive ? "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200" : "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted bg-white/40 border border-white/50 hover:bg-white/70 hover:text-brand-ink transition-all"}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tool.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5 flex-1 flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass-card p-3 text-center"><div className="stat-number text-lg text-accent-electric">{stats.gcPercent}%</div><div className="text-[11px] text-brand-muted mt-0.5">GC 含量</div></div>
              <div className="glass-card p-3 text-center"><div className="stat-number text-lg text-[#059669]">{stats.length} bp</div><div className="text-[11px] text-brand-muted mt-0.5">有效长度</div></div>
              <div className="glass-card p-3 text-center"><div className="stat-number text-lg text-accent-electric">{protein.length} aa</div><div className="text-[11px] text-brand-muted mt-0.5">翻译长度</div></div>
              <div className="glass-card p-3 text-center"><div className="stat-number text-lg text-[#059669]">{primers ? `${primers.forward.tm}°C` : "—"}</div><div className="text-[11px] text-brand-muted mt-0.5">上游 Tm</div></div>
            </div>

            {stats.invalidCount > 0 && (
              <div className="rounded-lg bg-[#fff7ed] border border-[#f59e0b]/20 px-3 py-2 text-xs text-[#92400e]">
                已忽略 {stats.invalidCount} 个非 ATGC/U 字符。生产环境可在后端使用 Biopython 做更严格格式校验。
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto">
              {activeTool === "gc" && (
                <div className="flex flex-col gap-4 h-full">
                  <h3 className="font-display text-sm font-medium text-brand-ink">GC 含量概览</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="stat-number text-4xl text-accent-electric mb-2">{stats.gcPercent}%</div>
                      <div className="text-sm text-brand-muted">GC 含量</div>
                      <div className="mt-4 flex items-center gap-6 text-xs text-brand-muted">
                        {Object.entries(stats.bases).map(([base, count]) => <div key={base}><span className="stat-number text-brand-ink">{count}</span> {base}</div>)}
                      </div>
                      <div className="mt-5 mx-auto h-3 rounded-full overflow-hidden flex" style={{ width: "280px" }}>
                        <div style={{ width: `${stats.length ? (stats.bases.G / stats.length) * 100 : 0}%`, background: "#2563eb" }} />
                        <div style={{ width: `${stats.length ? (stats.bases.C / stats.length) * 100 : 0}%`, background: "#3b82f6" }} />
                        <div style={{ width: `${stats.length ? (stats.bases.A / stats.length) * 100 : 0}%`, background: "#93c5fd" }} />
                        <div style={{ width: `${stats.length ? (stats.bases.T / stats.length) * 100 : 0}%`, background: "#dbeafe" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === "translate" && (
                <div className="flex flex-col h-full">
                  <h3 className="font-display text-sm font-medium text-brand-ink mb-2">氨基酸序列</h3>
                  <div className="flex-1 overflow-auto p-3 rounded-lg text-xs break-all leading-relaxed font-mono bg-white/40 border border-white/50">{protein || "请输入有效 DNA 序列"}</div>
                </div>
              )}

              {activeTool === "primer" && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm font-medium text-brand-ink">引物设计结果（Primer3 教学版）</h3>
                  {primers ? (["forward", "reverse"] as const).map((side) => (
                    <div key={side} className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={side === "forward" ? "badge badge-electric text-xs" : "badge badge-cyan text-xs"}>{side === "forward" ? "上游引物" : "下游引物"}</span>
                        <span className="text-xs text-brand-muted">Tm={primers[side].tm}°C ｜ GC={primers[side].gcPercent}% ｜ {primers[side].warning}</span>
                      </div>
                      <div className="text-xs p-2.5 rounded-md break-all font-mono bg-white/40 border border-white/50">5&apos;-{primers[side].sequence}-3&apos;</div>
                    </div>
                  )) : <div className="text-sm text-brand-muted">序列太短，无法设计 20 bp 引物。</div>}
                  {primers && <div className="text-[11px] text-brand-muted mt-1">产物长度：{primers.productLength} bp ｜ 上下游 Tm 差：{primers.tmDelta}°C</div>}
                </div>
              )}

              {activeTool === "blast" && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm font-medium text-brand-ink">BLAST+ 比对结果（本地库接入占位）</h3>
                  {blastHits.map((r, i) => (
                    <div key={i} className="glass-card p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5"><span className="text-sm font-medium text-brand-ink">{r.gene}</span><span className="text-[11px] text-brand-muted">{r.organism}</span></div>
                        <div className="flex items-center gap-4 text-xs"><span className="stat-number text-[#059669]">{r.identity}</span><span className="stat-number text-brand-faint">E={r.eValue}</span></div>
                      </div>
                      <p className="mt-2 text-[11px] text-brand-muted leading-relaxed">{r.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTool === "sites" && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm font-medium text-brand-ink">限制性内切酶位点</h3>
                  {sites.map((enzyme) => (
                    <div key={enzyme.name} className="glass-card p-4 flex items-center justify-between">
                      <div><span className="text-sm font-semibold text-brand-ink">{enzyme.name}</span><span className="ml-2 text-xs font-mono text-brand-muted">{enzyme.motif}</span></div>
                      <span className="text-xs text-brand-muted">{enzyme.count ? `位置：${enzyme.sites.join(", ")}` : "未检出"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <button onClick={() => setQuizOpen(!quizOpen)} className="w-full p-4 flex items-center justify-between text-left">
              <span className="text-xs font-medium text-brand-ink font-display">这段序列最适合用哪种限制酶进行克隆？为什么？</span>
              {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-faint" /> : <ChevronDown className="w-4 h-4 text-brand-faint" />}
            </button>
            {quizOpen && <div className="px-4 pb-4"><div className="p-3 rounded-lg text-xs text-brand-muted leading-relaxed font-body" style={{ background: "rgba(37, 99, 235, 0.04)", border: "1px solid rgba(37, 99, 235, 0.1)" }}>优先选择序列内部未出现、且载体 MCS 中存在的酶切位点。当前检测结果里 EcoRI/BamHI 等位点可用于讲解定向克隆，但真实实验还需要检查读框、保护碱基和载体兼容性。</div></div>}
          </div>
        </div>

        <div className="flex-[2] glass-card flex flex-col min-w-0">
          <div className="p-4 border-b border-white/60"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(37, 99, 235, 0.1)" }}><Sparkles className="w-3.5 h-3.5 text-accent-electric" /></div><span className="font-display text-sm font-medium text-brand-ink">AI 助手</span></div></div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37, 99, 235, 0.1)" }}><Sparkles className="w-3.5 h-3.5 text-accent-electric" /></div><div className="flex-1 min-w-0"><div className="text-[11px] text-brand-faint mb-1">AI 助手</div><div className="text-xs text-brand-ink leading-relaxed whitespace-pre-wrap font-body">当前序列长度 {stats.length} bp，GC 含量 {stats.gcPercent}%。{apiStatus}。我可以基于 Biopython 风格基础分析解释翻译、ORF、酶切位点；引物设计区域给出 Primer3 接入前的教学版结果；BLAST 区域预留本地数据库服务接入。</div></div></div>
            <div className="flex gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(5, 150, 105, 0.1)" }}><User className="w-3.5 h-3.5 text-[#059669]" /></div><div className="flex-1 min-w-0"><div className="text-[11px] text-brand-faint mb-1">你</div><div className="text-xs text-brand-ink leading-relaxed whitespace-pre-wrap font-body">帮我判断这段序列能否直接设计 PCR 引物。</div></div></div>
          </div>
          <div className="p-4 border-t border-white/60"><div className="flex items-center gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="输入你的问题..." className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all" /><button className="inline-flex items-center justify-center p-2.5 rounded-xl bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200"><Send className="w-4 h-4" /></button></div></div>
        </div>
      </div>
    </div>
  );
}
