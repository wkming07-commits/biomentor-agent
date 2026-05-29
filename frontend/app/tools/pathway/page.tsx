"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  FileUp,
  GitBranch,
  Loader2,
  Minus,
  Network,
  Search,
  Sparkles,
} from "lucide-react";

import {
  buildReactomePathwayUrl,
  getPathwayLearningPath,
  pathwayCatalog,
  toCytoscapeElements,
} from "@/lib/biotools.mjs";
import BioMentorToolChat from "@/components/BioMentorToolChat";
import type { ToolContextSummary } from "@/lib/tool-ai-types";

declare global {
  interface Window {
    cytoscape?: any;
  }
}

type PathwayKey = keyof typeof pathwayCatalog;
type Selection =
  | { kind: "node"; id: string; label: string; nodeType: string }
  | { kind: "edge"; id: string; source: string; target: string; label: string; interaction: string };

type PathwayCandidate = {
  id: string;
  name: string;
  species: string;
  source: "local" | "reactome";
  description: string;
  localKey?: string;
  reactomeUrl?: string;
};

const DEFAULT_LOCAL_KEY: PathwayKey = "cell-cycle";

export default function PathwayPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<PathwayCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeLocalKey, setActiveLocalKey] = useState<PathwayKey>(DEFAULT_LOCAL_KEY);
  const [activeReactomeCandidate, setActiveReactomeCandidate] = useState<PathwayCandidate | null>(null);
  const [cyReady, setCyReady] = useState(false);
  const [status, setStatus] = useState("正在准备通路图谱");
  const [selection, setSelection] = useState<Selection | null>(null);
  const cyRef = useRef<HTMLDivElement>(null);

  const isLocalActive = activeReactomeCandidate === null;
  const currentPathway = pathwayCatalog[activeLocalKey];
  const elements = useMemo(() => toCytoscapeElements(currentPathway), [currentPathway]);
  const learningPath = useMemo(() => getPathwayLearningPath(activeLocalKey), [activeLocalKey]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/bio-tools/pathway/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      } else {
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleSelectCandidate = useCallback((candidate: PathwayCandidate) => {
    setSelection(null);
    if (candidate.source === "local" && candidate.localKey && pathwayCatalog[candidate.localKey as PathwayKey]) {
      setActiveLocalKey(candidate.localKey as PathwayKey);
      setActiveReactomeCandidate(null);
    } else {
      setActiveReactomeCandidate(candidate);
    }
  }, []);

  useEffect(() => {
    setSelection(null);
  }, [activeLocalKey, activeReactomeCandidate]);

  useEffect(() => {
    if (!cyReady || !cyRef.current || !window.cytoscape || !isLocalActive) return;

    cyRef.current.innerHTML = "";
    const cy = window.cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#2563eb",
            color: "#ffffff",
            "font-size": 12,
            "font-weight": 700,
            "text-valign": "center",
            "text-halign": "center",
            width: 78,
            height: 36,
            shape: "round-rectangle",
            "border-width": 1,
            "border-color": "rgba(255,255,255,0.2)",
          },
        },
        { selector: 'node[type = "signal"]', style: { "background-color": "#94a3b8" } },
        { selector: 'node[type = "inhibitor"]', style: { "background-color": "#dc2626" } },
        { selector: 'node[type = "process"]', style: { "background-color": "#059669" } },
        { selector: 'node[type = "metabolite"]', style: { "background-color": "#f59e0b" } },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 9,
            color: "#cbd5e1",
          },
        },
        {
          selector: 'edge[interaction = "inhibition"]',
          style: { "line-color": "#dc2626", "target-arrow-shape": "tee", "target-arrow-color": "#dc2626" },
        },
        {
          selector: 'edge[interaction = "phosphorylation"]',
          style: { "line-color": "#7c3aed", "target-arrow-color": "#7c3aed" },
        },
        { selector: ".dimmed", style: { opacity: 0.18 } },
        {
          selector: ".focused",
          style: {
            "border-width": 3,
            "border-color": "#ffffff",
            "background-color": "#0ea5e9",
            "line-color": "#38bdf8",
            "target-arrow-color": "#38bdf8",
            width: 4,
          },
        },
        {
          selector: ".neighbor",
          style: { opacity: 1, "border-width": 2, "border-color": "rgba(255,255,255,0.75)" },
        },
      ],
      layout: { name: "breadthfirst", directed: true, padding: 34, spacingFactor: 1.12 },
      wheelSensitivity: 0.2,
    });

    cy.on("tap", "node", (event: any) => {
      const node = event.target;
      cy.elements().removeClass("dimmed focused neighbor");
      cy.elements().addClass("dimmed");
      node.removeClass("dimmed").addClass("focused");
      node.predecessors().removeClass("dimmed").addClass("neighbor");
      node.successors().removeClass("dimmed").addClass("neighbor");
      setSelection({
        kind: "node",
        id: node.id(),
        label: node.data("label"),
        nodeType: node.data("type") || "node",
      });
    });

    cy.on("tap", "edge", (event: any) => {
      const edge = event.target;
      cy.elements().removeClass("dimmed focused neighbor");
      cy.elements().addClass("dimmed");
      edge.removeClass("dimmed").addClass("focused");
      edge.source().removeClass("dimmed").addClass("neighbor");
      edge.target().removeClass("dimmed").addClass("neighbor");
      setSelection({
        kind: "edge",
        id: edge.id(),
        source: edge.source().data("label"),
        target: edge.target().data("label"),
        label: edge.data("label"),
        interaction: edge.data("interaction"),
      });
    });

    cy.on("tap", (event: any) => {
      if (event.target === cy) {
        cy.elements().removeClass("dimmed focused neighbor");
        setSelection(null);
      }
    });

    cy.fit(undefined, 30);
    setStatus("图谱已渲染：点击节点或关系查看解释");
    return () => cy.destroy();
  }, [cyReady, elements, isLocalActive]);

  const aiContext = useMemo<ToolContextSummary>(() => {
    const pathwayName = activeReactomeCandidate
      ? activeReactomeCandidate.name
      : currentPathway?.name ?? "";

    const subtitle = activeReactomeCandidate
      ? activeReactomeCandidate.species
      : currentPathway?.focus
        ? `教学重点：${currentPathway.focus}`
        : "";

    const sourceLabel = activeReactomeCandidate ? "公共通路候选" : "精选教学图谱";

    let selectedItemLabel = "整体通路";
    if (selection) {
      if (selection.kind === "node") {
        selectedItemLabel = `节点：${selection.label}`;
      } else if (selection.kind === "edge") {
        selectedItemLabel = `关系：${selection.source} → ${selection.target}`;
      }
    }

    const facts: { label: string; value: string }[] = [
      { label: "通路", value: pathwayName },
      { label: "当前选择", value: selectedItemLabel },
    ];

    if (!activeReactomeCandidate && currentPathway?.focus) {
      facts.push({ label: "学习重点", value: currentPathway.focus });
    }

    const highlights: string[] = [];
    if (currentPathway?.focus) {
      highlights.push(currentPathway.focus);
    }

    const warnings: string[] = [];
    if (activeReactomeCandidate) {
      warnings.push("该候选来自公共通路数据库，尚未整理为教学图谱");
    }

    return {
      title: pathwayName,
      subtitle,
      sourceLabel,
      selectedItemLabel,
      facts,
      highlights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }, [activeReactomeCandidate, currentPathway, selection]);

  const contextKey = useMemo(() => {
    const base = activeReactomeCandidate?.id ?? activeLocalKey ?? "default";
    const sel = selection ? `${selection.kind}-${selection.id}` : "overview";
    return `${base}-${sel}`;
  }, [activeLocalKey, activeReactomeCandidate, selection]);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-12 font-body">
      <Script
        src="https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setCyReady(true);
          setStatus("通路图谱引擎已准备好");
        }}
        onError={() => setStatus("通路图谱加载失败，请检查网络后重试")}
      />

      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        <header className="liquid-card p-6 md:p-8">
          <Link
            href="/tools"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回工具箱
          </Link>
          <p className="section-title">Pathway Graph</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">
            通路知识图谱
          </h1>
          <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
            搜索通路名称（如 MAPK、凋亡、糖酵解），选择精选教学图谱或公共通路候选，点击节点或边查看调控关系，并可跳转到思维导图整理学习结构。
          </p>
          <Link
            href="/seminar?source=通路图谱工具&topic=信号通路机制与证据链答辩&summary=围绕通路节点、上下游调控、激活/抑制关系、实验验证和应用风险展开答辩。"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <FileUp className="h-4 w-4" />
            带入答辩
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="搜索通路，如 MAPK、凋亡、糖酵解…"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm bg-white/65 border border-white/90 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-5 py-3 rounded-2xl bg-[#111827] text-white text-sm font-bold hover:bg-[#1f2937] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      搜索中
                    </>
                  ) : (
                    "搜索通路"
                  )}
                </button>
              </div>

              {candidates.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-bold text-brand-faint mb-2">搜索结果</div>
                  {candidates.map((candidate) => {
                    const isActive =
                      (candidate.source === "local" &&
                        candidate.localKey === activeLocalKey &&
                        !activeReactomeCandidate) ||
                      (candidate.source === "reactome" &&
                        candidate.id === activeReactomeCandidate?.id);
                    return (
                      <button
                        key={candidate.id}
                        onClick={() => handleSelectCandidate(candidate)}
                        className={`w-full text-left rounded-2xl border p-3 transition-all flex items-start justify-between gap-3 ${
                          isActive
                            ? "bg-[#111827] text-white border-[#111827]"
                            : "bg-white/45 border-white/70 text-brand-muted hover:bg-white/75"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-display text-sm font-bold truncate">{candidate.name}</div>
                          <div className={`mt-1 text-[11px] ${isActive ? "text-white/70" : "text-brand-faint"}`}>
                            {candidate.species}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                              candidate.source === "local"
                                ? isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-accent-electric/10 text-accent-electric"
                                : isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {candidate.source === "local" ? "精选教学图谱" : "公共候选"}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/60" : ""}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {hasSearched && !searchLoading && candidates.length === 0 && (
                <div className="mt-4 rounded-3xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm leading-7 text-amber-900">
                  暂未找到候选。可以尝试英文全称或常用缩写，例如 PI3K、Wnt、Notch、TCA、JAK-STAT、TGF-beta、NF-kB。
                </div>
              )}
            </div>

            {isLocalActive ? (
              <>
                <div className="glass-card relative min-h-[540px] overflow-hidden" style={{ background: "#111827" }}>
                  <div ref={cyRef} className="absolute inset-0" />
                  <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                    <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">
                      {status}
                    </div>
                    <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">
                      {currentPathway.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-brand-muted px-1 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3" />激活
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Minus className="w-3 h-3 text-[#dc2626]" />
                    <span className="text-[#dc2626]">抑制</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#7c3aed]">⊕</span>
                    <span>磷酸化</span>
                  </span>
                  <a
                    className="ml-auto text-accent-electric underline"
                    href={buildReactomePathwayUrl(currentPathway.reactomeId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    通路来源
                  </a>
                </div>
              </>
            ) : (
              <div className="liquid-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#111827]">公共通路候选</div>
                    <div className="text-[11px] text-brand-faint">{activeReactomeCandidate?.species}</div>
                  </div>
                </div>
                <h2 className="font-display text-2xl font-black tracking-[-0.04em] text-[#111827]">
                  {activeReactomeCandidate?.name}
                </h2>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {activeReactomeCandidate?.description}
                </p>
                <div className="rounded-3xl bg-amber-50/60 border border-amber-200/60 p-4 text-sm text-brand-muted leading-relaxed">
                  <div className="font-semibold text-[#111827] mb-2">提示</div>
                  该候选来自公共通路数据库，当前先展示候选详情与 AI 机制解释；若需要高质量教学图，请选择内置精选通路。
                </div>
                {activeReactomeCandidate?.reactomeUrl && (
                  <a
                    href={activeReactomeCandidate.reactomeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-electric underline"
                  >
                    在 Reactome 中查看 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </main>

          <aside className="space-y-4 xl:sticky xl:top-24 h-fit">
            <div className="liquid-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-[#111827]">机制解释</span>
              </div>
              <h2 className="font-display text-2xl font-black text-[#111827] tracking-[-0.04em] mb-2">
                {selection ? selectionTitle(selection) : (activeReactomeCandidate?.name ?? currentPathway.name)}
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                {selection
                  ? selectionDescription(selection, isLocalActive ? currentPathway.name : (activeReactomeCandidate?.name ?? ""))
                  : activeReactomeCandidate
                    ? activeReactomeCandidate.description
                    : `学习重点：${currentPathway.focus}。点击图上的节点或边，可以查看该节点的上下游和调控关系。`}
              </p>
              {isLocalActive && !activeReactomeCandidate && (
                <div className="mt-4 rounded-3xl bg-white/45 border border-white/70 p-4 text-sm text-brand-muted leading-relaxed">
                  <div className="font-semibold text-[#111827] mb-2">引导问题</div>
                  如果这个节点被激活、抑制或突变，会影响哪些下游过程？这种变化可以如何通过实验观察？
                </div>
              )}
            </div>

            {isLocalActive && (
              <div className="liquid-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="w-4 h-4 text-accent-electric" />
                  <span className="font-display font-bold text-[#111827]">推荐学习路径</span>
                </div>
                <div className="space-y-3">
                  {learningPath.map((step, index) => (
                    <div key={step.id} className="rounded-2xl bg-white/45 border border-white/70 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-[#111827] text-white text-[11px] font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-[#111827] text-sm">{step.label}</span>
                      </div>
                      <p className="text-xs text-brand-muted leading-relaxed">{step.reason}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/knowledge-map/mindmap?topic=${activeLocalKey}`}
                  className="mt-4 inline-flex items-center gap-2 w-full justify-center rounded-2xl bg-[#111827] px-4 py-3 text-sm font-bold text-white hover:bg-[#1f2937] transition-all"
                >
                  <Network className="w-4 h-4" /> 查看思维导图
                </Link>
              </div>
            )}

            <BioMentorToolChat
              tool="pathway"
              title="通路知识图谱"
              context={aiContext}
              contextKey={contextKey}
              emptyState="搜索并选择一条通路，或点击图谱中的节点/边，BioMentor AI 将为您生成机制讲解。"
              quickQuestions={[
                "这条通路的核心调控节点有哪些？",
                "如何通过实验验证这条通路的激活或抑制？",
                "该通路异常与哪些疾病或表型相关？",
              ]}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function selectionTitle(selection: Selection) {
  if (selection.kind === "node") return selection.label;
  return `${selection.source} → ${selection.target}`;
}

function selectionDescription(selection: Selection, pathwayName: string) {
  if (selection.kind === "node") {
    if (selection.nodeType === "process")
      return `${selection.label} 是 ${pathwayName} 的输出或过程节点，适合连接表型、疾病和实验观察。`;
    if (selection.nodeType === "signal")
      return `${selection.label} 是上游信号，理解它可以帮助判断通路为何被启动。`;
    if (selection.nodeType === "inhibitor")
      return `${selection.label} 具有抑制或检查点作用，常用于解释负调控和干预策略。`;
    return `${selection.label} 是 ${pathwayName} 中的关键节点，请结合高亮的上下游关系理解其调控位置。`;
  }
  const action =
    selection.interaction === "inhibition"
      ? "抑制"
      : selection.interaction === "phosphorylation"
        ? "磷酸化调控"
        : "激活";
  return `这条边表示 ${selection.source} 对 ${selection.target} 的${action}关系。观察边的方向可以判断信号从哪里来、传到哪里去。`;
}
