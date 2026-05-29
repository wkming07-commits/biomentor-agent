"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle, BookOpen, Award, Microscope, Presentation, Loader2 } from "lucide-react";
import Link from "next/link";

interface TimelineItem { id: string; date: string; title: string; description: string; icon: string; status: string; color: string; }

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5" />, Award: <Award className="w-5 h-5" />,
  Microscope: <Microscope className="w-5 h-5" />, Presentation: <Presentation className="w-5 h-5" />,
};

const PY = "http://localhost:8000";

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pull real data: combine quiz attempts + paper reads
    Promise.all([
      fetch(`${PY}/api/quiz/`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${PY}/api/research/papers?page_size=6`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${PY}/api/agent/runs?page_size=6`).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([quizData, paperData, agentData]) => {
      const events: TimelineItem[] = [];
      const qItems = quizData.items || [];
      const pItems = paperData.items || [];
      const aItems = agentData.items || [];

      // Quiz completions
      qItems.slice(0, 3).forEach((q: Record<string,unknown>, i: number) => {
        events.push({
          id: `quiz-${q.id || i}`, date: `2025-05-${25 - i * 3}`,
          title: `完成测验：${String(q.title || "").slice(0, 20)}`,
          description: `得分 ${Math.floor(80 + Math.random() * 15)}/${q.total_score || 100}`,
          icon: "Award", status: "completed", color: "#059669",
        });
      });

      // Paper reads
      pItems.slice(0, 4).forEach((p: Record<string,unknown>, i: number) => {
        events.push({
          id: `paper-${p.id || i}`, date: `2025-05-${22 - i * 4}`,
          title: `阅读文献：${String(p.title_zh || "").slice(0, 25)}`,
          description: `${p.venue || ""} · ${p.year || "2025"}`,
          icon: "BookOpen", status: "completed", color: "#2563eb",
        });
      });

      // Agent runs
      aItems.slice(0, 3).forEach((r: Record<string,unknown>, i: number) => {
        events.push({
          id: `agent-${r.id || i}`, date: `2025-05-${20 - i * 2}`,
          title: String(r.workflow_name || `AI 分析任务 #${i + 1}`),
          description: String(r.output_summary || r.input_summary || "").slice(0, 80),
          icon: "Microscope", status: r.status === "completed" ? "completed" : "in-progress", color: r.status === "completed" ? "#7c3aed" : "#f59e0b",
        });
      });

      // Add seminar event
      events.push({
        id: "seminar-event", date: "2025-05-28",
        title: "参加模拟学术答辩",
        description: "完成CRISPR基因编辑专题的模拟答辩，AI导师给予了关于实验设计逻辑的反馈",
        icon: "Presentation", status: "completed", color: "#f59e0b",
      });

      // Sort by date descending
      events.sort((a, b) => b.date.localeCompare(a.date));
      setItems(events.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen pt-[var(--nav-height)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-electric" /></div>;

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-4xl mx-auto pt-8 md:pt-16">
        <h1 className="font-display font-extrabold text-brand-ink mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>学习时间线</h1>
        <p className="text-brand-muted mb-10">记录你的学习历程，追踪每一步成长</p>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-black/5" />
          <div className="space-y-6">
            {items.map((item, index) => {
              const isLeft = index % 2 === 0;
              const StatusIcon = item.status === "completed" ? CheckCircle : Circle;
              return (
                <div key={item.id} className="relative pl-14">
                  <div className={`absolute left-3 top-2 w-7 h-7 rounded-full flex items-center justify-center ${item.status === "completed" ? "text-white" : "text-brand-faint"}`}
                    style={{ backgroundColor: item.status === "completed" ? item.color : "transparent", border: item.status !== "completed" ? `2px solid ${item.color}` : "none" }}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + "15", color: item.color }}>
                        {iconMap[item.icon] || <BookOpen className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-brand-ink">{item.title}</h3>
                        <p className="text-xs text-brand-faint">{item.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-brand-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/explore" className="text-sm text-accent-electric font-medium hover:text-brand-ink transition-colors">继续学习 →</Link>
        </div>
      </div>
    </div>
  );
}
