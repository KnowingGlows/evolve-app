"use client";

import { useState, useMemo } from "react";
import { Heart, Plus, Pencil, X, Check, Trash2, Sparkles } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import type { DesireEntry, AngleEntry, CreativeEntry } from "@/lib/types";

// A palette of soft gradients for each card
const gradients = [
  "from-violet-500/10 to-fuchsia-500/5 border-violet-500/20",
  "from-rose-500/10 to-pink-500/5 border-rose-500/20",
  "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
  "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  "from-indigo-500/10 to-violet-500/5 border-indigo-500/20",
];

const iconColors = [
  "text-violet-400",
  "text-rose-400",
  "text-emerald-400",
  "text-blue-400",
  "text-amber-400",
  "text-indigo-400",
];

export default function DesiresPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<DesireEntry>("desires");
  const { items: angles } = useCollection<AngleEntry>("angles");
  const { items: creative } = useCollection<CreativeEntry>("creative");
  const { toast } = useToast();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const linked = useMemo(() => {
    const map = new Map<string, { angles: number; ads: number }>();
    items.forEach((d) => {
      const text = d.text.toLowerCase();
      const angleCount = angles.filter((a) => a.desire?.toLowerCase() === text).length;
      const adCount = creative.filter((c) => c.desire?.toLowerCase() === text).length;
      map.set(d.id, { angles: angleCount, ads: adCount });
    });
    return map;
  }, [items, angles, creative]);

  if (!brand) return null;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    await addEntry(brand.id, "desires", { text: newText.trim() });
    setNewText("");
    toast("Desire captured");
  };

  const handleUpdate = async (id: string) => {
    await updateEntry(brand.id, "desires", id, { text: editText });
    setEditingId(null);
    toast("Updated");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this desire?")) return;
    await deleteEntry(brand.id, "desires", id);
    toast("Removed");
  };

  return (
    <div className="max-w-5xl">
      {/* Hero quick-add */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent border border-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-violet-400" />
          <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Capture a desire</p>
        </div>
        <p className="text-xs text-white/40 mb-4">We can&apos;t create desires — only channel them. What does your market actually want?</p>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 focus-within:border-violet-500/50 transition-colors">
            <Heart size={16} className="text-rose-400/60 shrink-0" />
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="I want..."
              className="flex-1 bg-transparent py-3.5 text-base text-white placeholder-white/25 outline-none"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            <Plus size={16} className="inline mr-1 -mt-0.5" /> Add
          </button>
        </div>
      </div>

      {/* Grid of chip cards */}
      {items.length === 0 && !loading ? (
        <EmptyState
          icon={Heart}
          title="No market desires yet"
          description="Start with one. What's the core thing your customer wants to achieve or avoid?"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((d, i) => {
            const grad = gradients[i % gradients.length];
            const iconColor = iconColors[i % iconColors.length];
            const stats = linked.get(d.id);
            const editing = editingId === d.id;

            return (
              <div
                key={d.id}
                className={`group relative rounded-2xl bg-gradient-to-br ${grad} border p-5 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30`}
              >
                <Heart size={18} className={`${iconColor} mb-3`} />
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(d.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                      className="flex-1 bg-black/30 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                    />
                    <button onClick={() => handleUpdate(d.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-white/40 hover:bg-white/10 rounded-lg"><X size={14} /></button>
                  </div>
                ) : (
                  <p className="text-base font-medium text-white leading-snug mb-3">{d.text}</p>
                )}

                {/* Linked data */}
                {!editing && (stats?.angles || stats?.ads) ? (
                  <div className="flex gap-3 mt-3 text-[11px] text-white/40">
                    {stats.angles > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" /> {stats.angles} angle{stats.angles > 1 ? "s" : ""}</span>}
                    {stats.ads > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400/60" /> {stats.ads} ad{stats.ads > 1 ? "s" : ""}</span>}
                  </div>
                ) : null}

                {/* Hover actions */}
                {!editing && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(d.id); setEditText(d.text); }}
                      className="p-1.5 rounded-lg bg-black/30 text-white/50 hover:text-white hover:bg-black/50 backdrop-blur-sm"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-lg bg-black/30 text-white/50 hover:text-red-400 hover:bg-black/50 backdrop-blur-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
