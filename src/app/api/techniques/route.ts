import { findTechniqueBySlug, queryCanon } from "@/lib/canon";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const t0 = Date.now();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const tradition = url.searchParams.get("tradition") || "All";
  const level = url.searchParams.get("level") || "All";
  const category = url.searchParams.get("category") || "All";
  const suggest = url.searchParams.get("suggest") === "1";
  const page = Math.max(1, Math.min(200, Number(url.searchParams.get("page") || "1") || 1));
  const pageSize = suggest
    ? 8
    : Math.min(48, Math.max(6, Number(url.searchParams.get("pageSize") || "24") || 24));

  const result = queryCanon({
    q,
    tradition,
    level,
    category,
    page,
    pageSize,
    suggest,
  });

  const res = Response.json({
    ...result,
    ms: Date.now() - t0,
  });

  res.headers.set(
    "Cache-Control",
    suggest
      ? "public, s-maxage=300, stale-while-revalidate=900"
      : "public, s-maxage=120, stale-while-revalidate=600"
  );
  res.headers.set("Server-Timing", `canon;dur=${Date.now() - t0}`);
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").slice(0, 120);
    if (!slug) return Response.json({ error: "slug required" }, { status: 400 });

    const technique = findTechniqueBySlug(slug);
    if (!technique) return Response.json({ error: "not found" }, { status: 404 });

    const res = Response.json({ technique });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    return res;
  } catch {
    return Response.json({ error: "lookup failed" }, { status: 500 });
  }
}
