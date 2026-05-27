"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, BarChart3, ChevronDown, ChevronUp, Dna, Flame, Scissors, Send, Sparkles } from "lucide-react";

import {
  calculateNucleotideStats,
  designPrimerPair,
  detectSequenceType,
  findOpenReadingFrames,
  findRestrictionSites,
  reverseComplement,
  sampleDnaSequence,
  transcribeDnaToRna,
  translateDna,
} from "@/lib/biotools.mjs";

type ToolMode = "overview" | "rna" | "reverse" | "translate" | "orf" | "sites" | "primer";

const tools: { key: ToolMode; label: string; icon: typeof Dna }[] = [
  { key: "overview", label: "概览", icon: BarChart3 },
  { key: "rna", label: "转录", icon: ArrowRightLeft },
  { key: "reverse", label: "反向互补", icon: Dna },
  { key: "translate", label: "翻译", icon: ArrowRightLeft },
  { key: "orf", label: "ORF", icon: Flame },
  { key: "sites", label: "酶切位点", icon: Scissors },
  { key: "primer", label: "引物", icon: Scissors },
];

export default function SequencePage() {
  const [sequence, setSequence] = useState(sampleDnaSequence);
  const [activeTool, setActiveTool] = useState<ToolMode>("overview");
  const [chatInput, setChatInput] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);

  const sequenceType = useMemo(() => detectSequenceType(sequence), [sequence]);
  const stats = useMemo(() => calculateNucleotideStats(sequence), [sequence]);
  const rna = useMemo(() => transcribeDnaToRna(sequence), [sequence]);
  const reverse = useMemo(() => reverseComplement(stats.sequence), [stats.sequence]);
  const protein = useMemo(() => translateDna(sequence), [sequence]);
  const orfs = useMemo(() => findOpenReadingFrames(sequence), [sequence]);
  const sites = useMemo(() => findRestrictionSites(sequence), [sequence]);
  const primers = useMemo(() => {
    try {
      return designPrimerPair(sequence);
    } catch {
      return null;
    }
  }, [sequence]);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-12 font-body">
      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        <header className="liquid-card p-6 md:p-8">
          <p className="section-title">Sequence Lab</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">序列分析工具</h1>
          <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
            粘贴 DNA / RNA / 蛋白序列，完成类型识别、GC 分析、转录、翻译、ORF、酶切位点和引物检查。
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4 space-y-3">
              <textarea
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
                placeholder="粘贴序列，支持 FASTA header"
                className="w-full px-4 py-3 rounded-2xl text-sm bg-white/65 backdrop-blur border border-white/90 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all h-32 resize-none font-mono"
              />
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.key;
                  return (
                    <button key={tool.key} onClick={() => setActiveTool(tool.key)} className={isActive ? "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-[#111827] text-white" : "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-brand-muted bg-white/45 border border-white/70 hover:bg-white/80 hover:text-[#111827] transition-all"}>
                      <Icon className="w-3.5 h-3.5" /> {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric label="序列类型" value={sequenceType} accent="#2563eb" />
              <Metric label="有效长度" value={`${stats.length} bp`} accent="#059669" />
              <Metric label="GC 含量" value={`${stats.gcPercent}%`} accent="#7c3aed" />
              <Metric label="ORF 数量" value={String(orfs.length)} accent="#d97706" />
            </div>

            {stats.invalidCount > 0 && (
              <div className="rounded-3xl bg-amber-50/80 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                已忽略 {stats.invalidCount} 个非标准字符；建议检查是否混入注释、空格或非核酸字符。
              </div>
            )}

            <div className="liquid-card p-5 min-h-[420px]">
              {activeTool === "overview" && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="stat-number text-5xl text-accent-electric mb-3">{stats.gcPercent}%</div>
                  <div className="font-display text-xl font-bold text-[#111827] mb-4">GC 含量</div>
                  <div className="flex flex-wrap justify-center gap-5 text-sm text-brand-muted">
                    {Object.entries(stats.bases).map(([base, count]) => <span key={base}><span className="font-mono font-bold text-[#111827]">{count}</span> {base}</span>)}
                  </div>
                  <div className="mt-7 h-3 rounded-full overflow-hidden flex w-full max-w-md bg-white/50">
                    <div style={{ width: `${stats.length ? (stats.bases.G / stats.length) * 100 : 0}%`, background: "#2563eb" }} />
                    <div style={{ width: `${stats.length ? (stats.bases.C / stats.length) * 100 : 0}%`, background: "#60a5fa" }} />
                    <div style={{ width: `${stats.length ? (stats.bases.A / stats.length) * 100 : 0}%`, background: "#a7f3d0" }} />
                    <div style={{ width: `${stats.length ? (stats.bases.T / stats.length) * 100 : 0}%`, background: "#fde68a" }} />
                  </div>
                </div>
              )}

              {activeTool === "rna" && <SequenceBlock title="DNA → RNA 转录" sequence={rna || "请输入 DNA 序列"} note="转录会把 DNA 中的 T 替换为 RNA 中的 U，可用于理解中心法则。" />}
              {activeTool === "reverse" && <SequenceBlock title="反向互补链" sequence={reverse || "请输入 DNA 序列"} note="反向互补链常用于引物设计、克隆方向检查和双链 DNA 理解。" />}
              {activeTool === "translate" && <SequenceBlock title="翻译得到的氨基酸序列" sequence={protein || "请输入有效 DNA 序列"} note="星号 * 表示终止密码子；若过早出现终止，需检查读框或序列完整性。" />}

              {activeTool === "orf" && (
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-bold text-[#111827]">开放阅读框 ORF</h3>
                  {orfs.length ? orfs.map((orf) => (
                    <div key={`${orf.frame}-${orf.start}-${orf.end}`} className="rounded-3xl bg-white/50 border border-white/80 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-bold text-[#111827]">Frame {orf.frame} · {orf.start}..{orf.end}</span>
                        <span className={orf.complete ? "badge badge-electric" : "badge badge-amber"}>{orf.complete ? "完整 ORF" : "未遇到终止密码子"}</span>
                      </div>
                      <p className="text-xs font-mono break-all text-brand-muted">{orf.protein}</p>
                    </div>
                  )) : <p className="text-brand-muted">未找到以 ATG 开始的明显 ORF。</p>}
                </div>
              )}

              {activeTool === "sites" && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-bold text-[#111827]">限制性内切酶位点</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sites.map((enzyme) => (
                      <div key={enzyme.name} className="rounded-3xl bg-white/50 border border-white/80 p-4 flex items-center justify-between gap-3">
                        <div><span className="font-bold text-[#111827]">{enzyme.name}</span><span className="ml-2 text-xs font-mono text-brand-muted">{enzyme.motif}</span></div>
                        <span className="text-xs text-brand-muted">{enzyme.count ? `位置：${enzyme.sites.join(", ")}` : "未检出"}</span>
                      </div>
                    ))}
                  </div>
                  <HighlightedSequence sequence={stats.sequence} sites={sites} />
                </div>
              )}

              {activeTool === "primer" && (
                <div className="space-y-3">
                  <h3 className="font-display text-lg font-bold text-[#111827]">引物设计检查</h3>
                  {primers ? (["forward", "reverse"] as const).map((side) => (
                    <div key={side} className="rounded-3xl bg-white/50 border border-white/80 p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={side === "forward" ? "badge badge-electric" : "badge badge-cyan"}>{side === "forward" ? "上游引物" : "下游引物"}</span>
                        <span className="text-xs text-brand-muted">Tm={primers[side].tm}°C ｜ GC={primers[side].gcPercent}% ｜ {primers[side].warning}</span>
                      </div>
                      <div className="text-xs p-3 rounded-2xl break-all font-mono bg-white/55 border border-white/70">5&apos;-{primers[side].sequence}-3&apos;</div>
                    </div>
                  )) : <div className="text-sm text-brand-muted">序列太短，至少需要约 40 bp 才能给出教学版引物对。</div>}
                  {primers && <div className="text-sm text-brand-muted">产物长度：{primers.productLength} bp ｜ 上下游 Tm 差：{primers.tmDelta}°C</div>}
                </div>
              )}
            </div>
          </main>

          <aside className="liquid-card p-5 xl:sticky xl:top-24 h-fit">
            <h2 className="font-display text-xl font-black text-[#111827] mb-4">序列学习解释</h2>
            <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
              <p>当前输入被识别为 <span className="font-semibold text-[#111827]">{sequenceType}</span>，有效核酸长度 {stats.length} bp，GC 含量 {stats.gcPercent}%。</p>
              <div className="rounded-3xl bg-white/45 border border-white/70 p-4">
                <div className="font-semibold text-[#111827] mb-2">如何判断实验风险</div>
                <p>GC 过低可能降低退火稳定性，GC 过高可能产生二级结构；酶切位点应避开目标片段内部；ORF 需要读框完整。</p>
              </div>
              <div className="rounded-3xl bg-white/45 border border-white/70 p-4">
                <div className="font-semibold text-[#111827] mb-2">引导问题</div>
                <p>如果要把这段序列克隆进表达载体，你会优先检查哪些酶切位点、读框和引物参数？</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="输入你的问题…" className="flex-1 px-4 py-2.5 rounded-2xl text-sm bg-white/60 border border-white/80 outline-none" />
              <button className="p-2.5 rounded-2xl bg-[#111827] text-white"><Send className="w-4 h-4" /></button>
            </div>
          </aside>
        </div>

        <div className="liquid-card overflow-hidden">
          <button onClick={() => setQuizOpen(!quizOpen)} className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#111827]">
            <span>验证理解：这段序列最适合用哪种限制酶进行克隆？为什么？</span>
            {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-faint" /> : <ChevronDown className="w-4 h-4 text-brand-faint" />}
          </button>
          {quizOpen && <div className="px-4 pb-4"><div className="p-4 rounded-3xl text-sm text-brand-muted leading-relaxed bg-white/45 border border-white/70">优先选择目标序列内部未出现、且载体 MCS 中存在的酶切位点；还要检查读框、保护碱基和上下游引物 Tm 是否匹配。</div></div>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return <div className="liquid-card p-4 text-center"><div className="stat-number text-lg" style={{ color: accent }}>{value}</div><div className="text-[11px] text-brand-muted mt-1">{label}</div></div>;
}

function SequenceBlock({ title, sequence, note }: { title: string; sequence: string; note: string }) {
  return <div className="space-y-4"><h3 className="font-display text-lg font-bold text-[#111827]">{title}</h3><div className="min-h-[220px] rounded-3xl bg-white/50 border border-white/80 p-4 text-xs font-mono break-all leading-relaxed text-[#111827]">{sequence}</div><p className="text-sm text-brand-muted leading-relaxed">{note}</p></div>;
}

function HighlightedSequence({ sequence, sites }: { sequence: string; sites: Array<{ name: string; motif: string; sites: number[] }> }) {
  const marks = new Map<number, string>();
  for (const enzyme of sites) {
    for (const site of enzyme.sites) {
      for (let i = 0; i < enzyme.motif.length; i += 1) marks.set(site - 1 + i, enzyme.name);
    }
  }
  return <div className="rounded-3xl bg-white/50 border border-white/80 p-4 text-xs font-mono break-all leading-7 max-h-56 overflow-auto">{sequence.split("").map((char, index) => <span key={`${index}-${char}`} className={marks.has(index) ? "rounded bg-amber-200 px-0.5 text-amber-950" : "text-[#111827]"} title={marks.get(index)}>{char}</span>)}</div>;
}
