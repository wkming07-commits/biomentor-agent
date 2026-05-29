"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  ImageIcon,
  FileText,
  Search,
  Sparkles,
  BookOpen,
  FlaskConical,
  Building2,
  GraduationCap,
  ArrowRight,
  X,
  Edit3,
  Play,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Loader2,
  Bookmark,
} from "lucide-react";
import { photoLearningSamples } from "@/data/photoLearningSamples";
import { analyzeTextWithKnowledgeBase, extractKeywordsFromText } from "@/lib/photoLearning";
import { generateQuestionsFromPhotoLearningResult } from "@/lib/questionGenerator";
import { addSelectedPaper } from "@/lib/selectedPapers";
import { getPaperById } from "@/data/knowledgeBase";
import type { PhotoLearningResult, GeneratedQuestion, PhotoLearningSample } from "@/lib/knowledgeTypes";

export default function PhotoLearningPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoLearningResult | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  // ---- 图片上传 ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setOcrText("");
    setResult(null);
    setQuestions([]);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageName("");
    setOcrText("");
    setResult(null);
    setQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- 模拟 OCR 识别 ----
  const handleStartOcr = () => {
    if (!uploadedImage) return;
    setIsRecognizing(true);
    setTimeout(() => {
      // 模拟识别：从样例中随机选择一个或基于现有文本
      const sampleTexts = photoLearningSamples.map((s) => s.mockOcrText);
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      setOcrText(randomText);
      setIsRecognizing(false);
      showToast("OCR 识别完成（模拟），可手动编辑文本");
    }, 1200);
  };

  // ---- 使用样例 ----
  const handleUseSample = (sample: PhotoLearningSample) => {
    setOcrText(sample.mockOcrText);
    setUploadedImage(null);
    setImageName(`示例：${sample.title}`);
    setShowSamplePicker(false);
    setResult(null);
    setQuestions([]);
    showToast(`已加载示例：${sample.title}`);
  };

  // ---- 分析知识点 ----
  const handleAnalyze = () => {
    if (!ocrText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setQuestions([]);
    setTimeout(() => {
      const analysisResult = analyzeTextWithKnowledgeBase(ocrText);
      const generatedQuestions = generateQuestionsFromPhotoLearningResult({
        rawText: ocrText,
        extractedKeywords: analysisResult.extractedKeywords,
        matchedConcepts: analysisResult.matchedConcepts,
        matchedPapers: analysisResult.matchedPapers,
      });
      setResult(analysisResult);
      setQuestions(generatedQuestions);
      setIsAnalyzing(false);
      showToast("知识点分析完成");
    }, 1500);
  };

  // ---- 加入文献工作台 ----
  const handleAddPaper = (paperId: string) => {
    addSelectedPaper(paperId, ["研读清单"]);
    showToast("已加入研读清单");
  };

  // ---- 题型渲染 ----
  const questionTypeIcons: Record<string, React.ReactNode> = {
    "选择题": <HelpCircle className="w-4 h-4 text-accent-electric" />,
    "判断题": <CheckCircle2 className="w-4 h-4 text-accent-cyan" />,
    "简答题": <FileText className="w-4 h-4 text-accent-amber" />,
    "科研拓展题": <FlaskConical className="w-4 h-4 text-accent-rose" />,
    "产业联系题": <Building2 className="w-4 h-4 text-accent-electric" />,
  };

  const typeAccentColors: Record<string, string> = {
    "选择题": "border-l-accent-electric",
    "判断题": "border-l-accent-cyan",
    "简答题": "border-l-accent-amber",
    "科研拓展题": "border-l-accent-rose",
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
        {/* 顶部标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-5">
            <Camera className="w-3 h-3" />
            Photo Learning
          </div>
          <h1
            className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            拍照学练：从课本内容到科研拓展
          </h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-2xl mx-auto">
            上传教材图片，识别知识点，自动生成练习题、科研拓展和产业联系
          </p>
        </div>

        {/* 区域 1：上传区域 */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent-electric/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-accent-electric" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-brand-ink">上传课本图片</h2>
                <p className="text-xs text-brand-muted font-body">支持 JPG、PNG 格式</p>
              </div>
            </div>

            {/* 上传区域 */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                uploadedImage
                  ? "border-accent-electric/30 bg-accent-electric/5"
                  : "border-brand-faint/20 hover:border-accent-electric/20 bg-white/30"
              }`}
            >
              {uploadedImage ? (
                <div>
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-h-64 mx-auto rounded-xl shadow-md mb-3"
                  />
                  <p className="text-xs text-brand-muted font-body mb-2">{imageName}</p>
                  <button
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-rose/10 text-accent-rose text-xs font-medium hover:bg-accent-rose/20 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    移除图片
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  <ImageIcon className="w-10 h-10 text-brand-faint/40 mx-auto mb-3" />
                  <p className="text-sm text-brand-muted font-body mb-1">点击上传图片或拖拽到此处</p>
                  <p className="text-xs text-brand-faint font-body">JPG、PNG，最大 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3 mt-5">
              {uploadedImage && (
                <button
                  onClick={handleStartOcr}
                  disabled={isRecognizing}
                  className="btn-hero cursor-pointer inline-flex items-center gap-2"
                >
                  {isRecognizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isRecognizing ? "识别中..." : "开始识别"}
                </button>
              )}
              <button
                onClick={() => setShowSamplePicker(!showSamplePicker)}
                className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                使用示例课本内容
              </button>
            </div>

            <p className="mt-4 text-xs text-brand-faint font-body leading-relaxed">
              当前演示版使用模拟 OCR，可手动编辑识别文本。后续可接入 PaddleOCR / RapidOCR / 国产 OCR 服务。
            </p>

            {/* 样例选择器 */}
            {showSamplePicker && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photoLearningSamples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleUseSample(sample)}
                    className="text-left p-4 rounded-xl bg-white/50 border border-black/5 hover:border-accent-electric/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-accent-electric" />
                      <span className="text-sm font-semibold text-brand-ink">{sample.title}</span>
                    </div>
                    <p className="text-xs text-brand-muted font-body">{sample.subject}</p>
                    <p className="text-[10px] text-brand-faint font-body mt-1">
                      {sample.mockOcrText.slice(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 区域 2：OCR 文本区域 */}
        {(ocrText || uploadedImage) && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent-amber" />
                  <h2 className="font-display font-bold text-sm text-brand-ink">识别文本</h2>
                </div>
                {ocrText && (
                  <span className="text-xs text-brand-faint font-body">
                    {ocrText.length} 字符 · 可编辑
                  </span>
                )}
              </div>

              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder={
                  uploadedImage
                    ? "点击「开始识别」获取文本，或在此粘贴课本文本..."
                    : "在此粘贴课本文本，或上传图片后点击「开始识别」..."
                }
                rows={10}
                className="w-full rounded-xl bg-white/40 border border-black/5 p-4 text-sm font-body text-brand-ink placeholder:text-brand-muted/40 outline-none focus:border-accent-electric/20 transition-all resize-y min-h-[160px]"
              />

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!ocrText.trim() || isAnalyzing}
                  className="btn-hero cursor-pointer inline-flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isAnalyzing ? "分析中..." : "分析知识点"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 区域 3：知识库匹配结果 */}
        {result && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Search className="w-5 h-5 text-accent-electric" />
                <h2 className="font-display font-bold text-sm text-brand-ink">知识库匹配结果</h2>
              </div>

              {/* 学习摘要 */}
              <div className="p-4 rounded-xl bg-accent-electric/5 border border-accent-electric/10 mb-5">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-accent-electric shrink-0 mt-0.5" />
                  <p className="text-sm text-brand-ink font-body leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* 关键词 */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">识别关键词</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.extractedKeywords.slice(0, 12).map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-electric/10 text-accent-electric font-body"
                    >
                      {kw}
                    </span>
                  ))}
                  {result.extractedKeywords.length > 12 && (
                    <span className="text-xs text-brand-faint font-body">
                      +{result.extractedKeywords.length - 12} 个
                    </span>
                  )}
                </div>
              </div>

              {/* 匹配概念 */}
              {result.matchedConcepts.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">
                    基础知识锚点
                  </p>
                  <div className="space-y-2">
                    {result.matchedConcepts.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/40 border border-black/5">
                        <GraduationCap className="w-4 h-4 text-accent-electric shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-brand-ink">{c.name}</p>
                          <p className="text-xs text-brand-muted">{c.shortDefinition}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 匹配文献 */}
              {result.matchedPapers.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">
                    关联代表文献
                  </p>
                  <div className="space-y-2">
                    {result.matchedPapers.slice(0, 4).map((paper) => (
                      <div
                        key={paper.id}
                        className="flex items-start justify-between p-3 rounded-xl bg-white/40 border border-black/5"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-brand-ink">{paper.titleZh}</p>
                          <p className="text-xs text-brand-muted">
                            {paper.venue} · {paper.year} · 难度：{paper.readingDifficulty}
                          </p>
                          <p className="text-xs text-brand-muted mt-1">{paper.coreProblem.slice(0, 80)}...</p>
                        </div>
                        <div className="flex flex-col gap-1 ml-3 shrink-0">
                          <button
                            onClick={() => handleAddPaper(paper.id)}
                            className="px-2.5 py-1 rounded-lg bg-accent-electric/10 text-accent-electric text-[10px] font-medium hover:bg-accent-electric/20 transition-colors cursor-pointer"
                          >
                            <Bookmark className="w-3 h-3 inline mr-1" />
                            加入研读
                          </button>
                          <Link
                            href={`/explore`}
                            className="px-2.5 py-1 rounded-lg bg-black/5 text-brand-muted text-[10px] font-medium hover:bg-black/10 transition-colors text-center"
                          >
                            查看详情
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 匹配科研任务 */}
              {result.matchedTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-faint uppercase tracking-wider mb-2">
                    关联科研任务
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedTasks.map((task) => (
                      <Link
                        key={task.id}
                        href="/research"
                        className="px-3 py-1.5 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition-colors"
                      >
                        {task.title.slice(0, 30)}...
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 区域 4：自动出题结果 */}
        {questions.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-accent-amber" />
                <h2 className="font-display font-bold text-sm text-brand-ink">
                  自动出题结果
                </h2>
                <span className="text-xs text-brand-muted font-body">
                  （共 {questions.length} 道题目）
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q) => {
                  const isExpanded = expandedQuestion === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border border-black/5 bg-white/40 overflow-hidden transition-all ${
                        isExpanded ? "border-l-4 " + (typeAccentColors[q.type] || "border-l-accent-electric") : ""
                      }`}
                    >
                      {/* 题目头部 */}
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                        className="w-full text-left p-4 flex items-start gap-3 cursor-pointer hover:bg-white/30 transition-colors"
                      >
                        <div className="shrink-0 mt-0.5">
                          {questionTypeIcons[q.type] || <HelpCircle className="w-4 h-4 text-brand-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                q.type === "选择题"
                                  ? "bg-accent-electric/10 text-accent-electric"
                                  : q.type === "判断题"
                                    ? "bg-accent-cyan/10 text-accent-cyan"
                                    : q.type === "简答题"
                                      ? "bg-accent-amber/10 text-accent-amber"
                                      : q.type === "科研拓展题"
                                        ? "bg-accent-rose/10 text-accent-rose"
                                        : "bg-accent-electric/10 text-accent-electric"
                              }`}
                            >
                              {q.type}
                            </span>
                          </div>
                          <p className="text-sm text-brand-ink font-body leading-relaxed">{q.question}</p>

                          {/* 选择题选项预览 */}
                          {q.type === "选择题" && q.options && !isExpanded && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {q.options.map((opt) => (
                                <span key={opt.slice(0, 2)} className="text-xs text-brand-muted font-body">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-brand-faint shrink-0">
                          {isExpanded ? "收起" : "展开"}
                        </span>
                      </button>

                      {/* 题目详情（展开时） */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-black/5 pt-3 space-y-3">
                          {/* 选项（选择题） */}
                          {q.type === "选择题" && q.options && (
                            <div>
                              <p className="text-xs font-semibold text-brand-faint mb-1">选项</p>
                              {q.options.map((opt) => (
                                <p
                                  key={opt.slice(0, 10)}
                                  className={`text-sm font-body leading-relaxed px-3 py-1.5 rounded-lg ${
                                    opt.startsWith(q.answer)
                                      ? "bg-green-100 text-green-800 font-semibold"
                                      : "text-brand-muted"
                                  }`}
                                >
                                  {opt}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* 答案 */}
                          <div>
                            <p className="text-xs font-semibold text-brand-faint mb-1">答案</p>
                            <p className="text-sm text-brand-ink font-body leading-relaxed bg-green-50/50 rounded-lg p-3 border border-green-100">
                              {q.answer}
                            </p>
                          </div>

                          {/* 解析 */}
                          <div>
                            <p className="text-xs font-semibold text-brand-faint mb-1">解析</p>
                            <p className="text-sm text-brand-muted font-body leading-relaxed">{q.explanation}</p>
                          </div>

                          {/* 关联知识点 */}
                          {q.relatedConceptIds.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-brand-faint mb-1">关联知识点</p>
                              <div className="flex flex-wrap gap-1">
                                {q.relatedConceptIds.map((cid) => {
                                  const concept = result?.matchedConcepts.find((c) => c.id === cid);
                                  return (
                                    <span
                                      key={cid}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-accent-electric/10 text-accent-electric font-body"
                                    >
                                      {concept?.name || cid}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 关联文献 */}
                          {q.relatedPaperIds && q.relatedPaperIds.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-brand-faint mb-1">关联文献</p>
                              {q.relatedPaperIds.map((pid) => {
                                const paper = getPaperById(pid);
                                if (!paper) return null;
                                return (
                                  <div key={pid} className="flex items-center justify-between py-1">
                                    <span className="text-xs text-brand-muted font-body">
                                      {paper.titleZh.slice(0, 40)}...
                                    </span>
                                    <button
                                      onClick={() => handleAddPaper(pid)}
                                      className="text-[10px] text-accent-electric font-medium hover:underline cursor-pointer"
                                    >
                                      加入研读
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 真实 OCR 扩展说明 */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent-amber" />
              <h3 className="font-display font-bold text-sm text-brand-ink">关于真实 OCR 扩展</h3>
            </div>
            <p className="text-xs text-brand-muted font-body leading-relaxed mb-3">
              当前版本为展示级 OCR workflow，默认使用模拟 OCR 与可编辑文本框，保证演示稳定。
              后续可扩展为：
            </p>
            <ul className="text-xs text-brand-muted font-body space-y-1 list-disc pl-4">
              <li>PaddleOCR / RapidOCR 本地服务部署</li>
              <li>百度 OCR / 阿里云 OCR 等国产 OCR API 接入</li>
              <li>后端上传图片后返回识别文本</li>
              <li>再将识别文本交给 BioMentor 知识库进行匹配和出题</li>
            </ul>
            <p className="text-xs text-brand-faint font-body mt-3">
              注意：当前不接真实 OCR API，不写入任何 API key，展示版离线可运行。
            </p>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              前往知识探索
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/paper-workbench"
              className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              文献工作台
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/research"
              className="btn-hero-secondary cursor-pointer inline-flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              科研实战
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
