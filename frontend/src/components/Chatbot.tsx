"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../lib/theme/ThemeContext";
import type { ChatMessage } from "../lib/types";

interface ChatbotProps {
  patientId?: string | null;
}

function renderMarkdown(text: string): string {
  const withBullets = text.replace(/^• (.*$)/gm, '<li class="ml-4 list-disc">$1</li>');
  const withDisclaimer = withBullets.replace(/^⚠ (.*$)/gm, '<div class="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-amber-700 dark:text-amber-300 text-xs">⚠ $1</div>');
  const withBold = withDisclaimer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const withItalic = withBold.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Wrap consecutive <li> elements in <ul>
  return withItalic.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, '<ul class="space-y-1 my-1">$1</ul>');
}

export function Chatbot({ patientId }: ChatbotProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "**Namaste! I'm SehatAI Clinical Assistant.** 🩺\n\nI provide clinical decision **support** — suggestions for you to evaluate.\n\n• Disease protocols (DM, HTN, TB, ANC)\n• Drug interaction checks\n• ICD-11 coding reference\n• ABHA workflow help\n\nWhat clinical question can I help with?\n\n⚠ *All outputs are suggestions. Please verify with your clinical judgment.*",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          patient_id: patientId || null,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again.\n\n⚠ *SehatAI is a clinical decision support tool. It does not replace professional medical judgment.*" }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, patientId]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-white shadow-xl shadow-blue-300/40 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/50"
          title="Chat with SehatAI"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {patientId && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
              AI
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border shadow-2xl ${isDark ? "border-halo-border bg-halo-sidebar shadow-black/50" : "border-slate-200 bg-white shadow-slate-300/50"}`} style={{ height: "520px" }}>
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">SehatAI Assistant</h3>
                <p className="text-[10px] text-white/70">
                  {patientId ? `Context: ${patientId}` : "Clinical decision support"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#2563EB] text-white rounded-br-md"
                    : isDark ? "bg-halo-card text-halo-text rounded-bl-md" : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div
                      className="whitespace-pre-wrap [&_strong]:font-semibold [&_strong]:text-inherit [&_em]:italic [&_em]:text-inherit [&_ul]:my-1 [&_li]:ml-4 [&_li]:list-disc"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${isDark ? "bg-halo-card" : "bg-slate-100"}`}>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer Banner */}
          <div className={`px-4 py-2 border-t ${isDark ? "border-halo-border bg-amber-900/10" : "border-amber-100 bg-amber-50"}`}>
            <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-medium">
              AI suggestions only — final decisions rest with the physician
            </p>
          </div>

          {/* Input */}
          <div className={`border-t px-4 py-3 ${isDark ? "border-halo-border" : "border-slate-100"}`}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about patient, drugs, ABHA..."
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                  isDark
                    ? "border-halo-border bg-halo-card text-white focus:border-[#5b6ee1] focus:ring-[#5b6ee1]/30"
                    : "border border-slate-200 bg-slate-50 text-slate-900 focus:border-[#2563EB] focus:ring-blue-100"
                }`}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
