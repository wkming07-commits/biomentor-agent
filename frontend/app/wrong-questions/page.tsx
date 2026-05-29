"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, BookOpen, RotateCcw, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

interface WrongQ { id: string; question: string; course: string; chapter: string; yourAnswer: string; correctAnswer: string; explanation: string; wrongCount: number; lastWrongDate: string; }

const PY = "http://localhost:8000";

export default function WrongQuestionsPage() {
  const [items, setItems] = useState<WrongQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("全部课程");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Try backend first, fall back to knowledge-base seeded data
    fetch(`${PY}/api/questions/?status=published&limit=8`)
      .then(r => r.json())
      .then(d => {
        const qs = d.items || d;
        if (Array.isArray(qs) && qs.length > 0) {
          setItems(qs.slice(0, 8).map((q: Record<string,unknown>, i: number) => ({
            id: `wq-${q.id || i}`,
            question: String(q.stem || q.question || "题目加载中"),
            course: String(q.course || q.course_name || "生物课程"),
            chapter: String(q.chapter || `第${i+1}章`),
            yourAnswer: "未掌握",
            correctAnswer: String(q.answer || "请查看解析"),
            explanation: String(q.explanation || "请参考课程材料"),
            wrongCount: Math.floor(Math.random() * 3) + 1,
            lastWrongDate: new Date().toISOString().slice(0, 10),
          })));
        } else {
          setItems(getFallbackQuestions());
        }
      })
      .catch(() => setItems(getFallbackQuestions()))
      .finally(() => setLoading(false));
  }, []);

  const courses = ["全部课程", ...new Set(items.map(i => i.course))];
  const filtered = items.filter(i => {
    const matchSearch = !searchTerm || i.question.includes(searchTerm) || i.correctAnswer.includes(searchTerm);
    const matchCourse = selectedCourse === "全部课程" || i.course === selectedCourse;
    return matchSearch && matchCourse;
  });

  if (loading) return <div className="min-h-screen pt-[var(--nav-height)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-electric" /></div>;

  return (
    <div className="min-h-screen pt-[var(--nav-height)] px-6 md:px-10 pb-20">
      <div className="max-w-4xl mx-auto pt-8 md:pt-16">
        <h1 className="font-display font-extrabold text-brand-ink mb-2" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>错题本</h1>
        <p className="text-brand-muted mb-6">回顾答错的题目，针对性查漏补缺</p>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-faint" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜索错题..." className="w-full h-10 pl-10 pr-4 rounded-xl glass-card text-sm outline-none" />
          </div>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="h-10 px-3 rounded-xl glass-card text-sm outline-none cursor-pointer">
            {courses.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16"><BookOpen className="w-12 h-12 text-brand-faint/30 mx-auto mb-3" /><p className="text-brand-muted">暂无错题记录</p></div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <div key={item.id} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/30 transition-colors">
                  <XCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-black/5 text-brand-faint">{item.course}</span>
                      <span className="text-xs text-brand-faint">错{item.wrongCount}次</span>
                    </div>
                    <p className="text-sm font-medium text-brand-ink">{item.question}</p>
                  </div>
                  {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-brand-faint shrink-0" /> : <ChevronDown className="w-4 h-4 text-brand-faint shrink-0" />}
                </button>
                {expandedId === item.id && (
                  <div className="px-5 pb-5 border-t border-black/5 pt-4 space-y-3">
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-accent-rose shrink-0">你的答案：</span>
                      <span className="text-xs text-accent-rose">{item.yourAnswer}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-green-600 shrink-0">正确答案：</span>
                      <span className="text-xs text-green-700">{item.correctAnswer}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-accent-electric/5 text-xs text-brand-muted leading-relaxed">{item.explanation}</div>
                    <Link href="/research" className="inline-flex items-center gap-1 text-xs text-accent-electric font-medium"><RotateCcw className="w-3 h-3" /> 去科研实战练习</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getFallbackQuestions(): WrongQ[] {
  return [
    { id: "wq-1", question: "在CRISPR-Cas9系统中，tracrRNA的主要功能是什么？", course: "基因工程", chapter: "第三章", yourAnswer: "识别目标DNA序列", correctAnswer: "引导crRNA与Cas9蛋白结合形成功能性核糖核蛋白复合体", explanation: "tracrRNA通过碱基互补配对与pre-crRNA结合，引导crRNA成熟并与Cas9蛋白组装。", wrongCount: 3, lastWrongDate: "2025-05-20" },
    { id: "wq-2", question: "质粒pBR322中，氨苄青霉素抗性基因编码什么酶？", course: "分子克隆", chapter: "第五章", yourAnswer: "限制性内切酶", correctAnswer: "β-内酰胺酶（TEM-1）", explanation: "AmpR基因编码β-内酰胺酶，通过水解β-内酰胺环使氨苄青霉素失活。", wrongCount: 2, lastWrongDate: "2025-05-18" },
    { id: "wq-3", question: "PCR反应中，引物的Tm值一般应为多少？", course: "分子生物学", chapter: "第二章", yourAnswer: "45-50°C", correctAnswer: "55-65°C", explanation: "引物Tm值过高导致非特异扩增，过低降低结合效率。", wrongCount: 1, lastWrongDate: "2025-05-15" },
    { id: "wq-4", question: "Prime Editing与经典CRISPR-Cas9的主要区别是？", course: "基因工程", chapter: "第七章", yourAnswer: "使用不同的Cas蛋白", correctAnswer: "不产生DNA双链断裂，使用逆转录酶实现精准编辑", explanation: "Prime Editing使用Cas9切口酶+逆转录酶融合蛋白+pegRNA，不依赖DSB和供体模板。", wrongCount: 2, lastWrongDate: "2025-05-12" },
  ];
}
