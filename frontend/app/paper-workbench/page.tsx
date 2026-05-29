"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  FlaskConical,
  FileText,
  GraduationCap,
  BookOpen,
  Sparkles,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import {
  getSelectedPapers,
  getSelectedPapersByCategory,
  buildPaperLearningPlan,
  buildDefenseOutlineFromSelectedPapers,
  buildResearchTasksFromSelectedPapers,
  removeSelectedPaper,
  clearSelectedPapers,
} from "@/lib/selectedPapers";
import { getPaperById } from "@/data/knowledgeBase";
import type { SelectedPaperItem, PaperLearningPlan, KnowledgeResearchTask } from "@/lib/knowledgeTypes";

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  "实验学习": { label: "实验学习", icon: <FlaskConical className="w-4 h-4" /> },
  "答辩材料": { label: "答辩材料", icon: <FileText className="w-4 h-4" /> },
  "科研任务": { label: "科研任务", icon: <GraduationCap className="w-4 h-4" /> },
  "知识图谱": { label: "知识图谱", icon: <BookOpen className="w-4 h-4" /> },
  "研读清单": { label: "研读清单", icon: <BookOpen className="w-4 h-4" /> },
};

const categoryColors: Record<string, string> = {
  "实验学习": "accent-electric",
  "答辩材料": "accent-amber",
  "科研任务": "accent-cyan",
  "知识图谱": "accent-electric",
  "研读清单": "accent-rose",
};

export default function PaperWorkbenchPage() {
  const [selectedPapers, setSelectedPapers] = useState<SelectedPaperItem[]>([]);
  const [grouped, setGrouped] = useState<ReturnType<typeof getSelectedPapersByCategory>>({});
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [learningPlans, setLearningPlans] = useState<Record<string, PaperLearningPlan>>({});
  const [defenseOutline, setDefenseOutline] = useState<string[] | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<KnowledgeResearchTask[]>([]);
  const [showTasks, setShowTasks] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const papers = getSelectedPapers();
    setSelectedPapers(papers);
    setGrouped(getSelectedPapersByCategory());
  };

  const handleRemove = (paperId: string) => {
    removeSelectedPaper(paperId);
    refreshData();
  };

  const handleClearAll = () => {
    clearSelectedPapers();
    refreshData();
    setDefenseOutline(null);
    setGeneratedTasks([]);
    setLearningPlans({});
    setExpandedPlan(null);
  };

  const handleGeneratePlan = (paperId: string) => {
    if (expandedPlan === paperId) {
      setExpandedPlan(null);
      return;
    }
    const plan = buildPaperLearningPlan(paperId);
    if (plan) {
      setLearningPlans((prev) => ({ ...prev, [paperId]: plan }));
      setExpandedPlan(paperId);
    }
  };

  const handleGenerateDefense = () => {
    const paperIds = selectedPapers.map((p) => p.paperId);
    const outline = buildDefenseOutlineFromSelectedPapers(paperIds);
    setDefenseOutline(outline);
  };

  const handleGenerateTasks = () => {
    const paperIds = selectedPapers.map((p) => p.paperId);
    const tasks = buildResearchTasksFromSelectedPapers(paperIds);
    setGeneratedTasks(tasks);
    setShowTasks(true);
  };

  const categoryKeys = Object.keys(grouped);

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-5">
            <Bookmark className="w-3 h-3" />
            Paper Workbench
          </div>
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            文献工作台
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-xl mx-auto">
            管理已选文献，生成实验学习路径、答辩提纲和科研任务
          </p>
        </div>

        {/* 操作栏 */}
        {selectedPapers.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={handleGenerateDefense}
              className="btn-hero cursor-pointer inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              生成答辩提纲
            </button>
            <button
              onClick={handleGenerateTasks}
              className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              生成科研任务
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-accent-rose hover:bg-accent-rose/5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              清空全部
            </button>
          </div>
        )}

        {/* 空状态 */}
        {selectedPapers.length === 0 && (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-brand-faint/30 mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold text-brand-ink mb-2">
              尚未选择文献
            </h2>
            <p className="text-sm text-brand-muted font-body mb-6 max-w-md mx-auto">
              前往知识探索或知识图谱页面，搜索你感兴趣的主题，在文献卡片上点击「加入实验学习」「加入答辩材料」「加入研读清单」即可将文献添加到这里。
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/explore"
                className="btn-hero cursor-pointer inline-flex items-center gap-2"
              >
                前往知识探索
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/knowledge-map"
                className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
              >
                前往知识图谱
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 按用途分组 */}
        {categoryKeys.length > 0 && (
          <div className="space-y-8 mb-12">
            {categoryKeys.map((cat) => {
              const papers = grouped[cat];
              const catInfo = categoryLabels[cat] || { label: cat, icon: <Bookmark className="w-4 h-4" /> };
              const accentColor = categoryColors[cat] || "accent-electric";
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-xl bg-${accentColor}/10 flex items-center justify-center`}>
                      {catInfo.icon}
                    </div>
                    <h2 className="font-display text-lg font-bold text-brand-ink">
                      {catInfo.label}
                    </h2>
                    <span className="text-sm text-brand-faint font-body">({papers.length} 篇)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.map((item) => {
                      const paper = getPaperById(item.paperId);
                      if (!paper) return null;
                      const isExpanded = expandedPlan === item.paperId;
                      const plan = learningPlans[item.paperId];
                      return (
                        <div key={item.paperId} className="glass-card rounded-2xl p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h3 className="font-display font-bold text-sm text-brand-ink leading-snug mb-1">
                                {paper.titleZh}
                              </h3>
                              <p className="text-xs text-brand-muted font-body">{paper.title}</p>
                            </div>
                            <button
                              onClick={() => handleRemove(item.paperId)}
                              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
                              title="移除此文献"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-brand-faint hover:text-accent-rose transition-colors" />
                            </button>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-brand-faint font-body">
                                {paper.direction}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-brand-faint font-body">
                                {paper.venue} · {paper.year}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-brand-faint font-body">
                                难度：{paper.readingDifficulty}
                              </span>
                            </div>
                            <p className="text-xs text-brand-muted font-body leading-relaxed">
                              核心问题：{paper.coreProblem}
                            </p>
                            {paper.experimentLearningValue && (
                              <p className="text-xs text-brand-muted font-body leading-relaxed">
                                实验学习价值：{paper.experimentLearningValue}
                              </p>
                            )}
                            {paper.defenseValue && (
                              <p className="text-xs text-brand-muted font-body leading-relaxed">
                                答辩价值：{paper.defenseValue}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-xs text-accent-cyan font-medium">
                                备注：{item.note}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleGeneratePlan(item.paperId)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent-electric hover:text-brand-ink transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            {isExpanded ? "收起学习路径" : "生成实验学习路径"}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && plan && (
                            <div className="mt-4 p-4 rounded-xl bg-white/60 border border-black/5 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-brand-ink mb-1">学习目标</p>
                                <p className="text-xs text-brand-muted">{plan.learningGoal}</p>
                              </div>
                              {plan.prerequisiteConcepts.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-brand-ink mb-1">前置概念</p>
                                  <div className="flex flex-wrap gap-1">
                                    {plan.prerequisiteConcepts.map((c, j) => (
                                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-electric/10 text-accent-electric font-body">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-brand-ink mb-1">阅读步骤</p>
                                {plan.readingSteps.map((s, j) => (
                                  <p key={j} className="text-xs text-brand-muted">{s}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-brand-ink mb-1">实验思考</p>
                                {plan.experimentThinking.map((s, j) => (
                                  <p key={j} className="text-xs text-brand-muted">{s}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-brand-ink mb-1">答辩要点</p>
                                {plan.defenseTalkingPoints.map((s, j) => (
                                  <p key={j} className="text-xs text-brand-muted">{s}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-brand-ink mb-1">可能被问到的问题</p>
                                {plan.possibleQuestions.map((s, j) => (
                                  <p key={j} className="text-xs text-brand-muted">· {s}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 答辩提纲 */}
        {defenseOutline && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-accent-amber" />
              <h2 className="font-display text-lg font-bold text-brand-ink">答辩讲解提纲</h2>
            </div>
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <pre className="text-sm text-brand-ink font-body leading-relaxed whitespace-pre-wrap">
                {defenseOutline.join("\n")}
              </pre>
            </div>
          </div>
        )}

        {/* 生成的科研任务 */}
        {showTasks && generatedTasks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-accent-cyan" />
              <h2 className="font-display text-lg font-bold text-brand-ink">基于已选文献的科研任务</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedTasks.map((task) => (
                <div key={task.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-bold text-sm text-brand-ink">{task.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      task.difficulty === "入门" ? "bg-green-100 text-green-700" :
                      task.difficulty === "进阶" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>{task.difficulty}</span>
                  </div>
                  <p className="text-xs text-brand-muted font-body mb-2">{task.scenario}</p>
                  <p className="text-xs text-brand-muted font-body mb-2">
                    输入知识：{task.inputKnowledge}
                  </p>
                  <p className="text-xs text-brand-muted font-body mb-2">
                    预期输出：{task.expectedOutput}
                  </p>
                  {task.evaluationRubric.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-brand-faint mb-1">评价标准</p>
                      {task.evaluationRubric.map((r, j) => (
                        <p key={j} className="text-xs text-brand-muted">· {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部帮助 */}
        {selectedPapers.length > 0 && (
          <div className="text-center pt-10 border-t border-black/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-brand-faint" />
              <span className="text-xs text-brand-faint font-body">如何使用文献工作台</span>
            </div>
            <p className="text-sm text-brand-muted font-body max-w-lg mx-auto">
              在知识探索和知识图谱中选择文献后，在这里统一管理。点击「生成实验学习路径」查看每篇文献的研读指南；点击「生成答辩提纲」获得结构化的答辩框架；点击「生成科研任务」获得基于文献的实践训练。
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-electric hover:text-brand-ink transition-colors"
            >
              返回知识探索，继续选择文献
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
