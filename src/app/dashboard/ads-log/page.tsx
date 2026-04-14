"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, Check, Circle } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { setEntry, getBrandCollection } from "@/lib/firestore";
import { onSnapshot, query } from "firebase/firestore";

interface AdsNote { [key: string]: string }

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

function isToday(d: Date) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

// Autosave note cell — debounced
function NoteCell({
  value, onSave, placeholder = "Add a note…", compact = false,
}: { value: string; onSave: (v: string) => void; placeholder?: string; compact?: boolean }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const latestValue = useRef(value);

  useEffect(() => {
    // Sync from remote if value changes externally while not focused
    if (!focused && value !== draft) setDraft(value);
    latestValue.current = value;
  }, [value, focused]);

  const scheduleSave = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (v !== latestValue.current) {
        onSave(v);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      }
    }, 600);
  };

  return (
    <div className="relative group">
      <textarea
        value={draft}
        onChange={(e) => { setDraft(e.target.value); scheduleSave(e.target.value); }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (timer.current) clearTimeout(timer.current);
          if (draft !== latestValue.current) onSave(draft);
        }}
        placeholder={placeholder}
        rows={1}
        className={`w-full bg-transparent border-0 outline-none resize-none text-sm leading-relaxed transition-colors
          ${compact ? "py-1" : "py-1.5"}
          ${draft ? "text-white/80" : "text-white/25"}
          focus:text-white placeholder-white/15
          overflow-hidden
        `}
        style={{ minHeight: compact ? 28 : 32, height: "auto" }}
        ref={(el) => {
          if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
        }}
      />
      {saved && (
        <span className="absolute right-0 top-2 text-[10px] text-emerald-400/70 flex items-center gap-1 animate-fade-in">
          <Check size={10} /> Saved
        </span>
      )}
    </div>
  );
}

export default function AdsLogPage() {
  const { brand } = useBrand();
  const [notes, setNotes] = useState<AdsNote>({});
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

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

  const months = useMemo(() => groupByWeek(generateDates(yearFilter)), [yearFilter]);
  const filteredMonths = monthFilter !== "" ? months.filter((m) => m.month === parseInt(monthFilter)) : months;

  const totalDays = useMemo(() => Object.keys(notes).filter((k) => !k.endsWith("_recap") && notes[k]).length, [notes]);

  if (!brand) return null;

  const saveNote = async (key: string, value: string) => {
    const update: Record<string, string> = {};
    update[key] = value;
    await setEntry(brand.id, "adsLog", "notes", update);
  };

  const jumpToToday = () => {
    const now = new Date();
    setYearFilter(now.getFullYear());
    setMonthFilter(String(now.getMonth()));
    setTimeout(() => {
      document.getElementById(`month-${now.getMonth()}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center mb-8">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(parseInt(e.target.value))}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none focus:border-violet-500/50"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none focus:border-violet-500/50"
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <button onClick={jumpToToday} className="px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm rounded-xl hover:bg-violet-500/20 transition-colors">
          Jump to today
        </button>
        <div className="ml-auto text-xs text-white/30">
          <span className="text-emerald-400 font-semibold">{totalDays}</span> day{totalDays !== 1 ? "s" : ""} logged
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-12">
        {filteredMonths.map((monthGroup) => (
          <section key={monthGroup.month} id={`month-${monthGroup.month}`}>
            <div className="sticky top-[64px] z-10 -mx-2 px-2 py-2 bg-[#0a0a12]/90 backdrop-blur-md border-b border-white/[0.04] mb-5 flex items-center gap-2">
              <Calendar size={14} className="text-violet-400" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">{MONTHS[monthGroup.month]} {yearFilter}</h3>
            </div>

            {monthGroup.weeks.map((week, wi) => {
              const recap = notes[week.recapKey] || "";
              return (
                <div key={wi} className="mb-8">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.04]">
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[2px]">Week {wi + 1}</span>
                    <span className="text-[10px] text-white/25 tabular-nums">
                      {MONTHS[week.dates[0].getMonth()]} {week.dates[0].getDate()} — {week.dates[week.dates.length - 1].getDate()}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {week.dates.map((dt) => {
                      const key = dt.toISOString().split("T")[0];
                      const hasNote = !!notes[key];
                      const today = isToday(dt);

                      return (
                        <div
                          key={key}
                          className={`flex gap-4 items-start px-3 py-2 rounded-xl transition-colors ${
                            today ? "bg-violet-500/[0.05] border border-violet-500/15" : "hover:bg-white/[0.015]"
                          }`}
                        >
                          <div className="w-16 shrink-0 pt-1.5 flex items-center gap-2">
                            {hasNote ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
                            )}
                            <div>
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${today ? "text-violet-400" : "text-white/40"}`}>
                                {DAYS[dt.getDay()]}
                              </p>
                              <p className={`text-[11px] tabular-nums ${today ? "text-violet-300" : "text-white/25"}`}>
                                {dt.getDate()}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <NoteCell
                              value={notes[key] || ""}
                              onSave={(v) => saveNote(key, v)}
                              placeholder={today ? "What happened today?" : ""}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly Recap */}
                  <div className="mt-3 rounded-2xl bg-gradient-to-br from-violet-500/[0.06] to-transparent border border-violet-500/15 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1 h-1 rounded-full bg-violet-400" />
                      <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Weekly Recap</p>
                    </div>
                    <NoteCell
                      value={recap}
                      onSave={(v) => saveNote(week.recapKey, v)}
                      placeholder="Patterns, wins, losses, what to try next week…"
                    />
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
