"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, ChevronRight, FlaskConical, Layers, RotateCw, Search, Sparkles, ZoomIn } from "lucide-react";

import { searchProteinCandidates } from "@/lib/biotools.mjs";

// 3Dmol.js is loaded from CDN for the structure viewer.
declare global {
  interface Window {
    $3Dmol?: any;
  }
}

const suggestions = ["GFP", "Cas9", "4HHB", "P42212", "insulin", "TP53"];
const styles = [
  { key: "cartoon", label: "卡通", icon: Layers },
  { key: "stick", label: "棒状", icon: FlaskConical },
  { key: "sphere", label: "球体", icon: Box },
] as const;

type ViewerStyle = (typeof styles)[number]["key"];

export default function ProteinPage() {
  const [query, setQuery] = useState("GFP");
  const [candidates, setCandidates] = useState(() => searchProteinCandidates("GFP"));
  const [selectedId, setSelectedId] = useState(candidates[0]?.id || "gfp");
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerStatus, setViewerStatus] = useState("正在准备结构查看器");
  const [style, setStyle] = useState<ViewerStyle>("cartoon");
  const viewerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) || candidates[0] || searchProteinCandidates("GFP")[0],
    [candidates, selectedId],
  );

  const handleSearch = (nextQuery = query) => {
    const results = searchProteinCandidates(nextQuery);
    setCandidates(results);
    if (results[0]) setSelectedId(results[0].id);
    setQuery(nextQuery);
  };

  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !window.$3Dmol || !selected?.structureUrl) return;

    let cancelled = false;
    setViewerStatus("正在加载结构文件…");

    async function loadStructure() {
      try {
        const response = await fetch(selected.structureUrl);
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
                <button onClick={() => handleSearch()} className="px-5 py-3 rounded-2xl bg-[#111827] text-white text-sm font-bold hover:bg-[#1f2937] transition-all">
                  搜索结构
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
                    key={`${candidate.id}-${candidate.pdbId}-${candidate.accession}`}
                    onClick={() => setSelectedId(candidate.id)}
                    className={`w-full text-left rounded-2xl border p-3 transition-all ${
                      selected.id === candidate.id
                        ? "bg-[#111827] text-white border-[#111827]"
                        : "bg-white/45 border-white/70 text-brand-muted hover:bg-white/75"
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{candidate.label}</div>
                    <div className={`mt-1 text-[11px] ${selected.id === candidate.id ? "text-white/70" : "text-brand-faint"}`}>{candidate.organism}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span>{candidate.sourceKind === "experimental" ? "实验结构" : candidate.sourceKind === "predicted" ? "预测结构" : "精选示例"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </aside>

              <section className="space-y-4 min-w-0">
                <div className="glass-card relative overflow-hidden min-h-[500px]" style={{ backgroundColor: "#111827" }}>
                  <div ref={viewerRef} className="absolute inset-0" />
                  <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                    <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">{viewerStatus}</div>
                    <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">PDB: {selected.pdbId || "预测模型"}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={() => setViewerStatus("可用鼠标左键拖拽旋转，滚轮缩放结构")} className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-brand-muted hover:bg-white/60 hover:text-[#111827] transition-all">
                    <RotateCw className="w-4 h-4" /> 旋转提示
                  </button>
                  <button onClick={() => setViewerStatus("滚轮或触控板可缩放结构；双击可聚焦结构区域")} className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-brand-muted hover:bg-white/60 hover:text-[#111827] transition-all">
                    <ZoomIn className="w-4 h-4" /> 缩放提示
                  </button>
                  {styles.map((btn) => {
                    const Icon = btn.icon;
                    return (
                      <button key={btn.key} onClick={() => setStyle(btn.key)} className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm transition-all ${style === btn.key ? "bg-[#111827] text-white" : "text-brand-muted hover:bg-white/60 hover:text-[#111827]"}`}>
                        <Icon className="w-4 h-4" /> {btn.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </main>

          <aside className="liquid-card p-5 xl:sticky xl:top-24 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
              <div>
                <div className="font-display font-bold text-[#111827]">结构学习解释</div>
                <div className="text-[11px] text-brand-faint">{selected.sourceKind === "experimental" ? "实验结构" : "预测/精选结构"}</div>
              </div>
            </div>
            <h2 className="font-display text-2xl font-black tracking-[-0.04em] text-[#111827] mb-2">{selected.label}</h2>
            <div className="space-y-3 text-sm text-brand-muted leading-relaxed">
              <p><span className="font-semibold text-[#111827]">物种：</span>{selected.organism}</p>
              <p><span className="font-semibold text-[#111827]">学习重点：</span>{selected.teachingFocus}</p>
              <p><span className="font-semibold text-[#111827]">怎么看：</span>先观察整体折叠，再切换显示样式查看局部残基、结构域和可能的功能区域。</p>
            </div>
            <div className="mt-5 rounded-3xl bg-white/45 border border-white/70 p-4 text-sm leading-relaxed text-brand-muted">
              <div className="font-semibold text-[#111827] mb-2">理解问题</div>
              这个蛋白的三维结构中，哪些区域可能与功能、结合或催化相关？如果换成预测结构，你会如何判断哪些区域更可信？
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
