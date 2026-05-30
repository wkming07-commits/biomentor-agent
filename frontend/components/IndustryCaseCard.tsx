"use client";

import Link from "next/link";
import { ArrowRight, Info, FlaskConical, MessageCircle } from "lucide-react";
import type { IndustryCase } from "@/data/industryCases";

interface IndustryCaseCardProps {
  caseData: IndustryCase;
  onViewDetail?: () => void;
}

const evidenceColors: Record<string, string> = {
  "高": "bg-green-50 text-green-700",
  "中": "bg-amber-50 text-amber-700",
  "发展中": "bg-blue-50 text-blue-700",
};

const abilityColors = [
  "bg-blue-50 text-blue-700",
  "bg-cyan-50 text-cyan-700",
  "bg-teal-50 text-teal-700",
];

export function IndustryCaseCard({ caseData, onViewDetail }: IndustryCaseCardProps) {
  const c = caseData;

  const migrationSummary = [
    c.migrationPath.textbookBase[0],
    c.migrationPath.researchFrontier[0],
    c.migrationPath.industryApplication[0],
  ].join(" → ");

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col group h-full">
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

      <div className="flex flex-wrap gap-1.5 mb-2">
        {c.relatedKnowledgePoints.slice(0, 3).map((kp, i) => (
          <span key={i} className="badge badge-cyan text-[10px]">{kp}</span>
        ))}
      </div>

      <div className="space-y-2 mb-3 flex-1">
        <div className="text-xs text-brand-muted font-body leading-relaxed">
          <span className="font-semibold text-brand-ink">核心问题</span>
          <span className="block mt-0.5 text-[11px] line-clamp-2">{c.coreProblem}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {c.requiredAbilities.slice(0, 3).map((ab, i) => (
          <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${abilityColors[i % abilityColors.length]}`}>
            {ab}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50/50 mb-3">
        <span className="text-[9px] text-brand-faint font-body uppercase tracking-wider shrink-0">知识迁移</span>
        <span className="text-[10px] font-medium text-brand-ink leading-snug truncate">{migrationSummary}</span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-black/5">
        <button
          onClick={onViewDetail}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50/60 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          查看详情
        </button>
        <Link
          href={`/research?caseId=${c.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50/60 ml-auto"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          科研实战
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          href={`/seminar?caseId=${c.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-emerald-50/60"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          学术研讨
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}