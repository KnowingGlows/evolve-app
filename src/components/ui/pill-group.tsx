"use client";

import { ReactNode } from "react";

interface PillOption {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface PillGroupProps {
  value: string;
  options: PillOption[];
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  size?: "sm" | "md";
}

const defaultColors: Record<string, string> = {
  idea: "data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-300 data-[active=true]:border-amber-500/30",
  testing: "data-[active=true]:bg-violet-500/15 data-[active=true]:text-violet-300 data-[active=true]:border-violet-500/30",
  learning: "data-[active=true]:bg-blue-500/15 data-[active=true]:text-blue-300 data-[active=true]:border-blue-500/30",
  done: "data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-300 data-[active=true]:border-emerald-500/30",
  winning: "data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-300 data-[active=true]:border-emerald-500/30",
  losing: "data-[active=true]:bg-red-500/15 data-[active=true]:text-red-300 data-[active=true]:border-red-500/30",
  "in progress": "data-[active=true]:bg-violet-500/15 data-[active=true]:text-violet-300 data-[active=true]:border-violet-500/30",
  default: "data-[active=true]:bg-violet-500/15 data-[active=true]:text-violet-300 data-[active=true]:border-violet-500/30",
};

export function PillGroup({ value, options, onChange, allowEmpty, size = "md" }: PillGroupProps) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        const colorKey = opt.color || opt.value.toLowerCase();
        const colorClass = defaultColors[colorKey] || defaultColors.default;
        return (
          <button
            key={opt.value}
            type="button"
            data-active={active}
            onClick={() => onChange(allowEmpty && active ? "" : opt.value)}
            className={`${sizeClass} rounded-full border font-medium transition-all flex items-center gap-2
              border-white/[0.08] bg-white/[0.02] text-white/40
              hover:border-white/15 hover:text-white/70
              ${colorClass}
            `}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
