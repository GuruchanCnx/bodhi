import {
  deleteHabitFromFirestore,
  getHabitsFromFirestore,
  saveHabitToFirestore,
  toggleHabitDateInFirestore,
} from "@/lib/firestore-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const habits = await getHabitsFromFirestore();
    return Response.json({ habits });
  } catch (e) {
    console.warn("[habits] GET fallback:", e);
    return Response.json({ habits: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "create";

    if (action === "toggle") {
      const { id, date, currentDates } = body;
      if (!id || !date) return Response.json({ error: "id and date required" }, { status: 400 });
      const result = await toggleHabitDateInFirestore(id, date, currentDates || []);
      return Response.json(result);
    }

    const title = String(body.title || "").trim();
    if (!title) return Response.json({ error: "Title required" }, { status: 400 });
    const targetMinutes = Math.max(1, Math.min(180, Number(body.targetMinutes) || 10));
    const frequency = body.frequency || "daily";

    const habit = await saveHabitToFirestore(title, targetMinutes, frequency);
    return Response.json({ habit }, { status: 201 });
  } catch (e) {
    console.error("[habits] POST error:", e);
    return Response.json({ error: "Failed to save habit" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    await deleteHabitFromFirestore(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[habits] DELETE error:", e);
    return Response.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
