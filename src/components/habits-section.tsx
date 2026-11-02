"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/chrome";

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
  const toast = useToast();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Last 7 days helper for habit dots
  const last7Days = useMemo(() => {
    const days: { dateStr: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      });
    }
    return days;
  }, []);

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

  // Toggle completion for today
  const toggleToday = async (habit: HabitItem) => {
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

  const completedTodayCount = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-900/15 bg-gradient-to-b from-white/90 via-amber-50/40 to-white/80 p-6 shadow-sm backdrop-blur md:p-8">
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
            Build unshakeable steadiness. Define a daily goal, check it off after each sit, and watch your practice thread strengthen unbroken.
          </p>
        </div>

        <button
          onClick={() => setIsAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-amber-50 shadow-sm transition hover:bg-amber-900 hover:shadow"
        >
          <span>{isAdding ? "✕ Close" : "+ New Habit"}</span>
        </button>
      </div>

      {/* New Habit Form Accordion */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="animate-fade-up mt-6 rounded-2xl border border-amber-900/15 bg-white/95 p-5 shadow-xs"
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
                    <button
                      onClick={() => toggleToday(habit)}
                      aria-label={`Toggle completion for ${habit.title}`}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-base font-bold transition-transform active:scale-90 ${
                        isCompletedToday
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                          : "border-stone-300 bg-white text-transparent hover:border-amber-700"
                      }`}
                    >
                      ✓
                    </button>
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
                            {d.label}
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
