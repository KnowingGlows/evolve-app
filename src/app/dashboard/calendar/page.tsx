"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useBrand } from "@/lib/brand-context";
import { useToast } from "@/lib/toast-context";
import { setEntry, getEntry } from "@/lib/firestore";
import type { CalendarData, MonthData, CalendarEvents } from "@/lib/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = [
  { label: "Q1", months: [0, 1, 2], color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { label: "Q2", months: [3, 4, 5], color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { label: "Q3", months: [6, 7, 8], color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { label: "Q4", months: [9, 10, 11], color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

const defaultMonth: MonthData = { targetRevenuePercent: 0, targetRevenue: 0, actualRevenue: 0, targetSpend: 0, actualSpend: 0, targetMER: 4 };
const defaultEvents: CalendarEvents = { keyEvents: [], salesPromos: [], winningAds: [], winningLPs: [], productLaunches: [] };

function defaultCalendar(year: number): Omit<CalendarData, "id"> {
  const months: Record<string, MonthData> = {};
  MONTHS.forEach((m) => { months[m] = { ...defaultMonth }; });
  return { year, grossProfitMargin: 0.8, targetMER: 4, targetYearlyRevenue: 20000000, targetYearlySpend: 5000000, months, events: { ...defaultEvents } };
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }

function EditableNum({ value, onSave, format = "number" }: { value: number; onSave: (v: number) => void; format?: "number" | "currency" | "percent" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const display = format === "currency" ? fmt(value) : format === "percent" ? pct(value) : String(value);

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(parseFloat(draft) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(parseFloat(draft) || 0); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        autoFocus
        className="w-full bg-white/[0.04] border border-violet-500/40 rounded px-2 py-1 text-xs text-white outline-none text-right"
      />
    );
  }

  return (
    <span onClick={() => { setDraft(String(value)); setEditing(true); }} className="cursor-pointer hover:text-violet-400 transition-colors">
      {display}
    </span>
  );
}

function EventList({ title, items, onUpdate }: { title: string; items: string[]; onUpdate: (items: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</h4>
        <button onClick={() => setAdding(true)} className="p-1 text-white/20 hover:text-violet-400"><Plus size={14} /></button>
      </div>
      {adding && (
        <div className="flex gap-2 mb-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newItem.trim()) { onUpdate([...items, newItem.trim()]); setNewItem(""); setAdding(false); } if (e.key === "Escape") setAdding(false); }}
            autoFocus
            placeholder="Add item..."
            className="flex-1 bg-white/[0.04] border border-violet-500/40 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
          />
        </div>
      )}
      {items.length === 0 && !adding && <p className="text-xs text-white/15 italic">No items</p>}
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between items-center text-xs text-white/50 py-1 border-b border-white/[0.03] last:border-0 group">
            <span>{item}</span>
            <button onClick={() => onUpdate(items.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400"><Trash2 size={12} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const year = parseInt(searchParams.get("year") || "2025");
  const { brand } = useBrand();
  const { toast } = useToast();
  const [data, setData] = useState<Omit<CalendarData, "id"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand?.id) return;
    setLoading(true);
    getEntry<CalendarData>(brand.id, "calendar", String(year)).then((d) => {
      setData(d || defaultCalendar(year));
      setLoading(false);
    });
  }, [brand?.id, year]);

  const save = useCallback(async (newData: Omit<CalendarData, "id">) => {
    if (!brand?.id) return;
    setData(newData);
    await setEntry(brand.id, "calendar", String(year), newData);
  }, [brand?.id, year]);

  if (!brand || loading || !data) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>;
  }

  const updateMonth = (month: string, field: keyof MonthData, value: number) => {
    const newData = { ...data, months: { ...data.months, [month]: { ...data.months[month], [field]: value } } };
    save(newData);
  };

  const updateGlobal = (field: string, value: number) => {
    save({ ...data, [field]: value });
  };

  const updateEvents = (field: keyof CalendarEvents, items: string[]) => {
    save({ ...data, events: { ...data.events, [field]: items } });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">{year} Marketing Overview</h2>

      {/* Global Targets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Target Yearly Revenue", field: "targetYearlyRevenue", value: data.targetYearlyRevenue, format: "currency" as const },
          { label: "Target Yearly Spend", field: "targetYearlySpend", value: data.targetYearlySpend, format: "currency" as const },
          { label: "Target MER", field: "targetMER", value: data.targetMER, format: "number" as const },
          { label: "Gross Profit Margin", field: "grossProfitMargin", value: data.grossProfitMargin, format: "percent" as const },
        ].map((m) => (
          <div key={m.field} className="bg-[#111119] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">{m.label}</p>
            <div className="text-lg font-bold text-violet-400">
              <EditableNum value={m.value} onSave={(v) => updateGlobal(m.field, v)} format={m.format} />
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Grid */}
      <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider sticky left-0 bg-[#111119] min-w-[180px]">Metric</th>
                {QUARTERS.map((q) => (
                  <th key={q.label} colSpan={3} className={`text-center px-2 py-2 text-[10px] font-bold tracking-wider border-b ${q.color}`}>
                    {q.label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-white/[0.06]">
                <th className="sticky left-0 bg-[#111119]" />
                {MONTHS.map((m) => (
                  <th key={m} className="text-center px-3 py-2 text-[10px] font-medium text-white/30">{MONTH_SHORT[MONTHS.indexOf(m)]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Target Revenue % */}
              <tr className="border-b border-white/[0.03]">
                <td className="px-4 py-3 text-white/50 font-medium sticky left-0 bg-[#111119]">% Yearly Revenue</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-white/60">
                    <EditableNum value={data.months[m]?.targetRevenuePercent || 0} onSave={(v) => updateMonth(m, "targetRevenuePercent", v)} format="percent" />
                  </td>
                ))}
              </tr>
              {/* Target Revenue */}
              <tr className="border-b border-white/[0.03]">
                <td className="px-4 py-3 text-white/50 font-medium sticky left-0 bg-[#111119]">Target Revenue</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-white/60">
                    <EditableNum value={data.months[m]?.targetRevenue || 0} onSave={(v) => updateMonth(m, "targetRevenue", v)} format="currency" />
                  </td>
                ))}
              </tr>
              {/* Actual Revenue */}
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <td className="px-4 py-3 text-emerald-400/70 font-medium sticky left-0 bg-[#12121a]">Actual Revenue</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-emerald-400/60">
                    <EditableNum value={data.months[m]?.actualRevenue || 0} onSave={(v) => updateMonth(m, "actualRevenue", v)} format="currency" />
                  </td>
                ))}
              </tr>
              {/* Target Spend */}
              <tr className="border-b border-white/[0.03]">
                <td className="px-4 py-3 text-white/50 font-medium sticky left-0 bg-[#111119]">Target Spend</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-white/60">
                    <EditableNum value={data.months[m]?.targetSpend || 0} onSave={(v) => updateMonth(m, "targetSpend", v)} format="currency" />
                  </td>
                ))}
              </tr>
              {/* Actual Spend */}
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <td className="px-4 py-3 text-amber-400/70 font-medium sticky left-0 bg-[#12121a]">Actual Spend</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-amber-400/60">
                    <EditableNum value={data.months[m]?.actualSpend || 0} onSave={(v) => updateMonth(m, "actualSpend", v)} format="currency" />
                  </td>
                ))}
              </tr>
              {/* Target MER */}
              <tr className="border-b border-white/[0.03]">
                <td className="px-4 py-3 text-white/50 font-medium sticky left-0 bg-[#111119]">Target MER</td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-3 py-3 text-center text-white/60">
                    <EditableNum value={data.months[m]?.targetMER || data.targetMER} onSave={(v) => updateMonth(m, "targetMER", v)} />
                  </td>
                ))}
              </tr>
              {/* Computed: Actual MER */}
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <td className="px-4 py-3 text-violet-400/70 font-medium sticky left-0 bg-[#12121a]">Actual MER</td>
                {MONTHS.map((m) => {
                  const month = data.months[m];
                  const mer = month?.actualSpend ? (month.actualRevenue / month.actualSpend).toFixed(2) : "—";
                  return <td key={m} className="px-3 py-3 text-center text-violet-400/60">{mer}</td>;
                })}
              </tr>
              {/* Computed: Gross Profit */}
              <tr>
                <td className="px-4 py-3 text-emerald-400/70 font-medium sticky left-0 bg-[#111119]">Gross Profit</td>
                {MONTHS.map((m) => {
                  const month = data.months[m];
                  const profit = (month?.actualRevenue || 0) * data.grossProfitMargin - (month?.actualSpend || 0);
                  return <td key={m} className="px-3 py-3 text-center text-emerald-400/60">{month?.actualRevenue ? fmt(profit) : "—"}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <EventList title="Key Events" items={data.events.keyEvents} onUpdate={(items) => updateEvents("keyEvents", items)} />
        <EventList title="Sales/Promotions" items={data.events.salesPromos} onUpdate={(items) => updateEvents("salesPromos", items)} />
        <EventList title="Winning Ads" items={data.events.winningAds} onUpdate={(items) => updateEvents("winningAds", items)} />
        <EventList title="Winning LPs" items={data.events.winningLPs} onUpdate={(items) => updateEvents("winningLPs", items)} />
        <EventList title="Product Launches" items={data.events.productLaunches} onUpdate={(items) => updateEvents("productLaunches", items)} />
      </div>
    </div>
  );
}
