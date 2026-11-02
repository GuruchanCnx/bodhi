import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, ne, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { meditationTechniques } from "@/db/schema";
import { meditations } from "@/lib/content";
import FavButton from "@/components/fav-button";

export const revalidate = 3600;

export function generateStaticParams() {
  return meditations.map((m) => ({ slug: m.slug }));
}

type Norm = {
  slug: string; name: string; pali: string; tradition: string; level: string;
  category?: string; durations: number[]; description: string; essence: string;
  instructions: string[]; benefits: string[]; cues?: { at: number; text: string }[];
  source: string; color: string; symbol: string; fromDb: boolean;
};

const getTechCached = (slug: string) =>
  unstable_cache(
    async () => {
      const rows = await db
        .select()
        .from(meditationTechniques)
        .where(eq(meditationTechniques.slug, slug))
        .limit(1);
      return rows[0] ?? null;
    },
    [`tech-${slug}`],
    { revalidate: 3600 }
  )();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const curated = meditations.find((x) => x.slug === slug);
  if (curated) {
    return {
      title: `${curated.name} — ${curated.pali}`,
      description: curated.description.slice(0, 155),
    };
  }
  try {
    const r = await getTechCached(slug);
    if (r) return { title: `${r.name}`, description: r.description.slice(0, 155) };
  } catch {}
  return { title: "Practice" };
}

export default async function DetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const curated = meditations.find((x) => x.slug === slug);
  let m: Norm | null = null;
  if (curated) {
    m = { ...curated, fromDb: false };
  } else {
    try {
      const r = await getTechCached(slug);
      if (r) {
        m = {
          slug: r.slug, name: r.name, pali: r.pali ?? "", tradition: r.tradition,
          level: r.level, category: r.category,
          durations: (r.durations as number[]) ?? [10, 20, 30],
          description: r.description, essence: r.essence,
          instructions: (r.instructions as string[]) ?? [],
          benefits: (r.benefits as string[]) ?? [],
          source: r.source, color: r.color, symbol: r.symbol, fromDb: true,
        };
      }
    } catch {
      m = null;
    }
  }
  if (!m) notFound();

  // Related: prefer same category, fallback random — single query
  let others: { slug: string; name: string; pali: string | null; color: string; symbol: string }[] = [];
  try {
    const rel = m.category
      ? await db
          .select({ slug: meditationTechniques.slug, name: meditationTechniques.name, pali: meditationTechniques.pali, color: meditationTechniques.color, symbol: meditationTechniques.symbol })
          .from(meditationTechniques)
          .where(and(eq(meditationTechniques.category, m.category), ne(meditationTechniques.slug, slug)))
          .orderBy(sql`random()`)
          .limit(3)
      : [];
    others = rel;
    if (others.length < 3) {
      const fill = await db
        .select({ slug: meditationTechniques.slug, name: meditationTechniques.name, pali: meditationTechniques.pali, color: meditationTechniques.color, symbol: meditationTechniques.symbol })
        .from(meditationTechniques)
        .orderBy(sql`random()`)
        .limit(3 - others.length);
      others = [...others, ...fill.filter((x) => x.slug !== slug)];
    }
  } catch {
    others = [];
  }

  const cues = m.cues ?? [
    { at: 0, text: "Arrive. Feel the body, the breath, the present moment." },
    { at: 0.3, text: m.essence },
    { at: 0.6, text: "If lost in thought, return with kindness. Beginning again is the practice." },
    { at: 0.9, text: "Widen awareness. Breathe with the whole being." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: m.name,
    description: m.description,
    step: m.instructions.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex items-center justify-between gap-3">
        <Link href="/library" className="text-sm font-semibold text-amber-800 hover:underline">← Back to library</Link>
        <span className="text-xs text-stone-400">⌘K to search · 🪷 Guide plans</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-[2rem] border border-amber-900/10 bg-white shadow-sm">
        <div className="h-3" style={{ background: `linear-gradient(90deg, ${m.color}, #f59e0b)` }} />
        <div className="p-6 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl text-white shadow-lg" style={{ background: m.color }}>
                {m.symbol}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
                  {m.tradition} · {m.level}{m.category ? ` · ${m.category}` : ""}{m.fromDb ? " · Canon" : " · Root"}
                </p>
                <h1 className="font-display text-balance text-4xl font-semibold leading-tight text-stone-950 md:text-[2.75rem]">{m.name}</h1>
                {m.pali && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">{m.pali}</p>}
              </div>
            </div>
            <FavButton slug={m.slug} name={m.name} />
          </div>
          <p className="font-display mt-6 border-l-4 border-amber-600 pl-5 text-2xl italic leading-snug text-stone-800">
            “{m.essence}”
          </p>
          <p className="mt-5 leading-relaxed text-stone-600">{m.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {m.durations.map((d) => (
              <Link key={d} href={`/practice?technique=${m.slug}&minutes=${d}`} prefetch className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-amber-50 transition hover:bg-amber-900">
                🔔 Sit {d} min
              </Link>
            ))}
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-[0.83rem] text-amber-900">
            🪷 Not sure? <Link href="/library" className="font-bold underline">Ask Bodhi Guide</Link> — “I feel restless, {m.durations[0] ?? 10} minutes” — for a personal pick.
          </p>

          <div className="cv-auto mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-display text-2xl font-semibold">Step-by-step</h2>
              <ol className="mt-4 space-y-3">
                {m.instructions.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-4 text-sm leading-relaxed text-stone-700">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-900 text-xs font-bold text-amber-100">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-50 p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Benefits</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-stone-700">
                  {m.benefits.map((b) => <li key={b}>✦ {b}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl bg-stone-900 p-5 text-stone-300">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Guidance cues</h3>
                <ul className="mt-2 space-y-2 text-[0.83rem] italic">
                  {cues.map((c) => (
                    <li key={c.text} className="border-l-2 border-amber-600/50 pl-3">“{c.text}”</li>
                  ))}
                </ul>
              </div>
              <p className="rounded-2xl border border-amber-900/15 p-4 text-xs italic text-stone-500">📜 Source: {m.source}</p>
            </div>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <h2 className="font-display mt-10 text-2xl font-semibold">Continue through the canon</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/library/${o.slug}`} className="rounded-2xl border border-amber-900/10 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid h-10 w-10 place-items-center rounded-xl text-lg text-white" style={{ background: o.color }}>
                  {o.symbol}
                </span>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-900">{o.name}</p>
                <p className="truncate text-xs text-stone-500">{o.pali}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
