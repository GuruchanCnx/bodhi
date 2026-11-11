"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/chrome";
import { playBell, unlockAudio } from "@/lib/audio";
import { ConfettiBurstOverlay } from "@/components/confetti-burst";
import { exportAsPdf, exportAsPng, HabitTrendExportData } from "@/lib/habit-export";

export interface HabitItem {
  id: string;
  title: string;
  targetMinutes: number;
  frequency: string;
  streak: number;
  completedDates: string[];
  active: boolean;
  createdAt?: string;
}

const DEFAULT_HABITS: HabitItem[] = [
  {
    id: "habit-default-1",
    title: "Sit for 10 minutes",
    targetMinutes: 10,
    frequency: "daily",
    streak: 1,
    completedDates: [new Date().toISOString().slice(0, 10)],
    active: true,
  },
  {
    id: "habit-default-2",
    title: "Morning Anapana breath reset",
    targetMinutes: 5,
    frequency: "daily",
    streak: 0,
    completedDates: [],
    active: true,
  },
];

const PRESETS = [
  { title: "Sit for 10 minutes", minutes: 10 },
  { title: "Morning breath reset (5 min)", minutes: 5 },
  { title: "Evening loving-kindness (15 min)", minutes: 15 },
  { title: "Walking meditation after lunch", minutes: 10 },
];

export default function HabitsSection() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  // Confetti bursts
  const [bursts, setBursts] = useState<{ id: string; x: number; y: number }[]>([]);

  // Daily notification state
  const [reminderActive, setReminderActive] = useState(false);
  const [reminderTime, setReminderTime] = useState("07:30");
  const [notifPermission, setNotifPermission] = useState<string>("default");

  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Last 7 days helper for habit chart & dots
  const last7Days = useMemo(() => {
    const days: { dateStr: string; label: string; fullDate: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      days.push({
        dateStr: str,
        label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" }),
        fullDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      });
    }
    return days;
  }, []);

  // Check notification permission and load saved settings
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
    try {
      const savedReminder = localStorage.getItem("bodhi-habit-reminder");
      if (savedReminder) {
        const parsed = JSON.parse(savedReminder);
        if (parsed.time) setReminderTime(parsed.time);
        if (typeof parsed.enabled === "boolean") setReminderActive(parsed.enabled);
      }
    } catch {}
  }, []);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportOpen]);

  // Load habits from API / Firestore or fallback to localStorage
  useEffect(() => {
    let alive = true;
    const fetchHabits = async () => {
      try {
        const res = await fetch("/api/habits");
        if (res.ok) {
          const data = await res.json();
          if (alive && data.habits && data.habits.length > 0) {
            setHabits(data.habits);
            localStorage.setItem("bodhi-habits", JSON.stringify(data.habits));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load habits from network, checking storage:", err);
      }

      // Local storage fallback
      try {
        const local = localStorage.getItem("bodhi-habits");
        if (local) {
          const parsed = JSON.parse(local);
          if (alive && Array.isArray(parsed) && parsed.length > 0) {
            setHabits(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {}

      if (alive) {
        setHabits(DEFAULT_HABITS);
        setLoading(false);
      }
    };

    fetchHabits();
    return () => {
      alive = false;
    };
  }, []);

  // 7-day completion chart metrics
  const chartData = useMemo(() => {
    const totalHabits = Math.max(1, habits.length);
    let totalCompletionsInWeek = 0;

    const days = last7Days.map((d) => {
      const completedCount = habits.filter((h) =>
        h.completedDates.includes(d.dateStr)
      ).length;
      totalCompletionsInWeek += completedCount;
      const pct = Math.min(100, Math.round((completedCount / totalHabits) * 100));
      return {
        ...d,
        count: completedCount,
        total: habits.length,
        pct,
      };
    });

    const weeklyPossible = habits.length * 7;
    const weeklyRate = weeklyPossible > 0 ? Math.round((totalCompletionsInWeek / weeklyPossible) * 100) : 0;

    return {
      days,
      totalCompletionsInWeek,
      weeklyRate,
    };
  }, [habits, last7Days]);

  // Toggle completion for today with micro-interaction + confetti burst + Tibetan bell
  const toggleToday = async (habit: HabitItem, e: React.MouseEvent<HTMLButtonElement>) => {
    const isDone = habit.completedDates.includes(todayStr);
    const updatedDates = isDone
      ? habit.completedDates.filter((d) => d !== todayStr)
      : [...habit.completedDates, todayStr].sort();

    // Recalculate streak
    let streak = 0;
    const cursor = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const set = new Set(updatedDates);
    if (!set.has(fmt(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (set.has(fmt(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const optimistic: HabitItem = {
      ...habit,
      completedDates: updatedDates,
      streak,
    };

    const nextHabits = habits.map((h) => (h.id === habit.id ? optimistic : h));
    setHabits(nextHabits);
    try {
      localStorage.setItem("bodhi-habits", JSON.stringify(nextHabits));
    } catch {}

    if (!isDone) {
      // Trigger Satisfying Micro-Interactions:
      // 1. Confetti Burst at button coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      setBursts((prev) => [...prev, { id: `burst-${Date.now()}`, x: originX, y: originY }]);

      // 2. Button Scale Pop State
      setJustCompletedId(habit.id);
      setTimeout(() => setJustCompletedId(null), 800);

      // 3. Sacred Tibetan Bowl Chime (with mobile unlock)
      unlockAudio();
      playBell(4.5, 0.5, 432, "tibetan");

      // 4. Haptic vibration feedback for mobile
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([20, 35, 20]);
        } catch {}
      }

      toast(`✦ Completed: “${habit.title}” · ${streak}-day streak!`);
    } else {
      toast("Habit unmarked for today");
    }

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          id: habit.id,
          date: todayStr,
          currentDates: habit.completedDates,
        }),
      });
    } catch (err) {
      console.warn("Could not sync toggle to server:", err);
    }
  };

  const handleClearBurst = (id: string) => {
    setBursts((curr) => curr.filter((b) => b.id !== id));
  };

  // Add new habit
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    const newHabit: HabitItem = {
      id: `local-${Date.now()}`,
      title,
      targetMinutes: newMinutes,
      frequency: "daily",
      streak: 0,
      completedDates: [],
      active: true,
      createdAt: new Date().toISOString(),
    };

    const next = [newHabit, ...habits];
    setHabits(next);
    try {
      localStorage.setItem("bodhi-habits", JSON.stringify(next));
    } catch {}

    toast(`☸ Daily habit created: “${title}”`);
    setNewTitle("");
    setIsAdding(false);

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetMinutes: newMinutes,
          frequency: "daily",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.habit?.id) {
          setHabits((curr) =>
            curr.map((h) => (h.id === newHabit.id ? data.habit : h))
          );
        }
      }
    } catch (err) {
      console.warn("Could not persist habit to server:", err);
    } finally {
      setSaving(false);
    }
  };

  const removeHabit = async (id: string, title: string) => {
    if (!confirm(`Release daily habit “${title}”?`)) return;
    const next = habits.filter((h) => h.id !== id);
    setHabits(next);
    try {
      localStorage.setItem("bodhi-habits", JSON.stringify(next));
    } catch {}
    toast("Habit released 🍃");

    try {
      await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    } catch {}
  };

  // Toggle notification reminder
  const toggleReminder = async () => {
    if (!reminderActive) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission !== "granted") {
          const perm = await Notification.requestPermission();
          setNotifPermission(perm);
          if (perm !== "granted") {
            toast("Notifications were blocked in your browser settings", "info");
            return;
          }
        }
      }
      setReminderActive(true);
      toast(`🔔 Daily practice reminder set for ${reminderTime}`);
      try {
        localStorage.setItem(
          "bodhi-habit-reminder",
          JSON.stringify({ enabled: true, time: reminderTime })
        );
      } catch {}
    } else {
      setReminderActive(false);
      toast("Daily reminders turned off");
      try {
        localStorage.setItem(
          "bodhi-habit-reminder",
          JSON.stringify({ enabled: false, time: reminderTime })
        );
      } catch {}
    }
  };

  const updateReminderTime = (val: string) => {
    setReminderTime(val);
    try {
      localStorage.setItem(
        "bodhi-habit-reminder",
        JSON.stringify({ enabled: reminderActive, time: val })
      );
    } catch {}
    toast(`Reminder updated to ${val}`);
  };

  const testReminder = () => {
    unlockAudio();
    playBell(6, 0.55, 432, "tibetan");
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Bodhi Sanctuary", {
        body: `Time for your daily sit: "${habits[0]?.title || "Sit for 10 minutes"}"`,
        icon: "/icon.svg",
      });
    }
    toast("🔔 Test chime sounded! (Tibetan Singing Bowl)");
  };

  // Export handlers
  const handleExportPng = () => {
    setExportOpen(false);
    const exportData: HabitTrendExportData = {
      weeklyRate: chartData.weeklyRate,
      totalCompletionsInWeek: chartData.totalCompletionsInWeek,
      days: chartData.days,
      habits: habits.map((h) => ({
        title: h.title,
        targetMinutes: h.targetMinutes,
        streak: h.streak,
        completedToday: h.completedDates.includes(todayStr),
      })),
    };
    exportAsPng(exportData, `bodhi-habit-trend-${todayStr}.png`);
    toast("🖼️ 7-Day Consistency chart exported as high-res PNG!");
  };

  const handleExportPdf = () => {
    setExportOpen(false);
    const exportData: HabitTrendExportData = {
      weeklyRate: chartData.weeklyRate,
      totalCompletionsInWeek: chartData.totalCompletionsInWeek,
      days: chartData.days,
      habits: habits.map((h) => ({
        title: h.title,
        targetMinutes: h.targetMinutes,
        streak: h.streak,
        completedToday: h.completedDates.includes(todayStr),
      })),
    };
    exportAsPdf(exportData, `bodhi-habit-trend-${todayStr}.pdf`);
    toast("📄 7-Day Consistency chart exported as PDF document!");
  };

  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-900/15 bg-gradient-to-b from-white/95 via-amber-50/40 to-white/90 p-6 shadow-sm backdrop-blur md:p-8">
      {/* Confetti Overlay */}
      <ConfettiBurstOverlay bursts={bursts} onClear={handleClearBurst} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-800/20 bg-amber-100/60 px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-amber-900">
            <span>🔥 Daily Rhythm</span>
            <span>·</span>
            <span>{completedTodayCount} of {habits.length} done today</span>
          </div>
          <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">
            Daily Meditation Habits
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">
            Build unshakeable steadiness. Define a daily goal, check it off after each sit, and track your 7-day consistency thread.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-xs transition hover:border-amber-700 hover:text-amber-900"
              aria-expanded={exportOpen}
              aria-haspopup="true"
            >
              <span>📥 Export Trend</span>
              <span className="text-[0.65rem] text-stone-400">▼</span>
            </button>

            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-amber-900/15 bg-white p-2 shadow-xl ring-1 ring-black/5"
                >
                  <p className="px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-amber-900">
                    Export 7-Day Trend Chart
                  </p>
                  <button
                    onClick={handleExportPng}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-stone-700 transition hover:bg-amber-50 hover:text-amber-900"
                  >
                    <span className="text-base">🖼️</span>
                    <div>
                      <span className="block font-bold">Export as PNG</span>
                      <span className="text-[0.65rem] text-stone-400">High-res retina image</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-stone-700 transition hover:bg-amber-50 hover:text-amber-900"
                  >
                    <span className="text-base">📄</span>
                    <div>
                      <span className="block font-bold">Export as PDF</span>
                      <span className="text-[0.65rem] text-stone-400">Printable document</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-amber-50 shadow-sm transition hover:bg-amber-900 hover:shadow"
          >
            <span>{isAdding ? "✕ Close" : "+ New Habit"}</span>
          </button>
        </div>
      </div>

      {/* 7-DAY COMPLETION TREND BAR CHART VISUALIZATION */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-amber-900/10 bg-white/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-stone-900">
              7-Day Practice Consistency Trend
            </h3>
            <p className="text-xs text-stone-500">
              Completion rate across all daily commitments over the past week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-bold text-emerald-800">
              {chartData.weeklyRate}% week consistency
            </span>
            <span className="text-xs font-medium text-stone-500">
              ({chartData.totalCompletionsInWeek} sittings)
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mt-5 flex h-36 items-end justify-between gap-2 px-1 sm:gap-4 md:px-4" role="img" aria-label="7-day meditation habit completion trend">
          {chartData.days.map((d) => {
            const hasData = d.count > 0;
            const barHeightPct = Math.max(8, d.pct);

            return (
              <div
                key={d.dateStr}
                className="group flex flex-1 flex-col items-center gap-2"
                title={`${d.fullDate}: ${d.count} of ${d.total} habits completed (${d.pct}%)`}
              >
                {/* Count tooltip indicator */}
                <span className="text-[0.68rem] font-bold tabular-nums text-stone-600 transition group-hover:text-amber-900">
                  {d.count > 0 ? `${d.count}` : "—"}
                </span>

                {/* Bar pillar */}
                <div className="relative flex h-24 w-full max-w-[42px] items-end justify-center rounded-xl bg-stone-100/80 p-1">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      d.pct >= 100
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm"
                        : hasData
                        ? "bg-gradient-to-t from-amber-600 to-amber-400"
                        : "bg-transparent"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                {/* Day label */}
                <div className="text-center">
                  <span
                    className={`block text-[0.72rem] font-semibold leading-tight ${
                      d.dateStr === todayStr
                        ? "font-bold text-amber-900 underline decoration-amber-600 decoration-2 underline-offset-2"
                        : "text-stone-500"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="hidden text-[0.6rem] text-stone-400 sm:block">
                    {d.fullDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY NOTIFICATION REMINDER TOGGLE & TIME PICKER */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-900/10 bg-amber-50/50 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-200/60 text-lg">
            🔔
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              Daily Practice Reminder
            </p>
            <p className="text-xs text-stone-500">
              {reminderActive
                ? `Prompt scheduled for ${reminderTime} daily with sacred bowl chime`
                : "Turn on to receive a quiet daily mindfulness alert"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {reminderActive && (
            <div className="flex items-center gap-2">
              <label htmlFor="reminder-time-input" className="text-xs font-medium text-stone-500">
                At:
              </label>
              <input
                id="reminder-time-input"
                type="time"
                value={reminderTime}
                onChange={(e) => updateReminderTime(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-800 shadow-xs outline-none focus:border-amber-700"
              />
              <button
                type="button"
                onClick={testReminder}
                className="rounded-lg border border-amber-800/20 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                title="Test reminder chime & notification"
              >
                Test 🔔
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleReminder}
            aria-pressed={reminderActive}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs ${
              reminderActive
                ? "bg-emerald-600 text-white"
                : "border border-stone-300 bg-white text-stone-700 hover:border-amber-700"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                reminderActive ? "bg-white" : "bg-stone-300"
              }`}
            />
            <span>{reminderActive ? "Reminders Active" : "Enable Reminder"}</span>
          </button>
        </div>
      </div>

      {/* New Habit Form Accordion */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="animate-fade-up mt-5 rounded-2xl border border-amber-900/15 bg-white/95 p-5 shadow-xs"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Define Daily Intention
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Sit for 10 minutes, Morning breath..."
              maxLength={100}
              autoFocus
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
            />
            <div className="flex shrink-0 items-center gap-2">
              <label className="text-xs font-medium text-stone-500">Duration:</label>
              <select
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-700"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
              </select>
              <button
                type="submit"
                disabled={saving || !newTitle.trim()}
                className="rounded-xl bg-amber-800 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-amber-900 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Goal"}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[0.72rem] font-medium text-stone-400">Quick ideas:</span>
            {PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => {
                  setNewTitle(p.title);
                  setNewMinutes(p.minutes);
                }}
                className="rounded-full border border-stone-200 bg-stone-100/70 px-2.5 py-1 text-[0.72rem] font-medium text-stone-600 transition hover:border-amber-700 hover:text-amber-900"
              >
                {p.title}
              </button>
            ))}
          </div>
        </form>
      )}

      {/* Habit List */}
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-2 py-8 text-center text-sm text-stone-400">
            Loading your habits…
          </div>
        ) : habits.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-amber-900/20 bg-white/50 p-8 text-center">
            <p className="text-3xl">🪷</p>
            <p className="mt-2 text-sm font-semibold text-stone-700">No habits set yet</p>
            <p className="mt-1 text-xs text-stone-400">
              Tap &ldquo;+ New Habit&rdquo; above to set your first daily commitment.
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habit.completedDates.includes(todayStr);
            const isPop = justCompletedId === habit.id;

            return (
              <div
                key={habit.id}
                className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 ${
                  isCompletedToday
                    ? "border-emerald-600/30 bg-emerald-50/50 shadow-xs"
                    : "border-stone-200/90 bg-white/80 hover:border-amber-700/30 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Micro-interaction Spring Pop Button */}
                    <motion.button
                      onClick={(e) => toggleToday(habit, e)}
                      animate={
                        isPop
                          ? {
                              scale: [1, 1.35, 0.9, 1.15, 1],
                              rotate: [0, 8, -6, 2, 0],
                            }
                          : { scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      whileTap={{ scale: 0.88 }}
                      aria-label={`Toggle completion for ${habit.title}`}
                      className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-base font-bold transition shadow-xs ${
                        isCompletedToday
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-stone-300 bg-white text-transparent hover:border-amber-700 hover:text-stone-300"
                      }`}
                    >
                      {/* Checkmark icon with spring scale */}
                      <motion.span
                        key={String(isCompletedToday)}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        ✓
                      </motion.span>

                      {/* Ripple ring on complete */}
                      {isPop && (
                        <span className="pointer-events-none absolute inset-0 animate-ping rounded-xl border-2 border-emerald-400 opacity-75" />
                      )}
                    </motion.button>

                    <div>
                      <h3
                        className={`text-sm font-semibold leading-snug ${
                          isCompletedToday ? "text-stone-900" : "text-stone-800"
                        }`}
                      >
                        {habit.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[0.68rem] font-bold text-stone-600">
                          ⏱ {habit.targetMinutes} min
                        </span>
                        {habit.streak > 0 && (
                          <span className="font-semibold text-amber-800">
                            🔥 {habit.streak} day streak
                          </span>
                        )}
                        {isCompletedToday && (
                          <span className="font-semibold text-emerald-700">
                            ✓ Done today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeHabit(habit.id, habit.title)}
                    aria-label="Remove habit"
                    title="Release habit"
                    className="text-xs text-stone-300 transition hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>

                {/* 7-day mini tracker & action */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-1.5" title="Last 7 days history">
                    {last7Days.map((d) => {
                      const completed = habit.completedDates.includes(d.dateStr);
                      return (
                        <div
                          key={d.dateStr}
                          className="flex flex-col items-center gap-0.5"
                          title={`${d.dateStr}: ${completed ? "Done" : "Missed"}`}
                        >
                          <div
                            className={`h-2.5 w-2.5 rounded-full transition ${
                              completed
                                ? "bg-emerald-600 ring-2 ring-emerald-200"
                                : "bg-stone-200"
                            }`}
                          />
                          <span className="text-[0.6rem] font-bold text-stone-400">
                            {d.label[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/practice?minutes=${habit.targetMinutes}`}
                    className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[0.72rem] font-bold text-stone-700 transition hover:bg-stone-900 hover:text-amber-50"
                  >
                    <span>Sit now</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
