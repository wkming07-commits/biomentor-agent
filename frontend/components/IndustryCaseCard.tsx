"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, FlaskConical, ChevronRight } from "lucide-react";
import type { IndustryCase } from "@/data/industryCases";

interface IndustryCaseCardProps {
  caseData: IndustryCase;
  onViewKnowledge?: () => void;
}

const evidenceColors: Record<string, string> = {
  "高": "bg-green-50 text-green-700",
  "中": "bg-amber-50 text-amber-700",
  "发展中": "bg-blue-50 text-blue-700",
};

export function IndustryCaseCard({ caseData, onViewKnowledge }: IndustryCaseCardProps) {
  const c = caseData;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group cursor-pointer h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="badge badge-electric">{c.industryDirection}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidenceColors[c.evidenceLevel] || "bg-gray-50 text-gray-600"}`}>
            {c.evidenceLevel}证据
          </span>
          <ArrowUpRight className="w-4 h-4 text-brand-muted group-hover:text-accent-electric transition-colors opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      <h3 className="font-display text-lg font-bold text-brand-ink mb-1 group-hover:text-accent-electric transition-colors">
        {c.title}
      </h3>
      <p className="text-xs text-brand-faint font-body mb-3">{c.subtitle}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {c.relatedKnowledgePoints.slice(0, 4).map((kp, i) => (
          <span key={i} className="badge badge-cyan text-[10px]">{kp}</span>
        ))}
        {c.relatedKnowledgePoints.length > 4 && (
          <span className="badge bg-brand-ink/5 text-brand-faint text-[10px]">
            +{c.relatedKnowledgePoints.length - 4}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <div className="text-xs text-brand-muted font-body leading-relaxed">
          <span className="font-semibold text-brand-ink">核心问题：</span>
          {c.coreProblem}
        </div>
        <div className="text-xs text-brand-muted font-body leading-relaxed">
          <span className="font-semibold text-brand-ink">应用价值：</span>
          {c.applicationValue.length > 80 ? c.applicationValue.slice(0, 80) + "..." : c.applicationValue}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] text-brand-faint font-body uppercase tracking-wider">来源：</span>
        <span className="text-[10px] font-semibold text-brand-muted">{c.sourceType}</span>
      </div>

      <div className="flex items-center gap-1 mb-4">
        <span className="text-[10px] text-brand-faint font-body uppercase tracking-wider">能力：</span>
        {c.requiredAbilities.map((ab, i) => (
          <span key={i} className="badge badge-amber text-[10px]">{ab}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-black/5">
        <button
          onClick={onViewKnowledge}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-accent-electric transition-colors py-1.5 px-3 rounded-lg hover:bg-accent-electric/5 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          查看关联知识点
        </button>
        <Link
          href="/research"
          className="flex items-center gap-1.5 text-xs font-medium text-accent-electric hover:text-accent-electric/80 transition-colors py-1.5 px-3 rounded-lg hover:bg-accent-electric/5 ml-auto"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          进入科研实战
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}