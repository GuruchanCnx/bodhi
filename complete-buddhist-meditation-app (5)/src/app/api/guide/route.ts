import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { meditationTechniques } from "@/db/schema";
import { buildPlanReply, moodReply, parseGuideQuery, type GuideContext } from "@/lib/agent";
import { buildReply, expandQuery, followUps, rankTechniques, type AgentMemory } from "@/lib/agentic";

export const dynamic = "force-dynamic";

type Rec = {
  slug: string; name: string; pali: string | null; tradition: string; level: string;
  category: string; durations: number[]; essence: string; description: string;
  color: string; symbol: string; reason: string;
};

function dhammaFallback(message: string): string | null {
  const t = message.toLowerCase();
  if (/\b(four noble|noble truth|suffering|dukkha)\b/.test(t))
    return "The Four Noble Truths: (1) dukkha — suffering exists, (2) samudaya — craving causes it, (3) nirodha — it can end, (4) magga — the Eightfold Path ends it. Which truth shall we sit with today?";
  if (/\b(eightfold|eight fold|right mindfulness|magga)\b/.test(t))
    return "The Eightfold Path is wisdom (view, intention), virtue (speech, action, livelihood), and meditation (effort, mindfulness, concentration). Tell me your time and mood and I'll pick the limb to train today.";
  if (/\b(anatta|not-self|emptiness|anatt)\b/.test(t))
    return "Anattā means no fixed self can be found in body, feeling, or thought — only processes arising and passing. Try Insight — Aggregates sittings and watch the 'I' dissolve into flow.";
  if (/\b(karma|rebirth|reincarnation)\b/.test(t))
    return "Kamma is intention: wholesome intentions ripen as ease, unwholesome as unease. Every breath is a fresh intention. Shall we set one together?";
  if (/\b(hi|hello|hey|greetings|namaste)\b/.test(t))
    return "Sādhu, noble friend. 🙏 I am Bodhi Guide. Tell me how your heart is and how many minutes you have — I'll chart a path through our 1,040 methods.";
  if (/\b(thank|thanks|sadhu)\b/.test(t))
    return "Sādhu! May the merit of your practice ripple to all beings. Come back tomorrow — consistency is the whole magic.";
  if (/\b(streak|every day|daily|consistent|motivation|habit)\b/.test(t))
    return "Streaks grow by gentleness, not force: same time, tiny minimum (5 min), forgiving restarts. Even one mindful breath counts. Shall I pick today's 5-minute sit?";
  if (/\b(plan|week|7 day|seven|program|course)\b/.test(t))
    return "I can weave a 7-day program around your goal — tell me the goal + minutes per day (e.g. “calm, 15 min/day”), or tap “Make it a 7-day plan” and I'll build it from real canon methods.";
  return null;
}

async function gatherMemory(context: GuideContext): Promise<AgentMemory> {
  const mem: AgentMemory = {
    streak: context.streak,
    recentSlugs: context.recentTechnique ? [context.recentTechnique] : [],
    hour: new Date().getHours(),
  };
  try {
    const r = await db.execute(sql`
      select count(*)::int as sessions, coalesce(avg(duration_seconds),0)::int as avg
      from meditation_sessions where completed = true`);
    const row = r.rows[0] as unknown as { sessions: number; avg: number };
    mem.totalSessions = row.sessions ?? 0;
    void row.avg;
  } catch {}
  return mem;
}

async function searchCandidates(intent: ReturnType<typeof parseGuideQuery>, expanded: string[]) {
  const filters = [];
  if (intent.traditions.length === 1) filters.push(eq(meditationTechniques.tradition, intent.traditions[0]));
  if (intent.levels.length === 1) filters.push(eq(meditationTechniques.level, intent.levels[0]));
  if (intent.categories.length === 1) filters.push(eq(meditationTechniques.category, intent.categories[0]));

  const cols = {
    slug: meditationTechniques.slug, name: meditationTechniques.name, pali: meditationTechniques.pali,
    tradition: meditationTechniques.tradition, level: meditationTechniques.level,
    category: meditationTechniques.category, durations: meditationTechniques.durations,
    description: meditationTechniques.description, essence: meditationTechniques.essence,
    color: meditationTechniques.color, symbol: meditationTechniques.symbol,
  };

  const baseWhere = filters.length ? and(...filters) : undefined;
  const primary = await db.select(cols).from(meditationTechniques).where(baseWhere).orderBy(meditationTechniques.name).limit(120);
  let candidates = primary.map((r) => ({ ...r, durations: (r.durations as number[]) ?? [] }));

  // blend keyword + expanded-synonym search when pool is thin or query is specific
  const keys = [...intent.keywords.slice(0, 3), ...expanded.slice(0, 3)];
  if (keys.length && candidates.length < 80) {
    const ors = keys.slice(0, 5).map((k) => {
      const like = `%${k}%`;
      return or(ilike(meditationTechniques.name, like), ilike(meditationTechniques.description, like))!;
    });
    try {
      const kwRows = await db.select(cols).from(meditationTechniques).where(or(...ors)!).limit(60);
      const seen = new Set(candidates.map((c) => c.slug));
      for (const r of kwRows) {
        if (!seen.has(r.slug)) {
          candidates.push({ ...r, durations: (r.durations as number[]) ?? [] });
          seen.add(r.slug);
        }
      }
    } catch {}
  }
  return candidates;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const stream = url.searchParams.get("stream") === "1";
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").slice(0, 1000);
    const context = (body.context || {}) as GuideContext & { favorites?: string[] };
    const history: { role: string; text: string }[] = Array.isArray(body.history) ? body.history.slice(-8) : [];
    if (!message.trim()) return Response.json({ error: "message required" }, { status: 400 });

    // enrich memory: client favorites + server stats
    const mem = await gatherMemory(context);
    mem.favorites = Array.isArray(context.favorites) ? context.favorites.slice(0, 100) : [];
    void history;

    const intent = parseGuideQuery(message, context);
    const expanded = expandQuery(message);
    const candidates = await searchCandidates(intent, expanded).catch(() => []);
    const { recs, steps } = rankTechniques(candidates, intent, mem, 6);

    const recList: Rec[] = recs.map((c) => ({
      slug: c.slug, name: c.name, pali: c.pali, tradition: c.tradition, level: c.level,
      category: c.category, durations: c.durations, essence: c.essence,
      description: c.description.slice(0, 220), color: c.color, symbol: c.symbol, reason: c.reason,
    }));

    const fallback = dhammaFallback(message);
    const moodLine = moodReply(intent.moods);
    let reply: string;
    if (recList.length) reply = `${moodLine ? moodLine + " " : ""}${buildReply(intent, recList.length, mem)}`;
    else if (fallback) reply = fallback;
    else reply = "I hear you. Tell me minutes + heart (anxious, restless, dull, sad, focus)? I'll match you to the canon.";

    const actions =
      recList.length > 0
        ? [
            { label: `▶ Start: ${recList[0].name.slice(0, 28)}`, href: `/practice?technique=${recList[0].slug}&minutes=${intent.minutes ?? recList[0].durations[0] ?? 10}` },
            { label: "🗓 Make it a 7-day plan", href: `/plan?goal=${encodeURIComponent(message.slice(0, 80))}&minutes=${intent.minutes ?? 10}` },
            { label: "📚 Open library", href: "/library" },
          ]
        : [{ label: "🔔 Just sit 10 min", href: "/practice?minutes=10" }];

    const payload = {
      reply,
      recommendations: recList,
      actions,
      intent,
      steps,
      followUps: followUps(intent),
      total: 1040,
    };

    if (!stream) {
      const res = Response.json(payload);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // ---- SSE streaming: reasoning steps → reply chunks → done ----
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        (async () => {
          for (const s of steps) {
            send("step", s);
            await new Promise((r) => setTimeout(r, 120));
          }
          // stream reply in word-chunks for typewriter effect
          const words = reply.split(" ");
          let acc = "";
          for (let i = 0; i < words.length; i += 4) {
            acc = words.slice(0, i + 4).join(" ");
            send("token", { text: acc });
            await new Promise((r) => setTimeout(r, 40));
          }
          send("done", payload);
          controller.close();
        })().catch((e) => {
          try {
            send("done", payload);
          } catch {}
          try {
            controller.close();
          } catch {}
          console.error("[guide] stream fail", e);
        });
      },
    });
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "guide failed" }, { status: 500 });
  }
}
