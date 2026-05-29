"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ChevronRight, FlaskConical, Layers, RotateCw, Search, ZoomIn } from "lucide-react";

import { searchProteinCandidates } from "@/lib/biotools.mjs";
import BioMentorToolChat from "@/components/BioMentorToolChat";
import type { ToolContextSummary } from "@/lib/tool-ai-types";

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

interface ProteinCandidate {
  id: string;
  label: string;
  geneName?: string;
  accession?: string;
  pdbId?: string;
  organism?: string;
  reviewed?: boolean;
  sourceKind?: "experimental" | "predicted" | "metadata-only";
  sourceLabel?: string;
  confidence?: number | null;
  teachingFocus?: string;
  structureUrl?: string;
  alphaFoldUrl?: string;
  alphaFoldApiUrl?: string;
  uniprotUrl?: string;
  rcsbUrl?: string;
  matchType?: string;
}

const suggestions = ["GFP", "Cas9", "4HHB", "P42212", "insulin", "TP53"];
const initialProteinCandidates = searchProteinCandidates("GFP") as ProteinCandidate[];
const styles = [
  { key: "cartoon", label: "卡通", icon: Layers },
  { key: "stick", label: "棒状", icon: FlaskConical },
  { key: "sphere", label: "球体", icon: Box },
] as const;

type ViewerStyle = (typeof styles)[number]["key"];

function buildProteinContext(candidate: ProteinCandidate): ToolContextSummary {
  const facts: { label: string; value: string }[] = [];
  if (candidate.accession) facts.push({ label: "UniProt", value: candidate.accession });
  if (candidate.pdbId) facts.push({ label: "PDB", value: candidate.pdbId });
  if (candidate.organism) facts.push({ label: "物种", value: candidate.organism });
  if (candidate.sourceLabel) facts.push({ label: "结构来源", value: candidate.sourceLabel });
  facts.push({ label: "Reviewed", value: candidate.reviewed ? "是 (Swiss-Prot)" : "否 (预测/未审阅)" });

  const warnings: string[] = [];
  if (candidate.sourceKind === "predicted") {
    warnings.push("该结构为预测模型，需结合 pLDDT 置信度谨慎理解。");
  }
  if (candidate.sourceKind === "metadata-only") {
    warnings.push("该候选暂无可直接查看的三维结构。");
  }

  return {
    title: candidate.label,
    subtitle: [candidate.geneName, candidate.organism].filter(Boolean).join(" · "),
    facts,
    highlights: candidate.teachingFocus ? [candidate.teachingFocus] : [],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export default function ProteinPage() {
  const [query, setQuery] = useState("GFP");
  const [candidates, setCandidates] = useState<ProteinCandidate[]>(initialProteinCandidates);
  const [selectedId, setSelectedId] = useState<string | null>(initialProteinCandidates[0]?.id || null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerStatus, setViewerStatus] = useState("正在准备结构查看器");
  const [style, setStyle] = useState<ViewerStyle>("cartoon");
  const viewerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) || null,
    [candidates, selectedId],
  );

  const handleSearch = useCallback(
    async (nextQuery = query) => {
      setQuery(nextQuery);
      setSelectedId(null);
      setIsSearching(true);

      try {
        const res = await fetch(`/api/bio-tools/protein/search?query=${encodeURIComponent(nextQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const nextCandidates = (data.candidates || []) as ProteinCandidate[];
          setCandidates(nextCandidates);
          setSelectedId(nextCandidates[0]?.id || null);
          setIsSearching(false);
          return;
        }
      } catch {
        // API unavailable, fallback to local candidates
      }

      const results = searchProteinCandidates(nextQuery) as ProteinCandidate[];
      setCandidates(results);
      setSelectedId(results[0]?.id || null);
      setIsSearching(false);
    },
    [query],
  );

  const handleSelectCandidate = useCallback((id: string) => {
    setSelectedId(id);
    setViewerStatus("正在准备结构查看器");
  }, []);

  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !window.$3Dmol || !selected?.structureUrl) return;

    let cancelled = false;
    setViewerStatus("正在加载结构文件…");

    async function loadStructure() {
      try {
        const response = await fetch(selected!.structureUrl!);
        if (!response.ok) throw new Error("结构文件暂时无法访问");
        const pdbText = await response.text();
        if (cancelled || !viewerRef.current || !window.$3Dmol) return;

        viewerRef.current.innerHTML = "";
        const viewer = window.$3Dmol.createViewer(viewerRef.current, { backgroundColor: "#111827" });
        viewer.addModel(pdbText, "pdb");
        viewer.setStyle({}, { [style]: { color: "spectrum" } });
        viewer.zoomTo();
        viewer.render();
        setViewerStatus("结构已加载，可拖拽旋转、滚轮缩放");
      } catch (error) {
        setViewerStatus(error instanceof Error ? error.message : "结构加载失败，请换一个候选结果");
      }
    }

    loadStructure();
    return () => {
      cancelled = true;
    };
  }, [selected?.structureUrl, style, viewerReady]);

  const proteinContext = useMemo<ToolContextSummary | null>(() => {
    if (!selected) return null;
    return buildProteinContext(selected);
  }, [selected]);

  const contextKey = selected?.id || "";

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-12 font-body">
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setViewerReady(true);
          setViewerStatus("结构查看器已准备好");
        }}
        onError={() => setViewerStatus("结构查看器加载失败，请检查网络后重试")}
      />

      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        <header className="liquid-card p-6 md:p-8 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative z-10">
            <p className="section-title">Protein Explorer</p>
            <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">蛋白结构查看器</h1>
            <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
              输入蛋白名、基因名、PDB ID 或 UniProt ID，先选择候选结果，再查看三维结构和学习解释。
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                    placeholder="搜索 GFP、Cas9、4HHB、P42212…"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-white/65 backdrop-blur border border-white/90 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="px-5 py-3 rounded-2xl bg-[#111827] text-white text-sm font-bold hover:bg-[#1f2937] transition-all disabled:opacity-60"
                >
                  {isSearching ? "搜索中…" : "搜索结构"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-brand-muted bg-white/45 border border-white/70 hover:bg-white/80 hover:text-[#111827] transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
              <aside className="liquid-card p-4 space-y-3">
                <div className="text-xs font-bold text-brand-faint">候选结果</div>
                {candidates.map((candidate) => (
                  <button
                    key={`${candidate.id}-${candidate.pdbId || ""}-${candidate.accession || ""}`}
                    onClick={() => handleSelectCandidate(candidate.id)}
                    className={`w-full text-left rounded-2xl border p-3 transition-all ${
                      selected?.id === candidate.id
                        ? "bg-[#111827] text-white border-[#111827]"
                        : "bg-white/45 border-white/70 text-brand-muted hover:bg-white/75"
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{candidate.label}</div>
                    <div className={`mt-1 text-[11px] ${selected?.id === candidate.id ? "text-white/70" : "text-brand-faint"}`}>
                      {candidate.organism || candidate.geneName || candidate.sourceLabel || ""}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span>
                        {candidate.sourceKind === "experimental"
                          ? "实验结构"
                          : candidate.sourceKind === "predicted"
                            ? "预测结构"
                            : candidate.sourceKind === "metadata-only"
                              ? "无可用结构"
                              : "精选示例"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </aside>

              <section className="space-y-4 min-w-0">
                <div className="glass-card relative overflow-hidden min-h-[500px]" style={{ backgroundColor: "#111827" }}>
                  {!selected ? (
                    <div className="absolute inset-0 flex items-center justify-center text-brand-faint text-sm">
                      请从左侧候选结果中选择一个蛋白以查看结构
                    </div>
                  ) : selected.sourceKind === "metadata-only" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-faint text-sm gap-2 px-8 text-center">
                      <Box className="w-10 h-10 opacity-40" />
                      <p className="font-semibold text-white/70">暂未找到可直接显示的结构</p>
                      <p className="max-w-sm">该候选目前仅有元数据信息，未关联 PDB 实验结构或 AlphaFold 预测模型。你可以尝试搜索其他蛋白或查看下方 AI 讲解了解该蛋白的基本信息。</p>
                    </div>
                  ) : (
                    <div ref={viewerRef} className="absolute inset-0" />
                  )}
                  {selected && selected.sourceKind !== "metadata-only" && (
                    <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                      <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">{viewerStatus}</div>
                      <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">PDB: {selected.pdbId || "预测模型"}</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setViewerStatus("可用鼠标左键拖拽旋转，滚轮缩放结构")}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-brand-muted hover:bg-white/60 hover:text-[#111827] transition-all"
                  >
                    <RotateCw className="w-4 h-4" /> 旋转提示
                  </button>
                  <button
                    onClick={() => setViewerStatus("滚轮或触控板可缩放结构；双击可聚焦结构区域")}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-brand-muted hover:bg-white/60 hover:text-[#111827] transition-all"
                  >
                    <ZoomIn className="w-4 h-4" /> 缩放提示
                  </button>
                  {styles.map((btn) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={btn.key}
                        onClick={() => setStyle(btn.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm transition-all ${style === btn.key ? "bg-[#111827] text-white" : "text-brand-muted hover:bg-white/60 hover:text-[#111827]"}`}
                      >
                        <Icon className="w-4 h-4" /> {btn.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </main>

          {proteinContext && contextKey ? (
            <BioMentorToolChat
              tool="protein"
              title="蛋白结构"
              context={proteinContext}
              contextKey={contextKey}
              autoGenerate
              quickQuestions={[
                "这个蛋白的主要功能是什么？",
                "它的结构域有什么特点？",
                "如何理解这个蛋白的活性机制？",
              ]}
            />
          ) : (
            <BioMentorToolChat
              tool="protein"
              title="蛋白结构"
              context={{
                title: "未选择蛋白",
                facts: [],
                highlights: [],
              }}
              contextKey=""
              autoGenerate={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
