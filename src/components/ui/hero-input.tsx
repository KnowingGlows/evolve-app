"use client";

import { useRef, useEffect } from "react";

interface HeroInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}

export function HeroInput({ value, onChange, placeholder, rows = 2, autoFocus }: HeroInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={rows}
      className="w-full bg-transparent border-0 text-xl font-medium text-white placeholder-white/20 outline-none resize-none leading-snug"
    />
  );
}
