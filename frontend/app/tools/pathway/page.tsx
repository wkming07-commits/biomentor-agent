"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, GitBranch, Minus, Network, Search, Send, Sparkles } from "lucide-react";

import { buildReactomePathwayUrl, buildReactomeQueryUrl, getPathwayLearningPath, pathwayCatalog, toCytoscapeElements } from "@/lib/biotools.mjs";

declare global {
  interface Window {
    cytoscape?: any;
  }
}

type PathwayKey = keyof typeof pathwayCatalog;
type Selection =
  | { kind: "node"; id: string; label: string; nodeType: string }
  | { kind: "edge"; id: string; source: string; target: string; label: string; interaction: string };

export default function PathwayPage() {
  const [selectedPathway, setSelectedPathway] = useState<PathwayKey>("cell-cycle");
  const [searchTerm, setSearchTerm] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [cyReady, setCyReady] = useState(false);
  const [status, setStatus] = useState("正在准备通路图谱");
  const [selection, setSelection] = useState<Selection | null>(null);
  const cyRef = useRef<HTMLDivElement>(null);

  const pathwayKeys = Object.keys(pathwayCatalog) as PathwayKey[];
  const filteredKeys = searchTerm
    ? pathwayKeys.filter((key) => pathwayCatalog[key].name.toLowerCase().includes(searchTerm.toLowerCase()))
    : pathwayKeys;
  const currentPathway = pathwayCatalog[selectedPathway];
  const elements = useMemo(() => toCytoscapeElements(currentPathway), [currentPathway]);
  const learningPath = useMemo(() => getPathwayLearningPath(selectedPathway), [selectedPathway]);

  useEffect(() => {
    setSelection(null);
  }, [selectedPathway]);

  useEffect(() => {
    if (!cyReady || !cyRef.current || !window.cytoscape) return;
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
        { selector: 'edge[interaction = "inhibition"]', style: { "line-color": "#dc2626", "target-arrow-shape": "tee", "target-arrow-color": "#dc2626" } },
        { selector: 'edge[interaction = "phosphorylation"]', style: { "line-color": "#7c3aed", "target-arrow-color": "#7c3aed" } },
        { selector: ".dimmed", style: { opacity: 0.18 } },
        { selector: ".focused", style: { "border-width": 3, "border-color": "#ffffff", "background-color": "#0ea5e9", "line-color": "#38bdf8", "target-arrow-color": "#38bdf8", width: 4 } },
        { selector: ".neighbor", style: { opacity: 1, "border-width": 2, "border-color": "rgba(255,255,255,0.75)" } },
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
      setSelection({ kind: "node", id: node.id(), label: node.data("label"), nodeType: node.data("type") || "node" });
    });

    cy.on("tap", "edge", (event: any) => {
      const edge = event.target;
      cy.elements().removeClass("dimmed focused neighbor");
      cy.elements().addClass("dimmed");
      edge.removeClass("dimmed").addClass("focused");
      edge.source().removeClass("dimmed").addClass("neighbor");
      edge.target().removeClass("dimmed").addClass("neighbor");
      setSelection({ kind: "edge", id: edge.id(), source: edge.source().data("label"), target: edge.target().data("label"), label: edge.data("label"), interaction: edge.data("interaction") });
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
  }, [cyReady, elements]);

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
          <p className="section-title">Pathway Graph</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">通路知识图谱</h1>
          <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
            点击节点或边，查看上下游、调控关系和推荐学习路径，并可跳转到思维导图整理学习结构。
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <main className="space-y-4 min-w-0">
            <div className="liquid-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative">
                <select value={selectedPathway} onChange={(event) => setSelectedPathway(event.target.value as PathwayKey)} className="w-full md:w-64 pr-9 pl-4 py-3 rounded-2xl text-sm bg-white/65 border border-white/90 text-brand-ink outline-none appearance-none">
                  {filteredKeys.map((key) => <option key={key} value={key}>{pathwayCatalog[key].name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint pointer-events-none" />
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-faint" />
                <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索通路…" className="w-full pl-9 pr-4 py-3 rounded-2xl text-sm bg-white/65 border border-white/90 text-brand-ink placeholder:text-brand-faint outline-none" />
              </div>
              <a href={buildReactomeQueryUrl(currentPathway.name)} target="_blank" rel="noreferrer" className="text-xs font-bold text-accent-electric underline">查看 Reactome</a>
            </div>

            <div className="glass-card relative min-h-[540px] overflow-hidden" style={{ background: "#111827" }}>
              <div ref={cyRef} className="absolute inset-0" />
              <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">{status}</div>
                <div className="rounded-2xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">{currentPathway.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[12px] text-brand-muted px-1 flex-wrap">
              <span className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3" />激活</span>
              <span className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-[#dc2626]" /><span className="text-[#dc2626]">抑制</span></span>
              <span className="flex items-center gap-1.5"><span className="text-sm font-bold text-[#7c3aed]">⊕</span><span>磷酸化</span></span>
              <a className="ml-auto text-accent-electric underline" href={buildReactomePathwayUrl(currentPathway.reactomeId)} target="_blank" rel="noreferrer">通路来源</a>
            </div>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-24 h-fit">
            <div className="liquid-card p-5">
              <div className="flex items-center gap-2 mb-4"><div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div><span className="font-display font-bold text-[#111827]">机制解释</span></div>
              <h2 className="font-display text-2xl font-black text-[#111827] tracking-[-0.04em] mb-2">{selection ? selectionTitle(selection) : currentPathway.name}</h2>
              <p className="text-sm text-brand-muted leading-relaxed">{selection ? selectionDescription(selection, currentPathway.name) : `学习重点：${currentPathway.focus}。点击图上的节点或边，可以查看该节点的上下游和调控关系。`}</p>
              <div className="mt-4 rounded-3xl bg-white/45 border border-white/70 p-4 text-sm text-brand-muted leading-relaxed">
                <div className="font-semibold text-[#111827] mb-2">引导问题</div>
                如果这个节点被激活、抑制或突变，会影响哪些下游过程？这种变化可以如何通过实验观察？
              </div>
            </div>

            <div className="liquid-card p-5">
              <div className="flex items-center gap-2 mb-4"><GitBranch className="w-4 h-4 text-accent-electric" /><span className="font-display font-bold text-[#111827]">推荐学习路径</span></div>
              <div className="space-y-3">
                {learningPath.map((step, index) => (
                  <div key={step.id} className="rounded-2xl bg-white/45 border border-white/70 p-3">
                    <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-full bg-[#111827] text-white text-[11px] font-black flex items-center justify-center">{index + 1}</span><span className="font-bold text-[#111827] text-sm">{step.label}</span></div>
                    <p className="text-xs text-brand-muted leading-relaxed">{step.reason}</p>
                  </div>
                ))}
              </div>
              <Link href={`/knowledge-map/mindmap?topic=${selectedPathway}`} className="mt-4 inline-flex items-center gap-2 w-full justify-center rounded-2xl bg-[#111827] px-4 py-3 text-sm font-bold text-white hover:bg-[#1f2937] transition-all">
                <Network className="w-4 h-4" /> 查看思维导图
              </Link>
            </div>

            <div className="liquid-card p-4 flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="输入你的问题…" className="flex-1 px-4 py-2.5 rounded-2xl text-sm bg-white/60 border border-white/80 outline-none" />
              <button className="p-2.5 rounded-2xl bg-[#111827] text-white"><Send className="w-4 h-4" /></button>
            </div>
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
    if (selection.nodeType === "process") return `${selection.label} 是 ${pathwayName} 的输出或过程节点，适合连接表型、疾病和实验观察。`;
    if (selection.nodeType === "signal") return `${selection.label} 是上游信号，理解它可以帮助判断通路为何被启动。`;
    if (selection.nodeType === "inhibitor") return `${selection.label} 具有抑制或检查点作用，常用于解释负调控和干预策略。`;
    return `${selection.label} 是 ${pathwayName} 中的关键节点，请结合高亮的上下游关系理解其调控位置。`;
  }
  const action = selection.interaction === "inhibition" ? "抑制" : selection.interaction === "phosphorylation" ? "磷酸化调控" : "激活";
  return `这条边表示 ${selection.source} 对 ${selection.target} 的${action}关系。观察边的方向可以判断信号从哪里来、传到哪里去。`;
}
