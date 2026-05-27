"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Compass, RotateCcw, Sparkles } from "lucide-react";

import { findMindMapNode, findMindMapPath, mindMapRoot, type MindMapNode, type MindMapStatus } from "@/lib/mindmap-data";

const statusStyles: Record<MindMapStatus, { label: string; color: string; bg: string }> = {
  mastered: { label: "已掌握", color: "#2563eb", bg: "rgba(37,99,235,.1)" },
  review: { label: "需复习", color: "#d97706", bg: "rgba(245,158,11,.12)" },
  weak: { label: "薄弱", color: "#e11d48", bg: "rgba(244,63,94,.12)" },
  recommended: { label: "推荐下一步", color: "#059669", bg: "rgba(5,150,105,.12)" },
  new: { label: "未学习", color: "#64748b", bg: "rgba(100,116,139,.1)" },
};

interface PositionedNode {
  node: MindMapNode;
  x: number;
  y: number;
  level: number;
  parentId?: string;
}

export default function MindMapPage() {
  const initialNode = mindMapRoot.children?.[0]?.id || mindMapRoot.id;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([mindMapRoot.id, initialNode]));
  const [selectedId, setSelectedId] = useState(initialNode);

  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("topic");
    const nodeId = topicToNode(topic);
    if (nodeId) {
      setExpanded(new Set([mindMapRoot.id, nodeId]));
      setSelectedId(nodeId);
    }
  }, []);

  const selectedNode = findMindMapNode(selectedId) || mindMapRoot;
  const focusedPath = findMindMapPath(selectedId).map((node) => node.id);
  const positioned = useMemo(() => layoutNodes(expanded), [expanded]);
  const edges = useMemo(() => positioned.filter((item) => item.parentId), [positioned]);

  const toggleNode = (node: MindMapNode) => {
    setSelectedId(node.id);
    if (node.children?.length) {
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(node.id) && node.id !== mindMapRoot.id) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-12 font-body">
      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        <header className="liquid-card p-6 md:p-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="section-title">BioMind Map</p>
            <h1 className="font-display text-3xl md:text-5xl font-black tracking-[-0.05em] text-[#111827]">渐进展开式思维导图</h1>
            <p className="mt-4 max-w-3xl text-brand-muted leading-relaxed">
              初始只展示一级主题，点击节点逐步展开子节点；详细解释、推荐工具和下一步放在右侧面板。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/knowledge-map" className="rounded-2xl bg-white/55 border border-white/80 px-4 py-2.5 text-sm font-bold text-brand-muted hover:text-[#111827]">返回知识图谱</Link>
            <button onClick={() => { setExpanded(new Set([mindMapRoot.id])); setSelectedId(mindMapRoot.id); }} className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-bold text-white">
              <RotateCcw className="w-4 h-4" /> 重置视图
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_360px] gap-6">
          <aside className="liquid-card p-4 h-fit xl:sticky xl:top-24">
            <div className="flex items-center gap-2 mb-4"><Compass className="w-4 h-4 text-accent-electric" /><span className="font-display font-bold text-[#111827]">主题目录</span></div>
            <div className="space-y-2">
              {(mindMapRoot.children || []).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setExpanded(new Set([mindMapRoot.id, topic.id])); setSelectedId(topic.id); }}
                  className={`w-full text-left rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${selectedId === topic.id || focusedPath.includes(topic.id) ? "bg-[#111827] text-white" : "bg-white/45 border border-white/70 text-brand-muted hover:bg-white/80 hover:text-[#111827]"}`}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="liquid-card relative min-h-[660px] overflow-hidden">
            <div className="absolute inset-0 liquid-hero-bg opacity-70" />
            <div className="bio-network" />
            <svg viewBox="0 0 760 660" className="relative z-10 w-full h-full min-h-[660px]">
              <defs>
                <filter id="mind-node-glow"><feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="0.28" /></filter>
              </defs>
              {edges.map((edge) => {
                const parent = positioned.find((item) => item.node.id === edge.parentId);
                if (!parent) return null;
                const active = focusedPath.includes(edge.node.id) && focusedPath.includes(parent.node.id);
                return <line key={`${edge.parentId}-${edge.node.id}`} x1={parent.x} y1={parent.y} x2={edge.x} y2={edge.y} stroke={active ? "#2563eb" : "rgba(100,116,139,.25)"} strokeWidth={active ? 2.5 : 1.3} strokeDasharray={active ? "none" : "5 7"} />;
              })}
              {positioned.map((item) => {
                const active = item.node.id === selectedId;
                const inPath = focusedPath.includes(item.node.id);
                const status = statusStyles[item.node.status];
                const dimmed = focusedPath.length > 1 && !inPath && item.level > 0;
                const width = item.level === 0 ? 150 : item.level === 1 ? 136 : 108;
                const height = item.level === 0 ? 54 : item.level === 1 ? 46 : 38;
                return (
                  <g key={item.node.id} onClick={() => toggleNode(item.node)} className="cursor-pointer" opacity={dimmed ? 0.32 : 1}>
                    <rect x={item.x - width / 2} y={item.y - height / 2} width={width} height={height} rx={height / 2} fill={active ? "#111827" : "rgba(255,255,255,.78)"} stroke={active || inPath ? status.color : "rgba(255,255,255,.95)"} strokeWidth={active ? 3 : 1.5} filter="url(#mind-node-glow)" />
                    <text x={item.x} y={item.y + 4} textAnchor="middle" fill={active ? "#ffffff" : "#111827"} fontSize={item.level === 2 ? 11 : 12} fontWeight="800" fontFamily="system-ui, sans-serif">{item.node.label}</text>
                    {item.node.children?.length ? <circle cx={item.x + width / 2 - 14} cy={item.y - height / 2 + 12} r="5" fill={expanded.has(item.node.id) ? status.color : "#cbd5e1"} /> : null}
                  </g>
                );
              })}
            </svg>
          </main>

          <aside className="liquid-card p-5 h-fit xl:sticky xl:top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ color: statusStyles[selectedNode.status].color, background: statusStyles[selectedNode.status].bg }}><Sparkles className="w-4 h-4" /></div>
              <div><div className="text-[11px] font-bold text-brand-faint">节点详情</div><div className="font-display font-bold text-[#111827]">{selectedNode.label}</div></div>
            </div>
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold mb-4" style={{ color: statusStyles[selectedNode.status].color, background: statusStyles[selectedNode.status].bg }}>{statusStyles[selectedNode.status].label}</span>
            <p className="text-sm text-brand-muted leading-relaxed mb-5">{selectedNode.summary}</p>
            <div className="space-y-4">
              <Panel title="需要掌握">
                <ul className="list-disc pl-4 space-y-1">{selectedNode.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
              </Panel>
              <Panel title="推荐练习">{selectedNode.practice}</Panel>
              <Panel title="下一步">{selectedNode.next}</Panel>
              {selectedNode.tool && (
                <Link href={selectedNode.tool.href} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-bold text-white hover:bg-[#1f2937] transition-all">
                  {selectedNode.tool.label}<ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-3xl bg-white/45 border border-white/70 p-4 text-sm text-brand-muted leading-relaxed"><div className="font-semibold text-[#111827] mb-2">{title}</div>{children}</div>;
}

function layoutNodes(expanded: Set<string>): PositionedNode[] {
  const items: PositionedNode[] = [{ node: mindMapRoot, x: 380, y: 330, level: 0 }];
  const primary = mindMapRoot.children || [];
  primary.forEach((node, index) => {
    const angle = (-90 + (360 / primary.length) * index) * Math.PI / 180;
    const x = 380 + Math.cos(angle) * 210;
    const y = 330 + Math.sin(angle) * 210;
    items.push({ node, x, y, level: 1, parentId: mindMapRoot.id });
    if (expanded.has(node.id) && node.children?.length) {
      const spread = Math.min(90, 18 * node.children.length);
      node.children.forEach((child, childIndex) => {
        const childAngle = (-90 + (360 / primary.length) * index - spread / 2 + (spread / Math.max(1, node.children!.length - 1)) * childIndex) * Math.PI / 180;
        items.push({ node: child, x: x + Math.cos(childAngle) * 104, y: y + Math.sin(childAngle) * 104, level: 2, parentId: node.id });
      });
    }
  });
  return items;
}

function topicToNode(topic: string | null) {
  if (!topic) return null;
  const map: Record<string, string> = {
    "cell-cycle": "pathway-regulation",
    apoptosis: "pathway-regulation",
    mapk: "pathway-regulation",
    glycolysis: "pathway-regulation",
    "dna-repair": "pathway-regulation",
    protein: "protein-structure",
    plasmid: "synthetic-tools",
    sequence: "sequence-design",
  };
  return findMindMapNode(topic)?.id || map[topic] || null;
}
