import { briefingCopy, debriefCopy, planArchetype } from "@/lib/agentic";
import { allCanonTechniques, queryCanon } from "@/lib/canon";
import {
  activatePracticePlanInFirestore,
  deletePracticePlanFromFirestore,
  getPracticePlansFromFirestore,
  getSessionsFromFirestore,
  savePracticePlanToFirestore,
} from "@/lib/firestore-service";

export const dynamic = "force-dynamic";

async function getStatsFast() {
  try {
    const sessions = await getSessionsFromFirestore(120).catch(() => []);
    const completed = sessions.filter((s) => s.completed !== false);
    const totalSessions = completed.length;
    let totalSeconds = 0;
    const days = new Set<string>();

    for (const s of completed) {
      totalSeconds += s.durationSeconds;
      const day = (s.createdAt || "").slice(0, 10);
      if (day) days.add(day);
    }

    let streak = 0;
    const cur = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (!days.has(fmt(cur))) cur.setDate(cur.getDate() - 1);
    while (days.has(fmt(cur)) && streak <= 365) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    return {
      sessions: totalSessions,
      minutes: Math.round(totalSeconds / 60),
      avgMinutes: totalSessions > 0 ? Math.round(totalSeconds / totalSessions / 60) : 0,
      streak,
    };
  } catch {
    return { sessions: 0, minutes: 0, avgMinutes: 0, streak: 0 };
  }
}

function pickOneFromCanon(
  category: string,
  exclude: Set<string>,
  minutes: number,
  level?: string
) {
  const inCat = allCanonTechniques.filter((t) => t.category === category);
  const src = inCat.length ? inCat : allCanonTechniques;
  const pool = src.filter((r) => !exclude.has(r.slug));
  const candidates = pool.length ? pool : src;

  const durationMatches = candidates.filter((r) => (r.durations ?? []).includes(minutes));
  const narrowed = durationMatches.length ? durationMatches : candidates;

  if (level && level !== "All Levels") {
    const levelMatches = narrowed.filter((r) => r.level === level);
    if (levelMatches.length) {
      return levelMatches[Math.floor(Math.random() * levelMatches.length)];
    }
  }
  return narrowed[Math.floor(Math.random() * narrowed.length)];
}

// ---------- GET: briefing | suggest | plans | insight ----------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "briefing";

  if (action === "suggest") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
    if (q.length < 2) return Response.json({ suggestions: [], total: allCanonTechniques.length });
    const { techniques, total } = queryCanon({ q, suggest: true, pageSize: 8 });
    const suggestions = techniques.map((t) => ({
      slug: t.slug,
      name: t.name,
      pali: t.pali,
      tradition: t.tradition,
      level: t.level,
      category: t.category,
      durations: t.durations,
      color: t.color,
      symbol: t.symbol,
    }));
    const res = Response.json({ suggestions, total });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    return res;
  }

  if (action === "plans") {
    try {
      const plans = await getPracticePlansFromFirestore(12);
      return Response.json({ plans });
    } catch {
      return Response.json({ plans: [] });
    }
  }

  if (action === "insight") {
    const s = await getStatsFast();
    let text = "Your path begins with a single breath — today's 5 minutes count double.";
    if (s.sessions > 0 && s.streak >= 7) {
      text = `🔥 ${s.streak}-day thread with ${s.sessions} sits. Protect it: same time, tiny minimum, forgiving restarts. Next edge: lengthen one sit by 5 min.`;
    } else if (s.sessions > 0 && s.streak >= 1) {
      text = `${s.streak}-day streak alive across ${s.sessions} sits (avg ~${s.avgMinutes || 10} min). Depth in one door opens all doors — revisit your most-used family this week.`;
    } else if (s.sessions > 0) {
      text = `${s.sessions} sits banked. Streaks grow by gentleness: pick one anchor technique and return 3 days in a row.`;
    }
    const res = Response.json({ insight: text, stats: s });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  }

  // default: briefing
  const hour = Number(url.searchParams.get("hour") ?? new Date().getHours());
  const safeHour = Number.isFinite(hour) ? hour : new Date().getHours();
  const s = await getStatsFast();
  const b = briefingCopy(safeHour, s.streak, s.sessions);

  let sit: { slug: string; name: string; minutes: number } | null = null;
  const keyword = b.moodHint.split(" ")[0] || "breath";
  const matched = queryCanon({ q: keyword, suggest: true }).techniques;
  const r = matched[0] ?? allCanonTechniques[0];
  if (r) {
    const ds = r.durations ?? [10];
    const mins = ds.includes(b.minutes) ? b.minutes : ds[0] ?? b.minutes;
    sit = { slug: r.slug, name: r.name, minutes: mins };
  }

  const res = Response.json({ ...b, stats: s, sit });
  res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res;
}

// ---------- POST: plan | debrief | activate-plan | delete-plan ----------
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
      const pick =
        allCanonTechniques[Math.floor(Math.random() * Math.min(200, allCanonTechniques.length))];
      const next = pick ? { slug: pick.slug, name: pick.name } : null;
      return Response.json({ ...out, next });
    }

    if (action === "activate-plan") {
      const id = String(body.id || "");
      if (!id) return Response.json({ error: "id required" }, { status: 400 });
      await activatePracticePlanInFirestore(id);
      return Response.json({ ok: true });
    }

    if (action === "delete-plan") {
      const id = String(body.id || "");
      if (!id) return Response.json({ error: "id required" }, { status: 400 });
      await deletePracticePlanFromFirestore(id);
      return Response.json({ ok: true });
    }

    // default: build 7-day plan from the living canon
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
      const pick = pickOneFromCanon(cat, exclude, minutesPerDay, level);
      if (pick) {
        exclude.add(pick.slug);
        const ds = pick.durations ?? [minutesPerDay];
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
    let savedId: string | null = null;
    if (body.save === true) {
      try {
        const saved = await savePracticePlanToFirestore({
          title,
          goal: goal.slice(0, 200),
          minutesPerDay,
          level,
          days,
          active: false,
        });
        savedId = saved.id;
      } catch (e) {
        console.error("[plan] save fail", e);
      }
    }

    const res = Response.json({
      title,
      note: arch.note,
      days,
      savedId,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    console.error("[agent] POST fail", e);
    return Response.json({ error: "agent failed" }, { status: 500 });
  }
}
