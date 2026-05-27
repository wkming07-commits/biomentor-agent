"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Box,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
  RotateCw,
  Search,
  SendHorizonal,
  ZoomIn,
} from "lucide-react";

import { resolveProteinViaApi } from "@/lib/bioToolApi";
import { resolveProteinQuery } from "@/lib/biotools.mjs";

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

const suggestions = ["CRISPR-Cas9", "GFP", "胰岛素", "血红蛋白", "4HHB", "P42212"];
const styles = [
  { key: "cartoon", label: "卡通", icon: Layers },
  { key: "stick", label: "棒状", icon: FlaskConical },
  { key: "sphere", label: "球体", icon: Box },
] as const;

export default function ProteinPage() {
  const [proteinName, setProteinName] = useState("GFP");
  const [activeQuery, setActiveQuery] = useState("GFP");
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerStatus, setViewerStatus] = useState("等待 3Dmol.js 加载");
  const [apiStatus, setApiStatus] = useState("后端 API 未连接时使用前端备用解析");
  const [apiProtein, setApiProtein] = useState<Record<string, unknown> | null>(null);
  const [style, setStyle] = useState<(typeof styles)[number]["key"]>("cartoon");
  const [chatInput, setChatInput] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const fallbackProtein = useMemo(() => resolveProteinQuery(activeQuery), [activeQuery]);
  const protein = useMemo(
    () => ({
      ...fallbackProtein,
      label: String(apiProtein?.label || fallbackProtein.label),
      accession: String(apiProtein?.accession || fallbackProtein.accession),
      pdbId: String(apiProtein?.pdb_id || fallbackProtein.pdbId),
      source: String(apiProtein?.source || fallbackProtein.source),
      organism: String(apiProtein?.organism || fallbackProtein.organism),
      confidence:
        typeof apiProtein?.confidence === "number"
          ? apiProtein.confidence
          : fallbackProtein.confidence,
      teachingFocus: String(apiProtein?.teaching_focus || fallbackProtein.teachingFocus),
      structureUrl: String(apiProtein?.structure_url || fallbackProtein.structureUrl),
      alphaFoldUrl: String(apiProtein?.alphafold_url || fallbackProtein.alphaFoldUrl),
      alphaFoldApiUrl: String(apiProtein?.alphafold_api_url || fallbackProtein.alphaFoldApiUrl),
    }),
    [apiProtein, fallbackProtein],
  );

  useEffect(() => {
    let cancelled = false;
    resolveProteinViaApi(activeQuery).then((record) => {
      if (cancelled) return;
      if (record) {
        setApiProtein(record);
        setApiStatus("已连接后端 /api/bio-tools/protein/resolve");
      } else {
        setApiProtein(null);
        setApiStatus("后端不可用，使用前端备用解析");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !window.$3Dmol) return;

    let cancelled = false;
    setViewerStatus(`正在从 ${protein.source} 加载结构...`);

    async function loadStructure() {
      try {
        const response = await fetch(protein.structureUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const pdbText = await response.text();
        if (cancelled || !viewerRef.current || !window.$3Dmol) return;

        viewerRef.current.innerHTML = "";
        const viewer = window.$3Dmol.createViewer(viewerRef.current, {
          backgroundColor: "#111827",
        });
        viewer.addModel(pdbText, "pdb");
        viewer.setStyle({}, { [style]: { color: "spectrum" } });
        viewer.zoomTo();
        viewer.render();
        setViewerStatus("结构已加载，可拖拽旋转、滚轮缩放");
      } catch (error) {
        setViewerStatus(`结构加载失败：${error instanceof Error ? error.message : "未知错误"}`);
      }
    }

    loadStructure();
    return () => {
      cancelled = true;
    };
  }, [protein.structureUrl, protein.source, style, viewerReady]);

  const aiExplanation = `${protein.label}（${protein.organism}）当前使用 ${protein.source} 结构源。教学重点：${protein.teachingFocus}。网页端通过 3Dmol.js 读取 PDB 文件并渲染三维结构；同时保留 AlphaFold DB 链接用于讲解预测结构和 pLDDT 置信度。`;

  return (
    <div className="min-h-screen pt-[var(--nav-height)] flex flex-col px-6 md:px-10 pb-10 font-body">
      <Script
        src="https://3Dmol.org/build/3Dmol-min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setViewerReady(true);
          setViewerStatus("3Dmol.js 已加载");
        }}
        onError={() => setViewerStatus("3Dmol.js 加载失败，请检查网络")}
      />

      <div className="flex flex-col lg:flex-row flex-1 gap-6" style={{ minHeight: 0 }}>
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint" />
              <input
                type="text"
                placeholder="输入蛋白名、UniProt ID 或 PDB ID"
                value={proteinName}
                onChange={(e) => setProteinName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setActiveQuery(proteinName);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all"
              />
            </div>
            <button
              onClick={() => setActiveQuery(proteinName)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200"
            >
              查看结构
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setProteinName(s);
                  setActiveQuery(s);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-brand-muted bg-white/40 border border-white/50 hover:bg-white/70 hover:border-accent-electric/20 transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="glass-card relative overflow-hidden flex-shrink-0" style={{ minHeight: 460, backgroundColor: "#111827" }}>
            <div ref={viewerRef} className="absolute inset-0" />
            <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
              <div className="rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">
                {viewerStatus}
              </div>
              <div className="rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">
                3Dmol.js / PDB
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-1 flex-wrap">
            <button
              onClick={() => setViewerStatus("可用鼠标左键拖拽旋转，滚轮缩放")}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-brand-muted hover:text-brand-ink hover:bg-white/50 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px]">旋转</span>
            </button>
            <button
              onClick={() => setViewerStatus("滚轮或触控板可缩放结构")}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-brand-muted hover:text-brand-ink hover:bg-white/50 transition-all"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-[10px]">缩放</span>
            </button>
            {styles.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.key}
                  onClick={() => setStyle(btn.key)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${style === btn.key ? "bg-brand-ink text-white" : "text-brand-muted hover:text-brand-ink hover:bg-white/50"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <span className="font-display text-sm font-semibold text-brand-ink">{protein.label}</span>
              <span className="badge badge-electric">{protein.source}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-brand-muted">
              <span>UniProt: <span className="stat-number text-accent-electric">{protein.accession || "—"}</span></span>
              <span>PDB: <span className="stat-number text-accent-electric">{protein.pdbId || "—"}</span></span>
              <span>置信度: <span className="stat-number text-[#059669]">{protein.confidence ?? "—"}</span></span>
              <a className="text-accent-electric underline" href={protein.structureUrl} target="_blank" rel="noreferrer">结构文件</a>
            </div>
          </div>
        </div>

        <div className="flex-[2] glass-card flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/60">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
              <Bot className="w-4 h-4 text-accent-electric" />
            </div>
            <span className="font-display text-sm font-semibold text-brand-ink">AI 智能体讲解</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 0 }}>
            <div className="max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[rgba(13,13,26,0.04)] text-brand-ink border-bottom-left-radius-6">
              {aiExplanation}
            </div>
            <div className="rounded-xl p-4 bg-white/45 border border-white/60 text-xs text-brand-muted leading-relaxed">
              <div className="font-semibold text-brand-ink mb-2">接入说明</div>
              <ul className="space-y-1 list-disc pl-4">
                <li>{apiStatus}</li>
                <li>优先使用 RCSB PDB 实验结构；输入 UniProt 时回退到 AlphaFold DB 文件地址。</li>
                <li>页面直接加载 3Dmol.js，在浏览器中渲染 PDB，不需要 Java 插件。</li>
                <li>后续可把结构域/活性位点标注交给后端 RAG 或 UniProt 注释补全。</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-white/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="输入你的问题..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all"
              />
              <button className="inline-flex items-center justify-center p-2.5 rounded-xl bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200">
                <SendHorizonal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card mt-4 overflow-hidden">
        <button onClick={() => setQuizOpen(!quizOpen)} className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium hover:bg-white/30 transition-colors text-brand-ink">
          <span>验证理解</span>
          {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
        </button>
        {quizOpen && (
          <div className="px-6 pb-5 text-sm text-brand-muted leading-relaxed">
            当前结构源是 <b>{protein.source}</b>。请比较：实验 PDB 结构更适合讨论配体/复合物证据；AlphaFold 预测结构更适合讨论单蛋白折叠和 pLDDT 置信度。
          </div>
        )}
      </div>
    </div>
  );
}
