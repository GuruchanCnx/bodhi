"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playBell, playSoftTick, unlockAudio } from "@/lib/audio";
import { fivePrecepts } from "@/lib/content";

export interface DayVowRecord {
  dateStr: string; // YYYY-MM-DD
  vows: boolean[]; // 5 booleans [life, theft, sensuality, speech, intoxicants]
  notes?: string;
}

export default function VowTracker() {
  const [history, setHistory] = useState<Record<string, boolean[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [celebrate, setCelebrate] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bodhi-vows-history-30d");
      if (raw) {
        setHistory(JSON.parse(raw));
      } else {
        // Seed today with previous simple storage if existed
        const oldVows = localStorage.getItem("bodhi-precepts");
        if (oldVows) {
          const parsed = JSON.parse(oldVows);
          if (Array.isArray(parsed) && parsed.length === 5) {
            setHistory({ [todayStr]: parsed });
          }
        }
      }
    } catch {}
  }, [todayStr]);

  // Persist to localStorage
  const saveHistory = (next: Record<string, boolean[]>) => {
    setHistory(next);
    try {
      localStorage.setItem("bodhi-vows-history-30d", JSON.stringify(next));
      // Keep legacy format synced for today
      if (next[todayStr]) {
        localStorage.setItem("bodhi-precepts", JSON.stringify(next[todayStr]));
      }
    } catch {}
  };

  // Generate 30 rolling days (from 29 days ago to today)
  const last30Days = useMemo(() => {
    const days: { dateStr: string; dayNum: number; weekday: string; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      days.push({
        dateStr: str,
        dayNum: d.getDate(),
        weekday: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        isToday: str === todayStr,
      });
    }
    return days;
  }, [todayStr]);

  // Active vows for currently selected date
  const currentVows = useMemo(() => {
    return history[selectedDate] || [false, false, false, false, false];
  }, [history, selectedDate]);

  const currentKeptCount = currentVows.filter(Boolean).length;

  // Toggle single precept
  const togglePrecept = (index: number) => {
    unlockAudio();
    playSoftTick(880, 0.05);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }

    const nextVows = [...currentVows];
    nextVows[index] = !nextVows[index];

    const nextHistory = { ...history, [selectedDate]: nextVows };
    saveHistory(nextHistory);

    // If all 5 completed
    if (nextVows.every(Boolean)) {
      setCelebrate(true);
      playBell(5, 0.45, 432, "tibetan");
      setTimeout(() => setCelebrate(false), 2000);
    }
  };

  // Take all 5 vows at once
  const takeAllVows = () => {
    unlockAudio();
    playBell(6, 0.5, 432, "tibetan");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
    const allTrue = [true, true, true, true, true];
    const nextHistory = { ...history, [selectedDate]: allTrue };
    saveHistory(nextHistory);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2000);
  };

  // Reset selected day
  const resetDay = () => {
    const nextHistory = { ...history, [selectedDate]: [false, false, false, false, false] };
    saveHistory(nextHistory);
  };

  // Metrics across 30 days
  const metrics = useMemo(() => {
    let streak = 0;
    let fullDays = 0;
    let totalVowsKept = 0;
    const possibleVows = 30 * 5;

    // Calculate streak back from today
    const cursor = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    // If today has vows, count today; else start from yesterday
    let checkDate = fmt(cursor);
    const todayKept = (history[checkDate] || []).filter(Boolean).length;
    if (todayKept === 0) {
      cursor.setDate(cursor.getDate() - 1);
      checkDate = fmt(cursor);
    }

    while (true) {
      const dayVows = history[checkDate] || [];
      const kept = dayVows.filter(Boolean).length;
      if (kept > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
        checkDate = fmt(cursor);
      } else {
        break;
      }
    }

    last30Days.forEach((d) => {
      const v = history[d.dateStr] || [];
      const count = v.filter(Boolean).length;
      totalVowsKept += count;
      if (count === 5) fullDays++;
    });

    const rate = Math.round((totalVowsKept / possibleVows) * 100);

    return {
      streak,
      fullDays,
      totalVowsKept,
      rate,
    };
  }, [history, last30Days]);

  return (
    <div className="rounded-[2.25rem] border border-amber-900/15 bg-gradient-to-b from-white via-amber-50/30 to-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-800/20 bg-amber-100/60 px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-amber-900">
            <span>☸ Pañcasīla</span>
            <span>·</span>
            <span>30-Day Vow Tracker</span>
          </div>
          <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">
            The Five Precepts &amp; Calendar Heatmap
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">
            The bedrock of Buddhist training. Review each precept with honesty, gentleness, and reverence.
          </p>
        </div>

        {/* 30-Day Streak Badge */}
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl border border-amber-900/10 bg-white/90 px-4 py-2 text-right shadow-xs">
            <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-amber-800">
              Current Streak
            </span>
            <span className="font-display text-2xl font-bold text-stone-900">
              🔥 {metrics.streak} <span className="text-xs font-normal text-stone-500">days</span>
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 px-4 py-2 text-right shadow-xs">
            <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800">
              30-Day Sīla Rate
            </span>
            <span className="font-display text-2xl font-bold text-emerald-700">
              {metrics.rate}%
            </span>
          </div>
        </div>
      </div>

      {/* 30-DAY CALENDAR HEATMAP VISUALIZATION */}
      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-display text-base font-semibold text-stone-900">
              30-Day Precept Consistency Heatmap
            </h3>
            <p className="text-xs text-stone-500">
              Tap any date cell below to view or log vows for that day
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-1.5 text-[0.68rem] text-stone-500">
            <span>0</span>
            <span className="h-3.5 w-3.5 rounded-md border border-stone-200 bg-stone-100" title="0/5 vows" />
            <span className="h-3.5 w-3.5 rounded-md bg-amber-400/60" title="1-2/5 vows" />
            <span className="h-3.5 w-3.5 rounded-md bg-lime-500/70" title="3/5 vows" />
            <span className="h-3.5 w-3.5 rounded-md bg-emerald-500/80" title="4/5 vows" />
            <span className="h-3.5 w-3.5 rounded-md bg-emerald-600 text-[0.55rem] font-bold text-white grid place-items-center" title="5/5 full vows">✓</span>
            <span>5 Vows</span>
          </div>
        </div>

        {/* Heatmap Grid (30 rolling days) */}
        <div className="mt-4 grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {last30Days.map((d) => {
            const dayVows = history[d.dateStr] || [];
            const keptCount = dayVows.filter(Boolean).length;
            const isSelected = selectedDate === d.dateStr;

            // Heatmap color logic
            let bgClass = "border border-stone-200/80 bg-stone-50 text-stone-400 hover:border-amber-400";
            if (keptCount === 5) {
              bgClass = "bg-emerald-600 text-white font-bold shadow-xs";
            } else if (keptCount === 4) {
              bgClass = "bg-emerald-500/85 text-white font-semibold";
            } else if (keptCount === 3) {
              bgClass = "bg-lime-500/80 text-stone-950 font-semibold";
            } else if (keptCount >= 1) {
              bgClass = "bg-amber-400/70 text-amber-950 font-medium";
            }

            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => {
                  unlockAudio();
                  playSoftTick(900, 0.03);
                  setSelectedDate(d.dateStr);
                }}
                className={`relative flex flex-col items-center justify-between rounded-xl p-1.5 text-center transition-all ${bgClass} ${
                  isSelected
                    ? "ring-2 ring-amber-700 ring-offset-2 scale-105 z-10"
                    : "hover:scale-102"
                }`}
                title={`${d.dateStr}: ${keptCount} of 5 precepts honored`}
              >
                <span className="text-[0.6rem] uppercase tracking-tighter opacity-70">
                  {d.weekday}
                </span>
                <span className="text-xs font-bold leading-none my-0.5">
                  {d.dayNum}
                </span>
                <span className="text-[0.55rem] leading-none opacity-80">
                  {keptCount}/5
                </span>

                {/* Today dot indicator */}
                {d.isToday && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY PRECEPT REVIEW & VOW CARDS */}
      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                {selectedDate === todayStr ? "Today's Practice" : selectedDate}
              </span>
              <span className="font-display text-lg font-semibold text-stone-900">
                {currentKeptCount} of 5 Precepts Kept
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Each morning, take the precepts as a sacred intention. Each evening, review with kindness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={takeAllVows}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
            >
              ✓ Take All 5 Vows
            </button>
            <button
              type="button"
              onClick={resetDay}
              className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progress Bar for Selected Day */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <motion.div
            initial={false}
            animate={{ width: `${(currentKeptCount / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`h-full rounded-full transition-colors duration-300 ${
              currentKeptCount === 5
                ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                : "bg-gradient-to-r from-amber-600 to-amber-400"
            }`}
          />
        </div>

        {/* Precept Cards */}
        <div className="mt-5 space-y-3">
          {fivePrecepts.map((p, i) => {
            const isHonored = currentVows[i] === true;
            return (
              <motion.button
                key={p.name}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => togglePrecept(i)}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isHonored
                    ? "border-emerald-600/40 bg-emerald-50/60 shadow-xs"
                    : "border-stone-200 bg-white/90 hover:border-amber-700/40"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold transition ${
                    isHonored
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-stone-300 bg-stone-50 text-stone-400"
                  }`}
                >
                  {isHonored ? "✓" : i + 1}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-stone-900 text-sm">
                      {i + 1}. Refrain from {p.name.toLowerCase()}
                    </span>
                    <span className="text-xs italic text-amber-800">{p.pali}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600 leading-relaxed">{p.detail}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Celebration Banner */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-2xl border border-emerald-600/30 bg-emerald-100/70 p-3 text-center text-xs font-bold text-emerald-900"
            >
              🪷 Sādhu! All five precepts honored. A pure conscience is the sweet fragrance of Dhamma.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
