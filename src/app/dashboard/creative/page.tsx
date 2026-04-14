"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Palette, Plus, Search, Image as ImageIcon, Film, Grid3x3, User, Lightbulb, Repeat, Rocket, Link as LinkIcon, FileText } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { addEntry, updateEntry, deleteEntry } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PillGroup } from "@/components/ui/pill-group";
import { Combobox } from "@/components/ui/combobox";
import { FullScreenEditor } from "@/components/ui/full-screen-editor";
import { RichText } from "@/components/ui/rich-text";
import { RichTextField } from "@/components/ui/rich-text-field";
import type { CreativeEntry, DesireEntry, AngleEntry } from "@/lib/types";

const defaultEntry: Omit<CreativeEntry, "id" | "createdAt"> = {
  status: "Idea", batch: "", author: "", concept: "", desire: "", angle: "",
  hypothesis: "", format: "Static", type: "Ideation", result: "", brief: "",
  adLink: "", variable: "", learnings: "",
};

const statusOptions = [
  { value: "Idea", label: "Idea" },
  { value: "Testing", label: "Testing" },
  { value: "Learning", label: "Learning" },
  { value: "Done", label: "Done" },
];

const formatOptions = [
  { value: "Static", label: "Static", icon: <ImageIcon size={14} /> },
  { value: "Video", label: "Video", icon: <Film size={14} /> },
  { value: "Carousel", label: "Carousel", icon: <Grid3x3 size={14} /> },
  { value: "UGC", label: "UGC", icon: <User size={14} /> },
];

const typeOptions = [
  { value: "Ideation", label: "Ideation", icon: <Lightbulb size={14} /> },
  { value: "Iteration", label: "Iteration", icon: <Repeat size={14} /> },
  { value: "Scale", label: "Scale", icon: <Rocket size={14} /> },
];

const resultOptions = [
  { value: "Winning", label: "Winning" },
  { value: "Losing", label: "Losing" },
  { value: "Learning", label: "Learning" },
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

export default function CreativePage() {
  const { brand } = useBrand();
  const { items, loading } = useCollection<CreativeEntry>("creative");
  const { items: desires } = useCollection<DesireEntry>("desires");
  const { items: angles } = useCollection<AngleEntry>("angles");
  const { toast } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultEntry);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const desireSuggestions = useMemo(() => desires.map((d) => d.text), [desires]);
  const angleSuggestions = useMemo(() => angles.map((a) => a.angle).filter(Boolean), [angles]);

  const nextBatchNum = useMemo(() => {
    const nums = items.map((i) => parseInt((i.batch || "").replace(/\D/g, ""))).filter(Boolean);
    return `BATCH #${(Math.max(0, ...nums) || 0) + 1}`;
  }, [items]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setForm({ ...defaultEntry, batch: nextBatchNum });
      setEditingId(null);
      setDirty(false);
      setEditorOpen(true);
      router.replace("/dashboard/creative");
    }
  }, [searchParams, router, nextBatchNum]);

  if (!brand) return null;

  const filtered = items.filter((c) => {
    const matchSearch = !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setForm({ ...defaultEntry, batch: nextBatchNum });
    setEditingId(null);
    setDirty(false);
    setEditorOpen(true);
  };

  const openEdit = (item: CreativeEntry) => {
    setForm({ status: item.status, batch: item.batch, author: item.author, concept: item.concept, desire: item.desire, angle: item.angle, hypothesis: item.hypothesis, format: item.format, type: item.type, result: item.result, brief: item.brief, adLink: item.adLink, variable: item.variable, learnings: item.learnings });
    setEditingId(item.id);
    setDirty(false);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.concept.trim()) {
      toast("Add an ad concept first", "error");
      return;
    }
    if (editingId) await updateEntry(brand.id, "creative", editingId, form);
    else await addEntry(brand.id, "creative", form);
    setEditorOpen(false);
    setDirty(false);
    toast(editingId ? "Updated" : "Concept created");
  };

  const handleDelete = async () => {
    if (editingId && confirm("Delete this ad concept?")) {
      await deleteEntry(brand.id, "creative", editingId);
      setEditorOpen(false);
      setDirty(false);
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
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20">
          <Plus size={16} /> New Ad Concept
        </button>
      </div>

      {/* List */}
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
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Ad Concept</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Desire</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Format</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Result</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Author</th>
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
                    <td className="px-5 py-4 text-white/40 font-mono text-xs">{item.batch}</td>
                    <td className="px-5 py-4 font-medium text-white max-w-[300px] truncate">{item.concept}</td>
                    <td className="px-5 py-4">
                      {item.desire && <span className="inline-block px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-full">{item.desire}</span>}
                    </td>
                    <td className="px-5 py-4 text-white/50">{item.format}</td>
                    <td className="px-5 py-4 text-white/50">{item.type}</td>
                    <td className="px-5 py-4"><Badge label={item.result} /></td>
                    <td className="px-5 py-4 text-white/40">{item.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full-screen editor */}
      <FullScreenEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={editingId ? handleDelete : undefined}
        saveLabel={editingId ? "Save Changes" : "Create Concept"}
        unsaved={dirty}
        meta={
          <>
            <span className="font-mono">{form.batch || nextBatchNum}</span>
            <span className="text-white/15">·</span>
            <Badge label={form.status} />
            {dirty && <span className="text-amber-400/70 flex items-center gap-1">• Unsaved</span>}
          </>
        }
      >
        {/* Title / Concept */}
        <div className="mb-2">
          <label className="block text-[10px] font-mono text-white/30 tracking-widest uppercase mb-2">Ad Concept</label>
          <textarea
            value={form.concept}
            onChange={(e) => set("concept", e.target.value)}
            placeholder="What's the ad idea?"
            autoFocus={!editingId}
            rows={1}
            className="w-full bg-transparent border-0 text-4xl font-bold text-white placeholder-white/15 outline-none resize-none leading-tight"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
          />
        </div>

        {/* Author + quick meta */}
        <div className="flex items-center gap-4 mb-2">
          <input
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Author"
            className="bg-transparent text-sm text-white/50 placeholder-white/20 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1"
          />
          <input
            value={form.batch}
            onChange={(e) => set("batch", e.target.value)}
            placeholder={nextBatchNum}
            className="bg-transparent text-sm text-white/50 placeholder-white/20 outline-none focus:text-white/80 border-b border-transparent focus:border-white/20 py-1 font-mono w-32"
          />
        </div>

        {/* 01 Status */}
        <SectionLabel number={1} title="Status" />
        <PillGroup value={form.status} options={statusOptions} onChange={(v) => set("status", v as typeof form.status)} />

        {/* 02 Strategy */}
        <SectionLabel number={2} title="Strategy" hint="What desire? What angle? Why now?" />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Desire</label>
            <Combobox value={form.desire} suggestions={desireSuggestions} onChange={(v) => set("desire", v)} placeholder="I want..." />
            <p className="text-[11px] text-white/25 mt-1.5">Pulls from your Desires library. Enter to create new.</p>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Angle</label>
            <Combobox value={form.angle} suggestions={angleSuggestions} onChange={(v) => set("angle", v)} placeholder="Protect your melatonin production..." />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Hypothesis</label>
            <textarea
              value={form.hypothesis}
              onChange={(e) => set("hypothesis", e.target.value)}
              rows={3}
              placeholder="What gives you confidence this will work? Hook ideas, audience insight, differentiator..."
              className={inputClass}
            />
          </div>
        </div>

        {/* 03 Brief — full document */}
        <SectionLabel number={3} title="Brief" hint="The entire ad — write it out" />
        <RichTextField
          label="Brief"
          value={form.brief}
          onChange={(v) => set("brief", v)}
          placeholder={`Write the full ad brief here…

# Hook
The first 3 seconds…

# Script / Body Copy
What the viewer sees and hears…

# Visuals
Frame-by-frame or key visuals…

# CTA
What do you want them to do?`}
          minHeight={400}
          collection="creative"
          entryId={editingId}
          field="brief"
        />

        {/* 04 Execution */}
        <SectionLabel number={4} title="Execution" />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Format</label>
            <PillGroup value={form.format} options={formatOptions} onChange={(v) => set("format", v as typeof form.format)} size="sm" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Type</label>
            <PillGroup value={form.type} options={typeOptions} onChange={(v) => set("type", v as typeof form.type)} size="sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Link to Ad</label>
              <div className="relative">
                <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input value={form.adLink} onChange={(e) => set("adLink", e.target.value)} placeholder="URL" className={`${inputClass} pl-9`} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Ad Variable</label>
              <input value={form.variable} onChange={(e) => set("variable", e.target.value)} placeholder="e.g. Hook 1 vs Hook 2" className={inputClass} />
            </div>
          </div>
        </div>

        {/* 05 Results */}
        <SectionLabel number={5} title="Results & Learnings" hint="Fill in after the test runs" />
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Test Result</label>
            <PillGroup value={form.result} options={resultOptions} onChange={(v) => set("result", v as typeof form.result)} allowEmpty size="sm" />
          </div>
          <RichTextField
            label="Learnings"
            value={form.learnings}
            onChange={(v) => set("learnings", v)}
            placeholder="What surprised you. Why it won or lost. What you'll test next."
            minHeight={180}
            collection="creative"
            entryId={editingId}
            field="learnings"
          />
        </div>

        {/* Bottom spacer */}
        <div className="h-16" />
      </FullScreenEditor>
    </div>
  );
}
