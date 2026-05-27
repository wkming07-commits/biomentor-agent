"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Info,
  Move,
  ChevronRight,
} from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  domain: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

const domains = [
  { name: "分子生物学", color: "#2563eb", label: "分子生物学 (blue)" },
  { name: "细胞生物学", color: "#10b981", label: "细胞生物学 (green)" },
  { name: "生物工程", color: "#f59e0b", label: "生物工程 (amber)" },
];

const nodes: GraphNode[] = [
  { id: "mol-bio", label: "分子生物学", x: 400, y: 60, r: 36, color: "#2563eb", domain: "分子生物学" },
  { id: "gene-edit", label: "基因编辑", x: 280, y: 160, r: 30, color: "#2563eb", domain: "分子生物学" },
  { id: "crispr", label: "CRISPR", x: 180, y: 260, r: 28, color: "#2563eb", domain: "分子生物学" },
  { id: "protein", label: "蛋白质工程", x: 520, y: 160, r: 30, color: "#2563eb", domain: "分子生物学" },
  { id: "cell-bio", label: "细胞生物学", x: 620, y: 280, r: 34, color: "#10b981", domain: "细胞生物学" },
  { id: "synthetic", label: "合成生物学", x: 400, y: 340, r: 32, color: "#10b981", domain: "细胞生物学" },
  { id: "metabolic", label: "代谢工程", x: 300, y: 420, r: 30, color: "#f59e0b", domain: "生物工程" },
  { id: "bioinfo", label: "生物信息学", x: 560, y: 400, r: 28, color: "#f59e0b", domain: "生物工程" },
];

const edges: GraphEdge[] = [
  { from: "mol-bio", to: "gene-edit" },
  { from: "mol-bio", to: "protein" },
  { from: "gene-edit", to: "crispr" },
  { from: "gene-edit", to: "synthetic" },
  { from: "protein", to: "synthetic" },
  { from: "crispr", to: "metabolic" },
  { from: "synthetic", to: "metabolic" },
  { from: "synthetic", to: "bioinfo" },
  { from: "cell-bio", to: "synthetic" },
  { from: "cell-bio", to: "bioinfo" },
  { from: "metabolic", to: "bioinfo" },
  { from: "mol-bio", to: "cell-bio" },
];

export default function KnowledgeMapPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getColor = (domain: string) => {
    switch (domain) {
      case "分子生物学":
        return "#2563eb";
      case "细胞生物学":
        return "#10b981";
      case "生物工程":
        return "#f59e0b";
      default:
        return "#4a4a6a";
    }
  };

  const getEdgePath = (from: GraphNode, to: GraphNode) => {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-10">
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            知识图谱浏览
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-xl mx-auto">
            可视化浏览生物学科知识体系，探索概念之间的联系与层级关系
          </p>
          <Link
            href="/knowledge-map/mindmap"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(17,24,39,0.16)] hover:bg-[#1f2937] transition-all"
          >
            打开渐进式思维导图
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-4 md:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-muted" />
                  <span className="text-xs text-brand-muted font-body">
                    点击节点探索知识 · 拖拽平移 · 滚轮缩放
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleZoomOut}
                    className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4 text-brand-ink" />
                  </button>
                  <span className="text-xs font-mono text-brand-muted w-10 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4 text-brand-ink" />
                  </button>
                  <button
                    onClick={() => {
                      setScale(1);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer ml-2"
                  >
                    <Share2 className="w-4 h-4 text-brand-ink" />
                  </button>
                </div>
              </div>

              <div
                className="relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                  background: "#1a1a2e",
                  height: "clamp(380px, 50vw, 520px)",
                  userSelect: "none",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <svg
                  viewBox="0 0 800 520"
                  className="w-full h-full"
                  style={{
                    transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <defs>
                    <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-green" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-amber" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    <filter id="node-shadow">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {nodes.map((node) => (
                    <circle
                      key={`glow-${node.id}`}
                      cx={node.x}
                      cy={node.y}
                      r={node.r * 2.2}
                      fill={
                        node.color === "#2563eb"
                          ? "url(#glow-blue)"
                          : node.color === "#10b981"
                            ? "url(#glow-green)"
                            : "url(#glow-amber)"
                      }
                      style={{ pointerEvents: "none" }}
                    />
                  ))}

                  {edges.map((edge, i) => {
                    const from = nodes.find((n) => n.id === edge.from);
                    const to = nodes.find((n) => n.id === edge.to);
                    if (!from || !to) return null;
                    const isHighlighted =
                      selectedNode === edge.from || selectedNode === edge.to;
                    return (
                      <line
                        key={`edge-${i}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={
                          isHighlighted
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(255,255,255,0.12)"
                        }
                        strokeWidth={isHighlighted ? 2 : 1}
                        strokeDasharray={isHighlighted ? "none" : "4 4"}
                        style={{ transition: "all 0.3s ease" }}
                      />
                    );
                  })}

                  {nodes.map((node) => {
                    const isSelected = selectedNode === node.id;
                    const isHovered = hoveredNode === node.id;
                    const isDimmed =
                      selectedNode &&
                      selectedNode !== node.id &&
                      !edges.some(
                        (e) =>
                          (e.from === selectedNode && e.to === node.id) ||
                          (e.to === selectedNode && e.from === node.id)
                      );

                    return (
                      <g
                        key={node.id}
                        onClick={() =>
                          setSelectedNode(
                            selectedNode === node.id ? null : node.id
                          )
                        }
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                          cursor: "pointer",
                          opacity: isDimmed ? 0.3 : 1,
                          transition: "opacity 0.3s ease",
                        }}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r}
                          fill={node.color}
                          stroke={
                            isSelected || isHovered
                              ? "#ffffff"
                              : "rgba(255,255,255,0.2)"
                          }
                          strokeWidth={isSelected || isHovered ? 3 : 1.5}
                          filter="url(#node-shadow)"
                          style={{ transition: "all 0.25s ease" }}
                        />
                        <text
                          x={node.x}
                          y={node.y + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight={isSelected || isHovered ? "700" : "500"}
                          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                          style={{
                            pointerEvents: "none",
                            transition: "all 0.25s ease",
                          }}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/30 font-body">
                    拖拽查看完整图谱
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h3 className="font-display font-bold text-sm text-brand-ink mb-4">
                图例
              </h3>
              <div className="space-y-3 mb-6">
                {domains.map((domain) => (
                  <div
                    key={domain.name}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/[0.02] transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="text-sm font-body text-brand-muted">
                      {domain.label}
                    </span>
                  </div>
                ))}
              </div>

              {selectedNodeData && (
                <div className="pt-4 border-t border-black/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColor(selectedNodeData.domain),
                      }}
                    />
                    <h4 className="font-display font-bold text-sm text-brand-ink">
                      {selectedNodeData.label}
                    </h4>
                  </div>
                  <p className="text-xs text-brand-muted font-body leading-relaxed mb-3">
                    属于{selectedNodeData.domain}领域，点击相关节点查看知识关联。
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium text-accent-electric">
                    <span>查看详细知识</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {!selectedNode && (
                <div className="pt-4 border-t border-black/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-brand-muted" />
                    <span className="text-xs font-semibold font-body text-brand-muted">
                      操作提示
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted/70 font-body leading-relaxed">
                    点击图谱中的节点可以查看该知识领域的详细信息。拖拽鼠标可以平移视图，使用滚轮或缩放按钮可以放大/缩小。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
