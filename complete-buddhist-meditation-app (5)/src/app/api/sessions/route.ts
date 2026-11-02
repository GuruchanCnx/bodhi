import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { meditationSessions } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit") || "60") || 60), 200);
  const rows = await db
    .select({
      id: meditationSessions.id,
      technique: meditationSessions.technique,
      title: meditationSessions.title,
      durationSeconds: meditationSessions.durationSeconds,
      moodBefore: meditationSessions.moodBefore,
      moodAfter: meditationSessions.moodAfter,
      notes: meditationSessions.notes,
      createdAt: meditationSessions.createdAt,
    })
    .from(meditationSessions)
    .orderBy(desc(meditationSessions.createdAt))
    .limit(limit);
  const res = Response.json({ sessions: rows });
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const durationSeconds = Math.max(30, Math.min(6 * 3600, Number(body.durationSeconds) || 600));
    const technique = String(body.technique || "anapanasati").slice(0, 80);
    const title = String(body.title || technique).slice(0, 160);
    const [row] = await db
      .insert(meditationSessions)
      .values({
        technique,
        title,
        durationSeconds,
        completed: body.completed !== false,
        moodBefore: body.moodBefore != null ? Number(body.moodBefore) : null,
        moodAfter: body.moodAfter != null ? Number(body.moodAfter) : null,
        notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      })
      .returning();
    return Response.json({ session: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Could not save session" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await db.delete(meditationSessions).where(eq(meditationSessions.id, id));
  return Response.json({ ok: true });
}
