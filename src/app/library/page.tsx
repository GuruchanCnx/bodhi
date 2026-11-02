"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { meditations } from "@/lib/content";
import { SectionHeading, SkeletonCard } from "@/components/ui";
import { cachedFetch, pushRecent, useDebounced, useFavorites } from "@/components/chrome";
import DharmaQuoteWidget from "@/components/dharma-quote-widget";

type Tech = {
  slug: string; name: string; pali: string | null; tradition: string; level: string;
  category: string; durations: number[]; description: string; essence: string;
  source: string; color: string; symbol: string;
};

type Data = {
  total: number; totalPages: number; techniques: Tech[];
  facets?: { traditions: string[]; levels: string[]; categories: string[]; catCounts: Record<string, number> };
};

const TechCard = memo(function TechCard({ m, saved, onToggle }: { m: Tech; saved: boolean; onToggle: (slug: string) => void }) {
  return (
    <article className="cv-auto group flex flex-col rounded-3xl border border-amber-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base text-white" style={{ background: m.color }}>{m.symbol}</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-amber-900/8 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-amber-900">{m.category}</span>
          <button onClick={() => onToggle(m.slug)} aria-label={saved ? "Remove bookmark" : "Bookmark"} aria-pressed={saved} className={`rounded-full px-2 py-0.5 text-sm transition ${saved ? "text-rose-600" : "text-stone-300 hover:text-rose-500"}`}>
            {saved ? "♥" : "♡"}
          </button>
        </div>
      </div>
      <h3 className="font-display mt-2 text-[1.05rem] font-semibold leading-snug">{m.name}</h3>
      <p className="truncate text-[0.68rem] font-semibold uppercase tracking-widest text-stone-400">{[m.tradition, m.level].join(" · ")}</p>
      <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-stone-600">{m.description}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex gap-1">
          {(m.durations ?? []).slice(0, 3).map((d) => (
            <Link key={d} href={`/practice?technique=${m.slug}&minutes=${d}`} prefetch={false} className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-bold text-stone-600 hover:bg-stone-900 hover:text-amber-50">{d}m</Link>
          ))}
        </div>
        <Link href={`/library/${m.slug}`} onClick={() => pushRecent(m.slug)} className="text-xs font-bold text-amber-800 hover:underline">Study →</Link>
      </div>
    </article>
  );
});

function ForYouShelf({ onPick }: { onPick: (slug: string) => void }) {
  const [items, setItems] = useState<Tech[]>([]);
  useEffect(() => {
    let alive = true;
    try {
      const favs = JSON.parse(localStorage.getItem("bodhi-favs") || "[]") as string[];
      const recents = JSON.parse(localStorage.getItem("bodhi-recent") || "[]") as string[];
      const seed = [...favs, ...recents].slice(0, 3);
      if (!seed.length) return;
      // infer family from first saved/recent slug keywords → search it
      const hint = seed[0].split("-").slice(0, 2).join(" ");
      fetch(`/api/techniques?q=${encodeURIComponent(hint)}&pageSize=6`)
        .then((r) => r.json())
        .then((d) => {
          if (alive) setItems((d.techniques ?? []).filter((t: Tech) => t.slug !== seed[0]).slice(0, 3));
        })
        .catch(() => {});
    } catch {}
    return () => {
      alive = false;
    };
  }, []);
  if (!items.length) return null;
  return (
    <div className="mt-10">
      <h2 className="font-display text-2xl font-semibold">✦ Because you sat there</h2>
      <p className="text-sm opacity-70">Personalized from your saves + recents — novelty first.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map((m) => (
          <button key={m.slug} onClick={() => onPick(m.slug)} className="liquid-card pressable squircle p-5 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-base text-white" style={{ background: m.color }}>{m.symbol}</span>
            <p className="mt-2 text-sm font-bold leading-snug">{m.name}</p>
            <p className="text-[0.7rem] opacity-60">{m.tradition} · {m.category}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const dq = useDebounced(q, 300);
  const deferredQ = useDeferredValue(dq);
  const [trad, setTrad] = useState(searchParams.get("tradition") || "All");
  const [level, setLevel] = useState(searchParams.get("level") || "All");
  const [cat, setCat] = useState(searchParams.get("category") || "All");
  const [page, setPage] = useState(Number(searchParams.get("page") || "1") || 1);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const { favs, toggle, has } = useFavorites();
  const [showFavs, setShowFavs] = useState(false);

  // URL sync (shareable filters) — debounced replace, no scroll jump
  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredQ) params.set("q", deferredQ);
    if (trad !== "All") params.set("tradition", trad);
    if (level !== "All") params.set("level", level);
    if (cat !== "All") params.set("category", cat);
    if (page > 1) params.set("page", String(page));
    router.replace(`/library${params.toString() ? `?${params}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQ, trad, level, cat, page]);

  useEffect(() => {
    setPage(1);
  }, [deferredQ, trad, level, cat]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({
      q: deferredQ, tradition: trad, level, category: cat,
      page: String(showFavs ? 1 : page), pageSize: showFavs ? "48" : "24",
    });
    cachedFetch<Data>(`/api/techniques?${params}`, 45_000, ctrl.signal)
      .then((d) => {
        if (showFavs && favs.length) {
          const filtered = d.techniques.filter((t) => favs.includes(t.slug));
          d = { ...d, techniques: filtered, total: filtered.length, totalPages: 1 };
        }
        setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQ, trad, level, cat, page, showFavs]);

  // prefetch next page while idle
  useEffect(() => {
    if (!data || page >= (data.totalPages ?? 1) || showFavs) return;
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    const pre = () => {
      const params = new URLSearchParams({ q: deferredQ, tradition: trad, level, category: cat, page: String(page + 1), pageSize: "24" });
      fetch(`/api/techniques?${params}`).catch(() => {});
    };
    if (idle) idle(pre);
    else {
      const t = setTimeout(pre, 2500);
      return () => clearTimeout(t);
    }
  }, [data, page, deferredQ, trad, level, cat, showFavs]);

  const facets = data?.facets;
  const sorted = useMemo(() => {
    // boost favorites slightly in default view (stable, cheap)
    const list = data?.techniques ?? [];
    if (!favs.length || deferredQ || trad !== "All" || cat !== "All") return list;
    return [...list].sort((a, b) => Number(favs.includes(b.slug)) - Number(favs.includes(a.slug)));
  }, [data, favs, deferredQ, trad, cat]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <SectionHeading
        eyebrow="Guided Library"
        title="Over a thousand doors to stillness"
        sub={`${(data?.total ?? 1040) + 8} practices — 8 roots + living canon. Filters live in the URL (share them!) · ♥ bookmarks · 🪷 Guide plans.`}
      />

      <div className="mt-6">
        <DharmaQuoteWidget />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={() => setShowFavs((v) => !v)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${showFavs ? "bg-rose-700 text-white" : "border border-stone-300 bg-white text-stone-600 hover:border-rose-500"}`} aria-pressed={showFavs}>
          ♥ Saved ({favs.length})
        </button>
        <Link href="/practice" className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-amber-50 hover:bg-amber-900">🔔 Quick sit →</Link>
        <Link href="/plan" className="rounded-full border border-amber-700/40 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-900 hover:text-amber-50">🗓 7-day plan →</Link>
      </div>

      <ForYouShelf onPick={(slug) => { pushRecent(slug); router.push(`/library/${slug}`); }} />

      <h2 className="font-display mt-10 text-2xl font-semibold">✦ The Eight Root Practices</h2>
      <p className="text-sm opacity-70">Start here — full guided timers with lineage.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {meditations.map((m) => (
          <Link key={m.slug} href={`/library/${m.slug}`} prefetch={false} className="group rounded-3xl border border-amber-900/15 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <span className="grid h-11 w-11 place-items-center rounded-2xl text-lg text-white" style={{ background: m.color }}>
              {m.symbol === " footsteps " ? "👣" : m.symbol}
            </span>
            <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-amber-800">{m.tradition}</p>
            <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-amber-900">{m.name}</h3>
            <p className="text-[0.7rem] uppercase tracking-widest opacity-60">{m.pali}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-[2rem] border border-amber-900/10 bg-white/60 p-5 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold">📚 The Great Canon</h2>
            <p className="text-sm opacity-70" role="status">
              {loading && !data ? "Opening the shelves…" : `${data?.total ?? 0} methods · page ${page} of ${data?.totalPages ?? 1}`}
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search — 'koan', 'tara', 'sleep 15 min'…"
              className="w-full rounded-full border border-amber-900/20 bg-white px-5 py-3 pr-10 text-sm outline-none focus:border-amber-700"
              aria-label="Search methods"
              autoComplete="off"
              enterKeyHint="search"
            />
            {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-stone-100 px-2 py-0.5 text-xs" aria-label="Clear search">✕</button>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterRow label="Tradition" values={["All", ...((facets?.traditions ?? ["Theravāda", "Zen", "Mahāyāna", "Tibetan", "Pure Land", "All Traditions"]))]} current={trad} set={setTrad} dark />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterRow label="Level" values={["All", ...((facets?.levels ?? ["Beginner", "All Levels", "Intermediate", "Advanced"]))]} current={level} set={setLevel} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterRow label="Family" values={["All", ...((facets?.categories ?? []))]} current={cat} set={setCat} counts={facets?.catCounts} />
        </div>

        {loading && !data ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            <div className="library-grid mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((m) => (
                <TechCard key={m.slug} m={m} saved={has(m.slug)} onToggle={toggle} />
              ))}
            </div>
            {(sorted.length ?? 0) === 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm opacity-70">No methods match — loosen a filter. 🙏</p>
                <button
                  onClick={() => { setQ(""); setTrad("All"); setLevel("All"); setCat("All"); setShowFavs(false); }}
                  className="mt-3 rounded-full border border-stone-300 px-5 py-2 text-xs font-bold hover:border-amber-700"
                >
                  Clear all ↺
                </button>
              </div>
            )}
            {!showFavs && (
              <>
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page <= 1 || loading} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 380, behavior: "smooth" }); }} className="rounded-full border border-stone-300 px-5 py-2 text-sm font-bold disabled:opacity-40 hover:border-amber-700">← Prev</button>
                  <span className="px-3 text-sm font-semibold tabular-nums opacity-70" aria-live="polite">{page} / {data?.totalPages ?? 1}</span>
                  <button disabled={page >= (data?.totalPages ?? 1) || loading} onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 380, behavior: "smooth" }); }} className="rounded-full bg-stone-900 px-5 py-2 text-sm font-bold text-amber-50 disabled:opacity-40 hover:bg-amber-900">Next →</button>
                </div>
                {(data?.totalPages ?? 0) > 1 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {Array.from({ length: Math.min(10, data?.totalPages ?? 0) }).map((_, i) => {
                      const p = i + 1 + Math.max(0, Math.min((data?.totalPages ?? 1) - 10, page - 5));
                      return (
                        <button key={p} onClick={() => setPage(p)} aria-label={`Page ${p}`} aria-current={p === page ? "page" : undefined} className={`h-8 w-8 rounded-full text-xs font-bold ${p === page ? "bg-amber-700 text-white" : "bg-stone-100 opacity-70 hover:opacity-100"}`}>{p}</button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function FilterRow({ label, values, current, set, dark, counts }: { label: string; values: string[]; current: string; set: (v: string) => void; dark?: boolean; counts?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[0.65rem] font-bold uppercase tracking-widest opacity-60">{label}:</span>
      {values.map((v) => (
        <button
          key={v}
          onClick={() => set(v)}
          aria-pressed={current === v}
          className={`rounded-full px-3 py-1 text-[0.7rem] font-bold transition ${current === v ? (dark ? "bg-stone-900 text-amber-50" : "bg-amber-700 text-white") : "border border-stone-200 bg-white opacity-70 hover:opacity-100 hover:border-amber-600"}`}
        >
          {v}{counts?.[v] ? ` · ${counts[v]}` : ""}
        </button>
      ))}
    </div>
  );
}
