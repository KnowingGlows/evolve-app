"use client";

import { useState } from "react";
import { Heart, Plus, Pencil, X, Check, Trash2 } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import type { DesireEntry } from "@/lib/types";

export default function DesiresPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<DesireEntry>("desires");
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!brand) return null;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addEntry(brand.id, "desires", { text: newText.trim() });
    setNewText("");
    setAdding(false);
    toast("Desire added");
  };

  const handleUpdate = async (id: string) => {
    await updateEntry(brand.id, "desires", id, { text: editText });
    setEditingId(null);
    toast("Updated");
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(brand.id, "desires", id);
    toast("Removed");
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-white">Market Desires</h3>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-xl transition-colors"
          >
            <Plus size={14} /> Add Desire
          </button>
        </div>
        <p className="text-xs text-white/30 mb-6">Remember: we cannot create desires, we can only channel them.</p>

        {adding && (
          <div className="flex gap-3 mb-4 animate-fade-in">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              placeholder="I want..."
              autoFocus
              className="flex-1 bg-white/[0.04] border border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none"
            />
            <button onClick={handleAdd} className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700"><Check size={16} /></button>
            <button onClick={() => setAdding(false)} className="p-3 bg-white/5 text-white/40 rounded-xl hover:bg-white/10"><X size={16} /></button>
          </div>
        )}

        {items.length === 0 && !loading ? (
          <EmptyState
            icon={Heart}
            title="No market desires yet"
            description="Capture what your target market truly wants."
            action={
              <button onClick={() => setAdding(true)} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
                + Add Desire
              </button>
            }
          />
        ) : (
          <div className="space-y-1">
            {items.map((d) => (
              <div key={d.id} className="group flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
                <Heart size={16} className="text-rose-400/40 shrink-0" />
                {editingId === d.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(d.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                      className="flex-1 bg-white/[0.04] border border-violet-500/40 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                    />
                    <button onClick={() => handleUpdate(d.id)} className="p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-white/30 hover:bg-white/10 rounded-lg"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-white/70">{d.text}</span>
                    <button onClick={() => { setEditingId(d.id); setEditText(d.text); }} className="p-1.5 text-white/10 hover:text-white/40 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
