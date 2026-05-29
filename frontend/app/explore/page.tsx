"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Image,
  FileText,
  X,
  Loader2,
  Send,
  User,
  Bot,
  BookOpen,
  Lightbulb,
  Sparkles,
  FileQuestion,
  ChevronRight,
  Microscope,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface UploadedFile {
  name: string;
  type: string;
  size: string;
  content: string;
}

interface KnowledgePoint {
  id: number;
  title: string;
  content: string;
}

interface StudyTip {
  id: number;
  title: string;
  content: string;
}

interface SummaryData {
  knowledgePoints: KnowledgePoint[];
  keywords: string[];
  studyTips: StudyTip[];
}

export default function ExplorePage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "你好，我是 BioMentor AI 导师，请上传教材开始学习。" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const img = document.createElement("img");
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
            }
            resolve("图片内容提取中...（实际应用中会使用OCR技术）");
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve("PDF内容提取中...（实际应用中会使用PDF解析库）");
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setIsAnalyzing(true);

    try {
      const newFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          const content = await extractTextFromFile(file);
          return {
            name: file.name,
            type: file.type.startsWith("image") ? "image" : "pdf",
            size: formatFileSize(file.size),
            content,
          };
        })
      );

      setUploadedFiles(newFiles);
      const allContent = newFiles.map((f) => f.content).join("\n\n");
      const fileName = newFiles.length > 0 ? newFiles[0].name : "";

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: allContent, fileName }),
      });

      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "教材已解析完成！我已为你提取了核心知识点和学习建议。",
          },
        ]);
      } else {
        throw new Error(result.error || "分析失败");
      }
    } catch (error) {
      console.error("分析失败:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "抱歉，教材解析失败，请重试。" },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500");
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      setSummary(null);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: Message = { role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const contextText = summary 
        ? summary.knowledgePoints.map(kp => `${kp.title}: ${kp.content}`).join("\n")
        : "暂无教材内容";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          context: contextText,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages((prev) => [...prev, { role: "ai", content: result.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "抱歉，我无法回答这个问题。" },
        ]);
      }
    } catch (error) {
      console.error("聊天失败:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "抱歉，网络错误，请重试。" },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!summary || isGeneratingQuiz) return;

    setIsGeneratingQuiz(true);

    try {
      const contentText = summary 
        ? summary.knowledgePoints.map(kp => `${kp.title}: ${kp.content}`).join("\n") + 
          "\n\n关键词: " + summary.keywords.join(", ") +
          "\n\n学习建议: " + summary.studyTips.map(st => st.content).join("\n")
        : "";

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentText }),
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem("quizData", JSON.stringify(result.data));
        router.push("/explore/quiz");
      } else {
        throw new Error(result.error || "生成练习题失败");
      }
    } catch (error) {
      console.error("生成练习题失败:", error);
      alert("生成练习题失败，请重试。");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--nav-height)+2rem)] pb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            知识探索中心
          </h1>
          <p className="text-gray-600">上传教材图片或PDF，AI帮你总结知识要点、生成练习题、提供学习建议</p>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">上传教材资料</h3>
            <span className="text-sm text-gray-500">支持图片（PNG/JPG/JPEG）和PDF文件，最大50MB</span>
          </div>
          
          <div className="flex gap-4">
            <div
              className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-gray-700 font-medium">点击或拖拽上传文件</p>
                <p className="text-gray-400 text-sm">支持 PNG, JPG, JPEG, PDF</p>
              </div>
            </div>
            
            <button
              className="flex flex-col items-center justify-center w-24 border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Image className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-gray-700 text-sm font-medium">拍照上传</span>
            </button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {file.type === "image" ? (
                      <Image className="w-8 h-8 text-blue-500" />
                    ) : (
                      <FileText className="w-8 h-8 text-purple-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 md:p-8 min-h-[520px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-800">AI知识总结</h2>
                <span className="text-sm text-gray-500">基于教材内容的智能提炼</span>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600">AI正在分析教材内容...</p>
                </div>
              ) : summary ? (
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      核心知识点
                    </h3>
                    <ul className="space-y-2">
                      {summary.knowledgePoints.map((point, index) => (
                        <li
                          key={point.id || index}
                          className="flex items-start gap-2 p-3 bg-white/50 rounded-lg"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{point.title}</p>
                            <p className="text-gray-700 text-sm">{point.content}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                      <Microscope className="w-5 h-5 text-indigo-600" />
                      重点概念
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {summary.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-100 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                      <Lightbulb className="w-5 h-5 text-orange-500" />
                      学习建议
                    </h3>
                    <ul className="space-y-3">
                      {summary.studyTips.map((tip, index) => (
                        <li
                          key={tip.id || index}
                          className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-blue-100"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 mb-1">{tip.title}</p>
                            <p className="text-gray-600 text-sm leading-relaxed">{tip.content}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                  <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-center">
                    上传教材后，AI 将自动生成知识总结
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col h-[930px] sticky top-[calc(var(--nav-height)+2rem)]">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-800">BioMentor AI 导师</h2>
                <span className="text-sm text-gray-500">随时解答你的疑问</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-2 rounded-2xl ${
                          message.role === "user"
                            ? "bg-blue-500 text-white rounded-tr-sm"
                            : "bg-white/80 text-gray-800 rounded-tl-sm shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/80 px-4 py-2 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="输入你的问题..."
                    className="flex-1 px-4 py-2.5 bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {summary && (
          <div className="mt-8 text-center">
            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileQuestion className="w-6 h-6" />
                  一键生成练习题
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* 拍照学练入口：知识探索的子模块 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 glass-card rounded-2xl">
            <Camera className="w-4 h-4 text-accent-electric" />
            <span className="text-sm text-brand-muted font-body">
              需要从课本文本直接匹配知识库并出题？
            </span>
            <Link
              href="/photo-learning"
              className="text-sm font-semibold text-accent-electric hover:text-brand-ink transition-colors inline-flex items-center gap-1"
            >
              拍照学练（高级模式）
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
