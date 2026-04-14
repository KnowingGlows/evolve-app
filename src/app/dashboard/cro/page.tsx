"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp, Plus, Search, Link as LinkIcon } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PillGroup } from "@/components/ui/pill-group";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { CroEntry } from "@/lib/types";

const defaultForm: Omit<CroEntry, "id" | "createdAt"> = {
  status: "Idea", date: "", author: "", concept: "", explanation: "", url: "",
  coupon: "", offer: "", sellingPoint: "", avatar: "", result: "", testStart: "", learnings: "",
};

const statusOptions = [
  { value: "Idea", label: "Idea" },
  { value: "Testing", label: "Testing" },
  { value: "Done", label: "Done" },
];

const resultOptions = [
  { value: "Winning", label: "Winning" },
  { value: "Losing", label: "Losing" },
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

export default function CroPage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CroEntry>("cro");
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setForm(defaultForm);
      setEditingId(null);
      setDirty(false);
      setEditorOpen(true);
      router.replace("/dashboard/cro");
    }
  }, [searchParams, router]);

  if (!brand) return null;

  const filtered = items.filter((c) => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(defaultForm); setEditingId(null); setDirty(false); setEditorOpen(true); };
  const openEdit = (item: CroEntry) => {
    setForm({ status: item.status, date: item.date, author: item.author, concept: item.concept, explanation: item.explanation, url: item.url, coupon: item.coupon, offer: item.offer, sellingPoint: item.sellingPoint, avatar: item.avatar, result: item.result, testStart: item.testStart, learnings: item.learnings });
    setEditingId(item.id);
    setDirty(false);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.concept.trim()) { toast("Add a concept first", "error"); return; }
    if (editingId) await updateEntry(brand.id, "cro", editingId, form);
    else await addEntry(brand.id, "cro", form);
    setEditorOpen(false);
    setDirty(false);
    toast(editingId ? "Updated" : "LP test created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this LP test?")) {
      await deleteEntry(brand.id, "cro", editingId);
      setEditorOpen(false);
      toast("Deleted");
    }
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };
  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search landing pages..." className="pl-9 pr-4 py-2.5 w-64 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors" />
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
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

      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Create Test"}
        unsaved={dirty}
        meta={
          <>
            <Badge label={form.status} />
            {dirty && <span className="text-amber-400/70">• Unsaved</span>}
          </>
        }
      >
        {/* Title */}
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Landing Page Concept</label>
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
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="bg-transparent text-sm text-white/50 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1" />
        </div>

        <SectionLabel number={1} title="Status" />
        <PillGroup value={form.status} options={statusOptions} onChange={(v) => set("status", v as typeof form.status)} />

        <SectionLabel number={2} title="Offer & Positioning" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Selling Point</label>
            <input value={form.sellingPoint} onChange={(e) => set("sellingPoint", e.target.value)} placeholder="Easy to clean" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Avatar</label>
            <input value={form.avatar} onChange={(e) => set("avatar", e.target.value)} placeholder="Clean + Safe Persona" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Offer</label>
            <input value={form.offer} onChange={(e) => set("offer", e.target.value)} placeholder="Save $55" className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Coupon</label>
            <input value={form.coupon} onChange={(e) => set("coupon", e.target.value)} placeholder="REFRESH20" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Landing Page URL</label>
            <div className="relative">
              <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://..." className={`${inputClass} pl-9`} />
            </div>
          </div>
        </div>

        <SectionLabel number={3} title="Explanation" hint="The full story of this test" />
        <RichTextField
          label="Explanation"
          value={form.explanation}
          onChange={(v) => set("explanation", v)}
          placeholder={`Write out the full explanation of this landing page test…

# What's different about this page?
# Key sections
# Why this offer?
# Customer feedback / insights driving this`}
          minHeight={350}
          collection="cro"
          entryId={editingId}
          field="explanation"
        />

        <SectionLabel number={4} title="Results & Learnings" />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Test Start</label>
            <input type="date" value={form.testStart} onChange={(e) => set("testStart", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Test Result</label>
            <PillGroup value={form.result} options={resultOptions} onChange={(v) => set("result", v as typeof form.result)} allowEmpty size="sm" />
          </div>
          <RichTextField
            label="Learnings"
            value={form.learnings}
            onChange={(v) => set("learnings", v)}
            placeholder="What worked, what didn't, what to test next."
            minHeight={180}
            collection="cro"
            entryId={editingId}
            field="learnings"
          />
        </div>

        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
