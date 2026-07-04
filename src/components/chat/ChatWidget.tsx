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
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-medium text-sm">Asisten Virtual</span>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="bg-slate-100 text-slate-500 text-sm rounded-lg px-3 py-2 w-fit">
                Mengetik...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-2 flex gap-2">
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
              className="bg-blue-600 text-white rounded-lg px-3 hover:bg-blue-700 disabled:opacity-60"
              aria-label="Kirim"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
        aria-label="Buka chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
