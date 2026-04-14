"use client";

import { useState } from "react";
import { Diamond, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/empty-state";
import type { AngleEntry } from "@/lib/types";

const defaultForm = { product: "", feature: "", benefit: "", desire: "", subAvatar: "", angle: "" };

export default function AnglesPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AngleEntry>("angles");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: AngleEntry) => {
    setForm({ product: item.product, feature: item.feature, benefit: item.benefit, desire: item.desire, subAvatar: item.subAvatar, angle: item.angle });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "angles", editingId, form);
    else await addEntry(brand.id, "angles", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this angle?")) {
      await deleteEntry(brand.id, "angles", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";
  const labelClass = "block text-xs font-medium text-white/30 mb-1.5";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New Angle
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState
          icon={Diamond}
          title="No angles yet"
          description="Map your product features to market desires."
          action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Angle</button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => openEdit(item)}
              className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.product || "Untitled"}</h4>
                  <p className="text-xs text-white/30 mt-0.5">{item.angle || "No angle"}</p>
                </div>
                {item.desire && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] rounded-full">{item.desire}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Feature</p>
                  <p className="text-white/50 text-xs leading-relaxed">{item.feature || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Benefit</p>
                  <p className="text-white/50 text-xs leading-relaxed">{item.benefit || "—"}</p>
                </div>
              </div>
              {item.subAvatar && (
                <p className="mt-3 text-xs text-white/30 leading-relaxed whitespace-pre-line">{item.subAvatar}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Angle" : "New Angle"}>
        <div className="space-y-5">
          <div><label className={labelClass}>Product Name</label><input value={form.product} onChange={(e) => set("product", e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Feature (what it is)</label><textarea value={form.feature} onChange={(e) => set("feature", e.target.value)} rows={2} className={inputClass} /></div>
          <div><label className={labelClass}>Benefit (&ldquo;so you can...&rdquo;)</label><textarea value={form.benefit} onChange={(e) => set("benefit", e.target.value)} rows={2} className={inputClass} /></div>
          <div><label className={labelClass}>Desire</label><input value={form.desire} onChange={(e) => set("desire", e.target.value)} placeholder="I want..." className={inputClass} /></div>
          <div><label className={labelClass}>Sub Avatar</label><textarea value={form.subAvatar} onChange={(e) => set("subAvatar", e.target.value)} rows={3} className={inputClass} /></div>
          <div><label className={labelClass}>Angle(s)</label><textarea value={form.angle} onChange={(e) => set("angle", e.target.value)} rows={2} className={inputClass} /></div>
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
