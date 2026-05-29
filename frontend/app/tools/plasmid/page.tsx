"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, FileUp, Upload } from "lucide-react";

import { calculateNucleotideStats, circularFeaturePath, describeFeature, detectPlasmidInputKind, parseGenBankFeatures, plasmidExamples } from "@/lib/biotools.mjs";
import BioMentorToolChat from "@/components/BioMentorToolChat";
import type { ToolContextSummary } from "@/lib/tool-ai-types";

type PlasmidKey = keyof typeof plasmidExamples;

const quizChoices = [
  { value: "a", label: "A. ori 决定复制能力，抗性基因决定筛选条件" },
  { value: "b", label: "B. promoter 决定质粒能否复制" },
  { value: "c", label: "C. terminator 决定抗生素种类" },
];

export default function PlasmidPage() {
  const [selectedPlasmid, setSelectedPlasmid] = useState<PlasmidKey>("pET-28a");
  const [uploadedName, setUploadedName] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [selectedFeatureKey, setSelectedFeatureKey] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basePlasmid = plasmidExamples[selectedPlasmid];
  const uploadedLength = uploadedText ? calculateNucleotideStats(uploadedText).length : 0;
  const inputKind = uploadedText ? detectPlasmidInputKind(uploadedText) : "builtin";
  const isUnsupportedUpload = Boolean(uploadedText) && inputKind === "unknown";
  const parsedFeatures = useMemo(
    () => {
      if (isUnsupportedUpload) return [];
      return uploadedText ? parseGenBankFeatures(uploadedText, uploadedLength || basePlasmid.length) : basePlasmid.features;
    },
    [basePlasmid.features, basePlasmid.length, isUnsupportedUpload, uploadedLength, uploadedText],
  );
  const plasmidLength = uploadedText ? Math.max(uploadedLength || 0, ...parsedFeatures.map((f) => f.end), 1) : basePlasmid.length;
  const selectedFeature = parsedFeatures.find((feature) => featureKey(feature) === selectedFeatureKey) || parsedFeatures[0];
  const isFastaLikeUpload = Boolean(uploadedText) && parsedFeatures.length === 1 && parsedFeatures[0]?.label === "uploaded sequence";

  const aiContext: ToolContextSummary = useMemo(() => {
    const kindLabel =
      inputKind === "genbank" ? "GenBank" :
      inputKind === "fasta" ? "FASTA" :
      inputKind === "raw-sequence" ? "Raw Sequence" : "Unknown";

    return {
      title: uploadedName || basePlasmid.name,
      subtitle: `${plasmidLength} bp · ${uploadedText ? kindLabel : "内置示例"}`,
      facts: [
        { label: "长度", value: `${plasmidLength} bp` },
        { label: "宿主", value: basePlasmid.host },
        { label: "元件数", value: `${parsedFeatures.length}` },
        { label: "当前元件", value: selectedFeature?.label || "未选择" },
      ],
      highlights: [
        uploadedName ? `上传文件: ${uploadedName}` : basePlasmid.notes,
        isUnsupportedUpload
          ? "当前文件无法识别为可解析的质粒序列格式。"
          : selectedFeature ? describeFeature(selectedFeature) : "点击图谱或元件列表查看解释。",
      ],
      warnings:
        isUnsupportedUpload
          ? ["当前文件无法识别为 GenBank、FASTA 或纯 DNA 序列。请导出为带 FEATURES 的 GenBank 文本后重试。"]
          : inputKind === "fasta" || inputKind === "raw-sequence"
          ? ["当前输入为未经注释的序列，无法推断 ori、抗性基因、promoter 等功能元件。如需完整元件注释，请上传 GenBank 格式文件。"]
          : undefined,
    };
  }, [uploadedName, basePlasmid, plasmidLength, inputKind, uploadedText, parsedFeatures.length, selectedFeature, isUnsupportedUpload]);

  const aiContextKey = useMemo(
    () => (uploadedText ? `upload-${uploadedName}-${uploadedText.slice(0, 80)}` : `builtin-${selectedPlasmid}`),
    [uploadedText, uploadedName, selectedPlasmid],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setUploadedName(file.name);
    setUploadedText(text);
    setSelectedFeatureKey("");
  }

  const handleQuizSubmit = () => {
    if (quizAnswer) setQuizSubmitted(true);
  };

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
          <p className="section-title">Plasmid Designer</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">质粒图谱查看器</h1>
          <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
            选择经典质粒或上传带 FEATURES 注释的 GenBank 文件查看完整元件图谱；FASTA / TXT 仅显示整段序列轨道，不会自动识别 ori、抗性基因或 promoter。
          </p>
          <Link
            href="/seminar?source=质粒图谱工具&topic=质粒设计与表达策略答辩&summary=围绕载体元件、复制起点、筛选标记、启动子、插入片段和表达策略展开答辩。"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <FileUp className="h-4 w-4" />
            带入答辩
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
                <select
                  value={selectedPlasmid}
                  onChange={(event) => {
                    setSelectedPlasmid(event.target.value as PlasmidKey);
                    setUploadedText("");
                    setUploadedName("");
                    setSelectedFeatureKey("");
                  }}
                  className="w-full px-4 py-3 rounded-2xl text-sm bg-white/65 backdrop-blur border border-white/90 text-brand-ink outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all appearance-none"
                >
                  {Object.keys(plasmidExamples).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-faint pointer-events-none" />
              </div>
              <input ref={fileInputRef} type="file" accept=".gb,.gbk,.genbank,.txt,.fasta,.fa" className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-[#111827] text-white hover:bg-[#1f2937] transition-all">
                <Upload className="w-4 h-4" /> 上传 GenBank / FASTA
              </button>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/52 px-4 py-3 text-sm leading-7 text-brand-muted">
              推荐上传 `.gb` / `.gbk` / `.genbank` 且包含 `FEATURES` 注释的文本文件。`.fa` / `.fasta` / `.txt` 只用于读取序列长度；暂不支持 SnapGene `.dna`、ApE 二进制、Benchling 私有格式、图片或 PDF。
            </div>

            {isFastaLikeUpload && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                已识别为未注释序列。当前显示整段序列轨道；如需 ori、抗性基因、promoter 等完整元件，请上传 GenBank 文件。
              </div>
            )}

            {uploadedText && inputKind === "unknown" && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/75 px-4 py-3 text-sm leading-7 text-rose-900">
                当前文件无法识别为 GenBank、FASTA 或纯 DNA 序列。请导出为带 FEATURES 的 GenBank 文本，或粘贴标准 FASTA / DNA 序列后重试。
              </div>
            )}

            <div className="liquid-card p-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 items-center">
              {isUnsupportedUpload ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-rose-200 bg-rose-50/70 px-6 text-center">
                  <FileText className="mb-4 h-10 w-10 text-rose-500" />
                  <h3 className="font-display text-xl font-black text-[#111827]">无法生成质粒图谱</h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-rose-900">
                    当前文件不是可解析的 GenBank / FASTA / 纯 DNA 序列。请重新导出为带 FEATURES 注释的 GenBank 文本，或上传标准 FASTA。
                  </p>
                </div>
              ) : (
                <svg viewBox="0 0 420 420" className="w-full max-w-[460px] mx-auto" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="feature-glow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodOpacity="0.35" /></filter>
                  </defs>
                  <circle cx="210" cy="210" r="174" fill="#111827" />
                  <circle cx="210" cy="210" r="144" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 8" />
                  {parsedFeatures.map((feature) => {
                    const selected = selectedFeature ? featureKey(feature) === featureKey(selectedFeature) : false;
                    return (
                      <path
                        key={featureKey(feature)}
                        d={circularFeaturePath(feature, plasmidLength, 144, 210)}
                        stroke={feature.color}
                        strokeWidth={selected ? 32 : 24}
                        fill="none"
                        strokeLinecap="butt"
                        filter={selected ? "url(#feature-glow)" : undefined}
                        onClick={() => setSelectedFeatureKey(featureKey(feature))}
                        className="cursor-pointer transition-all"
                      />
                    );
                  })}
                  <circle cx="210" cy="210" r="8" fill="#e5e7eb" />
                  <text x="210" y="202" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="system-ui, sans-serif">
                    {uploadedName || basePlasmid.name}
                  </text>
                  <text x="210" y="226" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontFamily="system-ui, sans-serif">
                    {plasmidLength} bp
                  </text>
                </svg>
              )}

              <div className="space-y-3">
                <div className="rounded-3xl bg-white/55 border border-white/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#111827] mb-2"><FileText className="w-4 h-4" />{uploadedName ? "上传图谱" : "示例图谱"}</div>
                  <p className="text-sm text-brand-muted leading-relaxed">{uploadedName ? `当前文件：${uploadedName}` : basePlasmid.notes}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/45 border border-white/70 p-3"><span className="text-brand-faint">宿主</span><div className="font-bold text-[#111827] mt-1">{basePlasmid.host}</div></div>
                  <div className="rounded-2xl bg-white/45 border border-white/70 p-3"><span className="text-brand-faint">元件数</span><div className="font-bold text-[#111827] mt-1">{parsedFeatures.length}</div></div>
                </div>
                <div className="rounded-3xl bg-white/55 border border-white/80 p-4">
                  <div className="text-xs font-bold text-brand-faint mb-2">当前元件</div>
                  <div className="font-display text-xl font-black text-[#111827] mb-2">{selectedFeature?.label || "未选择"}</div>
                  <p className="text-sm leading-relaxed text-brand-muted">{selectedFeature ? describeFeature(selectedFeature) : "点击图谱或元件列表查看解释。"}</p>
                </div>
              </div>
            </div>

            {!isUnsupportedUpload && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {parsedFeatures.map((feature) => {
                const selected = selectedFeature ? featureKey(feature) === featureKey(selectedFeature) : false;
                return (
                  <button
                    key={`${featureKey(feature)}-legend`}
                    onClick={() => setSelectedFeatureKey(featureKey(feature))}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all ${selected ? "bg-[#111827] text-white border-[#111827]" : "bg-white/45 border-white/70 text-brand-muted hover:bg-white/75"}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: feature.color }} />
                    <span className="text-xs truncate" title={`${feature.type}: ${feature.start}..${feature.end}`}>{feature.label}</span>
                  </button>
                );
              })}
            </div>
            )}
          </main>

          <BioMentorToolChat
            tool="plasmid"
            title="质粒图谱"
            context={aiContext}
            contextKey={aiContextKey}
            quickQuestions={[
              "这个质粒适合克隆还是表达？为什么？",
              "这些元件各自的生物学功能是什么？",
              "如何设计引物在这个质粒上插入目的基因？",
            ]}
          />
        </div>

        <div className="liquid-card overflow-hidden">
          <button onClick={() => setQuizOpen(!quizOpen)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-[#111827] hover:bg-white/30 transition-colors">
            <span>验证理解：ori 和抗性基因分别主要决定什么？</span>
            {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
          </button>
          {quizOpen && (
            <div className="px-6 pb-5">
              <div className="space-y-2.5 mb-4">
                {quizChoices.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${quizSubmitted && opt.value === "a" ? "bg-[#ecfdf5] border border-[#059669]/20" : quizSubmitted && quizAnswer === opt.value && opt.value !== "a" ? "bg-[#fef2f2] border border-[#dc2626]/20" : quizAnswer === opt.value ? "bg-[rgba(37,99,235,0.04)] border border-[#2563eb]/20" : "bg-white/40 border border-transparent hover:bg-white/70"}`}>
                    <input type="radio" name="plasmid-quiz" value={opt.value} checked={quizAnswer === opt.value} onChange={(event) => setQuizAnswer(event.target.value)} disabled={quizSubmitted} />
                    <span className="text-sm text-[#111827]">{opt.label}</span>
                    {quizSubmitted && opt.value === "a" && <span className="badge badge-electric ml-auto">正确</span>}
                  </label>
                ))}
              </div>
              <button onClick={handleQuizSubmit} disabled={!quizAnswer || quizSubmitted} className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-[#111827] text-white disabled:opacity-40">提交</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function featureKey(feature: { label: string; start: number; end: number }) {
  return `${feature.label}-${feature.start}-${feature.end}`;
}
