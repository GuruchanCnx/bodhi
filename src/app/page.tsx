import Link from "next/link";
import { Suspense } from "react";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { dailyItem, meditations, quotes, eightfoldPath } from "@/lib/content";
import { Mandala, Petals, SectionHeading, Stat } from "@/components/ui";
import TodayPath from "@/components/today-path";
import { AgentBriefing, PlanBuilder } from "@/components/agent-widgets";

export const revalidate = 3600; // ISR: stats refresh hourly, instant CDN hits

const getStatsCached = unstable_cache(
  async () => {
    try {
      const [s, t] = await Promise.all([
        db.execute(sql`
          select count(*)::int as sessions, coalesce(sum(duration_seconds),0)::int as seconds
          from meditation_sessions where completed = true`),
        db.execute(sql`select count(*)::int as c from meditation_techniques`),
      ]);
      const row = s.rows[0] as unknown as { sessions: number; seconds: number };
      const tech = t.rows[0] as unknown as { c: number };
      return {
        sessions: row.sessions ?? 0,
        minutes: Math.round((row.seconds ?? 0) / 60),
        techniques: (tech.c ?? 0) + 8,
      };
    } catch {
      return { sessions: 0, minutes: 0, techniques: 1048 };
    }
  },
  ["home-stats"],
  { revalidate: 3600, tags: ["stats"] }
);

async function StatsRow() {
  const stats = await getStatsCached();
  return (
    <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
      <Stat value={String(stats.sessions)} label="Sittings" sub="kept in sanctuary" />
      <Stat value={String(stats.minutes)} label="Minutes" sub="of stillness" />
      <Stat value={String(stats.techniques)} label="Methods" sub="in the great canon" />
    </div>
  );
}

function StatsFallback() {
  return (
    <div className="mt-8 grid max-w-md grid-cols-3 gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-[92px] rounded-2xl" />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const quote = dailyItem(quotes);
  const featured = meditations.slice(0, 6);
  const stats = await getStatsCached();

  return (
    <main>
      <Petals count={8} />
      {/* HERO — critical, server-rendered */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/70 via-[#faf6ee] to-[#faf6ee]" aria-hidden />
        <div className="absolute -right-24 -top-24 opacity-40" aria-hidden>
          <Mandala size={520} />
        </div>
        <div className="absolute -left-32 top-64 opacity-20" aria-hidden>
          <Mandala size={380} />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-800/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">
              ☸ 1,048 methods · Agentic guide · Bowl timer
            </p>
            <h1 className="font-display mt-5 text-balance text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[0.95] text-stone-950">
              Sit.
              <br />
              Breathe.
              <br />
              <span className="italic text-amber-800">Awaken.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-stone-600">
              A Buddhist meditation sanctuary — 1,040 guided methods in every tradition, a
              singing-bowl timer, Dhamma teachings, journal, and <strong>Bodhi Guide</strong>, an
              agentic companion that charts your path. Press <kbd className="rounded-md bg-stone-900/8 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd> to search everything.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-amber-50 shadow-xl shadow-stone-900/25 transition hover:-translate-y-0.5 hover:bg-amber-900"
              >
                Begin Sitting — 10 min →
              </Link>
              <Link
                href="/library"
                className="rounded-full border border-stone-900/20 bg-white/70 px-7 py-3.5 text-sm font-semibold text-stone-900 backdrop-blur transition hover:border-amber-800 hover:text-amber-900"
              >
                Explore 1,048 methods
              </Link>
            </div>
            <Suspense fallback={<StatsFallback />}>
              <StatsRow />
            </Suspense>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="relative overflow-hidden rounded-[2rem] border border-amber-900/15 bg-[#1c1917] p-7 text-stone-200 shadow-[0_30px_80px_rgba(28,25,23,0.35)] md:p-8">
              <div className="absolute -right-16 -top-16 opacity-30" aria-hidden>
                <Mandala size={260} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">✦ Daily Dhamma</p>
              <blockquote className="font-display mt-4 text-balance text-[1.6rem] font-medium italic leading-snug text-amber-50">
                “{quote.text}”
              </blockquote>
              <p className="mt-4 text-sm font-medium text-amber-200/80">— {quote.source}</p>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <div className="flex gap-2">
                  {[5, 10, 20, 30].map((m) => (
                    <Link
                      key={m}
                      href={`/practice?minutes=${m}`}
                      prefetch
                      className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-stone-200 transition hover:border-amber-400 hover:text-amber-200"
                    >
                      {m} min
                    </Link>
                  ))}
                </div>
                <span className="text-2xl" aria-hidden>🪷</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-amber-900/10 bg-white/70 px-5 py-4 backdrop-blur">
              <div className="breath-orb h-12 w-12 shrink-0 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fde68a, #b45309 70%)", ["--breath-cycle" as string]: "8s" }} aria-hidden />
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">Try now:</span> breathe in 4, out 4
                with the orb.
                <Link href="/practice?tab=breath" className="ml-1 font-semibold text-amber-800 underline underline-offset-2"> Open breath guide →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AGENTIC BRIEFING + TODAY'S PATH + PLAN */}
      <section className="cv-auto mx-auto grid max-w-6xl gap-5 px-5 pb-4 lg:grid-cols-[1fr_1fr]">
        <AgentBriefing />
        <TodayPath />
      </section>
      <section className="cv-auto mx-auto max-w-6xl px-5 py-4">
        <PlanBuilder />
      </section>

      {/* PRACTICES — content-visibility for 1000+ scroll perf */}
      <section className="cv-auto mx-auto max-w-6xl px-5 py-10">
        <SectionHeading
          eyebrow={`The Library · ${stats.techniques} methods`}
          title="A thousand doors to the same stillness"
          sub="Eight root practices plus a 1,040-method living canon — breath, body, brahmaviharas, kasinas, koans, lojong, mantras, walking, death contemplations, everyday Zen. Ask Bodhi Guide 🪷 or press ⌘K."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m, i) => (
            <Link
              key={m.slug}
              href={`/library/${m.slug}`}
              prefetch={i < 3}
              className="group animate-fade-up overflow-hidden rounded-3xl border border-amber-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(120,70,10,0.15)]"
              style={{ animationDelay: `${Math.min(i, 5) * 0.06}s` }}
            >
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${m.color}, #f59e0b)` }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl text-xl text-white shadow" style={{ background: m.color }}>
                    {m.symbol === " footsteps " ? "👣" : m.symbol}
                  </span>
                  <span className="rounded-full bg-amber-900/8 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-amber-900">
                    {m.tradition}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-2xl font-semibold text-stone-900 group-hover:text-amber-900">
                  {m.name}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{m.pali}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">{m.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {m.durations.slice(0, 4).map((d) => (
                      <span key={d} className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.7rem] font-semibold text-stone-600">
                        {d}m
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-800">Begin →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/library" className="inline-flex items-center gap-2 rounded-full border border-amber-800/30 px-6 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-900 hover:text-amber-50">
            Enter the Great Canon — {stats.techniques} methods <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* EIGHTFOLD PATH */}
      <section className="cv-auto mt-10 bg-[#1c1917] py-16 text-stone-300">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="The Noble Eightfold Path"
            title="The way out of suffering"
            sub="The Buddha's fourth noble truth — wisdom, virtue, and meditation."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {eightfoldPath.map((f, i) => (
              <div key={f.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-amber-500/40 hover:bg-white/[0.07]">
                <p className="font-display text-3xl font-semibold text-amber-500/90">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-semibold text-amber-50">{f.name}</h3>
                <p className="text-xs italic text-amber-200/70">{f.pali}</p>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-stone-400">{f.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/teachings" className="inline-block rounded-full bg-amber-500 px-7 py-3 text-sm font-bold text-stone-950 transition hover:bg-amber-400">
              Study the Dhamma →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="cv-auto mx-auto max-w-6xl px-5 py-16">
        <SectionHeading eyebrow="Your Sanctuary · Now Agentic" title="Practice, reflect, ripen — guided" />
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            { icon: "🪷", t: "0 · Ask the Guide", d: "Tell Bodhi Guide your mood + minutes. It searches 1,040 methods and charts a personal path — with voice.", href: "/library", cta: "Try below ↑" },
            { icon: "🔔", t: "1 · Sit with the bowl", d: "Synthesized bowl, interval bells, wake-lock, focus mode, ambient rain, spoken cues.", href: "/practice", cta: "Open timer" },
            { icon: "📿", t: "2 · Learn the teachings", d: "Four Truths, Eightfold Path, Precepts vow-tracker, searchable suttas.", href: "/teachings", cta: "Study" },
            { icon: "📖", t: "3 · Journal & journey", d: "Autosaved reflections, streaks, 14-day chart, technique mandala, agent insights.", href: "/journal", cta: "Reflect" },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
              <span className="text-3xl" aria-hidden>{c.icon}</span>
              <h3 className="font-display mt-3 text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{c.d}</p>
              <Link href={c.href} className="mt-4 inline-block text-sm font-bold text-amber-800 hover:underline">{c.cta} →</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
