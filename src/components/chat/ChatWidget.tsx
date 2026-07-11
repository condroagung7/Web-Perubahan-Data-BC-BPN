"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import type { ChatMessage } from "@/types/database";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Halo! Saya asisten virtual layanan Permohonan Perubahan Data. Ada yang bisa saya bantu?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function openChat() {
      setOpen(true);
    }

    window.addEventListener("open-ai-chat", openChat);
    return () => window.removeEventListener("open-ai-chat", openChat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const json = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "model", text: json.reply ?? "Maaf, terjadi kesalahan." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Maaf, terjadi kesalahan saat menghubungi asisten." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-112 w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <span className="text-sm font-medium">Asisten Virtual</span>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Mengetik...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-2 dark:border-slate-800">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Tulis pertanyaan..."
              className="input flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700 disabled:opacity-60"
              aria-label="Kirim"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-blue-600 p-4 text-white shadow-lg transition hover:bg-blue-700"
        aria-label="Buka chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
