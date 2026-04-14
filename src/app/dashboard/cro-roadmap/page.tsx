"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Map, Plus, Link as LinkIcon } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PillGroup } from "@/components/ui/pill-group";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { CroRoadmapEntry } from "@/lib/types";

const defaultForm: { status: "Idea" | "In Progress" | "Done"; page: string; author: string; concept: string; explanation: string; adLink: string; offer: string } = {
  status: "Idea", page: "", author: "", concept: "", explanation: "", adLink: "", offer: ""
};

const statusOptions = [
  { value: "Idea", label: "Idea" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
];

function SectionLabel({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 mt-12 mb-4 pb-3 border-b border-white/[0.06]">
      <span className="text-[10px] font-mono text-violet-400/70 tracking-widest">0{number}</span>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {hint && <span className="text-[11px] text-white/30 ml-auto">{hint}</span>}
    </div>
  );
}

export default function CroRoadmapPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CroRoadmapEntry>("croRoadmap");
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
      router.replace("/dashboard/cro-roadmap");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const nextPageNum = (() => {
    const nums = items.map((i) => parseInt((i.page || "").replace(/\D/g, ""))).filter(Boolean);
    return `PAGE #${(Math.max(0, ...nums) || 0) + 1}`;
  })();

  const openNew = () => { setForm({ ...defaultForm, page: nextPageNum }); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: CroRoadmapEntry) => {
    setForm({ status: item.status, page: item.page, author: item.author, concept: item.concept, explanation: item.explanation, adLink: item.adLink, offer: item.offer });
    setEditingId(item.id); setDirty(false); setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.concept.trim()) { toast("Add a concept first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "croRoadmap", editingId, form);
    else await addEntry(brand.id, "croRoadmap", form);
    setEditorOpen(false); setDirty(false);
    toast(editingId ? "Updated" : "Page concept created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this page concept?")) {
      await deleteEntry(brand.id, "croRoadmap", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const ensureEntry = async (): Promise<string | null> => {
    const data = { ...form, concept: form.concept.trim() || "Untitled page concept" };
    if (editingId) {
      await updateEntry(brand.id, "croRoadmap", editingId, data);
      setForm((f) => ({ ...f, concept: data.concept })); setDirty(false);
      return editingId;
    }
    const id = await addEntry(brand.id, "croRoadmap", data);
    setEditingId(id); setForm((f) => ({ ...f, concept: data.concept })); setDirty(false);
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
                  {["Status", "Page #", "Author", "Concept", "Ad Link", "Offer"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} onClick={() => openEdit(item)} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-5 py-4"><Badge label={item.status} /></td>
                    <td className="px-5 py-4 text-white/40 font-mono text-xs">{item.page}</td>
                    <td className="px-5 py-4 text-white/50">{item.author}</td>
                    <td className="px-5 py-4 font-medium text-white max-w-[300px] truncate">{item.concept}</td>
                    <td className="px-5 py-4 text-white/40 max-w-[200px] truncate">{item.adLink}</td>
                    <td className="px-5 py-4 text-white/50">{item.offer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Create Page Concept"}
        unsaved={dirty}
        meta={<>
          <span className="font-mono">{form.page || nextPageNum}</span>
          <span className="text-white/15">·</span>
          <Badge label={form.status} />
          {dirty && <span className="text-amber-400/70">• Unsaved</span>}
        </>}
      >
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">CRO Concept</label>
          <textarea
            value={form.concept}
            onChange={(e) => set("concept", e.target.value)}
            placeholder="What's the landing page idea?"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
          />
        </div>

        <div className="flex items-center gap-4 mb-2">
          <input value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Author" className="bg-transparent text-sm text-white/50 placeholder-white/20 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1" />
          <input value={form.page} onChange={(e) => set("page", e.target.value)} placeholder={nextPageNum} className="bg-transparent text-sm text-white/50 placeholder-white/20 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1 font-mono w-32" />
        </div>

        <SectionLabel number={1} title="Status" />
        <PillGroup value={form.status} options={statusOptions} onChange={(v) => set("status", v as typeof form.status)} />

        <SectionLabel number={2} title="Details" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Ad Link / New Ad Idea</label>
            <div className="relative">
              <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={form.adLink} onChange={(e) => set("adLink", e.target.value)} placeholder="URL or brief" className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Offer</label>
            <input value={form.offer} onChange={(e) => set("offer", e.target.value)} placeholder="Save $55, Free shipping..." className={inputClass} />
          </div>
        </div>

        <SectionLabel number={3} title="Explanation" hint="Why this page? What's being tested?" />
        <RichTextField
          label="Explanation"
          value={form.explanation}
          onChange={(v) => set("explanation", v)}
          placeholder={`Write out what this page should do and why.

# What's the hypothesis?
# Key sections
# How does this connect to the ad?
# What are we measuring?`}
          minHeight={350}
          collection="croRoadmap"
          entryId={editingId}
          field="explanation"
          onEnsureEntry={ensureEntry}
        />

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
