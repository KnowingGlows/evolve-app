"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Diamond, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { Combobox } from "@/components/ui/combobox";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { AngleEntry, DesireEntry, AvatarEntry } from "@/lib/types";

const defaultForm = { product: "", feature: "", benefit: "", desire: "", subAvatar: "", angle: "" };

function SectionLabel({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-12 mb-4 pb-3 border-b border-white/[0.06]">
      <span className="text-[10px] font-mono text-violet-400/70 tracking-widest">0{number}</span>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {hint && <span className="text-[11px] text-white/30 ml-auto">{hint}</span>}
    </div>
  );
}

export default function AnglesPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AngleEntry>("angles");
  const { items: desires } = useCollection<DesireEntry>("desires");
  const { items: avatars } = useCollection<AvatarEntry>("avatars");
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dirty, setDirty] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const desireSuggestions = useMemo(() => desires.map((d) => d.text), [desires]);
  const avatarSuggestions = useMemo(() => avatars.map((a) => a.name).filter(Boolean), [avatars]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true);
      router.replace("/dashboard/angles");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: AngleEntry) => {
    setForm({ product: item.product, feature: item.feature, benefit: item.benefit, desire: item.desire, subAvatar: item.subAvatar, angle: item.angle });
    setEditingId(item.id); setDirty(false); setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.product.trim() && !form.angle.trim()) { toast("Add a product or angle first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "angles", editingId, form);
    else await addEntry(brand.id, "angles", form);
    setEditorOpen(false); setDirty(false);
    toast(editingId ? "Updated" : "Angle created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this angle?")) {
      await deleteEntry(brand.id, "angles", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const ensureEntry = async (): Promise<string | null> => {
    const data = { ...form, product: form.product.trim() || "Untitled angle" };
    if (editingId) {
      await updateEntry(brand.id, "angles", editingId, data);
      setForm((f) => ({ ...f, product: data.product })); setDirty(false);
      return editingId;
    }
    const id = await addEntry(brand.id, "angles", data);
    setEditingId(id); setForm((f) => ({ ...f, product: data.product })); setDirty(false);
    toast("Draft saved");
    return id;
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => { setForm((f) => ({ ...f, [key]: val })); setDirty(true); };
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
          <Plus size={16} /> New Angle
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <EmptyState icon={Diamond} title="No angles yet" description="Map your product features to market desires." action={<button onClick={openNew} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">+ New Angle</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} onClick={() => openEdit(item)} className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] cursor-pointer transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate">{item.product || "Untitled"}</h4>
                  <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{item.angle || "No angle"}</p>
                </div>
                {item.desire && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] rounded-full shrink-0 ml-2">{item.desire}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Feature</p>
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{item.feature || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Benefit</p>
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{item.benefit || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Create Angle"}
        unsaved={dirty}
        meta={
          <>
            <span className="uppercase tracking-widest text-[10px] text-violet-400/70 font-mono">Angle</span>
            {dirty && <span className="text-amber-400/70">• Unsaved</span>}
          </>
        }
      >
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Product</label>
          <textarea
            value={form.product}
            onChange={(e) => set("product", e.target.value)}
            placeholder="What product is this angle for?"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
        </div>

        <SectionLabel number={1} title="Desire & Audience" hint="Who's this for? What do they want?" />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Desire</label>
            <Combobox value={form.desire} suggestions={desireSuggestions} onChange={(v) => set("desire", v)} placeholder="I want..." />
            <p className="text-[11px] text-white/25 mt-1.5">Pulls from your Desires library. Enter to create new.</p>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Sub Avatar</label>
            <Combobox value={form.subAvatar} suggestions={avatarSuggestions} onChange={(v) => set("subAvatar", v)} placeholder="e.g. Night shift worker" />
          </div>
        </div>

        <SectionLabel number={2} title="Feature → Benefit" hint="What it is, so they can..." />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Feature (what it is)</label>
            <textarea value={form.feature} onChange={(e) => set("feature", e.target.value)} rows={2} placeholder="Edge-sealing track system..." className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Benefit (&ldquo;so you can...&rdquo;)</label>
            <textarea value={form.benefit} onChange={(e) => set("benefit", e.target.value)} rows={2} placeholder="Total darkness whenever you want..." className={inputClass} />
          </div>
        </div>

        <SectionLabel number={3} title="The Angle" hint="The story / framing" />
        <RichTextField
          label="Angle"
          value={form.angle}
          onChange={(v) => set("angle", v)}
          placeholder={`How are you framing this feature to this audience?

Examples:
- Protect Your Melatonin Production
- The Only Blackout That Actually Works`}
          minHeight={250}
          collection="angles"
          entryId={editingId}
          field="angle"
          onEnsureEntry={ensureEntry}
        />

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
