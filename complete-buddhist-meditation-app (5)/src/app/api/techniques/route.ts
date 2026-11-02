import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { meditationTechniques } from "@/db/schema";

export const dynamic = "force-dynamic";

// Facets cached 10 min in-memory (avoids GROUP BY per keystroke)
let facetCache: { at: number; data: { traditions: string[]; levels: string[]; categories: string[]; catCounts: Record<string, number> } } | null = null;

async function getFacets() {
  if (facetCache && Date.now() - facetCache.at < 10 * 60 * 1000) return facetCache.data;
  const [counts, tr, lv, ct] = await Promise.all([
    db.select({ v: meditationTechniques.category, c: count() }).from(meditationTechniques).groupBy(meditationTechniques.category),
    db.select({ v: meditationTechniques.tradition }).from(meditationTechniques).groupBy(meditationTechniques.tradition),
    db.select({ v: meditationTechniques.level }).from(meditationTechniques).groupBy(meditationTechniques.level),
    db.select({ v: meditationTechniques.category }).from(meditationTechniques).groupBy(meditationTechniques.category),
  ]);
  const catCounts: Record<string, number> = {};
  for (const r of counts) catCounts[r.v] = Number(r.c);
  const data = {
    traditions: tr.map((r) => r.v).sort(),
    levels: lv.map((r) => r.v).sort(),
    categories: ct.map((r) => r.v).sort(),
    catCounts,
  };
  facetCache = { at: Date.now(), data };
  return data;
}

const FULL_COLS = {
  slug: meditationTechniques.slug,
  name: meditationTechniques.name,
  pali: meditationTechniques.pali,
  tradition: meditationTechniques.tradition,
  level: meditationTechniques.level,
  category: meditationTechniques.category,
  durations: meditationTechniques.durations,
  description: meditationTechniques.description,
  essence: meditationTechniques.essence,
  source: meditationTechniques.source,
  color: meditationTechniques.color,
  symbol: meditationTechniques.symbol,
};

const LITE_COLS = {
  slug: meditationTechniques.slug,
  name: meditationTechniques.name,
  pali: meditationTechniques.pali,
  tradition: meditationTechniques.tradition,
  level: meditationTechniques.level,
  category: meditationTechniques.category,
  durations: meditationTechniques.durations,
  color: meditationTechniques.color,
  symbol: meditationTechniques.symbol,
};

export async function GET(req: Request) {
  const t0 = Date.now();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const tradition = url.searchParams.get("tradition") || "All";
  const level = url.searchParams.get("level") || "All";
  const category = url.searchParams.get("category") || "All";
  const suggest = url.searchParams.get("suggest") === "1";
  const page = Math.max(1, Math.min(200, Number(url.searchParams.get("page") || "1") || 1));
  // suggest mode: tiny payload, max 8
  const pageSize = suggest
    ? 8
    : Math.min(48, Math.max(6, Number(url.searchParams.get("pageSize") || "24") || 24));
  const offset = suggest ? 0 : (page - 1) * pageSize;

  const filters = [];
  if (tradition !== "All") filters.push(eq(meditationTechniques.tradition, tradition));
  if (level !== "All") filters.push(eq(meditationTechniques.level, level));
  if (category !== "All") filters.push(eq(meditationTechniques.category, category));

  // tokenize query: every token must appear somewhere (AND of ORs) — better relevance than one big LIKE
  const tokens = q.replace(/[%_]/g, "").split(/\s+/).filter((t) => t.length >= 2).slice(0, 4);
  if (tokens.length) {
    for (const tok of tokens) {
      const like = `%${tok}%`;
      filters.push(
        or(
          ilike(meditationTechniques.name, like),
          ilike(meditationTechniques.description, like),
          ilike(meditationTechniques.pali, like),
          ilike(meditationTechniques.source, like)
        )!
      );
    }
  }
  const where = filters.length ? and(...filters) : undefined;

  try {
    // trigram-ranked ordering when searching: similarity(name) first, then name
    const orderExpr = tokens.length
      ? sql`similarity(${meditationTechniques.name}, ${tokens.join(" ")}) DESC, ${meditationTechniques.name} ASC`
      : meditationTechniques.name;

    const cols = suggest ? LITE_COLS : FULL_COLS;
    const needFacets = !suggest;

    const [totalRows, rows, facets] = await Promise.all([
      suggest
        ? Promise.resolve([{ c: 0 }])
        : db.select({ c: count() }).from(meditationTechniques).where(where),
      db.select(cols).from(meditationTechniques).where(where).orderBy(orderExpr as never).limit(pageSize).offset(offset),
      needFacets ? getFacets() : Promise.resolve(null),
    ]);

    // total via fast path for unfiltered first pages
    let total = (totalRows[0] as { c: number } | undefined)?.c ?? 0;
    if (!suggest && !q && tradition === "All" && level === "All" && category === "All") {
      total = 1040; // known canon size; avoids count(*) on hot path (facets carry truth)
      try {
        const c = await db.execute(sql`select count(*)::int as c from meditation_techniques`);
        total = (c.rows[0] as unknown as { c: number }).c ?? total;
      } catch {}
    }

    const res = Response.json({
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      techniques: rows,
      ...(facets ? { facets } : {}),
      ms: Date.now() - t0,
    });
    res.headers.set(
      "Cache-Control",
      suggest
        ? "public, s-maxage=300, stale-while-revalidate=900"
        : "public, s-maxage=120, stale-while-revalidate=600"
    );
    res.headers.set("Server-Timing", `db;dur=${Date.now() - t0}`);
    return res;
  } catch (e) {
    console.error("[techniques] fail", e);
    return Response.json(
      { total: 0, page, pageSize, totalPages: 1, techniques: [], facets: { traditions: [], levels: [], categories: [], catCounts: {} } },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").slice(0, 120);
    if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
    const rows = await db.select().from(meditationTechniques).where(eq(meditationTechniques.slug, slug)).limit(1);
    if (!rows[0]) return Response.json({ error: "not found" }, { status: 404 });
    const res = Response.json({ technique: rows[0] });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    return res;
  } catch {
    return Response.json({ error: "lookup failed" }, { status: 500 });
  }
}
