"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { AwarenessEntry } from "@/lib/types";

const levels = [
  { key: "most" as const, label: "Most Aware", color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15", hint: "They know you and the product — just need the right deal" },
  { key: "productAware" as const, label: "Product Aware", color: "text-teal-400", bg: "bg-teal-500/5 border-teal-500/15", hint: "Know your product but not sold yet" },
  { key: "solution" as const, label: "Solution Aware", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/15", hint: "Know a solution exists but not your product" },
  { key: "problem" as const, label: "Problem Aware", color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/15", hint: "Know they have a problem but don't know solutions" },
  { key: "unaware" as const, label: "Unaware", color: "text-red-400", bg: "bg-red-500/5 border-red-500/15", hint: "No idea they even have the problem" },
];

const defaultForm = { product: "", most: "", productAware: "", solution: "", problem: "", unaware: "" };

function SectionLabel({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-12 mb-4 pb-3 border-b border-white/[0.06]">
      <span className="text-[10px] font-mono text-violet-400/70 tracking-widest">0{number}</span>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {hint && <span className="text-[11px] text-white/30 ml-auto">{hint}</span>}
    </div>
  );
}

export default function AwarenessPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<AwarenessEntry>("awareness");
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
      router.replace("/dashboard/awareness");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const openNew = () => { setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: AwarenessEntry) => {
    setForm({ product: item.product, most: item.most, productAware: item.productAware, solution: item.solution, problem: item.problem, unaware: item.unaware });
    setEditingId(item.id); setDirty(false); setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.product.trim()) { toast("Add a product name first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "awareness", editingId, form);
    else await addEntry(brand.id, "awareness", form);
    setEditorOpen(false); setDirty(false);
    toast(editingId ? "Updated" : "Map created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this awareness map?")) {
      await deleteEntry(brand.id, "awareness", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const ensureEntry = async (): Promise<string | null> => {
    const data = { ...form, product: form.product.trim() || "Untitled product" };
    if (editingId) {
      await updateEntry(brand.id, "awareness", editingId, data);
      setForm((f) => ({ ...f, product: data.product })); setDirty(false);
      return editingId;
    }
    const id = await addEntry(brand.id, "awareness", data);
    setEditingId(id); setForm((f) => ({ ...f, product: data.product })); setDirty(false);
    toast("Draft saved");
    return id;
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => { setForm((f) => ({ ...f, [key]: val })); setDirty(true); };

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
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
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-5">
                      {stripHtml((item as unknown as Record<string, string>)[level.key]) || "—"}
                    </p>
                  </div>
                ))}
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
        saveLabel={editingId ? "Save Changes" : "Create Map"}
        unsaved={dirty}
        meta={<>
          <span className="uppercase tracking-widest text-[10px] text-violet-400/70 font-mono">Awareness Map</span>
          {dirty && <span className="text-amber-400/70">• Unsaved</span>}
        </>}
      >
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Product</label>
          <textarea
            value={form.product}
            onChange={(e) => set("product", e.target.value)}
            placeholder="What product are you mapping?"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
        </div>

        {levels.map((level, i) => (
          <div key={level.key}>
            <SectionLabel number={i + 1} title={level.label} hint={level.hint} />
            <RichTextField
              label={`${level.label} — Questions & Answers`}
              value={(form as unknown as Record<string, string>)[level.key] || ""}
              onChange={(v) => set(level.key, v)}
              placeholder={`What questions are they asking at the "${level.label}" stage? What are the answers that move them forward?`}
              minHeight={200}
              collection="awareness"
              entryId={editingId}
              field={level.key}
              onEnsureEntry={ensureEntry}
            />
          </div>
        ))}

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
