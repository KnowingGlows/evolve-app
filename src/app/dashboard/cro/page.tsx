"use client";

import { useState } from "react";
import { TrendingUp, Plus, Search } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CroEntry } from "@/lib/types";

const defaultForm: Omit<CroEntry, "id" | "createdAt"> = {
  status: "Idea", date: "", author: "", concept: "", explanation: "", url: "",
  coupon: "", offer: "", sellingPoint: "", avatar: "", result: "", testStart: "", learnings: "",
};

export default function CroPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CroEntry>("cro");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");

  if (!brand) return null;

  const filtered = items.filter((c) => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(defaultForm); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: CroEntry) => {
    setForm({ status: item.status, date: item.date, author: item.author, concept: item.concept, explanation: item.explanation, url: item.url, coupon: item.coupon, offer: item.offer, sellingPoint: item.sellingPoint, avatar: item.avatar, result: item.result, testStart: item.testStart, learnings: item.learnings });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "cro", editingId, form);
    else await addEntry(brand.id, "cro", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this LP test?")) {
      await deleteEntry(brand.id, "cro", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";
  const labelClass = "block text-xs font-medium text-white/30 mb-1.5";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search landing pages..." className="pl-9 pr-4 py-2.5 w-64 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors" />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New LP Test
        </button>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={TrendingUp} title="No CRO tests yet" description="Start optimizing your landing pages." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New LP Test</button>} />
      ) : (
        <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Status", "Date", "Author", "Concept", "Offer", "Avatar", "Result"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} onClick={() => openEdit(item)} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-5 py-4"><Badge label={item.status} /></td>
                    <td className="px-5 py-4 text-white/40">{item.date}</td>
                    <td className="px-5 py-4 text-white/50">{item.author}</td>
                    <td className="px-5 py-4 font-medium text-white max-w-[250px] truncate">{item.concept}</td>
                    <td className="px-5 py-4 text-white/50">{item.offer}</td>
                    <td className="px-5 py-4 text-white/50">{item.avatar}</td>
                    <td className="px-5 py-4"><Badge label={item.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit LP Test" : "New LP Test"} wide>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}><option>Idea</option><option>Testing</option><option>Done</option></select></div>
            <div><label className={labelClass}>Date Added</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Author</label><input value={form.author} onChange={(e) => set("author", e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Landing Page Concept</label><input value={form.concept} onChange={(e) => set("concept", e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Explanation</label><textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} rows={3} className={inputClass} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>URL</label><input value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Coupon</label><input value={form.coupon} onChange={(e) => set("coupon", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Offer</label><input value={form.offer} onChange={(e) => set("offer", e.target.value)} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Selling Point</label><input value={form.sellingPoint} onChange={(e) => set("sellingPoint", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Avatar</label><input value={form.avatar} onChange={(e) => set("avatar", e.target.value)} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Test Result</label><select value={form.result} onChange={(e) => set("result", e.target.value)} className={inputClass}><option value="">—</option><option>Winning</option><option>Losing</option></select></div>
            <div><label className={labelClass}>Test Start</label><input type="date" value={form.testStart} onChange={(e) => set("testStart", e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Learnings</label><textarea value={form.learnings} onChange={(e) => set("learnings", e.target.value)} rows={3} className={inputClass} /></div>
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
