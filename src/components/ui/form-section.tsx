interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  number?: number;
}

export function FormSection({ title, description, children, number }: FormSectionProps) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        {number && (
          <div className="w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-[11px] font-semibold text-violet-400">
            {number}
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="pl-0 space-y-4">{children}</div>
    </div>
  );
}

export function FormField({ label, children, hint }: { label?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">{label}</label>}
      {children}
      {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}
