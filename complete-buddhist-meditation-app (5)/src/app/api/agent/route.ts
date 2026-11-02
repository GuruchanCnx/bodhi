import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { meditationTechniques, practicePlans } from "@/db/schema";
import { briefingCopy, debriefCopy, planArchetype } from "@/lib/agentic";

export const dynamic = "force-dynamic";

// ---------- helpers ----------
async function getStatsFast() {
  try {
    const [t, perDay] = await Promise.all([
      db.execute(sql`
        select count(*)::int as sessions, coalesce(sum(duration_seconds),0)::int as seconds,
               coalesce(avg(duration_seconds),0)::int as avg_seconds
        from meditation_sessions where completed = true`),
      db.execute(sql`
        select to_char(created_at,'YYYY-MM-DD') as day from meditation_sessions
        where created_at > now() - interval '60 days' group by 1 order by 1`),
    ]);
    const row = t.rows[0] as unknown as { sessions: number; seconds: number; avg_seconds: number };
    const days = (perDay.rows as unknown as { day: string }[]).map((r) => r.day);
    const set = new Set(days);
    let streak = 0;
    const cur = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (!set.has(fmt(cur))) cur.setDate(cur.getDate() - 1);
    while (set.has(fmt(cur)) && streak <= 365) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return {
      sessions: row.sessions ?? 0,
      minutes: Math.round((row.seconds ?? 0) / 60),
      avgMinutes: Math.round((row.avg_seconds ?? 0) / 60),
      streak,
    };
  } catch {
    return { sessions: 0, minutes: 0, avgMinutes: 0, streak: 0 };
  }
}

async function pickOne(category: string, exclude: Set<string>, minutes: number, level?: string) {
  const filters = [eq(meditationTechniques.category, category)];
  const rows = await db
    .select({
      slug: meditationTechniques.slug,
      name: meditationTechniques.name,
      pali: meditationTechniques.pali,
      tradition: meditationTechniques.tradition,
      level: meditationTechniques.level,
      category: meditationTechniques.category,
      durations: meditationTechniques.durations,
      essence: meditationTechniques.essence,
      color: meditationTechniques.color,
      symbol: meditationTechniques.symbol,
    })
    .from(meditationTechniques)
    .where(and(...filters))
    .orderBy(meditationTechniques.name)
    .limit(60);
  const pool = rows.filter((r) => !exclude.has(r.slug));
  const src = pool.length ? pool : rows;
  if (!src.length) return null;
  // prefer duration match, then level match, deterministic by day seed
  const idx = Math.floor(Math.random() * src.length);
  // try duration fit first
  const fit = src.find((r) => ((r.durations as number[]) ?? []).includes(minutes));
  const chosen = fit ?? src[idx % src.length];
  void level;
  return chosen;
}

// ---------- GET: briefing | suggest | plans | insight ----------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "briefing";

  if (action === "suggest") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
    if (q.length < 2) return Response.json({ suggestions: [] });
    try {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      const rows = await db
        .select({
          slug: meditationTechniques.slug,
          name: meditationTechniques.name,
          tradition: meditationTechniques.tradition,
          category: meditationTechniques.category,
          color: meditationTechniques.color,
          symbol: meditationTechniques.symbol,
        })
        .from(meditationTechniques)
        .where(or(ilike(meditationTechniques.name, like), ilike(meditationTechniques.description, like))!)
        .orderBy(sql`similarity(${meditationTechniques.name}, ${q}) DESC`)
        .limit(6);
      const res = Response.json({ suggestions: rows });
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
      return res;
    } catch {
      return Response.json({ suggestions: [] });
    }
  }

  if (action === "plans") {
    try {
      const rows = await db.select().from(practicePlans).orderBy(desc(practicePlans.createdAt)).limit(10);
      const res = Response.json({ plans: rows });
      res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
      return res;
    } catch {
      return Response.json({ plans: [] });
    }
  }

  if (action === "insight") {
    const s = await getStatsFast();
    let text = "Your path begins with a single breath — today's 5 minutes count double.";
    if (s.sessions > 0 && s.streak >= 7) text = `🔥 ${s.streak}-day thread with ${s.sessions} sits. Protect it: same time, tiny minimum, forgiving restarts. Next edge: lengthen one sit by 5 min.`;
    else if (s.sessions > 0 && s.streak >= 1) text = `${s.streak}-day streak alive across ${s.sessions} sits (avg ~${s.avgMinutes || 10} min). Depth in one door opens all doors — revisit your most-used family this week.`;
    else if (s.sessions > 0) text = `${s.sessions} sits banked. Streaks grow by gentleness: pick one anchor technique and return 3 days in a row.`;
    const res = Response.json({ insight: text, stats: s });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  }

  // default: briefing
  const hour = Number(url.searchParams.get("hour") ?? new Date().getHours());
  const s = await getStatsFast();
  const b = briefingCopy(Number.isFinite(hour) ? hour : new Date().getHours(), s.streak, s.sessions);
  // one-tap sit: find a real technique matching mood hint
  let sit: { slug: string; name: string; minutes: number } | null = null;
  try {
    const like = `%${b.moodHint.split(" ")[0]}%`;
    const rows = await db
      .select({ slug: meditationTechniques.slug, name: meditationTechniques.name, durations: meditationTechniques.durations })
      .from(meditationTechniques)
      .where(or(ilike(meditationTechniques.name, like), ilike(meditationTechniques.description, like))!)
      .limit(5);
    const r = rows[0];
    if (r) {
      const ds = (r.durations as number[]) ?? [10];
      const mins = ds.includes(b.minutes) ? b.minutes : ds[0] ?? b.minutes;
      sit = { slug: r.slug, name: r.name, minutes: mins };
    }
  } catch {}
  const res = Response.json({ ...b, stats: s, sit });
  res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res;
}

// ---------- POST: plan | debrief | activate-plan ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "plan");

    if (action === "debrief") {
      const out = debriefCopy({
        moodBefore: body.moodBefore ?? null,
        moodAfter: body.moodAfter ?? null,
        minutes: Math.max(1, Math.min(180, Number(body.minutes) || 10)),
        techniqueName: String(body.techniqueName || "sitting").slice(0, 120),
      });
      // next-step suggestion: one real technique in complementary family
      let next: { slug: string; name: string } | null = null;
      try {
        const rows = await db
          .select({ slug: meditationTechniques.slug, name: meditationTechniques.name })
          .from(meditationTechniques)
          .orderBy(sql`random()`)
          .limit(1);
        if (rows[0]) next = rows[0];
      } catch {}
      return Response.json({ ...out, next });
    }

    if (action === "activate-plan") {
      const id = String(body.id || "");
      if (!id) return Response.json({ error: "id required" }, { status: 400 });
      try {
        await db.execute(sql`update practice_plans set active = false`);
        await db.update(practicePlans).set({ active: true }).where(eq(practicePlans.id, id));
        return Response.json({ ok: true });
      } catch {
        return Response.json({ error: "activate failed" }, { status: 500 });
      }
    }

    // default: build 7-day plan
    const goal = String(body.goal || "balanced").slice(0, 200);
    const minutesPerDay = Math.max(5, Math.min(60, Number(body.minutesPerDay) || 10));
    const level = String(body.level || "All Levels").slice(0, 30);
    const arch = planArchetype(goal);
    const exclude = new Set<string>();
    const days: { day: number; slug: string; name: string; minutes: number; focus: string }[] = [];
    const focuses = [
      "Arrive + anchor",
      "Steady the flame",
      "Deepen one door",
      "Soften + widen",
      "Depth day",
      "Gentle integration",
      "Dedicate + rest in glow",
    ];
    for (let d = 1; d <= 7; d++) {
      const cat = arch.categories[(d - 1) % arch.categories.length];
      const pick = await pickOne(cat, exclude, minutesPerDay, level);
      if (pick) {
        exclude.add(pick.slug);
        const ds = (pick.durations as number[]) ?? [minutesPerDay];
        days.push({
          day: d,
          slug: pick.slug,
          name: pick.name,
          minutes: ds.includes(minutesPerDay) ? minutesPerDay : ds[0] ?? minutesPerDay,
          focus: focuses[d - 1],
        });
      }
    }
    if (!days.length) return Response.json({ error: "could not build plan" }, { status: 500 });

    const title = `7 days · ${arch.key} · ${minutesPerDay}m`;
    let saved: { id: string } | null = null;
    if (body.save === true) {
      try {
        const [row] = await db
          .insert(practicePlans)
          .values({ title, goal: goal.slice(0, 300), minutesPerDay, level, days, active: false })
          .returning({ id: practicePlans.id });
        saved = row ?? null;
      } catch (e) {
        console.error("[plan] save fail", e);
      }
    }
    const res = Response.json({
      title,
      note: arch.note,
      days,
      savedId: saved?.id ?? null,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[agent] POST fail", e);
    return Response.json({ error: "agent failed" }, { status: 500 });
  }
}
