"use client";

import Link from "next/link";
import { BookOpen, FlaskConical, ChevronRight } from "lucide-react";
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
    <div className="glass-card rounded-2xl p-5 flex flex-col group cursor-pointer h-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="badge badge-electric text-[10px]">{c.industryDirection}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidenceColors[c.evidenceLevel] || "bg-gray-50 text-gray-600"}`}>
            {c.evidenceLevel}证据
          </span>
        </div>
        <span className="text-[10px] text-brand-faint font-body">{c.sourceType}</span>
      </div>

      <h3 className="font-display text-base font-bold text-brand-ink mb-1 group-hover:text-blue-600 transition-colors leading-snug">
        {c.title}
      </h3>
      <p className="text-[11px] text-brand-faint font-body mb-3 leading-relaxed">{c.subtitle}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {c.relatedKnowledgePoints.slice(0, 3).map((kp, i) => (
          <span key={i} className="badge badge-cyan text-[10px]">{kp}</span>
        ))}
        {c.relatedKnowledgePoints.length > 3 && (
          <span className="text-[10px] text-brand-faint font-body self-center">
            +{c.relatedKnowledgePoints.length - 3}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <div className="text-xs text-brand-muted font-body leading-relaxed">
          <span className="font-semibold text-brand-ink">核心问题</span>
          <span className="block mt-0.5 text-[11px]">{c.coreProblem}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-[10px] text-brand-faint font-body uppercase tracking-wider">所需能力</span>
        {c.requiredAbilities.map((ab, i) => (
          <span key={i} className="badge badge-amber text-[10px]">{ab}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-black/5">
        <button
          onClick={onViewKnowledge}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50/60 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          关联知识点
        </button>
        <Link
          href="/research"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50/60 ml-auto"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          进入案例
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}