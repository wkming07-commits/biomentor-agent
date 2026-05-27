"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Minus, Search, Send, Sparkles, User } from "lucide-react";

import { fetchPathwayViaApi } from "@/lib/bioToolApi";
import { buildReactomePathwayUrl, buildReactomeQueryUrl, pathwayCatalog, toCytoscapeElements } from "@/lib/biotools.mjs";

declare global {
  interface Window {
    cytoscape?: any;
  }
}

type PathwayKey = keyof typeof pathwayCatalog;

export default function PathwayPage() {
  const [selectedPathway, setSelectedPathway] = useState<PathwayKey>("cell-cycle");
  const [searchTerm, setSearchTerm] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [cyReady, setCyReady] = useState(false);
  const [status, setStatus] = useState("等待 Cytoscape.js 加载");
  const [apiStatus, setApiStatus] = useState("后端 API 未连接时使用前端示例通路");
  const cyRef = useRef<HTMLDivElement>(null);

  const pathwayKeys = Object.keys(pathwayCatalog) as PathwayKey[];
  const filteredKeys = searchTerm
    ? pathwayKeys.filter((k) => pathwayCatalog[k].name.toLowerCase().includes(searchTerm.toLowerCase()))
    : pathwayKeys;
  const currentPathway = pathwayCatalog[selectedPathway];
  const elements = useMemo(() => toCytoscapeElements(currentPathway), [currentPathway]);

  useEffect(() => {
    let cancelled = false;
    fetchPathwayViaApi(selectedPathway).then((record) => {
      if (cancelled) return;
      setApiStatus(record ? "已连接后端 /api/bio-tools/pathways" : "后端不可用，使用前端示例通路");
    });
    return () => {
      cancelled = true;
    };
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
            width: 74,
            height: 34,
            shape: "round-rectangle",
          },
        },
        { selector: 'node[type = "signal"]', style: { "background-color": "#9ca3af" } },
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
      ],
      layout: { name: "breadthfirst", directed: true, padding: 30, spacingFactor: 1.15 },
      wheelSensitivity: 0.2,
    });
    cy.fit(undefined, 30);
    setStatus("Cytoscape.js 图谱已渲染，可拖拽节点、缩放网络");
    return () => cy.destroy();
  }, [cyReady, elements]);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] flex flex-col px-6 md:px-10 pb-10 font-body">
      <Script
        src="https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setCyReady(true);
          setStatus("Cytoscape.js 已加载");
        }}
        onError={() => setStatus("Cytoscape.js 加载失败，请检查网络")}
      />

      <div className="flex flex-col lg:flex-row flex-1 gap-6" style={{ minHeight: 0 }}>
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={selectedPathway}
                onChange={(e) => setSelectedPathway(e.target.value as PathwayKey)}
                className="pr-8 pl-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all appearance-none"
              >
                {filteredKeys.map((k) => <option key={k} value={k}>{pathwayCatalog[k].name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint pointer-events-none" />
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-faint" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索通路..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all" />
            </div>
            <a href={buildReactomeQueryUrl(currentPathway.name)} target="_blank" rel="noreferrer" className="text-xs text-accent-electric underline">Reactome 搜索</a>
          </div>

          <div className="glass-card flex-1 relative min-h-[480px] overflow-hidden" style={{ background: "#111827" }}>
            <div ref={cyRef} className="absolute inset-0" />
            <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
              <div className="rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">{status}</div>
              <div className="rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">Reactome ID: {currentPathway.reactomeId}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-brand-muted px-1 flex-wrap">
            <span className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3" />激活</span>
            <span className="flex items-center gap-1.5"><Minus className="w-3 h-3 text-[#dc2626]" /><span className="text-[#dc2626]">抑制</span></span>
            <span className="flex items-center gap-1.5"><span className="text-sm font-bold text-[#7c3aed]">⊕</span><span>磷酸化</span></span>
            <a className="ml-auto text-accent-electric underline" href={buildReactomePathwayUrl(currentPathway.reactomeId)} target="_blank" rel="noreferrer">Reactome Content Service</a>
          </div>

          <div className="glass-card overflow-hidden">
            <button onClick={() => setQuizOpen(!quizOpen)} className="w-full p-4 flex items-center justify-between text-left">
              <span className="text-xs font-medium text-brand-ink font-display">{currentPathway.name} 中哪个节点最适合作为干预或诊断切入点？为什么？</span>
              {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-faint" /> : <ChevronDown className="w-4 h-4 text-brand-faint" />}
            </button>
            {quizOpen && <div className="px-4 pb-4"><div className="p-3 rounded-lg text-xs text-brand-muted leading-relaxed font-body" style={{ background: "rgba(37, 99, 235, 0.04)", border: "1px solid rgba(37, 99, 235, 0.1)" }}>可优先选择连接上下游多、且代表检查点/级联放大的节点。例如细胞周期中的 p53/p21 与 CDK4/6，既能解释机制，也能连接药物干预和疾病案例。</div></div>}
          </div>
        </div>

        <div className="flex-[2] glass-card flex flex-col min-w-0">
          <div className="p-4 border-b border-white/60"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(37, 99, 235, 0.1)" }}><Sparkles className="w-3.5 h-3.5 text-accent-electric" /></div><span className="font-display text-sm font-medium text-brand-ink">AI 通路讲解</span></div></div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37, 99, 235, 0.1)" }}><Sparkles className="w-3.5 h-3.5 text-accent-electric" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-brand-faint mb-1">AI 助手</div>
                <div className="text-xs text-brand-ink leading-relaxed whitespace-pre-wrap font-body">当前展示 {currentPathway.name}。学习重点：{currentPathway.focus}。{apiStatus}。页面用 Cytoscape.js 渲染节点-边网络，Reactome Content Service 链接用于后续接真实通路条目、实体和上下游关系。</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(5, 150, 105, 0.1)" }}><User className="w-3.5 h-3.5 text-[#059669]" /></div>
              <div className="flex-1 min-w-0"><div className="text-[11px] text-brand-faint mb-1">你</div><div className="text-xs text-brand-ink leading-relaxed whitespace-pre-wrap font-body">如果这个通路里某个关键节点失活，会影响哪些下游过程？</div></div>
            </div>
            <div className="rounded-xl p-4 bg-white/45 border border-white/60 text-xs text-brand-muted leading-relaxed">
              <div className="font-semibold text-brand-ink mb-2">功能接入状态</div>
              <ul className="space-y-1 list-disc pl-4">
                <li>Cytoscape.js 已作为真实网络可视化引擎接入。</li>
                <li>每个示例通路保留 Reactome ID 与 Content Service 链接。</li>
                <li>下一步可由后端缓存 Reactome API 结果，替换当前教学图谱种子数据。</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-white/60"><div className="flex items-center gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="输入你的问题..." className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all" /><button className="inline-flex items-center justify-center p-2.5 rounded-xl bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200"><Send className="w-4 h-4" /></button></div></div>
        </div>
      </div>
    </div>
  );
}
