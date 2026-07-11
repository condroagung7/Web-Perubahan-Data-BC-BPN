"use client";

import { ArrowRight } from "lucide-react";

export default function ChatOpenButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}
      className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs font-black text-white transition group-hover:border-[#E8A83C] group-hover:text-[#E8A83C]"
    >
      {label}
      <ArrowRight size={14} className="transition group-hover:translate-x-1" />
    </button>
  );
}
