"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, ChevronUp, FileText, SendHorizonal, Upload } from "lucide-react";

import { annotatePlasmidViaApi } from "@/lib/bioToolApi";
import { circularFeaturePath, parseGenBankFeatures, plasmidExamples } from "@/lib/biotools.mjs";

type PlasmidKey = keyof typeof plasmidExamples;

const quizChoices = [
  { value: "a", label: "A. ori 决定复制宿主范围，抗性基因决定筛选条件" },
  { value: "b", label: "B. promoter 决定质粒能否复制" },
  { value: "c", label: "C. terminator 决定抗生素种类" },
];

export default function PlasmidPage() {
  const [selectedPlasmid, setSelectedPlasmid] = useState<PlasmidKey>("pBR322");
  const [uploadedName, setUploadedName] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [annotationEngine, setAnnotationEngine] = useState("前端 GenBank parser");
  const [chatInput, setChatInput] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basePlasmid = plasmidExamples[selectedPlasmid];
  const parsedFeatures = useMemo(
    () => (uploadedText ? parseGenBankFeatures(uploadedText, basePlasmid.length) : basePlasmid.features),
    [basePlasmid.features, basePlasmid.length, uploadedText],
  );
  const plasmidLength = uploadedText ? Math.max(basePlasmid.length, ...parsedFeatures.map((f) => f.end)) : basePlasmid.length;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setUploadedName(file.name);
    setUploadedText(text);
    const apiResult = await annotatePlasmidViaApi(text, basePlasmid.length);
    setAnnotationEngine(apiResult?.engine || "前端 GenBank parser fallback");
  }

  const handleQuizSubmit = () => {
    if (quizAnswer) setQuizSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] flex flex-col px-6 md:px-10 pb-10 font-body">
      <div className="flex flex-col lg:flex-row flex-1 gap-6" style={{ minHeight: 0 }}>
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={selectedPlasmid}
                onChange={(e) => {
                  setSelectedPlasmid(e.target.value as PlasmidKey);
                  setUploadedText("");
                  setUploadedName("");
                }}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all appearance-none"
              >
                {Object.keys(plasmidExamples).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="absolute left-0 -top-5 text-[11px] text-brand-faint">选择示例质粒</span>
            </div>
            <input ref={fileInputRef} type="file" accept=".gb,.gbk,.genbank,.txt,.fasta,.fa" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-ink hover:bg-white/50 transition-all"
            >
              <Upload className="w-4 h-4" />
              上传 GenBank/FASTA
            </button>
          </div>

          <div className="glass-card flex flex-col lg:flex-row items-center justify-center gap-6 p-6 flex-shrink-0">
            <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 390, height: "auto" }} xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="165" fill="#111827" />
              <circle cx="200" cy="200" r="140" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 8" />
              {parsedFeatures.map((feature) => (
                <path
                  key={`${feature.label}-${feature.start}-${feature.end}`}
                  d={circularFeaturePath(feature, plasmidLength)}
                  stroke={feature.color}
                  strokeWidth="26"
                  fill="none"
                  strokeLinecap="butt"
                />
              ))}
              <circle cx="200" cy="200" r="7" fill="#e5e7eb" />
              <text x="200" y="194" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700" fontFamily="system-ui, sans-serif">
                {uploadedName || basePlasmid.name}
              </text>
              <text x="200" y="218" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontFamily="system-ui, sans-serif">
                {plasmidLength} bp
              </text>
            </svg>

            <div className="w-full lg:max-w-xs space-y-3">
              <div className="rounded-xl bg-white/50 border border-white/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink mb-2">
                  <FileText className="w-4 h-4" />
                  {uploadedName ? "上传文件解析" : "示例质粒注释"}
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">{uploadedName ? `已从上传文本中解析 GenBank FEATURES；注释引擎：${annotationEngine}。如果是 FASTA，会生成基础序列轨道。` : basePlasmid.notes}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass-card p-3"><span className="text-brand-faint">宿主</span><div className="font-semibold text-brand-ink mt-1">{basePlasmid.host}</div></div>
                <div className="glass-card p-3"><span className="text-brand-faint">特征数</span><div className="font-semibold text-brand-ink mt-1">{parsedFeatures.length}</div></div>
              </div>
              <div className="rounded-xl bg-[rgba(37,99,235,0.04)] border border-[rgba(37,99,235,0.1)] p-3 text-[11px] text-brand-muted leading-relaxed">
                接入定位：当前前端实现 GenBank/FASTA 解析与环形图谱；后端后续可把上传序列交给 pLannotate 生成标准注释，再交给 OVE/SeqViz 做可编辑视图。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 py-1">
            {parsedFeatures.map((f) => (
              <div key={`${f.label}-legend`} className="flex items-center gap-1.5 rounded-lg bg-white/40 border border-white/50 px-2.5 py-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                <span className="text-xs text-brand-muted truncate" title={`${f.type}: ${f.start}..${f.end}`}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-[2] glass-card flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/60">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
              <Bot className="w-4 h-4 text-accent-electric" />
            </div>
            <span className="font-display text-sm font-semibold text-brand-ink">AI 实验设计讲解</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ minHeight: 0 }}>
            <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[rgba(13,13,26,0.04)] text-brand-ink">
              我识别到 {parsedFeatures.map((f) => f.label).slice(0, 6).join("、")} 等元件。课堂上可以继续追问：宿主范围、筛选抗生素、插入片段是否破坏 CDS、以及应选择哪些酶切位点。
            </div>
            <div className="rounded-xl p-4 bg-white/45 border border-white/60 text-xs text-brand-muted leading-relaxed">
              <div className="font-semibold text-brand-ink mb-2">功能接入状态</div>
              <ul className="space-y-1 list-disc pl-4">
                <li>支持上传 GenBank/FASTA 文本并即时解析。</li>
                <li>圆形质粒图谱由真实 feature 坐标生成。</li>
                <li>保留 pLannotate / OVE 接入位，适合后端继续增强自动注释。</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-white/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="输入你的问题..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur border border-white/80 text-brand-ink placeholder:text-brand-faint outline-none focus:border-accent-electric/30 focus:ring-2 focus:ring-accent-electric/10 transition-all"
              />
              <button className="inline-flex items-center justify-center p-2.5 rounded-xl bg-brand-ink text-white hover:bg-[#1a1a2e] transition-all duration-200">
                <SendHorizonal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card mt-4 overflow-hidden">
        <button onClick={() => setQuizOpen(!quizOpen)} className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium hover:bg-white/30 transition-colors text-brand-ink">
          <span>验证理解</span>
          {quizOpen ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
        </button>
        {quizOpen && (
          <div className="px-6 pb-5">
            <p className="font-body text-sm font-medium mb-4 text-brand-ink">质粒图谱中，ori 和抗性基因分别主要决定什么？</p>
            <div className="space-y-2.5 mb-4">
              {quizChoices.map((opt) => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${quizSubmitted && opt.value === "a" ? "bg-[#ecfdf5] border border-[#059669]/20" : quizSubmitted && quizAnswer === opt.value && opt.value !== "a" ? "bg-[#fef2f2] border border-[#dc2626]/20" : quizAnswer === opt.value ? "bg-[rgba(37,99,235,0.04)] border border-[#2563eb]/20" : "bg-white/40 border border-transparent hover:bg-white/70"}`}>
                  <input type="radio" name="plasmid-quiz" value={opt.value} checked={quizAnswer === opt.value} onChange={(e) => setQuizAnswer(e.target.value)} disabled={quizSubmitted} />
                  <span className="text-sm font-body text-brand-ink">{opt.label}</span>
                  {quizSubmitted && opt.value === "a" && <span className="badge badge-electric ml-auto">正确</span>}
                </label>
              ))}
            </div>
            <button onClick={handleQuizSubmit} disabled={!quizAnswer || quizSubmitted} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-ink text-white hover:bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">提交</button>
          </div>
        )}
      </div>
    </div>
  );
}
