"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Star, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { CreatorEntry } from "@/lib/types";

const defaultForm = { name: "", audience: "", youtube: "", tiktok: "", instagram: "", trends: "", notes: "" };

function SectionLabel({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-12 mb-4 pb-3 border-b border-white/[0.06]">
      <span className="text-[10px] font-mono text-violet-400/70 tracking-widest">0{number}</span>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {hint && <span className="text-[11px] text-white/30 ml-auto">{hint}</span>}
    </div>
  );
}

export default function CreatorsPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CreatorEntry>("creators");
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dirty, setDirty] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true);
      router.replace("/dashboard/creators");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: CreatorEntry) => {
    setForm({ name: item.name, audience: item.audience, youtube: item.youtube, tiktok: item.tiktok, instagram: item.instagram, trends: item.trends, notes: item.notes });
    setEditingId(item.id); setDirty(false); setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast("Add creator name first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "creators", editingId, form);
    else await addEntry(brand.id, "creators", form);
    setEditorOpen(false); setDirty(false);
    toast(editingId ? "Updated" : "Creator added");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this creator?")) {
      await deleteEntry(brand.id, "creators", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const ensureEntry = async (): Promise<string | null> => {
    const data = { ...form, name: form.name.trim() || "Untitled creator" };
    if (editingId) {
      await updateEntry(brand.id, "creators", editingId, data);
      setForm((f) => ({ ...f, name: data.name })); setDirty(false);
      return editingId;
    }
    const id = await addEntry(brand.id, "creators", data);
    setEditingId(id); setForm((f) => ({ ...f, name: data.name })); setDirty(false);
    toast("Draft saved");
    return id;
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => { setForm((f) => ({ ...f, [key]: val })); setDirty(true); };
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

  return (
    <div>
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
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
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
              {item.trends && <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{stripHtml(item.trends).substring(0, 300)}</p>}
            </div>
          ))}
        </div>
      )}

      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Add Creator"}
        unsaved={dirty}
        meta={<>
          <span className="uppercase tracking-widest text-[10px] text-violet-400/70 font-mono">Creator</span>
          {dirty && <span className="text-amber-400/70">• Unsaved</span>}
        </>}
      >
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Creator Name</label>
          <textarea
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="@username or their name"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
        </div>

        <div className="flex items-center gap-4 mb-2">
          <input
            value={form.audience}
            onChange={(e) => set("audience", e.target.value)}
            placeholder="Audience size (e.g. 500K)"
            className="bg-transparent text-sm text-white/50 placeholder-white/20 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1"
          />
        </div>

        <SectionLabel number={1} title="Channels" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">YouTube</label>
            <input value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="URL" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">TikTok</label>
            <input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="URL" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Instagram</label>
            <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="URL" className={inputClass} />
          </div>
        </div>

        <SectionLabel number={2} title="Content Trends" hint="What's working for them?" />
        <RichTextField
          label="High Performing Content Trends"
          value={form.trends}
          onChange={(v) => set("trends", v)}
          placeholder={`What hooks, topics, formats, or angles are performing for this creator?

# Top hooks
# Recurring themes
# Format patterns
# Standout examples`}
          minHeight={300}
          collection="creators"
          entryId={editingId}
          field="trends"
          onEnsureEntry={ensureEntry}
        />

        <SectionLabel number={3} title="Audience Insights" hint="What are their viewers saying?" />
        <RichTextField
          label="User Comment Notes"
          value={form.notes}
          onChange={(v) => set("notes", v)}
          placeholder="What are viewers saying? What pains do they mention? What language do they use?"
          minHeight={250}
          collection="creators"
          entryId={editingId}
          field="notes"
          onEnsureEntry={ensureEntry}
        />

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
