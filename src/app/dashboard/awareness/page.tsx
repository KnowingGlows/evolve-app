"use client";

import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/empty-state";
import type { AwarenessEntry } from "@/lib/types";

const levels = [
  { key: "most", label: "Most Aware", color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10" },
  { key: "productAware", label: "Product Aware", color: "text-teal-400", bg: "bg-teal-500/5 border-teal-500/10" },
  { key: "solution", label: "Solution Aware", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
  { key: "problem", label: "Problem Aware", color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/10" },
  { key: "unaware", label: "Unaware", color: "text-red-400", bg: "bg-red-500/5 border-red-500/10" },
] as const;

const defaultForm = { product: "", most: "", productAware: "", solution: "", problem: "", unaware: "" };

export default function AwarenessPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AwarenessEntry>("awareness");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: AwarenessEntry) => {
    setForm({ product: item.product, most: item.most, productAware: item.productAware, solution: item.solution, problem: item.problem, unaware: item.unaware });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "awareness", editingId, form);
    else await addEntry(brand.id, "awareness", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete?")) {
      await deleteEntry(brand.id, "awareness", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New Product
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Eye} title="No awareness maps" description="Map your product across awareness levels." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Product</button>} />
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} onClick={() => openEdit(item)} className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all">
              <h4 className="text-base font-semibold text-white mb-5">{item.product || "Product"}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {levels.map((level) => (
                  <div key={level.key} className={`${level.bg} border rounded-xl p-4 min-h-[100px]`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${level.color} mb-2`}>{level.label}</p>
                    <p className="text-xs text-white/40 leading-relaxed whitespace-pre-line">
                      {(item as unknown as Record<string, string>)[level.key] || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Awareness Map" : "New Product Awareness Map"} wide>
        <div className="space-y-5">
          <div><label className="block text-xs font-medium text-white/30 mb-1.5">Product Name</label><input value={form.product} onChange={(e) => set("product", e.target.value)} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-emerald-400/60 mb-1.5">Most Aware — Questions & Answers</label><textarea value={form.most} onChange={(e) => set("most", e.target.value)} rows={3} placeholder="What questions do the most aware buyers ask?" className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-teal-400/60 mb-1.5">Product Aware — Questions & Answers</label><textarea value={form.productAware} onChange={(e) => set("productAware", e.target.value)} rows={3} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-blue-400/60 mb-1.5">Solution Aware — Questions & Answers</label><textarea value={form.solution} onChange={(e) => set("solution", e.target.value)} rows={3} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-amber-400/60 mb-1.5">Problem Aware — Questions & Answers</label><textarea value={form.problem} onChange={(e) => set("problem", e.target.value)} rows={3} className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-red-400/60 mb-1.5">Unaware</label><textarea value={form.unaware} onChange={(e) => set("unaware", e.target.value)} rows={3} className={inputClass} /></div>
          <div className="flex justify-between pt-4 border-t border-white/[0.06]">
            {editingId && <button onClick={handleDelete} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors">Delete</button>}
            <div className="flex gap-3 ml-auto">
              <button onClick={() => setPanelOpen(false)} className="px-4 py-2.5 bg-white/5 text-white/40 text-sm rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">Save</button>
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
