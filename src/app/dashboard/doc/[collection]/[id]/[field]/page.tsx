"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useBrand } from "@/lib/brand-context";
import { RichText } from "@/components/ui/rich-text";

// Map of collection → title field used as page heading
const TITLE_FIELDS: Record<string, string> = {
  creative: "concept",
  cro: "concept",
  angles: "product",
  avatars: "name",
  awareness: "product",
  creators: "name",
  croRoadmap: "concept",
};

// Map of collection → back-link path
const BACK_PATHS: Record<string, string> = {
  creative: "/dashboard/creative",
  cro: "/dashboard/cro",
  angles: "/dashboard/angles",
  avatars: "/dashboard/avatars",
  awareness: "/dashboard/awareness",
  creators: "/dashboard/creators",
  croRoadmap: "/dashboard/cro-roadmap",
};

// Nice labels for field names
const FIELD_LABELS: Record<string, string> = {
  brief: "Brief",
  learnings: "Learnings",
  explanation: "Explanation",
  desc: "Description",
  hypothesis: "Hypothesis",
  trends: "Content Trends",
  notes: "Notes",
};

export default function DocEditorPage({ params }: { params: Promise<{ collection: string; id: string; field: string }> }) {
  const { collection, id, field } = use(params);
  const router = useRouter();
  const { brand } = useBrand();

  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<NodeJS.Timeout | null>(null);
  const latestRef = useRef<string>("");
  const initialLoadRef = useRef(true);

  const titleField = TITLE_FIELDS[collection] || "name";
  const backPath = BACK_PATHS[collection] || "/dashboard";
  const fieldLabel = FIELD_LABELS[field] || field;

  useEffect(() => {
    if (!brand?.id) return;
    const ref = doc(db, "brands", brand.id, collection, id);

    // Real-time subscription so external edits sync
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const data = snap.data();
      setTitle(data[titleField] || "Untitled");

      // Only update content on first load or if we're not mid-typing
      if (initialLoadRef.current) {
        setContent(data[field] || "");
        latestRef.current = data[field] || "";
        initialLoadRef.current = false;
        setLoading(false);
      }
    });

    return unsub;
  }, [brand?.id, collection, id, field, titleField]);

  const handleChange = (html: string) => {
    setContent(html);
    setSaveStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!brand?.id) return;
      if (html === latestRef.current) {
        setSaveStatus("idle");
        return;
      }
      await updateDoc(doc(db, "brands", brand.id, collection, id), { [field]: html });
      latestRef.current = html;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 700);
  };

  if (!brand || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[240] bg-[#0a0a12] flex flex-col animate-fade-in">
      {/* Top bar */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(backPath)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex-1 flex items-center justify-center gap-3 text-xs text-white/40 min-w-0">
            <span className="truncate max-w-md">{title}</span>
            <span className="text-white/15">·</span>
            <span className="font-mono uppercase tracking-widest text-[10px] text-violet-400/70">{fieldLabel}</span>
          </div>

          <div className="w-20 flex justify-end">
            {saveStatus === "saving" && <span className="text-[11px] text-white/30 flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Saving</span>}
            {saveStatus === "saved" && <span className="text-[11px] text-emerald-400/80 flex items-center gap-1.5"><Check size={11} /> Saved</span>}
          </div>
        </div>
      </header>

      {/* Writing area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-16">
          <div className="mb-6">
            <p className="text-[11px] font-mono text-violet-400/70 tracking-widest uppercase mb-3">{fieldLabel}</p>
            <h1 className="text-4xl font-bold text-white leading-tight">{title}</h1>
          </div>

          <div className="mt-12">
            <RichText
              value={content}
              onChange={handleChange}
              placeholder="Start writing…"
              minHeight={600}
              variant="document"
            />
          </div>

          <div className="h-32" />
        </div>
      </div>
    </div>
  );
}
