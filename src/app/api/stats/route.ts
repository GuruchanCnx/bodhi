import {
  getJournalsFromFirestore,
  getSessionsFromFirestore,
} from "@/lib/firestore-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [sessions, journals] = await Promise.all([
      getSessionsFromFirestore(200).catch(() => []),
      getJournalsFromFirestore(100).catch(() => []),
    ]);

    const completed = sessions.filter((s) => s.completed !== false);
    const totalSessions = completed.length;
    let totalSeconds = 0;
    const perDayMap = new Map<string, { sessions: number; seconds: number }>();
    const byTechMap = new Map<string, { sessions: number; seconds: number }>();
    const distinctDays = new Set<string>();

    for (const s of completed) {
      totalSeconds += s.durationSeconds;
      const day = (s.createdAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
      distinctDays.add(day);

      const d = perDayMap.get(day) || { sessions: 0, seconds: 0 };
      d.sessions += 1;
      d.seconds += s.durationSeconds;
      perDayMap.set(day, d);

      const t = byTechMap.get(s.technique) || { sessions: 0, seconds: 0 };
      t.sessions += 1;
      t.seconds += s.durationSeconds;
      byTechMap.set(s.technique, t);
    }

    const perDay = Array.from(perDayMap.entries())
      .map(([day, val]) => ({ day, ...val }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const byTechnique = Array.from(byTechMap.entries())
      .map(([technique, val]) => ({ technique, ...val }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

    // Calculate streak
    let streak = 0;
    const cursor = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (!distinctDays.has(fmt(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (distinctDays.has(fmt(cursor)) && streak <= 365) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const res = Response.json({
      totals: {
        sessions: totalSessions,
        seconds: totalSeconds,
        minutes: Math.round(totalSeconds / 60),
        avgSeconds: totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0,
        days: distinctDays.size,
        streak,
        journalEntries: journals.length,
      },
      perDay,
      byTechnique,
    });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch (e) {
    console.error("[stats] Error:", e);
    return Response.json(
      {
        totals: { sessions: 0, seconds: 0, minutes: 0, avgSeconds: 0, days: 0, streak: 0, journalEntries: 0 },
        perDay: [],
        byTechnique: [],
      },
      { status: 200 }
    );
  }
}
