"use client";

import { useEffect, ReactNode } from "react";
import { X, Trash2, Check } from "lucide-react";

interface FullScreenEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  meta?: ReactNode;
  children: ReactNode;
  unsaved?: boolean;
}

export function FullScreenEditor({
  open,
  onClose,
  onSave,
  onDelete,
  saveLabel = "Save",
  meta,
  children,
  unsaved,
}: FullScreenEditorProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (unsaved && !confirm("Discard unsaved changes?")) return;
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose, onSave, unsaved]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-[#0a0a12] animate-fade-in flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => { if (unsaved && !confirm("Discard unsaved changes?")) return; onClose(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <X size={16} />
            Close
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded font-mono">esc</kbd>
          </button>

          <div className="flex-1 flex items-center justify-center gap-3 text-xs text-white/40">
            {meta}
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-violet-500/20"
            >
              <Check size={15} />
              {saveLabel}
              <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">⌘S</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
