"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";

interface ComboboxProps {
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
  label?: string;
}

export function Combobox({ value, suggestions, onChange, placeholder, allowCreate = true }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()) && s !== value);
  const exactMatch = suggestions.some((s) => s.toLowerCase() === query.toLowerCase());
  const showCreate = allowCreate && query.trim() && !exactMatch;

  const handleSelect = (val: string) => {
    onChange(val);
    setQuery(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleSelect(query); }
            if (e.key === "Escape") setOpen(false);
          }}
          onBlur={() => { setTimeout(() => onChange(query), 100); }}
          placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute left-0 right-0 mt-1 bg-[#161620] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-violet-500/10 hover:text-violet-300 transition-colors flex items-center justify-between"
            >
              <span>{s}</span>
              {value === s && <Check size={14} className="text-violet-400" />}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() => handleSelect(query.trim())}
              className="w-full text-left px-4 py-2.5 text-sm text-emerald-400/80 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 border-t border-white/[0.04]"
            >
              <Plus size={14} />
              Create &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
