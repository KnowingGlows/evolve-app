"use client";

import { useState } from "react";
import { Star, Plus, ExternalLink } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/empty-state";
import type { CreatorEntry } from "@/lib/types";

const defaultForm = { name: "", audience: "", youtube: "", tiktok: "", instagram: "", trends: "", notes: "" };

export default function CreatorsPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CreatorEntry>("creators");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: CreatorEntry) => {
    setForm({ name: item.name, audience: item.audience, youtube: item.youtube, tiktok: item.tiktok, instagram: item.instagram, trends: item.trends, notes: item.notes });
    setEditingId(item.id);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "creators", editingId, form);
    else await addEntry(brand.id, "creators", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete?")) {
      await deleteEntry(brand.id, "creators", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";
  const labelClass = "block text-xs font-medium text-white/30 mb-1.5";

  return (
    <div>
      {/* Guide */}
      <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Creator Analysis Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: "1", text: "Identify target persona for your ad" },
            { step: "2", text: "Research creators & influencers for those people" },
            { step: "3", text: "Study top-performing content for engagement patterns" },
            { step: "4", text: "Create content with those ideas — it'll resonate" },
          ].map((s) => (
            <div key={s.step} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <p className="text-[11px] font-bold text-violet-400 mb-1">Step {s.step}</p>
              <p className="text-xs text-white/40">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> Add Creator
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Star} title="No creators tracked" description="Start analyzing top content creators." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ Add Creator</button>} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} onClick={() => openEdit(item)} className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.name || "Unnamed"}</h4>
                  <p className="text-xs text-white/30 mt-0.5">Audience: {item.audience || "—"}</p>
                </div>
                <div className="flex gap-2">
                  {item.youtube && <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-full">YouTube</span>}
                  {item.tiktok && <span className="px-2 py-1 bg-white/5 text-white/40 text-[10px] rounded-full">TikTok</span>}
                  {item.instagram && <span className="px-2 py-1 bg-pink-500/10 text-pink-400 text-[10px] rounded-full">Instagram</span>}
                </div>
              </div>
              {item.trends && <p className="text-xs text-white/40 leading-relaxed">{item.trends.substring(0, 200)}{item.trends.length > 200 ? "..." : ""}</p>}
            </div>
          ))}
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Creator" : "Add Creator"}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Creator Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Audience Size</label><input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. 500K" className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>YouTube</label><input value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="URL" className={inputClass} /></div>
            <div><label className={labelClass}>TikTok</label><input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="URL" className={inputClass} /></div>
            <div><label className={labelClass}>Instagram</label><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="URL" className={inputClass} /></div>
          </div>
          <div><label className={labelClass}>High Performing Content Trends</label><textarea value={form.trends} onChange={(e) => set("trends", e.target.value)} rows={4} className={inputClass} /></div>
          <div><label className={labelClass}>User Comment Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputClass} /></div>
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
