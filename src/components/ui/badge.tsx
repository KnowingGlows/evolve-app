const variants: Record<string, string> = {
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  winning: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  learning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  idea: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  testing: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  losing: "bg-red-500/10 text-red-400 border-red-500/20",
  "in progress": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  default: "bg-white/5 text-white/50 border-white/10",
};

export function Badge({ label }: { label: string }) {
  if (!label) return null;
  const variant = variants[label.toLowerCase()] || variants.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${variant}`}>
      {label}
    </span>
  );
}
