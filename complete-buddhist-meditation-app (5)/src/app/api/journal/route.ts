import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit") || "100") || 100), 200);
  const rows = await db
    .select({
      id: journalEntries.id,
      title: journalEntries.title,
      content: journalEntries.content,
      mood: journalEntries.mood,
      prompt: journalEntries.prompt,
      gratitude: journalEntries.gratitude,
      createdAt: journalEntries.createdAt,
    })
    .from(journalEntries)
    .orderBy(desc(journalEntries.createdAt))
    .limit(limit);
  const res = Response.json({ entries: rows });
  res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = String(body.content || "").trim();
    if (!content) return Response.json({ error: "Content required" }, { status: 400 });
    const [row] = await db
      .insert(journalEntries)
      .values({
        title: String(body.title || "Untitled reflection").slice(0, 200),
        content: content.slice(0, 10000),
        mood: body.mood ? String(body.mood).slice(0, 40) : null,
        prompt: body.prompt ? String(body.prompt).slice(0, 500) : null,
        gratitude: body.gratitude ? String(body.gratitude).slice(0, 2000) : null,
      })
      .returning();
    return Response.json({ entry: row }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Could not save entry" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id || id.startsWith("tmp-")) return Response.json({ error: "id required" }, { status: 400 });
    const [row] = await db
      .update(journalEntries)
      .set({
        title: body.title ? String(body.title).slice(0, 200) : undefined,
        content: body.content ? String(body.content).slice(0, 10000) : undefined,
        mood: body.mood !== undefined ? (body.mood ? String(body.mood).slice(0, 40) : null) : undefined,
        gratitude: body.gratitude !== undefined ? (body.gratitude ? String(body.gratitude).slice(0, 2000) : null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, id))
      .returning();
    return Response.json({ entry: row });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Could not update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (id.startsWith("tmp-")) return Response.json({ ok: true });
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  return Response.json({ ok: true });
}
