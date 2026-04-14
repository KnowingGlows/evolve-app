"use client";

import { useState } from "react";
import { Palette, Plus, Search, ExternalLink } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CreativeEntry } from "@/lib/types";

const defaultEntry: Omit<CreativeEntry, "id" | "createdAt"> = {
  status: "Idea", batch: "", author: "", concept: "", desire: "", angle: "",
  hypothesis: "", format: "Static", type: "Ideation", result: "", brief: "",
  adLink: "", variable: "", learnings: "",
};

export default function CreativePage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CreativeEntry>("creative");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultEntry);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  if (!brand) return null;

  const filtered = items.filter((c) => {
    const matchSearch = !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(defaultEntry); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: CreativeEntry) => {
    setForm({ status: item.status, batch: item.batch, author: item.author, concept: item.concept, desire: item.desire, angle: item.angle, hypothesis: item.hypothesis, format: item.format, type: item.type, result: item.result, brief: item.brief, adLink: item.adLink, variable: item.variable, learnings: item.learnings });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) {
      await updateEntry(brand.id, "creative", editingId, form);
    } else {
      await addEntry(brand.id, "creative", form);
    }
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this ad concept?")) {
      await deleteEntry(brand.id, "creative", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";
  const labelClass = "block text-xs font-medium text-white/30 mb-1.5";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts..."
              className="pl-9 pr-4 py-2.5 w-64 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/60 outline-none focus:border-violet-500/50"
          >
            <option value="">All Status</option>
            <option>Done</option>
            <option>Learning</option>
            <option>Testing</option>
            <option>Idea</option>
          </select>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New Ad Concept
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={Palette}
          title="No ad concepts yet"
          description="Start building your creative roadmap by adding your first ad concept."
          action={
            <button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
              + New Ad Concept
            </button>
          }
        />
      ) : (
        <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Batch</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Author</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Ad Concept</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Desire</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Format</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openEdit(item)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4"><Badge label={item.status} /></td>
                    <td className="px-5 py-4 text-white/50">{item.batch}</td>
                    <td className="px-5 py-4 text-white/50">{item.author}</td>
                    <td className="px-5 py-4 font-medium text-white max-w-[250px] truncate">{item.concept}</td>
                    <td className="px-5 py-4">
                      {item.desire && <span className="inline-block px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full">{item.desire}</span>}
                    </td>
                    <td className="px-5 py-4 text-white/50">{item.format}</td>
                    <td className="px-5 py-4 text-white/50">{item.type}</td>
                    <td className="px-5 py-4"><Badge label={item.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Form */}
      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Ad Concept" : "New Ad Concept"} wide>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}><option>Idea</option><option>Testing</option><option>Learning</option><option>Done</option></select></div>
            <div><label className={labelClass}>Batch #</label><input value={form.batch} onChange={(e) => set("batch", e.target.value)} placeholder="BATCH #1" className={inputClass} /></div>
            <div><label className={labelClass}>Author</label><input value={form.author} onChange={(e) => set("author", e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Ad Concept</label><input value={form.concept} onChange={(e) => set("concept", e.target.value)} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Desire</label><input value={form.desire} onChange={(e) => set("desire", e.target.value)} placeholder="I want..." className={inputClass} /></div>
            <div><label className={labelClass}>Angle(s)</label><textarea value={form.angle} onChange={(e) => set("angle", e.target.value)} rows={2} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>What are you testing & what gives you confidence?</label><textarea value={form.hypothesis} onChange={(e) => set("hypothesis", e.target.value)} rows={3} className={inputClass} /></div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className={labelClass}>Format</label><select value={form.format} onChange={(e) => set("format", e.target.value)} className={inputClass}><option>Static</option><option>Video</option><option>Carousel</option><option>UGC</option></select></div>
            <div><label className={labelClass}>Type</label><select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}><option>Ideation</option><option>Iteration</option><option>Scale</option></select></div>
            <div><label className={labelClass}>Test Result</label><select value={form.result} onChange={(e) => set("result", e.target.value)} className={inputClass}><option value="">—</option><option>Winning</option><option>Losing</option><option>Learning</option></select></div>
            <div><label className={labelClass}>Link to Brief</label><input value={form.brief} onChange={(e) => set("brief", e.target.value)} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Link to Ad</label><input value={form.adLink} onChange={(e) => set("adLink", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Ad Variable</label><input value={form.variable} onChange={(e) => set("variable", e.target.value)} className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>Learnings</label><textarea value={form.learnings} onChange={(e) => set("learnings", e.target.value)} rows={3} className={inputClass} /></div>

          <div className="flex justify-between pt-4 border-t border-white/[0.06]">
            {editingId && (
              <button onClick={handleDelete} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            )}
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
