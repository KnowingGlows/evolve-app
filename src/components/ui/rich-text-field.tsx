"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Loader2 } from "lucide-react";
import { RichText } from "./rich-text";

interface RichTextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  variant?: "compact" | "document";
  collection?: string;
  entryId?: string | null;
  field?: string;
  // Called when the "Open full page" button is clicked on a new (unsaved) entry.
  // Should save the entry and return the new document id, or null if validation failed.
  onEnsureEntry?: () => Promise<string | null>;
  hint?: string;
}

export function RichTextField({
  label, value, onChange, placeholder, minHeight = 200, variant = "document",
  collection, entryId, field, onEnsureEntry, hint,
}: RichTextFieldProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const openFull = async () => {
    if (!collection || !field) return;
    let id = entryId;
    if (!id && onEnsureEntry) {
      setSaving(true);
      try {
        id = await onEnsureEntry();
      } finally {
        setSaving(false);
      }
    }
    if (id) router.push(`/dashboard/doc/${collection}/${id}/${field}`);
  };

  const canOpen = !!(collection && field) && (entryId || onEnsureEntry);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={openFull}
          disabled={!canOpen || saving}
          title={canOpen ? "Open in full-page editor" : "Not available"}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition-colors
            text-white/50 hover:text-violet-300 hover:bg-violet-500/10
            disabled:text-white/20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/20"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Maximize2 size={11} />}
          {saving ? "Saving…" : "Open full page"}
        </button>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <RichText
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          variant={variant}
        />
      </div>
      {hint && <p className="text-[11px] text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}
