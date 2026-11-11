"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { meditations } from "@/lib/content";
import { SectionHeading, Stat } from "@/components/ui";
import { cachedFetch, useToast } from "@/components/chrome";
import MoodTrendChart from "@/components/mood-trend-chart";

type Stats = {
  totals: { sessions: number; seconds: number; minutes: number; avgSeconds: number; days: number; streak: number; journalEntries: number };
  perDay: { day: string; sessions: number; seconds: number }[];
  byTechnique: { technique: string; sessions: number; seconds: number }[];
};

type Session = {
  id: string; technique: string; title: string; durationSeconds: number;
  moodBefore: number | null; moodAfter: number | null; notes: string | null; createdAt: string;
};

const moodFace = ["", "😣", "😟", "😐", "🙂", "😊"];

export default function JourneyPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState("all");
  const [coach, setCoach] = useState<string | null>(null);
  const [coaching, setCoaching] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    Promise.all([
      cachedFetch<Stats>("/api/stats", 30_000).catch(() => fetch("/api/stats").then((r) => r.json())),
      cachedFetch<{ sessions: Session[] }>("/api/sessions?limit=60", 20_000).catch(() => fetch("/api/sessions?limit=60").then((r) => r.json())),
    ]).then(([s, sess]) => {
      if (!alive) return;
      if (s) setStats(s);
      if (sess) setSessions(sess.sessions ?? []);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const maxSec = useMemo(() => Math.max(60, ...((stats?.perDay ?? []).map((d) => d.seconds))), [stats]);

  const last14 = useMemo(() => {
    const map = new Map((stats?.perDay ?? []).map((d) => [d.day, d]));
    const out: { day: string; label: string; sessions: number; seconds: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = map.get(key);
      out.push({
        day: key,
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        sessions: found?.sessions ?? 0,
        seconds: found?.seconds ?? 0,
      });
    }
    return out;
  }, [stats]);

  const techName = (slug: string) => meditations.find((m) => m.slug === slug)?.name ?? slug.split("-").slice(0, 3).join(" ");
  const techColor = (slug: string) => meditations.find((m) => m.slug === slug)?.color ?? "#78716c";

  const visibleSessions = sessions.filter((s) => filter === "all" || s.technique === filter);

  const insight = useMemo(() => {
    if (!stats || stats.totals.sessions === 0) return "Your path begins with a single breath. Complete your first sitting and this page will bloom.";
    const parts: string[] = [];
    if (stats.totals.streak >= 7) parts.push(`🔥 ${stats.totals.streak}-day unbroken thread — remarkable steadiness.`);
    else if (stats.totals.streak >= 3) parts.push(`A ${stats.totals.streak}-day streak glows. Even 5 mindful minutes keeps it alive.`);
    else if (stats.totals.streak >= 1) parts.push("You sat today or yesterday. Return tomorrow — gardens grow by returning.");
    const top = stats.byTechnique[0];
    if (top) parts.push(`Home practice: ${techName(top.technique)} (${top.sessions}×). Depth in one door opens all doors.`);
    const avgMin = Math.round(stats.totals.avgSeconds / 60);
    parts.push(avgMin >= 20 ? `Avg ${avgMin} min — samādhi ripening beautifully.` : "Tip: lengthen one sit/week by 5 min — mind settles in layers.");
    return parts.join(" ");
  }, [stats]);

  const askCoach = async () => {
    if (!stats || coaching) return;
    setCoaching(true);
    try {
      // fast structured insight first (cached), then rich guide coaching
      const [ins, guide] = await Promise.all([
        fetch("/api/agent?action=insight").then((r) => r.json()).catch(() => null),
        fetch("/api/guide", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Coach my streak: ${stats.totals.streak} days, ${stats.totals.sessions} sits, avg ${Math.round(stats.totals.avgSeconds / 60)} min. What next?`,
            context: { streak: stats.totals.streak, minutes: Math.round(stats.totals.avgSeconds / 60) },
          }),
        }).then((r) => r.json()).catch(() => null),
      ]);
      setCoach(guide?.reply ?? ins?.insight ?? insight);
    } catch {
      setCoach(insight);
    } finally {
      setCoaching(false);
    }
  };

  const exportCsv = () => {
    const rows = [["date", "title", "technique", "minutes", "moodBefore", "moodAfter", "notes"], ...sessions.map((s) => [s.createdAt, `"${s.title.replace(/"/g, '""')}"`, s.technique, Math.round(s.durationSeconds / 60), s.moodBefore ?? "", s.moodAfter ?? "", `"${(s.notes ?? "").replace(/"/g, '""')}"`])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bodhi-journey.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("⤓ Journey exported");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this sitting?")) return;
    const prev = sessions;
    setSessions((s) => s.filter((x) => x.id !== id));
    try {
      await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
      const r = await fetch("/api/stats").then((x) => x.json()).catch(() => null);
      if (r) setStats(r);
    } catch {
      setSessions(prev);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <SectionHeading
        eyebrow="Your Journey · agentic insights"
        title="The path is made by walking it"
        sub="Streaks, depth, heart-change — plus an AI coach. Export your record anytime."
      />

      {!stats ? (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[92px] rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat value={String(stats.totals.sessions)} label="Sittings" />
            <Stat value={String(stats.totals.minutes)} label="Minutes" sub={`${(stats.totals.seconds / 3600).toFixed(1)} hrs`} />
            <Stat value={`🔥 ${stats.totals.streak}`} label="Day streak" />
            <Stat value={String(stats.totals.days)} label="Active days" />
            <Stat value={String(stats.totals.journalEntries)} label="Reflections" />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="cv-auto rounded-3xl border border-amber-900/10 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">Last 14 days</h3>
                <div className="flex gap-2">
                  <button onClick={exportCsv} className="rounded-full border border-stone-200 px-3 py-1 text-xs font-bold hover:border-amber-700" title="Export CSV">⤓ CSV</button>
                  <span className="hidden text-xs text-stone-400 sm:inline">minutes / day</span>
                </div>
              </div>
              <div className="mt-5 flex h-44 items-end gap-1.5" role="img" aria-label="Minutes meditated per day, last 14 days">
                {last14.map((d) => (
                  <div key={d.day} className="group flex flex-1 flex-col items-center gap-1.5" title={`${d.day}: ${Math.round(d.seconds / 60)} min · ${d.sessions} sits`}>
                    <span className="text-[0.65rem] font-bold tabular-nums text-stone-400 opacity-0 transition group-hover:opacity-100">
                      {d.seconds ? Math.round(d.seconds / 60) : ""}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition ${d.seconds ? "bg-gradient-to-t from-amber-700 to-amber-400" : "bg-stone-100"}`}
                      style={{ height: `${Math.max(d.seconds ? 8 : 4, (d.seconds / maxSec) * 120)}px` }}
                    />
                    <span className="text-[0.65rem] font-semibold text-stone-400">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[0.83rem] leading-relaxed text-amber-900">
                💡 <span className="font-semibold">Teacher&apos;s note:</span> {insight}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button onClick={askCoach} disabled={coaching} className="rounded-full bg-stone-900 py-2.5 text-sm font-bold text-amber-50 transition hover:bg-amber-900 disabled:opacity-50">
                  {coaching ? "☸ consulting…" : "🪷 Coach my next edge"}
                </button>
                <Link href="/plan" className="rounded-full border border-amber-700/40 py-2.5 text-center text-sm font-bold text-amber-800 hover:bg-amber-900 hover:text-amber-50">
                  🗓 Build 7-day plan →
                </Link>
              </div>
              {coach && <p className="animate-fade-up mt-3 rounded-2xl border border-amber-900/15 bg-[#faf6ee] px-4 py-3 text-[0.83rem] italic leading-relaxed text-stone-700">“{coach}”</p>}
            </div>

            <div className="rounded-3xl border border-amber-900/10 bg-white p-6">
              <h3 className="font-display text-xl font-semibold">Practice mandala</h3>
              <p className="text-xs text-stone-400">Where your heart dwells</p>
              <div className="mt-4 space-y-3">
                {(stats.byTechnique.length ? stats.byTechnique.slice(0, 8) : [{ technique: "—", sessions: 0, seconds: 0 }]).map((t) => {
                  const totalSess = Math.max(1, stats.totals.sessions);
                  return (
                    <div key={t.technique}>
                      <div className="flex items-center justify-between gap-2 text-[0.8rem]">
                        <span className="truncate font-bold text-stone-800">{t.technique === "—" ? "No sittings yet" : techName(t.technique)}</span>
                        <span className="shrink-0 tabular-nums text-stone-500">{t.sessions} × · {Math.round(t.seconds / 60)}m</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full" style={{ width: `${(t.sessions / totalSess) * 100}%`, background: techColor(t.technique) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/practice" className="mt-5 block rounded-full bg-stone-900 py-2.5 text-center text-sm font-bold text-amber-50 hover:bg-amber-900">
                ＋ Add a sitting
              </Link>
              <Link href="/journal" className="mt-2 block rounded-full border border-stone-200 py-2.5 text-center text-sm font-bold text-stone-700 hover:border-amber-700">
                Write a reflection
              </Link>
            </div>
          </div>

          {/* D3 MOOD AFTER SITTING TRAJECTORY */}
          <div className="mt-6">
            <MoodTrendChart sessions={sessions} />
          </div>

          <div className="cv-auto mt-6 rounded-3xl border border-amber-900/10 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold">Recent sittings</h3>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === "all" ? "bg-stone-900 text-amber-50" : "bg-stone-100 text-stone-500"}`}>All</button>
                {meditations.map((m) => (
                  <button key={m.slug} onClick={() => setFilter(m.slug)} aria-pressed={filter === m.slug} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === m.slug ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-500"}`}>
                    {m.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            {visibleSessions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-amber-900/25 p-8 text-center">
                <p className="text-3xl">🪷</p>
                <p className="mt-2 text-sm text-stone-500">No sittings yet. Your cushion is waiting…</p>
                <Link href="/practice" className="mt-3 inline-block rounded-full bg-amber-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-700">Begin your first sit →</Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-stone-100">
                {visibleSessions.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: techColor(s.technique) }}>☸</span>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{s.title} · {Math.round(s.durationSeconds / 60)} min</p>
                        <p className="text-xs text-stone-400">
                          {new Date(s.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          {s.moodBefore || s.moodAfter ? ` · ${moodFace[s.moodBefore ?? 0] || ""}${s.moodBefore && s.moodAfter ? " → " : ""}${moodFace[s.moodAfter ?? 0] || ""}` : ""}
                        </p>
                        {s.notes && <p className="mt-1 text-[0.83rem] italic text-stone-600">“{s.notes}”</p>}
                      </div>
                    </div>
                    <button onClick={() => remove(s.id)} className="shrink-0 rounded-full px-2 py-1 text-xs text-stone-300 hover:text-red-500" aria-label="Delete sitting">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
