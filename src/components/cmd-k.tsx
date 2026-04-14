"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Palette, ScrollText, Heart, Diamond, Users,
  Eye, Star, TrendingUp, Map, Plus, CornerDownLeft, Settings, UserCog,
} from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { addEntry } from "@/lib/firestore";

interface CmdKProps {
  open: boolean;
  onClose: () => void;
}

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
  run: () => void | Promise<void>;
};

export function CmdK({ open, onClose }: CmdKProps) {
  const router = useRouter();
  const { brand } = useBrand();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [mode, setMode] = useState<"root" | "desire" | "avatar">("root");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setMode("root");
      setDraft("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const actions: Action[] = useMemo(() => {
    if (!brand) return [];

    const addDesire = async () => {
      if (!draft.trim()) return;
      await addEntry(brand.id, "desires", { text: draft.trim() });
      toast("Desire added");
      onClose();
    };

    const addAvatar = async () => {
      if (!draft.trim()) return;
      await addEntry(brand.id, "avatars", { name: draft.trim(), desc: "" });
      toast("Avatar added");
      onClose();
      router.push("/dashboard/avatars");
    };

    if (mode === "desire") {
      return [{
        id: "confirm-desire",
        label: draft.trim() ? `Add desire: "${draft}"` : "Type a desire first...",
        icon: Heart,
        group: "Quick Add",
        run: addDesire,
      }];
    }

    if (mode === "avatar") {
      return [{
        id: "confirm-avatar",
        label: draft.trim() ? `Add avatar: "${draft}"` : "Type an avatar name first...",
        icon: Users,
        group: "Quick Add",
        run: addAvatar,
      }];
    }

    return [
      // Quick Add
      { id: "new-creative", label: "New Ad Concept", icon: Palette, group: "Quick Add", keywords: "creative ad concept add", run: () => go("/dashboard/creative?new=1") },
      { id: "new-cro", label: "New LP Test", icon: TrendingUp, group: "Quick Add", keywords: "cro landing page", run: () => go("/dashboard/cro?new=1") },
      { id: "quick-desire", label: "Quick Add Desire…", icon: Heart, group: "Quick Add", keywords: "desire I want", run: () => { setMode("desire"); setQuery(""); setActiveIdx(0); } },
      { id: "quick-avatar", label: "Quick Add Avatar…", icon: Users, group: "Quick Add", keywords: "avatar persona", run: () => { setMode("avatar"); setQuery(""); setActiveIdx(0); } },
      { id: "new-angle", label: "New Angle", icon: Diamond, group: "Quick Add", run: () => go("/dashboard/angles?new=1") },
      { id: "new-creator", label: "Add Creator", icon: Star, group: "Quick Add", run: () => go("/dashboard/creators?new=1") },

      // Navigate
      { id: "nav-overview", label: "Overview", icon: LayoutDashboard, group: "Navigate", run: () => go("/dashboard") },
      { id: "nav-creative", label: "Creative Roadmap", icon: Palette, group: "Navigate", run: () => go("/dashboard/creative") },
      { id: "nav-ads", label: "Ads Log", icon: ScrollText, group: "Navigate", run: () => go("/dashboard/ads-log") },
      { id: "nav-desires", label: "Desires", icon: Heart, group: "Navigate", run: () => go("/dashboard/desires") },
      { id: "nav-angles", label: "Angles", icon: Diamond, group: "Navigate", run: () => go("/dashboard/angles") },
      { id: "nav-avatars", label: "Avatars", icon: Users, group: "Navigate", run: () => go("/dashboard/avatars") },
      { id: "nav-awareness", label: "Awareness", icon: Eye, group: "Navigate", run: () => go("/dashboard/awareness") },
      { id: "nav-creators", label: "Creators", icon: Star, group: "Navigate", run: () => go("/dashboard/creators") },
      { id: "nav-cro", label: "CRO Tests", icon: TrendingUp, group: "Navigate", run: () => go("/dashboard/cro") },
      { id: "nav-cro-roadmap", label: "CRO Roadmap", icon: Map, group: "Navigate", run: () => go("/dashboard/cro-roadmap") },
      { id: "nav-settings", label: "Settings", icon: Settings, group: "Workspace", run: () => go("/dashboard/settings") },
      ...(isAdmin ? [{ id: "nav-users", label: "Users & Permissions", icon: UserCog, group: "Workspace", run: () => go("/dashboard/users") }] : []),
    ];
  }, [brand, mode, draft, router, toast, isAdmin]);

  const filtered = useMemo(() => {
    if (mode !== "root") return actions;
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) =>
      a.label.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      (a.keywords || "").toLowerCase().includes(q)
    );
  }, [query, actions, mode]);

  const grouped = useMemo(() => {
    const g: Record<string, Action[]> = {};
    filtered.forEach((a) => { (g[a.group] ||= []).push(a); });
    return g;
  }, [filtered]);

  useEffect(() => { setActiveIdx(0); }, [query, mode]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter") { e.preventDefault(); filtered[activeIdx]?.run(); }
    if (e.key === "Escape") {
      if (mode !== "root") { setMode("root"); setQuery(""); setDraft(""); }
      else onClose();
    }
  };

  if (!open) return null;

  let flatIdx = -1;
  const placeholder = mode === "desire" ? "Type a desire (I want...)" : mode === "avatar" ? "Avatar name..." : "Search or jump to...";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-start justify-center pt-[15vh] px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#14141d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <Search size={16} className="text-white/30" />
          <input
            ref={inputRef}
            value={mode === "root" ? query : draft}
            onChange={(e) => mode === "root" ? setQuery(e.target.value) : setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          {mode !== "root" && (
            <button
              onClick={() => { setMode("root"); setDraft(""); }}
              className="text-[11px] text-white/40 hover:text-white/70 px-2 py-0.5 bg-white/5 rounded"
            >
              Esc to cancel
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-white/30 py-8">No matches</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-5 pt-3 pb-1.5 text-[10px] uppercase tracking-widest text-white/20 font-semibold">{group}</p>
                {items.map((item) => {
                  flatIdx++;
                  const active = flatIdx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.run()}
                      onMouseEnter={() => setActiveIdx(flatIdx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors ${
                        active ? "bg-violet-500/15 text-violet-200" : "text-white/60"
                      }`}
                    >
                      <item.icon size={15} className={active ? "text-violet-400" : "text-white/40"} />
                      <span className="flex-1">{item.label}</span>
                      {active && <CornerDownLeft size={13} className="text-violet-400/70" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-black/20 flex items-center justify-between text-[11px] text-white/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/5 rounded">esc</kbd> Close</span>
          </div>
          <span className="font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
