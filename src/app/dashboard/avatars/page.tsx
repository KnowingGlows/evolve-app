"use client";

import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/empty-state";
import type { AvatarEntry } from "@/lib/types";

export default function AvatarsPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AvatarEntry>("avatars");
  const { toast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", desc: "" });

  if (!brand) return null;

  const openNew = () => { setForm({ name: "", desc: "" }); setEditingId(null); setPanelOpen(true); };
  const openEdit = (item: AvatarEntry) => { setForm({ name: item.name, desc: item.desc }); setEditingId(item.id); setPanelOpen(true); };

  const handleSave = async () => {
    if (editingId) await updateEntry(brand.id, "avatars", editingId, form);
    else await addEntry(brand.id, "avatars", form);
    setPanelOpen(false);
    toast("Saved");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this avatar?")) {
      await deleteEntry(brand.id, "avatars", editingId);
      setPanelOpen(false);
      toast("Deleted");
    }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={16} /> New Avatar
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Users} title="No avatars defined" description="Identify your target customer personas." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Avatar</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} onClick={() => openEdit(item)} className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all">
              <h4 className="text-sm font-semibold text-white mb-3">{item.name || "Unnamed"}</h4>
              <p className="text-xs text-white/40 leading-relaxed whitespace-pre-line">{item.desc || "No description"}</p>
            </div>
          ))}
        </div>
      )}

      <SlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title={editingId ? "Edit Avatar" : "New Avatar"}>
        <div className="space-y-5">
          <div><label className="block text-xs font-medium text-white/30 mb-1.5">Avatar Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Parents with Young Children" className={inputClass} /></div>
          <div><label className="block text-xs font-medium text-white/30 mb-1.5">Description</label><textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={6} placeholder="Demographics, behaviors, pain points..." className={inputClass} /></div>
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
