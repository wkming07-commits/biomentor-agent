"use client";

import { useEffect, useState } from "react";
import { Clock, Brain, CalendarDays, AlertTriangle, TrendingUp, Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface DiagnosisProfile {
  totalHours?: number; masteryRate?: number; activeDays?: number;
  radarData: { name: string; value: number }[];
  weakPoints: { topic: string; mastery: number; color: string }[];
  recommendations: { title: string; description: string; href: string }[];
}

const PY = "http://localhost:8000";

export default function DiagnosisPage() {
  const [data, setData] = useState<DiagnosisProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PY}/api/diagnosis/profile/1`)
      .then(r => r.json())
      .then(d => {
        // Map backend data to UI format
        const abilityProfile = d.ability_profile || d;
        setData({
          totalHours: 128.5,
          masteryRate: Math.round((abilityProfile.mastery_level || 0.75) * 100),
          activeDays: 42,
          radarData: [
            { name: "分子生物学", value: abilityProfile.molecular_biology || 78 },
            { name: "基因工程", value: abilityProfile.genetic_engineering || 65 },
            { name: "蛋白质科学", value: abilityProfile.protein_science || 82 },
            { name: "代谢工程", value: abilityProfile.metabolic_engineering || 58 },
            { name: "细胞生物学", value: abilityProfile.cell_biology || 71 },
            { name: "生物信息学", value: abilityProfile.bioinformatics || 45 },
          ],
          weakPoints: (abilityProfile.weak_points && abilityProfile.weak_points.length > 0
            ? abilityProfile.weak_points.map((w: { topic?: string; name?: string; mastery?: number }, i: number) => ({
                topic: w.topic || w.name || "未知",
                mastery: w.mastery || 40 + i * 10,
                color: ["#f43f5e", "#f59e0b", "#f43f5e", "#f59e0b", "#f43f5e"][i] || "#f43f5e",
              }))
            : [
                { topic: "CRISPR-Cas9机制", mastery: 40, color: "#f43f5e" },
                { topic: "质粒设计", mastery: 55, color: "#f59e0b" },
                { topic: "代谢通路调控", mastery: 48, color: "#f43f5e" },
                { topic: "RNA干扰机制", mastery: 62, color: "#f59e0b" },
                { topic: "蛋白质表达系统", mastery: 50, color: "#f43f5e" },
              ]),
          recommendations: (abilityProfile.recommendations && abilityProfile.recommendations.length > 0
            ? abilityProfile.recommendations.map((r: { title?: string; label?: string; description?: string; reason?: string; href?: string }, i: number) => ({
                title: r.title || r.label || "推荐学习",
                description: r.description || r.reason || "基于你的薄弱环节推荐",
                href: r.href || ["/explore", "/knowledge-map", "/research", "/tools"][i] || "/explore",
              }))
            : [
                { title: "CRISPR系统深度学习", description: "从sgRNA设计到PAM识别，系统理解基因编辑原理", href: "/explore" },
                { title: "质粒载体设计实践", description: "在序列工具中分析pET载体元件", href: "/tools/sequence" },
                { title: "代谢通路可视化", description: "用通路图谱工具跟踪代谢流", href: "/tools/pathway" },
                { title: "文献研读训练", description: "选择2篇前沿文献进行实验思路分析", href: "/paper-workbench" },
              ]),
        });
      })
      .catch(() => {
        // Fallback to demo data if backend unavailable
        setData({
          radarData: [
            { name: "分子生物学", value: 78 }, { name: "基因工程", value: 65 },
            { name: "蛋白质科学", value: 82 }, { name: "代谢工程", value: 58 },
            { name: "细胞生物学", value: 71 }, { name: "生物信息学", value: 45 },
          ],
          weakPoints: [
            { topic: "CRISPR-Cas9机制", mastery: 40, color: "#f43f5e" },
            { topic: "质粒设计", mastery: 55, color: "#f59e0b" },
            { topic: "代谢通路调控", mastery: 48, color: "#f43f5e" },
            { topic: "RNA干扰机制", mastery: 62, color: "#f59e0b" },
            { topic: "蛋白质表达系统", mastery: 50, color: "#f43f5e" },
          ],
          recommendations: [
            { title: "CRISPR系统深度学习", description: "从sgRNA设计到PAM识别", href: "/explore" },
            { title: "质粒载体设计实践", description: "分析pET载体元件", href: "/tools/sequence" },
            { title: "代谢通路可视化", description: "用通路图谱工具跟踪代谢流", href: "/tools/pathway" },
            { title: "文献研读训练", description: "选择前沿文献进行实验思路分析", href: "/paper-workbench" },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const priorityConfig: Record<string, { color: string; label: string }> = {
    "0": { color: "#f43f5e", label: "紧急" },
    "1": { color: "#f59e0b", label: "重要" },
    "2": { color: "#2563eb", label: "一般" },
    default: { color: "#2563eb", label: "一般" },
  };

  if (loading) return <div className="min-h-screen pt-[var(--nav-height)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-electric" /></div>;
  if (!data) return null;

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-10">
          <h1 className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>学习诊断中心</h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-xl mx-auto">基于你的学习数据，AI 分析薄弱环节并推荐学习路径</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Clock className="w-5 h-5" />, label: "学习时长", value: `${data.totalHours || 128.5}h`, color: "#2563eb" },
            { icon: <TrendingUp className="w-5 h-5" />, label: "掌握率", value: `${data.masteryRate || 76}%`, color: "#059669" },
            { icon: <CalendarDays className="w-5 h-5" />, label: "活跃天数", value: `${data.activeDays || 42}天`, color: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="stat-number text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-brand-faint">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-brand-ink mb-4">能力雷达</h2>
            <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto">
              {data.radarData.map((d, i) => {
                const angle = (2 * Math.PI * i) / data.radarData.length - Math.PI / 2;
                const r = (d.value / 100) * 120;
                const x = 140 + r * Math.cos(angle);
                const y = 140 + r * Math.sin(angle);
                return <circle key={d.name} cx={x} cy={y} r="4" fill="#2563eb" />;
              })}
              {data.radarData.map((d, i) => {
                const angle = (2 * Math.PI * i) / data.radarData.length - Math.PI / 2;
                const r = (d.value / 100) * 120;
                const x = 140 + r * Math.cos(angle);
                const y = 140 + r * Math.sin(angle);
                const labelAngle = angle * (180 / Math.PI);
                const lx = 140 + (r + 20) * Math.cos(angle);
                const ly = 140 + (r + 20) * Math.sin(angle);
                return <text key={`l-${d.name}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#4a4a6a" fontFamily="system-ui">{d.name}</text>;
              })}
              {[40, 80, 120].map((r) => (
                <circle key={r} cx="140" cy="140" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              ))}
              {data.radarData.map((d, i) => {
                const angle = (2 * Math.PI * i) / data.radarData.length - Math.PI / 2;
                return <line key={`axis-${i}`} x1="140" y1="140" x2={140 + 120 * Math.cos(angle)} y2={140 + 120 * Math.sin(angle)} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />;
              })}
              <polygon
                points={data.radarData.map((d, i) => {
                  const angle = (2 * Math.PI * i) / data.radarData.length - Math.PI / 2;
                  const r = (d.value / 100) * 120;
                  return `${140 + r * Math.cos(angle)},${140 + r * Math.sin(angle)}`;
                }).join(" ")}
                fill="rgba(37,99,235,0.15)" stroke="#2563eb" strokeWidth="2"
              />
            </svg>
          </div>

          {/* Weak points */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-brand-ink mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-accent-rose" />薄弱环节</h2>
            <div className="space-y-3">
              {data.weakPoints.map((w, i) => (
                <div key={w.topic} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-brand-ink w-36 truncate">{w.topic}</span>
                  <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w.mastery}%`, backgroundColor: w.color }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: w.color }}>{w.mastery}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8">
          <h2 className="section-heading mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-accent-amber" />AI 学习建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.map((r, i) => (
              <Link key={i} href={r.href} className="glass-card rounded-2xl p-5 flex items-start gap-4 hover:border-accent-electric/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-brand-ink/5 flex items-center justify-center shrink-0 group-hover:bg-accent-electric/10 transition-colors">
                  <ArrowRight className="w-4 h-4 text-accent-electric" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-brand-ink mb-1">{r.title}</h3>
                  <p className="text-xs text-brand-muted leading-relaxed">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
