"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollText, Calendar } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { useToast } from "@/lib/toast-context";
import { setEntry, getBrandCollection } from "@/lib/firestore";
import { onSnapshot, query } from "firebase/firestore";
import { EmptyState } from "@/components/ui/empty-state";

interface AdsNote {
  [key: string]: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateDates(year: number) {
  const start = new Date(year, 1, 3);
  const end = new Date(year, 11, 31);
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function groupByWeek(dates: Date[]) {
  const months: { month: number; weeks: { dates: Date[]; recapKey: string }[] }[] = [];
  let currentMonth = -1;
  let currentWeek: Date[] = [];

  dates.forEach((dt, i) => {
    const m = dt.getMonth();
    if (m !== currentMonth) {
      if (currentWeek.length && months.length) {
        const recapKey = currentWeek[0].toISOString().split("T")[0] + "_recap";
        months[months.length - 1].weeks.push({ dates: currentWeek, recapKey });
        currentWeek = [];
      }
      currentMonth = m;
      months.push({ month: m, weeks: [] });
    }
    currentWeek.push(dt);
    if (dt.getDay() === 0 || i === dates.length - 1) {
      const recapKey = currentWeek[0].toISOString().split("T")[0] + "_recap";
      months[months.length - 1].weeks.push({ dates: currentWeek, recapKey });
      currentWeek = [];
    }
  });
  return months;
}

function NoteCell({ dateKey, value, onSave }: { dateKey: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="w-full bg-white/[0.04] border border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none resize-y min-h-[60px]"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors min-h-[36px] hover:bg-white/[0.03] ${
        value ? "text-white/70" : "text-white/20 italic"
      }`}
    >
      {value || "Add note..."}
    </div>
  );
}

export default function AdsLogPage() {
  const { brand } = useBrand();
  const { toast } = useToast();
  const [notes, setNotes] = useState<AdsNote>({});
  const [monthFilter, setMonthFilter] = useState<string>("");

  useEffect(() => {
    if (!brand?.id) return;
    const q = query(getBrandCollection(brand.id, "adsLog"));
    const unsub = onSnapshot(q, (snap) => {
      const data: AdsNote = {};
      snap.docs.forEach((d) => {
        const docData = d.data();
        Object.entries(docData).forEach(([k, v]) => {
          if (k !== "updatedAt" && typeof v === "string") data[k] = v;
        });
      });
      setNotes(data);
    });
    return unsub;
  }, [brand?.id]);

  if (!brand) return null;

  const allDates = generateDates(2025);
  const months = groupByWeek(allDates);
  const filteredMonths = monthFilter !== "" ? months.filter((m) => m.month === parseInt(monthFilter)) : months;

  const saveNote = async (key: string, value: string) => {
    const update: Record<string, string> = {};
    update[key] = value;
    await setEntry(brand.id, "adsLog", "notes", update);
  };

  const jumpToToday = () => {
    const now = new Date();
    setMonthFilter(String(now.getMonth()));
  };

  return (
    <div>
      <div className="flex gap-3 items-center mb-6 flex-wrap">
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/60 outline-none focus:border-violet-500/50"
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => i >= 1 && <option key={i} value={i}>{m}</option>)}
        </select>
        <button onClick={jumpToToday} className="px-4 py-2.5 bg-white/5 border border-white/[0.06] text-white/40 text-sm rounded-xl hover:bg-white/10 transition-colors">
          Today
        </button>
      </div>

      <div className="max-w-3xl space-y-8">
        {filteredMonths.map((monthGroup) => (
          <div key={monthGroup.month}>
            <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              {MONTHS[monthGroup.month]} 2025
            </h3>
            {monthGroup.weeks.map((week, wi) => (
              <div key={wi} className="mb-4">
                <div className="flex justify-between items-center text-[11px] text-white/20 uppercase tracking-widest pb-2 border-b border-white/[0.04] mb-2">
                  <span>Week {wi + 1}</span>
                  <span>{MONTHS[week.dates[0].getMonth()]} {week.dates[0].getDate()} — {week.dates[week.dates.length - 1].getDate()}</span>
                </div>
                {week.dates.map((dt) => {
                  const key = dt.toISOString().split("T")[0];
                  return (
                    <div key={key} className="flex gap-4 py-1.5 items-start">
                      <div className="w-20 shrink-0 pt-2">
                        <p className="text-xs font-semibold text-white/40">{DAYS[dt.getDay()]}</p>
                        <p className="text-[11px] text-white/20">{MONTHS[dt.getMonth()]} {dt.getDate()}</p>
                      </div>
                      <div className="flex-1">
                        <NoteCell dateKey={key} value={notes[key] || ""} onSave={(v) => saveNote(key, v)} />
                      </div>
                    </div>
                  );
                })}
                {/* Weekly Recap */}
                <div className="mt-2 mb-4 bg-violet-500/[0.04] border border-violet-500/10 rounded-xl p-4">
                  <p className="text-[10px] text-violet-400 uppercase tracking-widest mb-2">Weekly Recap</p>
                  <NoteCell dateKey={week.recapKey} value={notes[week.recapKey] || ""} onSave={(v) => saveNote(week.recapKey, v)} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
