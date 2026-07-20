"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  customOptionLabel?: string;
}

export default function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Pilih data...",
  customOptionLabel = "Lainnya (isi custom)",
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(
    value !== "" && !options.includes(value)
  );
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reposisi saat scroll/resize agar dropdown tetap menempel ke tombol
  useEffect(() => {
    if (!open) return;
    function reposition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(opt: string) {
    if (opt === customOptionLabel) {
      setIsCustomMode(true);
      onChange("");
    } else {
      setIsCustomMode(false);
      onChange(opt);
    }
    setOpen(false);
    setQuery("");
  }

  if (isCustomMode) {
    return (
      <div className="space-y-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis data yang dirubah..."
          className="input"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setIsCustomMode(false);
            onChange("");
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          ← Pilih dari daftar
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
              width: rect.width,
            });
          }
          setOpen((v) => !v);
        }}
        className="input flex items-center justify-between text-left"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {typeof document !== "undefined" &&
        open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: Math.max(coords.width, 240),
              zIndex: 1000,
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full text-sm outline-none bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">Tidak ditemukan</p>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-950 ${
                      opt === value ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={() => handleSelect(customOptionLabel)}
                className="w-full text-left px-3 py-2 text-sm text-amber-600 dark:text-amber-400 font-medium border-t border-slate-100 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                {customOptionLabel}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}