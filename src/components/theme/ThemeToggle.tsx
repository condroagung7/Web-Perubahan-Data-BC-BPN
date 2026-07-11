"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Ganti mode gelap/terang"
      className="grid place-items-center h-9 w-9 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}