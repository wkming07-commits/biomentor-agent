"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  FilePlus2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

const API_BASE = "/gateway";
const BACKEND_DIRECT_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:10087` : "");

interface ResearchPaper {
  id: number;
  title: string;
  title_zh: string;
  direction: string;
  venue: string;
  year: number;
  source_type: string;
  keywords: string[];
  abstract: string;
  core_problem: string;
  method_summary: string;
  key_finding: string;
  teaching_value: string;
  research_value: string;
  related_concepts: string[];
  pdf_filename: string;
  pdf_storage_path: string;
  pdf_text_char_count: number;
}

interface ResearchPaperListResponse {
  items: ResearchPaper[];
  total: number;
  page: number;
  page_size: number;
}

interface PaperImportJob {
  job_id: string;
  filename: string;
  status: "queued" | "running" | "succeeded" | "failed";
  message: string;
  paper_id?: number | null;
  paper_title?: string;
  error?: string;
}

interface PaperAnalysis {
  paper_id: number;
  title: string;
  one_sentence_summary: string;
  key_innovation?: string;
  teaching_points?: string[];
  method_breakdown?: string[];
  discussion_questions?: string[];
}

interface PaperLearningPlan {
  paper_id: number;
  title: string;
  learning_goal: string;
  one_sentence_summary: string;
  key_innovation?: string;
  reading_steps: string[];
  experiment_thinking: string[];
  defense_talking_points: string[];
  discussion_questions: string[];
}

const emptyForm = {
  title: "",
  title_zh: "",
  direction: "",
  venue: "",
  year: new Date().getFullYear(),
  source_type: "学术文献",
  keywords: "",
  abstract: "",
  core_problem: "",
  method_summary: "",
  key_finding: "",
  teaching_value: "",
  research_value: "",
  related_concepts: "",
};

type InsightState =
  | { type: "analysis"; paperId: number; data: PaperAnalysis }
  | { type: "plan"; paperId: number; data: PaperLearningPlan }
  | null;

export default function PaperLibraryPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importingPdf, setImportingPdf] = useState(false);
  const [importJob, setImportJob] = useState<PaperImportJob | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [analysisLoadingId, setAnalysisLoadingId] = useState<number | null>(null);
  const [planLoadingId, setPlanLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [insight, setInsight] = useState<InsightState>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const loadPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/research/papers`);
      if (!response.ok) {
        throw new Error("文献列表加载失败");
      }
      const data = (await response.json()) as ResearchPaperListResponse;
      setPapers(data.items || []);
      setTotal(data.total || 0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "文献列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPapers();
  }, []);

  const updateField = (key: keyof typeof emptyForm, value: string | number) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    clearMessages();

    try {
      const payload = {
        ...form,
        keywords: form.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        related_concepts: form.related_concepts
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch(`${API_BASE}/api/research/papers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "新增文献失败" }));
        throw new Error(body.detail || "新增文献失败");
      }

      setForm(emptyForm);
      setSuccess("文献已加入知识库");
      await loadPapers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "新增文献失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (paperId: number) => {
    setDeletingId(paperId);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/research/papers/${paperId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "删除文献失败" }));
        throw new Error(body.detail || "删除文献失败");
      }

      if (insight?.paperId === paperId) {
        setInsight(null);
      }
      setSuccess(`文献 ${paperId} 已删除`);
      await loadPapers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "删除文献失败");
    } finally {
      setDeletingId(null);
    }
  };

  const pollImportJob = async (jobId: string) => {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await fetch(`${BACKEND_DIRECT_BASE}/api/research/papers/import-pdf/jobs/${jobId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "PDF 导入任务查询失败" }));
        throw new Error(body.detail || "PDF 导入任务查询失败");
      }

      const job = (await response.json()) as PaperImportJob;
      setImportJob(job);

      if (job.status === "succeeded") {
        setSuccess(`PDF 已解析并入库：${job.paper_title || job.filename}`);
        await loadPapers();
        return;
      }

      if (job.status === "failed") {
        throw new Error(job.error || job.message || "PDF 导入失败");
      }
    }

    throw new Error("PDF 导入仍在后台解析，请稍后刷新文献列表");
  };

  const handleImportPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingPdf(true);
    setImportJob(null);
    clearMessages();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_DIRECT_BASE}/api/research/papers/import-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "PDF 导入任务创建失败" }));
        throw new Error(body.detail || "PDF 导入任务创建失败");
      }

      const job = (await response.json()) as PaperImportJob;
      setImportJob(job);
      setSuccess(`PDF 已提交后台解析：${job.filename}`);
      await pollImportJob(job.job_id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "PDF 导入失败");
    } finally {
      setImportingPdf(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    }
  };

  const handleAnalyze = async (paperId: number) => {
    setAnalysisLoadingId(paperId);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/research/papers/${paperId}/analysis`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "文献分析失败" }));
        throw new Error(body.detail || "文献分析失败");
      }

      const data = (await response.json()) as PaperAnalysis;
      setInsight({ type: "analysis", paperId, data });
      setSuccess(`文献 ${paperId} 的真实 LLM 分析已返回`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "文献分析失败");
    } finally {
      setAnalysisLoadingId(null);
    }
  };

  const handlePlan = async (paperId: number) => {
    setPlanLoadingId(paperId);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/research/papers/${paperId}/learning-plan`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "学习计划生成失败" }));
        throw new Error(body.detail || "学习计划生成失败");
      }

      const data = (await response.json()) as PaperLearningPlan;
      setInsight({ type: "plan", paperId, data });
      setSuccess(`文献 ${paperId} 的真实 LLM 学习计划已返回`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "学习计划生成失败");
    } finally {
      setPlanLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-7xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-5">
            <BookOpen className="w-3 h-3" />
            Paper Library
          </div>
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            知识库文献管理
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-2xl mx-auto">
            这里直接管理后端研究文献知识库。新增、删除、文献分析和学习计划都实时走 FastAPI 后端与真实 LLM。
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-accent-electric" />
                <h2 className="font-display font-bold text-sm text-brand-ink">上传 PDF 自动入库</h2>
              </div>
              <p className="text-sm text-brand-muted leading-6 mb-4">
                上传论文 PDF 后，后端会保存原始文件、提取文本，并调用真实 LLM 自动抽取标题、方向、摘要、方法和关键发现后写入文献库。
              </p>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleImportPdf}
                disabled={importingPdf}
                className="block w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-accent-electric/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-electric"
              />
              <div className="mt-4 text-xs text-brand-faint">
                后端保存目录：`backend/uploads/research_papers`
              </div>
              {importingPdf && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-brand-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {importJob?.message || "PDF 已提交后台解析，正在等待任务状态"}
                </div>
              )}
              {importJob && !importingPdf && importJob.status !== "succeeded" && (
                <div className="mt-4 text-sm text-brand-muted">
                  后台任务状态：{importJob.message}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FilePlus2 className="w-5 h-5 text-accent-electric" />
                <h2 className="font-display font-bold text-sm text-brand-ink">手动新增文献</h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="英文标题" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" required />
                <input value={form.title_zh} onChange={(e) => updateField("title_zh", e.target.value)} placeholder="中文标题" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" required />
                <input value={form.direction} onChange={(e) => updateField("direction", e.target.value)} placeholder="研究方向" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" required />
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <input value={form.venue} onChange={(e) => updateField("venue", e.target.value)} placeholder="期刊 / 会议" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" required />
                  <input type="number" value={form.year} onChange={(e) => updateField("year", Number(e.target.value))} placeholder="年份" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" required />
                </div>
                <input value={form.keywords} onChange={(e) => updateField("keywords", e.target.value)} placeholder="关键词，逗号分隔" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" />
                <input value={form.related_concepts} onChange={(e) => updateField("related_concepts", e.target.value)} placeholder="关联概念，逗号分隔" className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none" />
                <textarea value={form.abstract} onChange={(e) => updateField("abstract", e.target.value)} placeholder="摘要" rows={4} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />
                <textarea value={form.core_problem} onChange={(e) => updateField("core_problem", e.target.value)} placeholder="核心问题" rows={3} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />
                <textarea value={form.method_summary} onChange={(e) => updateField("method_summary", e.target.value)} placeholder="方法概述" rows={3} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />
                <textarea value={form.key_finding} onChange={(e) => updateField("key_finding", e.target.value)} placeholder="关键发现" rows={3} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />
                <textarea value={form.teaching_value} onChange={(e) => updateField("teaching_value", e.target.value)} placeholder="教学价值" rows={2} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />
                <textarea value={form.research_value} onChange={(e) => updateField("research_value", e.target.value)} placeholder="研究价值" rows={2} className="w-full rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-sm outline-none resize-y" />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-accent-electric to-accent-cyan text-white font-medium disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
                  {submitting ? "提交中" : "加入知识库"}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display font-bold text-sm text-brand-ink">后端文献列表</h2>
                  <p className="text-xs text-brand-faint font-body mt-1">共 {total} 篇</p>
                </div>
                <button
                  onClick={() => void loadPapers()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-black/5 text-sm text-brand-ink disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  刷新
                </button>
              </div>

              {(error || success) && (
                <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                  {error || success}
                </div>
              )}

              {loading ? (
                <div className="py-16 flex items-center justify-center text-brand-muted">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  正在加载文献
                </div>
              ) : (
                <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                  {papers.map((paper) => {
                    const isInsightPaper = insight?.paperId === paper.id;
                    return (
                      <div key={paper.id} className="rounded-2xl border border-black/5 bg-white/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-ink leading-6">{paper.title_zh || paper.title}</p>
                            <p className="text-xs text-brand-muted mt-1 break-all">{paper.title}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[10px] px-2 py-1 rounded-full bg-black/5 text-brand-faint">{paper.direction}</span>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-black/5 text-brand-faint">{paper.venue} · {paper.year}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => void handleDelete(paper.id)}
                            disabled={deletingId === paper.id}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 disabled:opacity-50"
                          >
                            {deletingId === paper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            删除
                          </button>
                        </div>

                        {paper.core_problem && (
                          <p className="text-sm text-brand-muted mt-3 leading-6">
                            核心问题：{paper.core_problem}
                          </p>
                        )}

                        {paper.pdf_filename && (
                          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-brand-muted">
                            <p>已保存 PDF：{paper.pdf_filename}</p>
                            <p className="break-all mt-1">存储路径：{paper.pdf_storage_path}</p>
                            <p className="mt-1">提取字符数：{paper.pdf_text_char_count}</p>
                          </div>
                        )}

                        {paper.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {paper.keywords.map((keyword) => (
                              <span key={`${paper.id}-${keyword}`} className="text-[10px] px-2 py-1 rounded-full bg-accent-electric/10 text-accent-electric">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => void handleAnalyze(paper.id)}
                            disabled={analysisLoadingId === paper.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-ink text-white text-sm disabled:opacity-50"
                          >
                            {analysisLoadingId === paper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            真实 LLM 分析
                          </button>
                          <button
                            onClick={() => void handlePlan(paper.id)}
                            disabled={planLoadingId === paper.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-electric/10 text-accent-electric text-sm border border-accent-electric/15 disabled:opacity-50"
                          >
                            {planLoadingId === paper.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                            学习计划
                          </button>
                        </div>

                        {isInsightPaper && insight?.type === "analysis" && (
                          <div className="mt-4 rounded-2xl bg-slate-950 text-slate-50 p-4 space-y-3">
                            <p className="text-sm leading-6">{insight.data.one_sentence_summary}</p>
                            {insight.data.key_innovation && (
                              <p className="text-sm text-slate-200">
                                <span className="font-semibold text-white">关键创新：</span>
                                {insight.data.key_innovation}
                              </p>
                            )}
                            {Array.isArray(insight.data.teaching_points) && insight.data.teaching_points.length > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">教学要点</p>
                                <div className="space-y-1 text-sm text-slate-200">
                                  {insight.data.teaching_points.map((item, index) => (
                                    <p key={`${paper.id}-teaching-${index}`}>{item}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isInsightPaper && insight?.type === "plan" && (
                          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4 space-y-3">
                            <p className="text-sm text-brand-ink leading-6">
                              <span className="font-semibold">学习目标：</span>
                              {insight.data.learning_goal}
                            </p>
                            <p className="text-sm text-brand-muted leading-6">{insight.data.one_sentence_summary}</p>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-brand-faint mb-2">阅读步骤</p>
                              <div className="space-y-1 text-sm text-brand-muted">
                                {insight.data.reading_steps.map((item, index) => (
                                  <p key={`${paper.id}-step-${index}`}>{item}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
