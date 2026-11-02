import {
  addSessionToFirestore,
  deleteSessionFromFirestore,
  getSessionsFromFirestore,
} from "@/lib/firestore-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit") || "60") || 60), 200);

  try {
    const rows = await getSessionsFromFirestore(limit);
    const res = Response.json({ sessions: rows });
    res.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    return res;
  } catch (e) {
    console.warn("[sessions] GET error, fallback to empty:", e);
    return Response.json({ sessions: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const durationSeconds = Math.max(30, Math.min(6 * 3600, Number(body.durationSeconds) || 600));
    const technique = String(body.technique || "anapanasati").slice(0, 80);
    const title = String(body.title || technique).slice(0, 160);

    const session = await addSessionToFirestore({
      id: body.id,
      technique,
      title,
      durationSeconds,
      completed: body.completed !== false,
      moodBefore: body.moodBefore != null ? Number(body.moodBefore) : null,
      moodAfter: body.moodAfter != null ? Number(body.moodAfter) : null,
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ session }, { status: 201 });
  } catch (e) {
    console.error("[sessions] POST error:", e);
    return Response.json({ error: "Could not save session" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  try {
    await deleteSessionFromFirestore(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[sessions] DELETE error:", e);
    return Response.json({ error: "Could not delete session" }, { status: 500 });
  }
}
