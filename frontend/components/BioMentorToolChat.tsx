"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import type {
  BioToolName,
  ToolChatMessage,
  ToolContextSummary,
  ToolAiResponse,
} from "@/lib/tool-ai-types";

interface BioMentorToolChatProps {
  tool: BioToolName;
  title: string;
  context: ToolContextSummary;
  contextKey: string;
  emptyState?: string;
  quickQuestions?: string[];
  autoGenerate?: boolean;
}

const TOOL_ASSISTANT_LABELS: Record<BioToolName, string> = {
  protein: "蛋白结构助手",
  plasmid: "质粒实验助手",
  sequence: "序列分析助手",
  pathway: "通路机制助手",
};

export default function BioMentorToolChat({
  tool,
  title,
  context,
  contextKey,
  emptyState,
  quickQuestions = [],
  autoGenerate = true,
}: BioMentorToolChatProps) {
  const [messages, setMessages] = useState<ToolChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();
  const initialCacheRef = useRef<Map<string, ToolChatMessage>>(new Map());
  const prevContextKeyRef = useRef<string>("");

  const assistantLabel = TOOL_ASSISTANT_LABELS[tool];

  const fetchAiResponse = useCallback(
    async (mode: "initial" | "question", question?: string) => {
      setIsLoading(true);
      setErrorText("");

      try {
        const res = await fetch("/api/ai/tool-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool,
            mode,
            question,
            context,
          }),
        });

        if (!res.ok) {
          setErrorText("暂时无法连接到 AI 助手，请稍后重试。");
          return;
        }

        const data: ToolAiResponse = await res.json();
        const assistantMsg: ToolChatMessage = {
          role: "assistant",
          content: data.answer,
          quickQuestions: data.quickQuestions,
        };

        startTransition(() => {
          setMessages((prev) => [...prev, assistantMsg]);
        });

        if (mode === "initial") {
          initialCacheRef.current.set(contextKey, assistantMsg);
        }
      } catch {
        setErrorText("网络连接异常，请检查网络后重试。");
      } finally {
        setIsLoading(false);
      }
    },
    [tool, context, contextKey],
  );

  useEffect(() => {
    if (!autoGenerate) return;
    if (!contextKey) return;
    if (contextKey === prevContextKeyRef.current) return;

    prevContextKeyRef.current = contextKey;

    const cached = initialCacheRef.current.get(contextKey);
    if (cached) {
      setMessages([cached]);
      return;
    }

    setMessages([]);
    fetchAiResponse("initial");
  }, [contextKey, autoGenerate, fetchAiResponse]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ToolChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    fetchAiResponse("question", trimmed);
  }, [input, isLoading, fetchAiResponse]);

  const handleQuickQuestion = useCallback(
    (q: string) => {
      if (isLoading) return;
      const userMsg: ToolChatMessage = { role: "user", content: q };
      setMessages((prev) => [...prev, userMsg]);
      fetchAiResponse("question", q);
    },
    [isLoading, fetchAiResponse],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const displayEmpty = emptyState || `选择${title}后，BioMentor AI 将为您生成智能讲解。`;

  return (
    <div className="liquid-card p-5 xl:sticky xl:top-24 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent-electric" />
        <h3 className="text-base font-semibold text-brand-ink">BioMentor AI</h3>
        <span className="text-xs text-brand-muted ml-auto">{assistantLabel}</span>
      </div>

      <div className="space-y-3 min-h-[200px] max-h-[460px] overflow-y-auto mb-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-brand-muted text-center py-8">{displayEmpty}</p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <Bot className="w-4 h-4 mt-1 text-accent-electric shrink-0" />
            )}
            <div
              className={`text-sm leading-relaxed rounded-xl px-4 py-2.5 max-w-[85%] ${
                msg.role === "assistant"
                  ? "bg-white/60 text-brand-ink"
                  : "bg-brand-ink text-white"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && msg.quickQuestions && msg.quickQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.quickQuestions.map((q, qi) => (
                    <button
                      key={qi}
                      onClick={() => handleQuickQuestion(q)}
                      disabled={isLoading}
                      className="text-xs px-2.5 py-1 rounded-full bg-accent-electric/10 text-accent-electric hover:bg-accent-electric/20 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <User className="w-4 h-4 mt-1 text-brand-muted shrink-0" />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <Bot className="w-4 h-4 mt-1 text-accent-electric shrink-0" />
            <div className="bg-white/60 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-muted" />
              <span className="text-sm text-brand-muted">正在生成讲解...</span>
            </div>
          </div>
        )}

        {errorText && (
          <p className="text-sm text-rose-500 text-center py-2">{errorText}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          disabled={isLoading}
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-white/20 bg-white/40 text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-accent-electric/50 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-accent-electric text-white hover:bg-accent-electric/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
