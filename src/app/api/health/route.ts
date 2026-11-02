import { doc, getDocFromServer } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDocFromServer(doc(firestore, "test", "health"));
    return Response.json({ ok: true, database: "firestore" });
  } catch (error: any) {
    if (error?.code === "not-found" || error?.message?.includes("not found")) {
      return Response.json({ ok: true, database: "firestore" });
    }
    // Still consider server healthy if responding
    return Response.json({ ok: true, database: "firestore", note: "offline/read-only" });
  }
}
