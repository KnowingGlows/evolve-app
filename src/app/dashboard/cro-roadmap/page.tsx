"use client";

import { useState } from "react";
import { Map, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CroRoadmapEntry } from "@/lib/types";

const defaultForm: { status: "Idea" | "In Progress" | "Done"; page: string; author: string; concept: string; explanation: string; adLink: string; offer: string } = { status: "Idea", page: "", author: "", concept: "", explanation: "", adLink: "", offer: "" };

export default function CroRoadmapPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CroRoadmapEntry>("croRoadmap");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: CroRoadmapEntry) => {
    setForm({ status: item.status, page: item.page, author: item.author, concept: item.concept, explanation: item.explanation, adLink: item.adLink, offer: item.offer });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "croRoadmap", editingId, form);
    else await addEntry(brand.id, "croRoadmap", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete?")) {
      await deleteEntry(brand.id, "croRoadmap", editingId);
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
          <Plus size={16} /> New Page Concept
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Map} title="No CRO roadmap items" description="Plan your landing page tests." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Page Concept</button>} />
      ) : (
        <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Status", "Page #", "Author", "Concept", "Explanation", "Ad Link", "Offer"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} onClick={() => openEdit(item)} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-5 py-4"><Badge label={item.status} /></td>
                    <td className="px-5 py-4 text-white/50">{item.page}</td>
                    <td className="px-5 py-4 text-white/50">{item.author}</td>
                    <td className="px-5 py-4 font-medium text-white max-w-[200px] truncate">{item.concept}</td>
                    <td className="px-5 py-4 text-white/40 max-w-[200px] truncate">{item.explanation}</td>
                    <td className="px-5 py-4 text-white/40 max-w-[150px] truncate">{item.adLink}</td>
                    <td className="px-5 py-4 text-white/50">{item.offer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Page Concept" : "New Page Concept"}>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}><option>Idea</option><option>In Progress</option><option>Done</option></select></div>
            <div><label className={labelClass}>Page #</label><input value={form.page} onChange={(e) => set("page", e.target.value)} placeholder="PAGE #1" className={inputClass} /></div>
            <div><label className={labelClass}>Author</label><input value={form.author} onChange={(e) => set("author", e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>CRO Concept</label><input value={form.concept} onChange={(e) => set("concept", e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Explanation</label><textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} rows={3} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Ad Link / New Ad Idea</label><input value={form.adLink} onChange={(e) => set("adLink", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Offer</label><input value={form.offer} onChange={(e) => set("offer", e.target.value)} className={inputClass} /></div>
          </div>
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
