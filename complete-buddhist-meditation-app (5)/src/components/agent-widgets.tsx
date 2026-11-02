"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "./chrome";

type Briefing = {
  greeting: string; suggestion: string; minutes: number; moodHint: string;
  stats: { sessions: number; minutes: number; avgMinutes: number; streak: number };
  sit: { slug: string; name: string; minutes: number } | null;
};

export function AgentBriefing() {
  const [b, setB] = useState<Briefing | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/agent?action=briefing")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.greeting) setB(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!b) {
    return (
      <div className="liquid-strong squircle-lg p-6 md:p-7" aria-busy="true">
        <div className="skeleton h-6 w-48 rounded-full" />
        <div className="skeleton mt-3 h-9 w-3/4 rounded-2xl" />
        <div className="skeleton mt-4 h-11 w-56 rounded-full" />
      </div>
    );
  }
  return (
    <div className="liquid-strong squircle-lg overflow-hidden">
      <div className="p-6 md:p-8">
        <p className="liquid-chip pill inline-flex px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
          ✦ Agentic briefing · {b.stats.streak > 0 ? `🔥 ${b.stats.streak}-day streak` : "fresh start"}
        </p>
        <h3 className="font-display ios-title mt-3 text-balance text-2xl md:text-[1.9rem]">{b.greeting}</h3>
        <p className="mt-2 text-sm leading-relaxed opacity-80">{b.suggestion}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {b.sit ? (
            <Link
              href={`/practice?technique=${b.sit.slug}&minutes=${b.sit.minutes}`}
              className="liquid-prominent pressable pill px-6 py-3 text-sm font-bold"
            >
              ▶ Start {b.sit.minutes}m — {b.sit.name.slice(0, 32)}
            </Link>
          ) : (
            <Link href="/practice?minutes=10" className="liquid-prominent pressable pill px-6 py-3 text-sm font-bold">
              ▶ Start 10-minute sit
            </Link>
          )}
          <Link href="/plan" className="liquid-chip pressable pill px-6 py-3 text-sm font-bold">
            🗓 7-day plan →
          </Link>
        </div>
        <p className="mt-3 text-[0.72rem] opacity-60">
          {b.stats.sessions > 0
            ? `${b.stats.sessions} sits · ~${b.stats.avgMinutes || 10} min avg · tuned to ${b.moodHint}.`
            : "New here? 5 kind minutes beat 30 forced ones."}
        </p>
      </div>
    </div>
  );
}

type PlanDay = { day: number; slug: string; name: string; minutes: number; focus: string };

export function PlanBuilder({ initialGoal = "", initialMinutes = 10 }: { initialGoal?: string; initialMinutes?: number }) {
  const [goal, setGoal] = useState(initialGoal);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{ title: string; note: string; days: PlanDay[]; savedId: string | null } | null>(null);
  const [savedTick, setSavedTick] = useState(false);
  const toast = useToast();

  const build = async (save: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "plan", goal: goal || "balanced", minutesPerDay: minutes, save }),
      });
      const data = await res.json();
      if (data.days) {
        setPlan(data);
        setSavedTick(save && !!data.savedId);
        if (save && data.savedId) toast("🗓 Plan saved — activate it to follow along");
      } else toast("Could not build plan — try again", "info");
    } catch {
      toast("Plan builder offline?", "info");
    } finally {
      setLoading(false);
    }
  };

  const activate = async () => {
    if (!plan?.savedId) {
      await build(true);
      return;
    }
    try {
      await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate-plan", id: plan.savedId }),
      });
      toast("✦ Plan activated — day 1 awaits");
    } catch {}
  };

  return (
    <div className="liquid-card squircle-lg p-6 md:p-8">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">🗓 Agentic 7-day program</p>
      <h3 className="font-display ios-title mt-2 text-2xl md:text-3xl">One goal. Seven sits. Zero decisions.</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Goal — calm, focus, sleep, heart…"
          className="liquid-field pill w-full px-5 py-3 text-sm outline-none placeholder:opacity-50"
          aria-label="Plan goal"
        />
        <div className="liquid-segment" role="group" aria-label="Minutes per day">
          {[10, 15, 20, 30].map((m) => (
            <button key={m} onClick={() => setMinutes(m)} aria-pressed={minutes === m} className={`pill px-4 py-2 text-sm font-bold ${minutes === m ? "bg-[var(--ink)] text-[var(--bg)] shadow" : "opacity-60 hover:opacity-100"}`}>
              {m}m
            </button>
          ))}
        </div>
        <button onClick={() => build(false)} disabled={loading} className="liquid-prominent pressable pill px-6 py-3 text-sm font-bold disabled:opacity-50">
          {loading ? "☸ weaving…" : "Weave my week ✦"}
        </button>
      </div>

      {plan && (
        <div className="animate-fade-up mt-5">
          <p className="text-sm font-bold">{plan.title}</p>
          <p className="text-xs opacity-70">{plan.note}</p>
          <ol className="mt-3 grid gap-2 md:grid-cols-2">
            {plan.days.map((d) => (
              <li key={d.day} className="liquid-chip flex items-center gap-3 rounded-2xl p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs font-bold text-[var(--bg)]">D{d.day}</span>
                <span className="min-w-0 flex-1">
                  <Link href={`/library/${d.slug}`} className="block truncate text-[0.83rem] font-bold hover:underline">{d.name}</Link>
                  <span className="block truncate text-[0.7rem] opacity-60">{d.focus} · {d.minutes}m</span>
                </span>
                <Link href={`/practice?technique=${d.slug}&minutes=${d.minutes}`} className="shrink-0 rounded-full bg-amber-600 px-3 py-1.5 text-[0.7rem] font-bold text-white hover:bg-amber-700">
                  Sit →
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            {!savedTick ? (
              <button onClick={() => build(true)} className="liquid-chip pressable pill px-5 py-2.5 text-xs font-bold">💾 Save plan</button>
            ) : (
              <button onClick={activate} className="liquid-prominent pressable pill px-5 py-2.5 text-xs font-bold">✦ Activate plan</button>
            )}
            <Link href="/journey" className="liquid-chip pressable pill px-5 py-2.5 text-xs font-bold">Track in Journey →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentDebrief({
  techniqueName, minutes, moodBefore, moodAfter, visible,
}: {
  techniqueName: string; minutes: number; moodBefore: number | null; moodAfter: number | null; visible: boolean;
}) {
  const [data, setData] = useState<{ headline: string; insight: string; journalPrompt: string; next: { slug: string; name: string } | null } | null>(null);
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "debrief", techniqueName, minutes, moodBefore, moodAfter }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.headline) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [visible, techniqueName, minutes, moodBefore, moodAfter]);
  if (!visible) return null;
  if (!data) {
    return (
      <div className="mt-4 rounded-2xl bg-white/5 p-4" aria-busy="true">
        <div className="skeleton h-5 w-40 rounded-full" />
        <div className="skeleton mt-2 h-12 w-full rounded-xl" />
      </div>
    );
  }
  return (
    <div className="animate-fade-up mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left">
      <p className="text-sm font-bold text-amber-200">{data.headline}</p>
      <p className="mt-1 text-[0.83rem] leading-relaxed opacity-90">{data.insight}</p>
      <p className="mt-2 text-[0.8rem] italic opacity-80">📝 {data.journalPrompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/journal" className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400">
          Journal this →
        </Link>
        {data.next && (
          <Link href={`/library/${data.next.slug}`} className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold hover:border-amber-400">
            Next: {data.next.name.slice(0, 30)} →
          </Link>
        )}
      </div>
    </div>
  );
}
