"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, ArrowRight, FlaskConical, BarChart3, Send, Bot, User, Sparkles, Target, Lightbulb, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message { role: "user" | "ai"; content: string; }

const phases = [
  { num: 1, title: "文献调研", icon: <BookOpen className="w-5 h-5" />, description: "AI 帮你检索知识库文献，提取关键信息，构建研究框架" },
  { num: 2, title: "实验设计", icon: <FlaskConical className="w-5 h-5" />, description: "基于文献调研，AI 辅助设计实验方案、优化参数" },
  { num: 3, title: "数据分析", icon: <BarChart3 className="w-5 h-5" />, description: "AI 辅助数据处理、可视化展示、报告撰写" },
];

const PY = "http://localhost:8000";

export default function ResearchPage() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "欢迎进入科研实战训练营！我可以帮你从知识库中选择文献、设计实验方案。请告诉我你想研究哪个方向？例如：CRISPR基因编辑、mRNA递送、单细胞分析等。" },
  ]);
  const [tasks, setTasks] = useState<{ id: string; title: string; difficulty: string; knowledge_point: string; steps: string[] }[]>([]);
  const [papers, setPapers] = useState<{ id: number; title_zh: string; venue: string; year: number; reading_difficulty: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    Promise.all([
      fetch(`${PY}/api/research/tasks`).then(r => r.json()).catch(() => []),
      fetch(`${PY}/api/research/papers?page_size=6`).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([t, p]) => {
      setTasks(Array.isArray(t) ? t.slice(0, 8) : []);
      setPapers((p.items || []).slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const um: Message = { role: "user", content: chatInput.trim() };
    setMessages(p => [...p, um]); setChatInput("");
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: um.content, context: "科研实战训练" }) })
      .then(r => r.json()).then(d => setMessages(p => [...p, { role: "ai", content: d.success ? d.message : "回答失败" }]))
      .catch(() => setMessages(p => [...p, { role: "ai", content: "网络错误" }]));
  };

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="text-center mb-12">
          <h1 className="font-display font-extrabold text-brand-ink leading-[1.1] tracking-[-0.03em] mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>科研实战训练营</h1>
          <p className="text-brand-muted text-base md:text-lg font-body max-w-xl mx-auto">AI 导师全程陪伴式指导，从文献调研到实验设计再到数据分析</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {phases.map(p => (
            <div key={p.num} className="glass-card rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-xl bg-brand-ink/5 flex items-center justify-center text-lg font-bold font-display text-brand-ink">{p.num}</span>
                <div className="w-9 h-9 rounded-xl bg-brand-ink/5 flex items-center justify-center">{p.icon}</div>
              </div>
              <h3 className="font-display text-lg font-bold text-brand-ink mb-2">{p.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed flex-1">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-brand-ink mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent-electric" />知识库文献 ({papers.length} 篇)</h2>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <div className="space-y-3">
                  {papers.map(p => (
                    <Link key={p.id} href="/explore" className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-black/5 hover:border-accent-electric/20 transition-all">
                      <div><p className="text-sm font-semibold text-brand-ink">{p.title_zh}</p><p className="text-xs text-brand-muted">{p.venue} · {p.year} · {p.reading_difficulty}</p></div>
                      <ChevronRight className="w-4 h-4 text-brand-faint" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-brand-ink mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-accent-cyan" />科研任务卡</h2>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <div className="space-y-3">
                  {tasks.map(t => (
                    <div key={t.id} className="p-4 rounded-xl bg-white/40 border border-black/5 hover:border-accent-cyan/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-brand-ink">{t.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.difficulty==="easy"?"bg-green-100 text-green-700":t.difficulty==="hard"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                          {t.difficulty==="easy"?"入门":t.difficulty==="hard"?"挑战":"进阶"}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted">知识点：{t.knowledge_point}</p>
                      {t.steps?.length>0 && <p className="text-xs text-brand-faint mt-1">步骤：{t.steps.slice(0,3).join(" → ")}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-5 flex flex-col h-full min-h-[500px] sticky top-[calc(var(--nav-height)+2rem)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-amber to-accent-electric flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                <div><h3 className="font-display font-bold text-sm text-brand-ink">AI 科研导师</h3><p className="text-xs text-brand-muted">实时指导与答疑</p></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role==="user"?"flex-row-reverse":""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role==="ai"?"bg-gradient-to-br from-accent-amber to-accent-electric":"bg-brand-ink"}`}>
                      {msg.role==="ai"?<Bot className="w-3.5 h-3.5 text-white" />:<User className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role==="ai"?"bg-white/60 border border-black/5 rounded-tl-md text-brand-ink":"bg-brand-ink text-white rounded-tr-md"}`}>{msg.content}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSendChat()} placeholder="向AI科研导师提问..." className="flex-1 h-10 px-4 rounded-xl bg-white/40 border border-black/5 text-sm outline-none" />
                <button onClick={handleSendChat} disabled={!chatInput.trim()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-ink text-white disabled:opacity-30"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/explore" className="btn-hero-secondary cursor-pointer inline-flex"><Lightbulb className="w-4 h-4" /> 去知识探索找文献<ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </div>
  );
}
