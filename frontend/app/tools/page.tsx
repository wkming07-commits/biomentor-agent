"use client";

import Link from "next/link";
import { Dna, CircleDot, Microscope, GitFork, ChevronRight, Server, ShieldCheck } from "lucide-react";

interface ToolCard {
  href: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  api: string;
  engine: string;
  Icon: typeof Dna;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

const toolCards: ToolCard[] = [
  {
    href: "/tools/protein",
    title: "蛋白结构查看器",
    description: "输入蛋白名、PDB ID 或 UniProt ID，解析 RCSB PDB / AlphaFold DB 结构源，并用 3Dmol.js 渲染三维结构。",
    tags: ["3Dmol.js", "RCSB PDB", "AlphaFold DB"],
    status: "已接入后端解析 + 前端 3D 渲染",
    api: "GET /api/bio-tools/protein/resolve",
    engine: "3Dmol.js + PDB 文件",
    Icon: Dna,
    accentColor: "#2563eb",
    accentBg: "rgba(37, 99, 235, 0.08)",
    accentBorder: "#2563eb",
  },
  {
    href: "/tools/plasmid",
    title: "质粒图谱查看器",
    description: "上传 GenBank / FASTA 文件，解析 FEATURES 坐标，动态生成圆形质粒图谱并解释 ori、抗性基因、启动子等元件。",
    tags: ["GenBank 上传", "Feature 解析", "pLannotate fallback"],
    status: "已接入后端注释 API + 上传解析",
    api: "POST /api/bio-tools/plasmid/annotate",
    engine: "GenBank parser；pLannotate 可部署增强",
    Icon: CircleDot,
    accentColor: "#059669",
    accentBg: "rgba(5, 150, 105, 0.08)",
    accentBorder: "#059669",
  },
  {
    href: "/tools/sequence",
    title: "序列分析工具",
    description: "对 DNA/RNA 序列执行 GC 统计、翻译、引物设计、常见酶切位点检测，并保留 BLAST+ 服务接入口。",
    tags: ["GC / 翻译", "引物设计", "酶切位点"],
    status: "已接入后端序列分析 API",
    api: "POST /api/bio-tools/sequence/analyze",
    engine: "内置分析 fallback；Primer3 / BLAST+ 可部署增强",
    Icon: Microscope,
    accentColor: "#7c3aed",
    accentBg: "rgba(124, 58, 237, 0.08)",
    accentBorder: "#7c3aed",
  },
  {
    href: "/tools/pathway",
    title: "通路知识图谱",
    description: "选择细胞周期、凋亡、MAPK 等通路，用 Cytoscape.js 交互式展示节点-边网络，并链接 Reactome Content Service。",
    tags: ["Cytoscape.js", "Reactome ID", "交互网络"],
    status: "已接入后端通路 API + 图网络渲染",
    api: "GET /api/bio-tools/pathways/{key}",
    engine: "Cytoscape.js + Reactome 链接",
    Icon: GitFork,
    accentColor: "#d97706",
    accentBg: "rgba(217, 119, 6, 0.08)",
    accentBorder: "#d97706",
  },
];

const apiItems = [
  "GET /api/bio-tools/status",
  "GET /api/bio-tools/protein/resolve?query=GFP",
  "POST /api/bio-tools/sequence/analyze",
  "POST /api/bio-tools/plasmid/annotate",
  "GET /api/bio-tools/pathways/cell-cycle",
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="pt-10 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(5,150,105,0.08)] text-[#059669] text-xs font-semibold border border-[#059669]/15 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            BioToolBox v2 已接入：前端交互 + 后端 API + fallback
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-brand-ink">
            生物工具箱
          </h1>
          <p className="mt-2 text-sm md:text-base text-brand-muted font-body max-w-3xl leading-relaxed">
            这不是静态入口页。四个工具已经接入真实交互逻辑：蛋白 3D 结构、质粒文件解析、序列计算分析、通路网络可视化。公网前端会优先调用后端 API，后端不可用时自动降级到浏览器 fallback。
          </p>
        </header>

        <section className="glass-card p-5 border border-white/70">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(37,99,235,0.08)] text-accent-electric flex-shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold text-brand-ink mb-2">后端 API 接入状态</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {apiItems.map((item) => (
                  <code key={item} className="px-3 py-2 rounded-lg bg-white/55 border border-white/70 text-[11px] text-brand-muted overflow-auto">
                    {item}
                  </code>
                ))}
              </div>
              <p className="mt-3 text-xs text-brand-muted leading-relaxed">
                说明：BLAST+、pLannotate、primer3_core、MAFFT 这类服务器二进制工具会在后端运行时检测；未部署时使用 fallback，保证网站可演示且不崩溃。
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toolCards.map((card) => (
            <Link key={card.href} href={card.href} className="group block">
              <div className="glass-card p-6 relative overflow-hidden transition-all duration-200 ease-out h-full" style={{ borderLeft: `4px solid ${card.accentBorder}` }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: card.accentBg }}>
                    <card.Icon className="w-6 h-6" style={{ color: card.accentColor }} />
                  </div>
                  <div className="min-w-0 flex-1 pr-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-[15px] font-semibold text-brand-ink">{card.title}</h3>
                      <span className="shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold bg-[rgba(5,150,105,0.08)] text-[#059669] border border-[#059669]/15">
                        已接入
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed mb-3">{card.description}</p>
                    <div className="space-y-2 mb-3">
                      <div className="text-[11px] text-brand-ink font-semibold">{card.status}</div>
                      <code className="block px-2.5 py-1.5 rounded-md bg-white/55 border border-white/60 text-[11px] text-brand-muted overflow-auto">
                        {card.api}
                      </code>
                      <div className="text-[11px] text-brand-faint">引擎：{card.engine}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.tags.map((tag) => (
                        <span key={tag} className="inline-block px-2.5 py-1 rounded-md text-[12px] font-medium leading-none font-body text-brand-muted" style={{ background: "rgba(13, 13, 26, 0.04)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 transition-all duration-200 ease-out" style={{ color: card.accentColor }}>
                  <ChevronRight className="w-[18px] h-[18px]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
