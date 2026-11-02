import {
  addJournalToFirestore,
  deleteJournalFromFirestore,
  getJournalsFromFirestore,
  updateJournalInFirestore,
} from "@/lib/firestore-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit") || "100") || 100), 200);

  try {
    const entries = await getJournalsFromFirestore(limit);
    const res = Response.json({ entries });
    res.headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    return res;
  } catch (e) {
    console.warn("[journal] GET error, fallback to empty:", e);
    return Response.json({ entries: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = String(body.content || "").trim();
    if (!content) return Response.json({ error: "Content required" }, { status: 400 });

    const entry = await addJournalToFirestore({
      id: body.id,
      title: String(body.title || "Untitled reflection").slice(0, 200),
      content: content.slice(0, 10000),
      mood: body.mood ? String(body.mood).slice(0, 40) : null,
      prompt: body.prompt ? String(body.prompt).slice(0, 500) : null,
      gratitude: body.gratitude ? String(body.gratitude).slice(0, 2000) : null,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ entry }, { status: 201 });
  } catch (e) {
    console.error("[journal] POST error:", e);
    return Response.json({ error: "Could not save entry" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id || id.startsWith("tmp-")) return Response.json({ error: "id required" }, { status: 400 });

    const updated = await updateJournalInFirestore(id, {
      title: body.title ? String(body.title).slice(0, 200) : undefined,
      content: body.content ? String(body.content).slice(0, 10000) : undefined,
      mood: body.mood !== undefined ? (body.mood ? String(body.mood).slice(0, 40) : null) : undefined,
      gratitude: body.gratitude !== undefined ? (body.gratitude ? String(body.gratitude).slice(0, 2000) : null) : undefined,
    });

    return Response.json({ entry: updated });
  } catch (e) {
    console.error("[journal] PUT error:", e);
    return Response.json({ error: "Could not update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (id.startsWith("tmp-")) return Response.json({ ok: true });

  try {
    await deleteJournalFromFirestore(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[journal] DELETE error:", e);
    return Response.json({ error: "Could not delete entry" }, { status: 500 });
  }
}
