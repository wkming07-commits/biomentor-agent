"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Layers3,
  Loader2,
  Network,
  PanelRight,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  findKnowledgeNode,
  getDisciplineById,
  getGalaxyEdges,
  getKnowledgePath,
  knowledgeDisciplines,
} from "@/lib/knowledge-map-data.mjs";
import {
  buildKnowledgeCacheKey,
} from "@/lib/knowledge-ai-types.mjs";
import type {
  KnowledgeAiMode,
  KnowledgeAiRequest,
  KnowledgeAiResponse,
  KnowledgeChildNode,
  KnowledgeDimension,
  KnowledgeDiscipline,
} from "@/lib/knowledge-map-types";

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "center" | "dimension" | "child";
  accent: string;
  summary?: string;
  parentId?: string;
  child?: KnowledgeChildNode;
  dimension?: KnowledgeDimension;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content?: string;
  response?: KnowledgeAiResponse;
}

const initialDisciplineId = "molecular-biology";

gsap.registerPlugin(ScrollTrigger);

export default function KnowledgeMapPage() {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);
  const [activeDisciplineId, setActiveDisciplineId] = useState(initialDisciplineId);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState(initialDisciplineId);
  const [query, setQuery] = useState("");
  const workspaceRef = useRef<HTMLElement>(null);

  const activeDiscipline = useMemo(
    () => getDisciplineById(activeDisciplineId),
    [activeDisciplineId],
  );

  const selectedPath = useMemo(
    () => getKnowledgePath(activeDisciplineId, selectedNodeId),
    [activeDisciplineId, selectedNodeId],
  );

  const selectedNode = useMemo(() => {
    if (selectedNodeId === activeDiscipline.id) return disciplineAsNode(activeDiscipline);
    const found = findKnowledgeNode(activeDisciplineId, selectedNodeId);
    if (!found) return disciplineAsNode(activeDiscipline);
    if ("children" in found) return dimensionAsNode(found as KnowledgeDimension);
    return found as KnowledgeChildNode;
  }, [activeDiscipline, activeDisciplineId, selectedNodeId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".knowledge-galaxy-node",
        { autoAlpha: 0, y: 20, scale: 0.88 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.72, stagger: 0.055, ease: "power3.out" },
      );
      ScrollTrigger.batch(".knowledge-reveal", {
        start: "top 84%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.06,
            ease: "power3.out",
          }),
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  useEffect(() => {
    if (!selectedDisciplineId) return;
    gsap.fromTo(
      ".knowledge-workspace",
      { autoAlpha: 0, y: 32, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.72, ease: "power3.out" },
    );
    gsap.fromTo(
      ".knowledge-workspace .knowledge-reveal",
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.08, ease: "power3.out", delay: 0.08 },
    );
    ScrollTrigger.refresh();
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [selectedDisciplineId, activeDisciplineId]);

  const openDiscipline = (disciplineId: string) => {
    setSelectedDisciplineId(disciplineId);
    setActiveDisciplineId(disciplineId);
    setExpandedDimensionId(null);
    setSelectedNodeId(disciplineId);
  };

  const switchDiscipline = (disciplineId: string) => {
    setActiveDisciplineId(disciplineId);
    setSelectedDisciplineId(disciplineId);
    setExpandedDimensionId(null);
    setSelectedNodeId(disciplineId);
  };

  const selectDimension = (dimension: KnowledgeDimension) => {
    setExpandedDimensionId((current) => (current === dimension.id ? null : dimension.id));
    setSelectedNodeId(dimension.id);
  };

  const filteredDisciplines = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return knowledgeDisciplines;
    return knowledgeDisciplines.filter((discipline) =>
      [discipline.label, discipline.group, discipline.summary]
        .join(" ")
        .toLowerCase()
        .includes(text),
    );
  }, [query]);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] font-body text-[#111827]">
      <section
        className={`relative overflow-hidden px-5 md:px-10 transition-all duration-700 ${
          selectedDisciplineId ? "min-h-[46vh] pb-8" : "min-h-screen pb-16"
        }`}
      >
        <div className="absolute inset-0 liquid-hero-bg" />
        <div className="bio-network" />
        <div className="absolute left-[8%] top-[18%] h-64 w-64 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute right-[10%] top-[20%] h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[8%] left-[40%] h-64 w-64 rounded-full bg-emerald-200/25 blur-3xl" />

        <GalaxyGraph
          activeId={activeDisciplineId}
          compact={Boolean(selectedDisciplineId)}
          onSelect={openDiscipline}
        />

        <div className="pointer-events-none relative z-10 mx-auto flex max-w-7xl flex-col gap-8 pt-10 md:pt-16">
          <div className={`flex items-center ${selectedDisciplineId ? "min-h-[32vh]" : "min-h-[calc(100vh-var(--nav-height)-8rem)]"}`}>
            <div className="knowledge-reveal max-w-2xl translate-y-8 opacity-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                <Network className="h-4 w-4" />
                BioMentor Knowledge Galaxy
              </div>
              <h1 className="mt-6 max-w-3xl font-display text-[clamp(42px,7vw,92px)] font-black leading-[0.94] tracking-[-0.07em] text-[#0f172a]">
                生命科学
                <span className="block bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#10b981] bg-clip-text text-transparent">
                  知识星图
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                先从 12 个生物学科构成的全局网络进入，再平滑过渡到某个学科的六维知识工作台：
                生物大类、基础知识、科研前沿、产业应用、代表文献与学习任务。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => openDiscipline(initialDisciplineId)}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white shadow-[0_18px_44px_rgba(15,23,42,.18)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
                >
                  进入学科工作台
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Link
                  href="/knowledge-map/mindmap"
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-5 py-3 text-sm font-black text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,.75)] transition hover:-translate-y-0.5 hover:bg-white/90"
                >
                  查看旧版思维导图
                  <Layers3 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {selectedDisciplineId && (
            <button
              onClick={() => setSelectedDisciplineId(null)}
              className="pointer-events-auto mx-auto inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回沉浸式星图
            </button>
          )}
        </div>
      </section>

      {selectedDisciplineId && (
        <section
          ref={workspaceRef}
          data-testid="knowledge-workspace"
          className="knowledge-workspace relative z-10 -mt-4 px-5 pb-16 md:px-10"
        >
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-5 flex flex-col gap-4 rounded-[30px] border border-white/80 bg-white/60 p-5 shadow-[0_22px_70px_rgba(67,106,160,.13)] backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  <span>当前路径</span>
                  {selectedPath.map((item, index) => (
                    <span key={item.id} className="inline-flex items-center gap-2">
                      {index > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                      <span className={index === selectedPath.length - 1 ? "text-[#2563eb]" : ""}>
                        {item.label}
                      </span>
                    </span>
                  ))}
                </div>
                <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.05em] text-[#0f172a] md:text-4xl">
                  {activeDiscipline.label}工作台
                </h2>
              </div>
              <div className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索学科，例如结构、生信、免疫"
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[260px_minmax(600px,1fr)_390px]">
              <aside className="knowledge-reveal h-fit rounded-[30px] border border-white/80 bg-white/58 p-4 shadow-[0_18px_58px_rgba(67,106,160,.11)] backdrop-blur-2xl xl:sticky xl:top-24">
                <div className="mb-4 flex items-center gap-2 px-2">
                  <BookOpen className="h-4 w-4 text-[#2563eb]" />
                  <span className="font-display text-sm font-black">12 个学科分支</span>
                </div>
                <div className="space-y-2">
                  {filteredDisciplines.map((discipline) => (
                    <button
                      key={discipline.id}
                      onClick={() => switchDiscipline(discipline.id)}
                      className={`w-full rounded-2xl px-3 py-3 text-left transition-all ${
                        discipline.id === activeDiscipline.id
                          ? "bg-[#111827] text-white shadow-[0_14px_30px_rgba(17,24,39,.18)]"
                          : "border border-white/70 bg-white/46 text-slate-600 hover:bg-white/85 hover:text-[#111827]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black">{discipline.label}</span>
                        {discipline.featured && (
                          <span className="rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black">
                            深做
                          </span>
                        )}
                      </div>
                      <div className={`mt-1 text-[11px] ${discipline.id === activeDiscipline.id ? "text-white/62" : "text-slate-400"}`}>
                        {discipline.group}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              <KnowledgeGraph
                discipline={activeDiscipline}
                expandedDimensionId={expandedDimensionId}
                selectedNodeId={selectedNodeId}
                onSelectCenter={() => setSelectedNodeId(activeDiscipline.id)}
                onSelectDimension={selectDimension}
                onSelectChild={setSelectedNodeId}
              />

              <KnowledgeAIChat
                discipline={activeDiscipline}
                selectedNode={selectedNode}
                selectedPath={selectedPath}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function GalaxyGraph({
  activeId,
  compact,
  onSelect,
}: {
  activeId: string;
  compact: boolean;
  onSelect: (id: string) => void;
}) {
  const edges = getGalaxyEdges();
  const byId = new Map(knowledgeDisciplines.map((item) => [item.id, item]));

  return (
    <div
      data-testid="knowledge-galaxy"
      className={`knowledge-reveal pointer-events-none absolute inset-0 z-[1] w-full translate-y-8 opacity-0 ${
        compact ? "min-h-[430px]" : "min-h-screen"
      }`}
    >
      <div className="absolute inset-[7%] rounded-full bg-white/18 blur-3xl" />
      <div className="absolute right-[4%] top-[11%] h-[56vh] w-[52vw] rounded-full bg-blue-200/25 blur-3xl" />
      <div className="absolute bottom-[7%] left-[32%] h-[42vh] w-[42vw] rounded-full bg-emerald-200/22 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="galaxy-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(37,99,235,.2)" />
            <stop offset="50%" stopColor="rgba(6,182,212,.34)" />
            <stop offset="100%" stopColor="rgba(16,185,129,.16)" />
          </linearGradient>
        </defs>
        {edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          const active = edge.from === activeId || edge.to === activeId;
          const fromPoint = galaxyPoint(from, compact);
          const toPoint = galaxyPoint(to, compact);
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={fromPoint.x}
              y1={fromPoint.y}
              x2={toPoint.x}
              y2={toPoint.y}
              stroke={active ? "rgba(37,99,235,.55)" : "url(#galaxy-line)"}
              strokeWidth={active ? 0.42 : 0.22}
              strokeDasharray={active ? "none" : "1.2 1.5"}
            />
          );
        })}
      </svg>
      <div
        className="absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-white/70 shadow-[0_18px_58px_rgba(37,99,235,.16)] backdrop-blur-xl"
        style={{ left: `${compact ? 50 : 58}%`, top: `${compact ? 50 : 52}%` }}
      >
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Sparkles className="mb-1 h-5 w-5 text-[#2563eb]" />
          <span className="text-xs font-black text-slate-800">BioMentor</span>
          <span className="text-[10px] font-bold text-slate-400">Knowledge Core</span>
        </div>
      </div>
      {knowledgeDisciplines.map((discipline) => {
        const active = discipline.id === activeId;
        const point = galaxyPoint(discipline, compact);
        return (
          <button
            key={discipline.id}
            data-testid={`discipline-${discipline.id}`}
            onClick={() => onSelect(discipline.id)}
            className={`knowledge-galaxy-node pointer-events-auto group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-4 py-3 text-left shadow-[0_14px_42px_rgba(67,106,160,.15)] backdrop-blur-2xl transition-all duration-300 hover:z-20 hover:-translate-y-[calc(50%+4px)] ${
              active
                ? "border-white bg-[#111827] text-white"
                : "border-white/80 bg-white/68 text-slate-700 hover:bg-white"
            }`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              boxShadow: active
                ? `0 18px 48px ${discipline.color}40`
                : "0 14px 42px rgba(67,106,160,.15)",
            }}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: discipline.color, boxShadow: `0 0 18px ${discipline.color}` }}
            />
            <span>
              <span className="block text-xs font-black md:text-sm">{discipline.label}</span>
              <span className={`block text-[10px] font-bold ${active ? "text-white/55" : "text-slate-400"}`}>
                {discipline.group}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function galaxyPoint(
  discipline: Pick<KnowledgeDiscipline, "id" | "x" | "y">,
  compact: boolean,
): { x: number; y: number } {
  if (compact) return { x: discipline.x, y: discipline.y };
  const offsets: Record<string, { x: number; y: number }> = {
    "structural-biology": { x: 3, y: -4 },
    "ecology-evolution": { x: 3, y: 6 },
  };
  const offset = offsets[discipline.id] || { x: 0, y: 0 };
  return {
    x: 28 + discipline.x * 0.74 + offset.x,
    y: 14 + discipline.y * 0.82 + offset.y,
  };
}

function KnowledgeGraph({
  discipline,
  expandedDimensionId,
  selectedNodeId,
  onSelectCenter,
  onSelectDimension,
  onSelectChild,
}: {
  discipline: KnowledgeDiscipline;
  expandedDimensionId: string | null;
  selectedNodeId: string;
  onSelectCenter: () => void;
  onSelectDimension: (dimension: KnowledgeDimension) => void;
  onSelectChild: (id: string) => void;
}) {
  const positioned = useMemo(
    () => layoutWorkspaceNodes(discipline, expandedDimensionId),
    [discipline, expandedDimensionId],
  );
  const byId = new Map(positioned.map((item) => [item.id, item]));
  const selectedPathIds = new Set(getKnowledgePath(discipline.id, selectedNodeId).map((item) => item.id));

  return (
    <main className="knowledge-reveal relative min-h-[720px] overflow-hidden rounded-[34px] border border-white/85 bg-white/50 shadow-[0_24px_80px_rgba(67,106,160,.13)] backdrop-blur-2xl">
      <div className="absolute inset-0 liquid-hero-bg opacity-70" />
      <div className="bio-network opacity-45" />
      <div className="absolute left-8 top-7 z-20 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-black text-slate-500">
        点击维度展开子节点 · 点击子节点让右侧 AI 自动讲解
      </div>
      <button
        onClick={() => {
          onSelectCenter();
        }}
        className="absolute right-8 top-7 z-20 rounded-full bg-[#111827] px-4 py-2 text-xs font-black text-white shadow-[0_14px_30px_rgba(17,24,39,.18)]"
      >
        回到学科中心
      </button>

      <svg viewBox="0 0 780 640" className="relative z-10 h-full min-h-[720px] w-full">
        <defs>
          <filter id="workspace-glow">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodOpacity="0.16" />
          </filter>
        </defs>
        {positioned
          .filter((item) => item.parentId)
          .map((item) => {
            const parent = byId.get(item.parentId || "");
            if (!parent) return null;
            const active = selectedPathIds.has(item.id) || selectedPathIds.has(parent.id);
            return (
              <line
                key={`${item.parentId}-${item.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={item.x}
                y2={item.y}
                stroke={active ? item.accent : "rgba(100,116,139,.23)"}
                strokeWidth={active ? 2.6 : 1.25}
                strokeDasharray={active ? "none" : "7 9"}
              />
            );
          })}
        {positioned.map((item) => {
          const selected = selectedNodeId === item.id;
          const inPath = selectedPathIds.has(item.id);
          const dimmed =
            expandedDimensionId &&
            item.kind === "dimension" &&
            item.id !== expandedDimensionId &&
            selectedNodeId !== item.id;
          const width = item.kind === "center" ? 176 : item.kind === "dimension" ? 132 : 116;
          const height = item.kind === "center" ? 64 : item.kind === "dimension" ? 48 : 40;

          return (
            <g
              key={item.id}
              className="cursor-pointer transition-opacity duration-300"
              opacity={dimmed ? 0.42 : 1}
              onClick={() => {
                if (item.kind === "center") onSelectCenter();
                if (item.kind === "dimension" && item.dimension) onSelectDimension(item.dimension);
                if (item.kind === "child") onSelectChild(item.id);
              }}
            >
              <rect
                x={item.x - width / 2}
                y={item.y - height / 2}
                width={width}
                height={height}
                rx={height / 2}
                fill={selected ? "#111827" : item.kind === "child" ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.72)"}
                stroke={selected || inPath ? item.accent : "rgba(255,255,255,.9)"}
                strokeWidth={selected ? 3 : 1.6}
                filter="url(#workspace-glow)"
              />
              <text
                x={item.x}
                y={item.y + 4}
                textAnchor="middle"
                fill={selected ? "#ffffff" : "#111827"}
                fontSize={item.kind === "child" ? 11 : 13}
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
              >
                {item.label}
              </text>
              {item.kind === "dimension" && (
                <circle
                  cx={item.x + width / 2 - 15}
                  cy={item.y - height / 2 + 12}
                  r="5.5"
                  fill={expandedDimensionId === item.id ? item.accent : "#cbd5e1"}
                />
              )}
            </g>
          );
        })}
      </svg>
    </main>
  );
}

function KnowledgeAIChat({
  discipline,
  selectedNode,
  selectedPath,
}: {
  discipline: KnowledgeDiscipline;
  selectedNode: KnowledgeChildNode;
  selectedPath: Array<{ id: string; label: string; type: string }>;
}) {
  const [mode, setMode] = useState<KnowledgeAiMode>("tutor");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Record<string, ChatMessage[]>>({});
  const endRef = useRef<HTMLDivElement>(null);

  const currentDimension = selectedPath.find((item) => item.type === "dimension");
  const requestContext = useMemo<KnowledgeAiRequest>(
    () => ({
      mode,
      action: "auto_explain",
      discipline: { id: discipline.id, name: discipline.label },
      dimension: currentDimension
        ? { id: currentDimension.id, name: currentDimension.label }
        : null,
      node: {
        id: selectedNode.id,
        name: selectedNode.label,
        summary: selectedNode.summary,
        keyPoints: selectedNode.keyPoints,
        moduleLinks: selectedNode.moduleLinks,
      },
      history: [],
    }),
    [currentDimension, discipline.id, discipline.label, mode, selectedNode],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const cacheKey = buildKnowledgeCacheKey(requestContext);
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setMessages(cached);
      return;
    }

    const controller = new AbortController();
    setMessages([]);
    setIsLoading(true);
    fetch("/api/ai/knowledge-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestContext),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => {
        const response: KnowledgeAiResponse | undefined = result?.data;
        const nextMessages: ChatMessage[] = response
          ? [{ id: `${cacheKey}:assistant`, role: "assistant", response }]
          : [
              {
                id: `${cacheKey}:assistant`,
                role: "assistant",
                content: "这个节点的解释暂时没有生成成功，你可以稍后重试。",
              },
            ];
        cacheRef.current[cacheKey] = nextMessages;
        setMessages(nextMessages);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setMessages([
          {
            id: `${cacheKey}:error`,
            role: "assistant",
            content: "这个节点的解释暂时没有生成成功，你可以稍后重试。",
          },
        ]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [requestContext]);

  const askQuestion = async (question: string) => {
    const text = question.trim();
    if (!text || isLoading) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: text };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMessage].map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content || message.response?.answer || "",
    }));

    try {
      const response = await fetch("/api/ai/knowledge-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestContext, action: "chat", history }),
      });
      const result = await response.json();
      if (result?.data) {
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: "assistant", response: result.data },
        ]);
      } else {
        throw new Error("empty response");
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "这个问题暂时没有回答成功，你可以换一种问法再试。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="knowledge-reveal flex h-[720px] flex-col rounded-[30px] border border-white/85 bg-white/62 p-4 shadow-[0_20px_70px_rgba(67,106,160,.13)] backdrop-blur-2xl xl:sticky xl:top-24">
      <div className="rounded-[24px] border border-white/80 bg-white/70 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111827] text-white">
            <PanelRight className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              当前节点
            </div>
            <div className="font-display text-lg font-black text-[#111827]">{selectedNode.label}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-500">
          {selectedPath.map((item, index) => (
            <span key={item.id} className="inline-flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/60 p-1.5">
        {[
          { id: "tutor", label: "教学导师", icon: GraduationCap },
          { id: "research", label: "科研助手", icon: FlaskConical },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setMode(item.id as KnowledgeAiMode)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
                mode === item.id ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500 hover:text-[#111827]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                message.role === "user"
                  ? "bg-[#2563eb] text-white"
                  : "bg-gradient-to-br from-[#2563eb] to-[#06b6d4] text-white"
              }`}
            >
              {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`${message.role === "user" ? "text-right" : ""} max-w-[86%]`}>
              {message.response ? (
                <AiResponseCard response={message.response} onAsk={askQuestion} />
              ) : (
                <div
                  className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-[#2563eb] text-white"
                      : "rounded-tl-sm bg-white/82 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="relative overflow-hidden rounded-2xl rounded-tl-sm border border-white/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
              <span className="absolute inset-0 -translate-x-full animate-[knowledge-shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-blue-100/80 to-transparent" />
              <span className="relative">BioMentor 正在整理这个节点的学习脉络</span>
              <span className="relative ml-2 inline-flex gap-1 align-middle">
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563eb]" />
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#06b6d4] [animation-delay:120ms]" />
                <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#10b981] [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 border-t border-slate-200/60 pt-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") askQuestion(input);
            }}
            disabled={isLoading}
            placeholder="围绕当前节点继续提问..."
            className="min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:ring-4 focus:ring-blue-100/70 disabled:opacity-60"
          />
          <button
            onClick={() => askQuestion(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111827] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function AiResponseCard({
  response,
  onAsk,
}: {
  response: KnowledgeAiResponse;
  onAsk: (question: string) => void;
}) {
  return (
    <div className="rounded-2xl rounded-tl-sm border border-white/85 bg-white/84 p-4 text-left shadow-sm">
      <h3 className="font-display text-base font-black text-[#111827]">{response.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{response.answer}</p>
      <div className="mt-3 space-y-3">
        <MiniPanel title="关键点" items={response.keyPoints} />
        <MiniPanel title="下一步" items={response.nextSteps} />
      </div>
      {response.moduleLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {response.moduleLinks.map((link, index) => (
            <Link
              key={`${link.href}-${link.label}-${index}`}
              href={link.href}
              className="rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-[#1f2937]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {response.suggestedQuestions.slice(0, 5).map((question) => (
          <button
            key={question}
            onClick={() => onAsk(question)}
            className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-[11px] font-black text-[#2563eb] transition hover:bg-blue-100"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 p-3">
      <div className="mb-1 text-[11px] font-black text-slate-400">{title}</div>
      <ul className="space-y-1 text-xs leading-5 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function layoutWorkspaceNodes(
  discipline: KnowledgeDiscipline,
  expandedDimensionId: string | null,
): PositionedNode[] {
  const center: PositionedNode = {
    id: discipline.id,
    label: discipline.label,
    x: 390,
    y: 320,
    kind: "center",
    accent: discipline.color,
    summary: discipline.summary,
  };
  const nodes: PositionedNode[] = [center];
  const radius = 188;

  discipline.dimensions.forEach((dimension, index) => {
    const angle = (-90 + (360 / discipline.dimensions.length) * index) * Math.PI / 180;
    const x = 390 + Math.cos(angle) * radius;
    const y = 320 + Math.sin(angle) * radius;
    nodes.push({
      id: dimension.id,
      label: dimension.label,
      x,
      y,
      kind: "dimension",
      accent: dimension.accent,
      parentId: discipline.id,
      dimension,
    });

    if (expandedDimensionId === dimension.id) {
      const spread = Math.min(116, 22 * dimension.children.length);
      dimension.children.forEach((child, childIndex) => {
        const divisor = Math.max(1, dimension.children.length - 1);
        const childAngle = (-90 + (360 / discipline.dimensions.length) * index - spread / 2 + (spread / divisor) * childIndex) * Math.PI / 180;
        nodes.push({
          id: child.id,
          label: child.label,
          x: x + Math.cos(childAngle) * 112,
          y: y + Math.sin(childAngle) * 112,
          kind: "child",
          accent: dimension.accent,
          parentId: dimension.id,
          child,
        });
      });
    }
  });

  return nodes;
}

function disciplineAsNode(discipline: KnowledgeDiscipline): KnowledgeChildNode {
  return {
    id: discipline.id,
    label: discipline.label,
    summary: discipline.summary,
    keyPoints: ["学科框架", "核心概念", "前沿应用"],
    importance: "它是进入该生命科学方向的总入口。",
    nextStep: "点击六个维度之一，展开具体知识节点。",
    moduleLinks: [{ label: "进入知识探索", href: "/explore" }],
  };
}

function dimensionAsNode(dimension: KnowledgeDimension): KnowledgeChildNode {
  const seenLinks = new Set<string>();
  const moduleLinks = dimension.children
    .flatMap((child) => child.moduleLinks)
    .filter((link) => {
      const key = `${link.href}-${link.label}`;
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    })
    .slice(0, 3);

  return {
    id: dimension.id,
    label: dimension.label,
    summary: dimension.summary,
    keyPoints: dimension.children.slice(0, 5).map((child) => child.label),
    importance: "这个维度帮助你从特定视角组织学科知识。",
    nextStep: "继续点击该维度下的具体子节点。",
    moduleLinks,
  };
}
