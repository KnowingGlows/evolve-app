"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { AvatarEntry } from "@/lib/types";

function SectionLabel({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-12 mb-4 pb-3 border-b border-white/[0.06]">
      <span className="text-[10px] font-mono text-violet-400/70 tracking-widest">0{number}</span>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {hint && <span className="text-[11px] text-white/30 ml-auto">{hint}</span>}
    </div>
  );
}

export default function AvatarsPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AvatarEntry>("avatars");
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", desc: "" });
  const [dirty, setDirty] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setForm({ name: "", desc: "" }); setEditingId(null); setDirty(false); setEditorOpen(true);
      router.replace("/dashboard/avatars");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const openNew = () => { setForm({ name: "", desc: "" }); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: AvatarEntry) => { setForm({ name: item.name, desc: item.desc }); setEditingId(item.id); setDirty(false); setEditorOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast("Add an avatar name first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "avatars", editingId, form);
    else await addEntry(brand.id, "avatars", form);
    setEditorOpen(false); setDirty(false);
    toast(editingId ? "Updated" : "Avatar created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this avatar?")) {
      await deleteEntry(brand.id, "avatars", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const ensureEntry = async (): Promise<string | null> => {
    const data = { ...form, name: form.name.trim() || "Untitled avatar" };
    if (editingId) {
      await updateEntry(brand.id, "avatars", editingId, data);
      setForm((f) => ({ ...f, name: data.name })); setDirty(false);
      return editingId;
    }
    const id = await addEntry(brand.id, "avatars", data);
    setEditingId(id); setForm((f) => ({ ...f, name: data.name })); setDirty(false);
    toast("Draft saved");
    return id;
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => { setForm((f) => ({ ...f, [key]: val })); setDirty(true); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
          <Plus size={16} /> New Avatar
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Users} title="No avatars defined" description="Identify your target customer personas." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Avatar</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} onClick={() => openEdit(item)} className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Users size={16} className="text-violet-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{item.name || "Unnamed"}</h4>
              <div className="text-xs text-white/40 leading-relaxed line-clamp-4 prose-invert" dangerouslySetInnerHTML={{ __html: item.desc || "<p>No description</p>" }} />
            </div>
          ))}
        </div>
      )}

      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Create Avatar"}
        unsaved={dirty}
        meta={<>
          <span className="uppercase tracking-widest text-[10px] text-violet-400/70 font-mono">Avatar</span>
          {dirty && <span className="text-amber-400/70">• Unsaved</span>}
        </>}
      >
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Avatar Name</label>
          <textarea
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Parents with Young Children"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
        </div>

        <SectionLabel number={1} title="Profile" hint="Who they are, what they care about" />
        <RichTextField
          label="Description"
          value={form.desc}
          onChange={(v) => set("desc", v)}
          placeholder={`Describe this persona…

# Demographics
Age, gender, income, location…

# Behaviors
Daily routine, habits, purchasing patterns…

# Pain Points
What are they struggling with?

# Desires
What do they want to achieve?

# Objections
Why haven't they bought already?`}
          minHeight={400}
          collection="avatars"
          entryId={editingId}
          field="desc"
          onEnsureEntry={ensureEntry}
        />

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
