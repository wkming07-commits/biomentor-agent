"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { ArrowLeft, ArrowRightLeft, BarChart3, Dna, FileUp, Flame, Scissors, Upload } from "lucide-react";

import {
  calculateNucleotideStats,
  calculateProteinStats,
  designPrimerPair,
  detectSequenceType,
  findOpenReadingFrames,
  findRestrictionSites,
  reverseComplement,
  sampleDnaSequence,
  sanitizeSequence,
  transcribeDnaToRna,
  translateDna,
} from "@/lib/biotools.mjs";

import BioMentorToolChat from "@/components/BioMentorToolChat";
import type { ToolContextSummary } from "@/lib/tool-ai-types";

type ToolMode = "overview" | "rna" | "reverse" | "translate" | "orf" | "sites" | "primer";

const dnaTools: { key: ToolMode; label: string; icon: typeof Dna }[] = [
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sequenceType = useMemo(() => detectSequenceType(sequence), [sequence]);
  const isNucleic = sequenceType === "DNA" || sequenceType === "RNA";
  const isProtein = sequenceType === "Protein";

  const dnaStats = useMemo(() => {
    if (isNucleic) return calculateNucleotideStats(sequence);
    return null;
  }, [sequence, isNucleic]);

  const proteinStats = useMemo(() => {
    if (isProtein) return calculateProteinStats(sequence);
    return null;
  }, [sequence, isProtein]);

  const safeActiveTool: ToolMode = isProtein ? "overview" : activeTool;

  const rna = useMemo(() => (isNucleic ? transcribeDnaToRna(sequence) : ""), [sequence, isNucleic]);
  const reverse = useMemo(() => (isNucleic && dnaStats ? reverseComplement(dnaStats.sequence) : ""), [isNucleic, dnaStats]);
  const protein = useMemo(() => (isNucleic ? translateDna(sequence) : ""), [sequence, isNucleic]);
  const orfs = useMemo(() => (isNucleic ? findOpenReadingFrames(sequence) : []), [sequence, isNucleic]);
  const sites = useMemo(() => (isNucleic ? findRestrictionSites(sequence) : []), [sequence, isNucleic]);
  const primers = useMemo(() => {
    if (!isNucleic) return null;
    try {
      return designPrimerPair(sequence);
    } catch {
      return null;
    }
  }, [sequence, isNucleic]);

  const invalidCount = isProtein ? proteinStats?.invalidCount ?? 0 : dnaStats?.invalidCount ?? 0;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event_) => {
      const text = event_?.target?.result;
      if (typeof text === "string") setSequence(text);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const aiContext = useMemo<ToolContextSummary>(() => {
    if (isProtein && proteinStats) {
      return {
        title: "序列分析",
        subtitle: `蛋白序列 · ${proteinStats.length} aa`,
        facts: [
          { label: "序列类型", value: "蛋白质" },
          { label: "氨基酸数", value: `${proteinStats.length} aa` },
          { label: "分子量", value: `${proteinStats.molecularWeight} Da` },
          { label: "疏水性比例", value: `${proteinStats.hydrophobicPercent}%` },
        ],
        highlights: [
          `该蛋白序列包含 ${proteinStats.length} 个氨基酸残基`,
          `粗略分子量约 ${proteinStats.molecularWeight} Da`,
          `疏水性残基占比 ${proteinStats.hydrophobicPercent}%，可用于初步判断蛋白的溶解性和折叠倾向`,
          "建议使用蛋白质结构查看器（Protein Explorer）进行三维结构分析",
        ],
        warnings: proteinStats.invalidCount > 0
          ? [`检测到 ${proteinStats.invalidCount} 个非标准氨基酸字符，建议检查序列完整性`]
          : undefined,
      };
    }
    if (isNucleic && dnaStats) {
      const enzymeNames = sites.filter((s) => s.count > 0).map((s) => s.name);
      return {
        title: "序列分析",
        subtitle: `核酸序列 · ${dnaStats.length} bp`,
        facts: [
          { label: "序列类型", value: sequenceType },
          { label: "序列长度", value: `${dnaStats.length} bp` },
          { label: "GC 含量", value: `${dnaStats.gcPercent}%` },
          { label: "ORF 数量", value: `${orfs.length}` },
          { label: "酶切位点", value: enzymeNames.length > 0 ? enzymeNames.join("、") : "未检出" },
        ],
        highlights: [
          `${sequenceType} 序列，长度 ${dnaStats.length} bp，GC 含量 ${dnaStats.gcPercent}%`,
          `共检出 ${orfs.length} 个开放阅读框`,
          enzymeNames.length > 0
            ? `检测到 ${enzymeNames.join("、")} 酶切位点，可用于克隆策略设计`
            : "未检测到常见限制性内切酶位点",
        ],
        warnings: dnaStats.invalidCount > 0
          ? [`已忽略 ${dnaStats.invalidCount} 个非标准字符，建议检查序列完整性`]
          : undefined,
      };
    }
    return {
      title: "序列分析",
      subtitle: "无效或混合序列",
      facts: [
        { label: "序列类型", value: sequenceType },
        { label: "有效长度", value: `${dnaStats?.length ?? proteinStats?.length ?? 0}` },
      ],
      highlights: ["请输入有效的 DNA / RNA / 蛋白质序列以开始分析"],
      warnings: ["当前输入无法被识别为标准的核酸或蛋白质序列"],
    };
  }, [isProtein, isNucleic, proteinStats, dnaStats, sequenceType, sites, orfs]);

  const contextKey = useMemo(() => {
    const seq = sanitizeSequence(sequence).slice(0, 50);
    return `${sequenceType}:${seq}`;
  }, [sequence, sequenceType]);

  const quickQuestions = isProtein
    ? ["如何判断蛋白质是膜蛋白还是可溶蛋白？", "疏水区有什么功能意义？", "如何从一级序列推演结构域？"]
    : ["这段序列的 GC 含量算高还是低？", "如何选择最合适的限制酶？", "ORF 不完整说明什么问题？"];

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-12 font-body">
      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        <header className="liquid-card p-6 md:p-8">
          <Link
            href="/tools"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回工具箱
          </Link>
          <p className="section-title">Sequence Lab</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">序列分析工具</h1>
          <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
            粘贴 DNA / RNA / 蛋白序列，或上传 .fa / .fasta / .txt 文件，完成类型识别和序列分析。
          </p>
          <Link
            href="/seminar?source=序列分析工具&topic=序列分析与实验设计答辩&summary=围绕序列类型、GC 含量、ORF、酶切位点、引物设计和结果解释展开答辩。"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <FileUp className="h-4 w-4" />
            带入答辩
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4 space-y-3">
              <textarea
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
                placeholder="粘贴序列，支持 FASTA header；DNA / RNA / 蛋白质序列均可"
                className="w-full px-4 py-3 rounded-2xl text-sm bg-white/65 backdrop-blur border border-white/90 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all h-32 resize-none font-mono"
              />
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fa,.fasta,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-brand-muted bg-white/45 border border-white/70 hover:bg-white/80 hover:text-[#111827] transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> 上传文件
                </button>
                {(isProtein ? [{ key: "overview" as ToolMode, label: "概览", icon: BarChart3 }] : dnaTools).map((tool) => {
                  const Icon = tool.icon;
                  const isActive = safeActiveTool === tool.key;
                  return (
                    <button
                      key={tool.key}
                      onClick={() => setActiveTool(tool.key)}
                      className={
                        isActive
                          ? "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-[#111827] text-white"
                          : "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-brand-muted bg-white/45 border border-white/70 hover:bg-white/80 hover:text-[#111827] transition-all"
                      }
                    >
                      <Icon className="w-3.5 h-3.5" /> {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {isProtein && proteinStats ? (
                <>
                  <Metric label="序列类型" value="蛋白质" accent="#2563eb" />
                  <Metric label="氨基酸数" value={`${proteinStats.length} aa`} accent="#059669" />
                  <Metric label="分子量" value={`${proteinStats.molecularWeight} Da`} accent="#7c3aed" />
                  <Metric label="疏水性" value={`${proteinStats.hydrophobicPercent}%`} accent="#d97706" />
                </>
              ) : (
                <>
                  <Metric label="序列类型" value={sequenceType} accent="#2563eb" />
                  <Metric label="有效长度" value={`${dnaStats?.length ?? 0} bp`} accent="#059669" />
                  <Metric label="GC 含量" value={`${dnaStats?.gcPercent ?? 0}%`} accent="#7c3aed" />
                  <Metric label="ORF 数量" value={String(orfs.length)} accent="#d97706" />
                </>
              )}
            </div>

            {invalidCount > 0 && (
              <div className="rounded-3xl bg-amber-50/80 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                已忽略 {invalidCount} 个非标准字符；建议检查是否混入注释、空格或非{isProtein ? "氨基酸" : "核酸"}字符。
              </div>
            )}

            <div className="liquid-card p-5 min-h-[420px]">
              {isProtein && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-bold text-[#111827]">蛋白质序列概览</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-3xl bg-white/50 border border-white/80 p-4 text-center">
                      <div className="stat-number text-2xl text-[#2563eb]">{proteinStats?.length ?? 0}</div>
                      <div className="text-xs text-brand-muted mt-1">氨基酸残基</div>
                    </div>
                    <div className="rounded-3xl bg-white/50 border border-white/80 p-4 text-center">
                      <div className="stat-number text-2xl text-[#059669]">{proteinStats?.molecularWeight ?? 0} Da</div>
                      <div className="text-xs text-brand-muted mt-1">分子量</div>
                    </div>
                    <div className="rounded-3xl bg-white/50 border border-white/80 p-4 text-center">
                      <div className="stat-number text-2xl text-[#7c3aed]">{proteinStats?.hydrophobicPercent ?? 0}%</div>
                      <div className="text-xs text-brand-muted mt-1">疏水性比例</div>
                    </div>
                  </div>
                  {proteinStats?.composition && (
                    <div className="rounded-3xl bg-white/50 border border-white/80 p-4">
                      <div className="font-semibold text-[#111827] text-sm mb-3">氨基酸组成</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(proteinStats.composition)
                          .sort(([, a], [, b]) => b - a)
                          .map(([aa, count]) => (
                            <span key={aa} className="text-xs font-mono bg-white/60 border border-white/80 rounded-full px-2.5 py-1">
                              {aa}: {count}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="rounded-3xl bg-white/45 border border-white/70 p-4 text-sm text-brand-muted leading-relaxed">
                    <div className="font-semibold text-[#111827] mb-2">蛋白质序列说明</div>
                    <p>
                      以上为蛋白质一级序列。如需了解三维结构、结构域和功能注释，请使用
                      <a href="/tools/protein" className="text-accent-electric font-semibold hover:underline ml-1">
                        蛋白结构查看器
                      </a>。
                    </p>
                  </div>
                </div>
              )}

              {!isProtein && safeActiveTool === "overview" && dnaStats && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="stat-number text-5xl text-accent-electric mb-3">{dnaStats.gcPercent}%</div>
                  <div className="font-display text-xl font-bold text-[#111827] mb-4">GC 含量</div>
                  <div className="flex flex-wrap justify-center gap-5 text-sm text-brand-muted">
                    {Object.entries(dnaStats.bases).map(([base, count]) => (
                      <span key={`base-${base}`}>
                        <span className="font-mono font-bold text-[#111827]">{count}</span> {base}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 h-3 rounded-full overflow-hidden flex w-full max-w-md bg-white/50">
                    <div style={{ width: `${dnaStats.length ? (dnaStats.bases.G / dnaStats.length) * 100 : 0}%`, background: "#2563eb" }} />
                    <div style={{ width: `${dnaStats.length ? (dnaStats.bases.C / dnaStats.length) * 100 : 0}%`, background: "#60a5fa" }} />
                    <div style={{ width: `${dnaStats.length ? (dnaStats.bases.A / dnaStats.length) * 100 : 0}%`, background: "#a7f3d0" }} />
                    <div style={{ width: `${dnaStats.length ? (dnaStats.bases.T / dnaStats.length) * 100 : 0}%`, background: "#fde68a" }} />
                  </div>
                </div>
              )}

              {!isProtein && safeActiveTool === "rna" && (
                <SequenceBlock title="DNA → RNA 转录" sequence={rna || "请输入 DNA 序列"} note="转录会把 DNA 中的 T 替换为 RNA 中的 U，可用于理解中心法则。" />
              )}
              {!isProtein && safeActiveTool === "reverse" && (
                <SequenceBlock title="反向互补链" sequence={reverse || "请输入 DNA 序列"} note="反向互补链常用于引物设计、克隆方向检查和双链 DNA 理解。" />
              )}
              {!isProtein && safeActiveTool === "translate" && (
                <SequenceBlock title="翻译得到的氨基酸序列" sequence={protein || "请输入有效 DNA 序列"} note="星号 * 表示终止密码子；若过早出现终止，需检查读框或序列完整性。" />
              )}

              {!isProtein && safeActiveTool === "orf" && (
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

              {!isProtein && safeActiveTool === "sites" && (
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
                  {dnaStats && <HighlightedSequence sequence={dnaStats.sequence} sites={sites} />}
                </div>
              )}

              {!isProtein && safeActiveTool === "primer" && (
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

          <BioMentorToolChat
            tool="sequence"
            title="序列分析"
            context={aiContext}
            contextKey={contextKey}
            emptyState="粘贴序列或上传文件后，BioMentor AI 将为您生成智能讲解。"
            quickQuestions={quickQuestions}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="liquid-card p-4 text-center">
      <div className="stat-number text-lg" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] text-brand-muted mt-1">{label}</div>
    </div>
  );
}

function SequenceBlock({ title, sequence, note }: { title: string; sequence: string; note: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-[#111827]">{title}</h3>
      <div className="min-h-[220px] rounded-3xl bg-white/50 border border-white/80 p-4 text-xs font-mono break-all leading-relaxed text-[#111827]">{sequence}</div>
      <p className="text-sm text-brand-muted leading-relaxed">{note}</p>
    </div>
  );
}

function HighlightedSequence({ sequence, sites }: { sequence: string; sites: Array<{ name: string; motif: string; sites: number[] }> }) {
  const marks = new Map<number, string>();
  for (const enzyme of sites) {
    for (const site of enzyme.sites) {
      for (let i = 0; i < enzyme.motif.length; i += 1) marks.set(site - 1 + i, enzyme.name);
    }
  }
  return (
    <div className="rounded-3xl bg-white/50 border border-white/80 p-4 text-xs font-mono break-all leading-7 max-h-56 overflow-auto">
      {sequence.split("").map((char, index) => (
        <span key={`${index}-${char}`} className={marks.has(index) ? "rounded bg-amber-200 px-0.5 text-amber-950" : "text-[#111827]"} title={marks.get(index)}>
          {char}
        </span>
      ))}
    </div>
  );
}
