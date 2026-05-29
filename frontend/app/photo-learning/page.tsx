"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Camera, Upload, ImageIcon, FileText, Search, Sparkles, BookOpen,
  FlaskConical, Building2, GraduationCap, ArrowRight, X, Edit3,
  CheckCircle2, HelpCircle, Lightbulb, ExternalLink, Loader2, Bookmark,
  ScanLine,
} from "lucide-react";
import { photoLearningSamples } from "@/data/photoLearningSamples";
import { extractKeywordsFromText, buildLearningSummary } from "@/lib/photoLearning";
import { generateQuestionsFromPhotoLearningResult } from "@/lib/questionGenerator";
import { addSelectedPaper } from "@/lib/selectedPapers";
import { getPaperById } from "@/data/knowledgeBase";
import { searchKnowledge } from "@/lib/knowledgeSearch";
import type { PhotoLearningResult, GeneratedQuestion, PhotoLearningSample } from "@/lib/knowledgeTypes";

const PY_BACKEND = "http://localhost:8000";

export default function PhotoLearningPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrEngine, setOcrEngine] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoLearningResult | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // ---- Real file upload ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
    setOcrText("");
    setResult(null);
    setQuestions([]);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null); setUploadedFile(null); setImageName("");
    setOcrText(""); setResult(null); setQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Real OCR: send to Python backend ----
  const handleStartOcr = async () => {
    if (!uploadedFile) return;
    setIsRecognizing(true);
    try {
      const form = new FormData();
      form.append("file", uploadedFile);
      const res = await fetch(`${PY_BACKEND}/api/photo-learning/ocr`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "OCR 失败" }));
        throw new Error(err.detail || "OCR 识别失败");
      }
      const data = await res.json();
      setOcrText(data.text);
      setOcrEngine(data.engine);
      showToast(`OCR 完成 · 引擎: ${data.engine} · ${data.char_count} 字符`);
    } catch (e) {
      showToast(`OCR 失败: ${e instanceof Error ? e.message : "未知错误"}`);
    } finally {
      setIsRecognizing(false);
    }
  };

  // ---- Sample text ----
  const handleUseSample = (sample: PhotoLearningSample) => {
    setOcrText(sample.mockOcrText);
    setUploadedImage(null); setUploadedFile(null);
    setImageName(`示例：${sample.title}`);
    setShowSamplePicker(false);
    setResult(null); setQuestions([]);
    setOcrEngine("示例文本");
    showToast(`已加载示例：${sample.title}`);
  };

  // ---- Analyze: local knowledge matching + questions ----
  const handleAnalyze = () => {
    if (!ocrText.trim()) return;
    setIsAnalyzing(true);
    setResult(null); setQuestions([]);
    setTimeout(() => {
      const keywords = extractKeywordsFromText(ocrText);
      const searchResults = keywords.slice(0, 6).flatMap((kw) => {
        const r = searchKnowledge(kw);
        return r.concepts;
      }).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
      const matchedPapers = keywords.slice(0, 6).flatMap((kw) => {
        const r = searchKnowledge(kw);
        return r.papers;
      }).filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i);
      const matchedTasks = keywords.slice(0, 6).flatMap((kw) => {
        const r = searchKnowledge(kw);
        return r.tasks;
      }).filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i);

      const summary = buildLearningSummary({
        rawText: ocrText, extractedKeywords: keywords,
        matchedConcepts: searchResults, matchedPapers,
      });

      const generatedQs = generateQuestionsFromPhotoLearningResult({
        rawText: ocrText, extractedKeywords: keywords,
        matchedConcepts: searchResults, matchedPapers,
      });

      setResult({
        rawText: ocrText, extractedKeywords: keywords,
        matchedConcepts: searchResults.slice(0, 8),
        matchedPapers: matchedPapers.slice(0, 6),
        matchedTasks: matchedTasks.slice(0, 4),
        summary, questions: generatedQs,
      });
      setQuestions(generatedQs);
      setIsAnalyzing(false);
      showToast(`分析完成 · ${keywords.length} 个关键词 · ${generatedQs.length} 道题目`);
    }, 800);
  };

  const handleAddPaper = (paperId: string) => { addSelectedPaper(paperId, ["研读清单"]); showToast("已加入研读清单"); };

  const questionTypeIcons: Record<string, React.ReactNode> = {
    "选择题": <HelpCircle className="w-4 h-4 text-accent-electric" />,
    "判断题": <CheckCircle2 className="w-4 h-4 text-accent-cyan" />,
    "简答题": <FileText className="w-4 h-4 text-accent-amber" />,
    "科研拓展题": <FlaskConical className="w-4 h-4 text-accent-rose" />,
    "产业联系题": <Building2 className="w-4 h-4 text-accent-electric" />,
  };
  const typeAccentColors: Record<string, string> = {
    "选择题": "border-l-accent-electric", "判断题": "border-l-accent-cyan",
    "简答题": "border-l-accent-amber", "科研拓展题": "border-l-accent-rose",
    "产业联系题": "border-l-accent-electric",
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-body shadow-lg animate-scale-in">
          {toastMsg}
        </div>
      )}
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-5">
            <ScanLine className="w-3 h-3" /> 真实 OCR + 知识库匹配
          </div>
          <h1 className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
            拍照学练：从课本内容到科研拓展
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-2xl mx-auto">
            上传教材图片或 PDF，真实 OCR 提取文字，匹配 BioMentor 知识库，自动生成练习题
          </p>
          <p className="text-xs text-brand-faint mt-2">OCR 引擎：PDF → PyMuPDF | 图片 → DeepSeek Vision | DOCX → python-docx</p>
        </div>

        {/* Region 1: Upload */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent-electric/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-accent-electric" />
              </div>
              <div><h2 className="font-display font-bold text-sm text-brand-ink">上传课本图片或文件</h2><p className="text-xs text-brand-muted font-body">JPG、PNG、PDF、DOCX · 最大 50MB</p></div>
            </div>

            <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${uploadedImage ? "border-accent-electric/30 bg-accent-electric/5" : "border-brand-faint/20 hover:border-accent-electric/20 bg-white/30"}`}>
              {uploadedImage ? (
                <div>
                  <img src={uploadedImage} alt="Uploaded" className="max-h-64 mx-auto rounded-xl shadow-md mb-3" />
                  <p className="text-xs text-brand-muted font-body mb-2">{imageName}</p>
                  <button onClick={handleRemoveImage} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-rose/10 text-accent-rose text-xs font-medium hover:bg-accent-rose/20 transition-colors cursor-pointer">
                    <X className="w-3 h-3" /> 移除
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                  <ImageIcon className="w-10 h-10 text-brand-faint/40 mx-auto mb-3" />
                  <p className="text-sm text-brand-muted font-body mb-1">点击上传图片、PDF 或 DOCX</p>
                  <p className="text-xs text-brand-faint font-body">真实 OCR · PDF→PyMuPDF · 图片→DeepSeek Vision</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.docx" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {uploadedFile && (
                <button onClick={handleStartOcr} disabled={isRecognizing}
                  className="btn-hero cursor-pointer inline-flex items-center gap-2">
                  {isRecognizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {isRecognizing ? "OCR 识别中…" : "开始真实 OCR 识别"}
                </button>
              )}
              <button onClick={() => setShowSamplePicker(!showSamplePicker)}
                className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> 使用示例课本内容
              </button>
            </div>

            {showSamplePicker && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photoLearningSamples.map((sample) => (
                  <button key={sample.id} onClick={() => handleUseSample(sample)}
                    className="text-left p-4 rounded-xl bg-white/50 border border-black/5 hover:border-accent-electric/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4 text-accent-electric" /><span className="text-sm font-semibold text-brand-ink">{sample.title}</span></div>
                    <p className="text-xs text-brand-muted font-body">{sample.subject}</p>
                    <p className="text-[10px] text-brand-faint font-body mt-1">{sample.mockOcrText.slice(0, 80)}…</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Region 2: OCR Text */}
        {ocrText && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent-amber" /><h2 className="font-display font-bold text-sm text-brand-ink">识别文本</h2>
                </div>
                <span className="text-xs text-brand-faint font-body">{ocrText.length} 字符 · {ocrEngine || ""} · 可编辑</span>
              </div>
              <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} rows={10}
                className="w-full rounded-xl bg-white/40 border border-black/5 p-4 text-sm font-body text-brand-ink placeholder:text-brand-muted/40 outline-none focus:border-accent-electric/20 transition-all resize-y min-h-[160px]" />
              <div className="flex justify-end mt-4">
                <button onClick={handleAnalyze} disabled={!ocrText.trim() || isAnalyzing}
                  className="btn-hero cursor-pointer inline-flex items-center gap-2">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAnalyzing ? "分析中…" : "分析知识点"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Region 3: Knowledge matching */}
        {result && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5"><Search className="w-5 h-5 text-accent-electric" /><h2 className="font-display font-bold text-sm text-brand-ink">知识库匹配结果</h2></div>
              <div className="p-4 rounded-xl bg-accent-electric/5 border border-accent-electric/10 mb-5">
                <div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-accent-electric shrink-0 mt-0.5" /><p className="text-sm text-brand-ink font-body leading-relaxed">{result.summary}</p></div>
              </div>
              <div className="mb-5">
                <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">识别关键词</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.extractedKeywords.slice(0, 15).map((kw) => (
                    <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-electric/10 text-accent-electric font-body">{kw}</span>
                  ))}
                  {result.extractedKeywords.length > 15 && <span className="text-xs text-brand-faint font-body">+{result.extractedKeywords.length - 15} 个</span>}
                </div>
              </div>
              {result.matchedConcepts.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">基础知识锚点</p>
                  <div className="space-y-2">
                    {result.matchedConcepts.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/40 border border-black/5">
                        <GraduationCap className="w-4 h-4 text-accent-electric shrink-0 mt-0.5" />
                        <div><p className="text-sm font-semibold text-brand-ink">{c.name}</p><p className="text-xs text-brand-muted">{c.shortDefinition}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.matchedPapers.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">关联代表文献</p>
                  <div className="space-y-2">
                    {result.matchedPapers.slice(0, 4).map((paper) => (
                      <div key={paper.id} className="flex items-start justify-between p-3 rounded-xl bg-white/40 border border-black/5">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-brand-ink">{paper.titleZh}</p>
                          <p className="text-xs text-brand-muted">{paper.venue} · {paper.year} · 难度：{paper.readingDifficulty}</p>
                        </div>
                        <button onClick={() => handleAddPaper(paper.id)} className="ml-2 px-2.5 py-1 rounded-lg bg-accent-electric/10 text-accent-electric text-[10px] font-medium hover:bg-accent-electric/20 transition-colors cursor-pointer shrink-0">
                          <Bookmark className="w-3 h-3 inline mr-1" />加入研读
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Region 4: Questions */}
        {questions.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5"><Sparkles className="w-5 h-5 text-accent-amber" /><h2 className="font-display font-bold text-sm text-brand-ink">自动出题结果</h2><span className="text-xs text-brand-muted font-body">（共 {questions.length} 道题目）</span></div>
              <div className="space-y-4">
                {questions.map((q) => {
                  const isExpanded = expandedQuestion === q.id;
                  return (
                    <div key={q.id} className={`rounded-xl border border-black/5 bg-white/40 overflow-hidden transition-all ${isExpanded ? "border-l-4 " + (typeAccentColors[q.type] || "border-l-accent-electric") : ""}`}>
                      <button onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                        className="w-full text-left p-4 flex items-start gap-3 cursor-pointer hover:bg-white/30 transition-colors">
                        <div className="shrink-0 mt-0.5">{questionTypeIcons[q.type] || <HelpCircle className="w-4 h-4 text-brand-muted" />}</div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${q.type === "选择题" ? "bg-accent-electric/10 text-accent-electric" : q.type === "判断题" ? "bg-accent-cyan/10 text-accent-cyan" : q.type === "简答题" ? "bg-accent-amber/10 text-accent-amber" : q.type === "科研拓展题" ? "bg-accent-rose/10 text-accent-rose" : "bg-accent-electric/10 text-accent-electric"}`}>{q.type}</span>
                          <p className="text-sm text-brand-ink font-body leading-relaxed mt-1">{q.question}</p>
                          {q.type === "选择题" && q.options && !isExpanded && (
                            <div className="flex flex-wrap gap-2 mt-2">{q.options.map((opt) => <span key={opt.slice(0, 2)} className="text-xs text-brand-muted font-body">{opt}</span>)}</div>
                          )}
                        </div>
                        <span className="text-xs text-brand-faint shrink-0">{isExpanded ? "收起" : "展开"}</span>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-black/5 pt-3 space-y-3">
                          {q.type === "选择题" && q.options && (
                            <div>
                              <p className="text-xs font-semibold text-brand-faint mb-1">选项</p>
                              {q.options.map((opt) => (
                                <p key={opt.slice(0, 10)} className={`text-sm font-body leading-relaxed px-3 py-1.5 rounded-lg ${opt.startsWith(q.answer) ? "bg-green-100 text-green-800 font-semibold" : "text-brand-muted"}`}>{opt}</p>
                              ))}
                            </div>
                          )}
                          <div><p className="text-xs font-semibold text-brand-faint mb-1">答案</p><p className="text-sm text-brand-ink font-body leading-relaxed bg-green-50/50 rounded-lg p-3 border border-green-100">{q.answer}</p></div>
                          <div><p className="text-xs font-semibold text-brand-faint mb-1">解析</p><p className="text-sm text-brand-muted font-body leading-relaxed">{q.explanation}</p></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* OCR info */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3"><ScanLine className="w-4 h-4 text-accent-amber" /><h3 className="font-display font-bold text-sm text-brand-ink">真实 OCR 引擎说明</h3></div>
            <ul className="text-xs text-brand-muted font-body space-y-1 list-disc pl-4">
              <li><strong>PDF：</strong>PyMuPDF (fitz) 直接提取文本层，秒级完成</li>
              <li><strong>图片 (JPG/PNG)：</strong>DeepSeek Vision API，将图片编码为 base64 发送给大模型识别</li>
              <li><strong>DOCX：</strong>python-docx 提取段落文本</li>
              <li><strong>文本：</strong>直接读取 UTF-8 编码</li>
            </ul>
            <p className="text-xs text-brand-faint font-body mt-3">需要 Python 后端 (localhost:8000) 正常运行。上传的文件仅用于 OCR 文本提取，不会存储在服务器上。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
