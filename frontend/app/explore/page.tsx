"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Image, FileText, X, Loader2, Send, User, Bot,
  BookOpen, Lightbulb, Sparkles, FileQuestion, ChevronRight,
  Microscope, Camera, ScanLine,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message { role: "user" | "ai"; content: string; }

interface UploadedFile { name: string; type: string; size: string; text: string; engine?: string; }

interface KnowledgePoint { id: number; title: string; content: string; }
interface StudyTip { id: number; title: string; content: string; }
interface SummaryData { knowledgePoints: KnowledgePoint[]; keywords: string[]; studyTips: StudyTip[]; ocrEngine?: string; }

const PY_BACKEND = "http://localhost:8000";

export default function ExplorePage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "你好，我是 BioMentor AI 导师。上传课本图片、PDF 或 DOCX，系统会用真实 OCR 提取文字并分析知识点。" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "ocr" | "analyzing" | "done">("idle");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /** Real OCR: send file to Python backend → get extracted text */
  const realOcr = async (file: File): Promise<{ text: string; engine: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${PY_BACKEND}/api/photo-learning/ocr`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "OCR failed" }));
      throw new Error(err.detail || "OCR 识别失败");
    }
    const data = await res.json();
    return { text: data.text, engine: data.engine };
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setIsAnalyzing(true);
    setStep("ocr");

    try {
      // Step 1: Real OCR for each file
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        setMessages((prev) => [...prev, { role: "ai", content: `正在用真实 OCR 识别 ${file.name} …` }]);
        const { text, engine } = await realOcr(file);
        newFiles.push({
          name: file.name,
          type: file.type.startsWith("image") ? "image" : file.type.includes("pdf") ? "pdf" : "doc",
          size: formatFileSize(file.size),
          text,
          engine,
        });
      }

      setUploadedFiles(newFiles);
      const allText = newFiles.map((f) => f.text).join("\n\n");
      const fileName = newFiles[0]?.name || "";

      // Step 2: AI analysis via Next.js API (DeepSeek)
      setStep("analyzing");
      setMessages((prev) => [...prev, { role: "ai", content: "OCR 完成！正在用 AI 分析知识点…" }]);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: allText, fileName }),
      });

      const result = await response.json();
      if (result.success) {
        setSummary({ ...result.data, ocrEngine: newFiles[0]?.engine });
        setMessages((prev) => [...prev, {
          role: "ai",
          content: `教材解析完成！已提取 ${result.data.knowledgePoints?.length || 0} 个核心知识点和 ${result.data.keywords?.length || 0} 个关键词。（OCR 引擎：${newFiles.map((f) => f.engine).join(", ")}）`,
        }]);
      } else {
        throw new Error(result.error || "分析失败");
      }
      setStep("done");
    } catch (error) {
      console.error("分析失败:", error);
      setMessages((prev) => [...prev, { role: "ai", content: `抱歉，处理失败：${error instanceof Error ? error.message : "未知错误"}。请确认 Python 后端 (localhost:8000) 已启动。` }]);
      setStep("idle");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); };
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) setSummary(null);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: Message = { role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput(""); setIsChatLoading(true);
    try {
      const contextText = summary
        ? summary.knowledgePoints.map((kp) => `${kp.title}: ${kp.content}`).join("\n")
        : "暂无教材内容";
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput.trim(), context: contextText }),
      });
      const result = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: result.success ? result.message : "抱歉，回答失败。" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "抱歉，网络错误。" }]);
    } finally { setIsChatLoading(false); }
  };

  const handleGenerateQuiz = async () => {
    if (!summary || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    try {
      const contentText = summary.knowledgePoints.map((kp) => `${kp.title}: ${kp.content}`).join("\n")
        + "\n\n关键词: " + summary.keywords.join(", ");
      const response = await fetch("/api/generate-quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentText }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem("quizData", JSON.stringify(result.data));
        router.push("/explore/quiz");
      }
    } catch (error) {
      console.error("生成练习题失败:", error);
      alert("生成练习题失败，请重试。");
    } finally { setIsGeneratingQuiz(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+2rem)] pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-electric/8 text-accent-electric text-[11px] font-semibold font-body mb-4">
            <ScanLine className="w-3 h-3" />
            真实 OCR + AI 分析
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            知识探索中心
          </h1>
          <p className="text-gray-600">
            上传教材图片或 PDF，真实 OCR 提取文字，AI 总结知识要点、生成练习题、提供学习建议
          </p>
          <p className="text-xs text-gray-400 mt-1">
            OCR 引擎：PDF → PyMuPDF | 图片 → DeepSeek Vision | DOCX → python-docx
          </p>
        </div>

        {/* Upload Area */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">上传教材资料</h3>
            <span className="text-sm text-gray-500">支持图片（PNG/JPG）、PDF、DOCX，最大 50MB</span>
          </div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" className="hidden"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple onChange={(e) => handleFileUpload(e.target.files)} />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-700 font-medium">点击或拖拽上传文件</p>
              <p className="text-gray-400 text-sm">PNG, JPG, PDF, DOCX — 真实 OCR</p>
            </div>
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {file.type === "image" ? <Image className="w-8 h-8 text-blue-500" />
                      : file.type === "pdf" ? <FileText className="w-8 h-8 text-red-500" />
                      : <FileText className="w-8 h-8 text-purple-500" />}
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.size}{file.engine ? ` · OCR: ${file.engine}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(index)} className="p-2 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {isAnalyzing && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="glass-card rounded-2xl p-6 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-700 font-medium">
                {step === "ocr" ? "正在进行真实 OCR 识别…" : "AI 正在分析教材内容…"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {step === "ocr" ? "PDF 用 PyMuPDF，图片用 DeepSeek Vision" : "调用 DeepSeek 大模型分析"}
              </p>
            </div>
          </div>
        )}

        {/* Results grid */}
        {!isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 md:p-8 min-h-[520px] flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-gray-800">AI知识总结</h2>
                  {summary?.ocrEngine && <span className="text-xs text-gray-400">· OCR: {summary.ocrEngine}</span>}
                </div>

                {summary ? (
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                        <Sparkles className="w-5 h-5 text-yellow-500" /> 核心知识点
                      </h3>
                      <ul className="space-y-2">
                        {summary.knowledgePoints.map((point, index) => (
                          <li key={point.id || index} className="flex items-start gap-2 p-3 bg-white/50 rounded-lg">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">{index + 1}</span>
                            <div><p className="font-medium text-gray-800">{point.title}</p><p className="text-gray-700 text-sm">{point.content}</p></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                        <Microscope className="w-5 h-5 text-indigo-600" /> 重点概念
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.keywords.map((keyword, index) => (
                          <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-100 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">{keyword}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                        <Lightbulb className="w-5 h-5 text-orange-500" /> 学习建议
                      </h3>
                      <ul className="space-y-3">
                        {summary.studyTips.map((tip, index) => (
                          <li key={tip.id || index} className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1"><p className="font-semibold text-gray-800 mb-1">{tip.title}</p><p className="text-gray-600 text-sm leading-relaxed">{tip.content}</p></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-center">上传教材后，系统将用真实 OCR 提取文字并分析</p>
                    <Link href="/photo-learning" className="mt-4 inline-flex items-center gap-2 text-sm text-accent-electric hover:text-brand-ink transition-colors">
                      <Camera className="w-4 h-4" /> 或使用拍照学练（高级模式）
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* AI Tutor Chat */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col h-[560px] sticky top-[calc(var(--nav-height)+2rem)]">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-blue-500" /><h2 className="font-semibold text-gray-800">AI 导师</h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"}`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-500 text-white rounded-tr-sm" : "bg-white/80 text-gray-800 rounded-tl-sm shadow-sm"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                      <div className="bg-white/80 px-4 py-2 rounded-2xl rounded-tl-sm"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="向AI导师提问…" disabled={isChatLoading}
                      className="flex-1 px-4 py-2.5 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <button onClick={handleSendChat} disabled={!chatInput.trim() || isChatLoading}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Quiz button */}
        {summary && !isAnalyzing && (
          <div className="mt-8 text-center">
            <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50">
              {isGeneratingQuiz ? <><Loader2 className="w-5 h-5 animate-spin" /> 生成中…</> : <><FileQuestion className="w-6 h-6" /> 一键生成练习题 <ChevronRight className="w-5 h-5" /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
