"use client";

import { useState, useEffect } from "react";
import { BarChart3, Palette, TrendingUp, Heart, Link as LinkIcon, Users, Pencil, Check, X } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useCollection } from "@/hooks/use-collection";
import { useToast } from "@/lib/toast-context";
import { updateBrandSettings } from "@/lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CreativeEntry, CroEntry, DesireEntry } from "@/lib/types";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-colors">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
        <Icon size={18} />
      </div>
      <p className="text-sm text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function EditableField({ value, onSave, label }: { value: string; onSave: (v: string) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onSave(draft); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className="flex-1 bg-white/[0.04] border border-violet-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none"
        />
        <button onClick={() => { onSave(draft); setEditing(false); }} className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10"><X size={14} /></button>
      </div>
    );
  }

  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="group flex items-center gap-2 text-left">
      <span className="text-sm text-white/70">{value || `Set ${label}...`}</span>
      <Pencil size={12} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function OverviewPage() {
  const { brand } = useBrand();
  const { toast } = useToast();
  const { items: creative } = useCollection<CreativeEntry>("creative");
  const { items: cro } = useCollection<CroEntry>("cro");
  const { items: desires } = useCollection<DesireEntry>("desires");
  const [team, setTeam] = useState(brand?.team || []);
  const [editingTeam, setEditingTeam] = useState(false);

  useEffect(() => {
    setTeam(brand?.team || []);
  }, [brand]);

  if (!brand) return null;

  const activeCreative = creative.filter((c) => c.status === "Testing" || c.status === "Learning").length;
  const activeCro = cro.filter((c) => c.status === "Testing").length;

  const updateSetting = async (key: string, value: string) => {
    await updateBrandSettings(brand.id, { [`settings.${key}`]: value });
    toast("Updated");
  };

  const saveTeam = async () => {
    const brandRef = doc(db, "brands", brand.id);
    await updateDoc(brandRef, { team });
    setEditingTeam(false);
    toast("Team saved");
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
            <BarChart3 size={18} />
          </div>
          <p className="text-sm text-white/40 mb-1">Ad Hit Rate</p>
          <EditableField
            value={brand.settings?.adHitRate || "0%"}
            onSave={(v) => updateSetting("adHitRate", v)}
            label="hit rate"
          />
        </div>
        <StatCard icon={Palette} label="Active Creative Tests" value={activeCreative} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={TrendingUp} label="Active CRO Tests" value={activeCro} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={Heart} label="Market Desires" value={desires.length} color="bg-rose-500/10 text-rose-400" />
      </div>

      {/* Team */}
      <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-white">Team</h3>
          {editingTeam ? (
            <div className="flex gap-2">
              <button onClick={saveTeam} className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors">Save</button>
              <button onClick={() => { setTeam(brand.team || []); setEditingTeam(false); }} className="px-3 py-1.5 bg-white/5 text-white/40 text-xs rounded-lg hover:bg-white/10 transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditingTeam(true)} className="px-3 py-1.5 bg-white/5 text-white/40 text-xs rounded-lg border border-white/[0.06] hover:bg-white/10 transition-colors">
              Edit Team
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 text-center">
              <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-[1.5px] mb-2">
                {editingTeam ? (
                  <input
                    value={member.role}
                    onChange={(e) => { const t = [...team]; t[i] = { ...t[i], role: e.target.value }; setTeam(t); }}
                    className="w-full bg-transparent border-b border-violet-500/30 text-center text-violet-400 outline-none text-[10px] uppercase tracking-[1.5px]"
                  />
                ) : member.role}
              </p>
              {editingTeam ? (
                <input
                  value={member.name}
                  onChange={(e) => { const t = [...team]; t[i] = { ...t[i], name: e.target.value }; setTeam(t); }}
                  placeholder="Name..."
                  className="w-full bg-transparent border-b border-white/10 text-center text-white text-sm outline-none placeholder-white/20"
                />
              ) : (
                <p className="text-sm font-medium text-white">{member.name || "Unassigned"}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">Quick Links</h3>
        <div>
          <label className="block text-xs font-medium text-white/30 mb-2">Research Document URL</label>
          <EditableField
            value={brand.settings?.researchDocUrl || ""}
            onSave={(v) => updateSetting("researchDocUrl", v)}
            label="URL"
          />
        </div>
      </div>
    </div>
  );
}
