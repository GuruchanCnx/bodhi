import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [total, perDay, byTechnique, journalCount] = await Promise.all([
      db.execute(sql`
        select
          count(*)::int as sessions,
          coalesce(sum(duration_seconds),0)::int as seconds,
          coalesce(avg(duration_seconds),0)::int as avg_seconds,
          count(distinct date_trunc('day', created_at))::int as days
        from meditation_sessions where completed = true
      `),
      db.execute(sql`
        select to_char(created_at, 'YYYY-MM-DD') as day,
               count(*)::int as sessions,
               sum(duration_seconds)::int as seconds
        from meditation_sessions
        where created_at > now() - interval '30 days'
        group by 1 order by 1
      `),
      db.execute(sql`
        select technique, count(*)::int as sessions, sum(duration_seconds)::int as seconds
        from meditation_sessions group by technique order by sessions desc limit 20
      `),
      db.execute(sql`select count(*)::int as c from journal_entries`),
    ]);

    const t = total.rows[0] as unknown as { sessions: number; seconds: number; avg_seconds: number; days: number };

    const days = (perDay.rows as unknown as { day: string }[]).map((r) => r.day);
    const daySet = new Set(days);
    let streak = 0;
    const cursor = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (!daySet.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(fmt(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      if (streak > 365) break;
    }

    const res = Response.json({
      totals: {
        sessions: t.sessions ?? 0,
        seconds: t.seconds ?? 0,
        minutes: Math.round((t.seconds ?? 0) / 60),
        avgSeconds: t.avg_seconds ?? 0,
        days: t.days ?? 0,
        streak,
        journalEntries: (journalCount.rows[0] as unknown as { c: number }).c ?? 0,
      },
      perDay: perDay.rows,
      byTechnique: byTechnique.rows,
    });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (e) {
    console.error(e);
    return Response.json(
      { totals: { sessions: 0, seconds: 0, minutes: 0, avgSeconds: 0, days: 0, streak: 0, journalEntries: 0 }, perDay: [], byTechnique: [] },
      { status: 200 }
    );
  }
}
