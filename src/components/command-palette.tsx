"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cachedFetch, useDebounced } from "./chrome";

type Hit = {
  slug: string; name: string; pali: string | null; tradition: string; level: string;
  category: string; durations: number[]; color: string; symbol: string;
};

function readList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"search" | "ask">("search");
  const dq = useDebounced(q, 220);
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
      setRecents(readList("bodhi-recent"));
      setFavs(readList("bodhi-favs"));
      setAnswer(null);
    } else {
      document.body.style.overflow = "";
      setQ("");
      setHits([]);
      setActive(0);
      setMode("search");
      setAnswer(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "search") return;
    const ctrl = new AbortController();
    const run = async () => {
      try {
        if (dq.trim().length >= 2) {
          // fast suggest path: tiny payload, edge-cached
          const data = await cachedFetch<{ suggestions: Hit[]; total: number }>(
            `/api/agent?action=suggest&q=${encodeURIComponent(dq)}`,
            60_000,
            ctrl.signal
          ).catch(async () => {
            const d2 = await cachedFetch<{ techniques: Hit[]; total: number }>(
              `/api/techniques?q=${encodeURIComponent(dq)}&pageSize=8&suggest=1`,
              30_000,
              ctrl.signal
            );
            return { suggestions: d2.techniques, total: d2.total };
          });
          setHits((data.suggestions ?? []) as Hit[]);
          setTotal(data.total ?? 0);
        } else {
          setHits([]);
          setTotal(1040);
        }
        setActive(0);
      } catch {}
    };
    run();
    return () => ctrl.abort();
  }, [dq, open, mode]);

  const go = useCallback(
    (h?: Hit) => {
      const t = h ?? hits[active];
      if (!t) return;
      setOpen(false);
      router.push(`/library/${t.slug}`);
    },
    [hits, active, router]
  );

  const ask = useCallback(async () => {
    if (!q.trim() || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, context: { favorites: favs } }),
      });
      const data = await res.json();
      const first = data.recommendations?.[0];
      setAnswer(data.reply ?? "…");
      if (first) {
        setHits(data.recommendations ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      setAnswer("The bowl trembles — try again.");
    } finally {
      setAsking(false);
    }
  }, [q, asking, favs]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="liquid-chip pressable pill hidden items-center gap-2 px-4 py-2 text-xs opacity-80 transition hover:opacity-100 lg:inline-flex"
        aria-label="Search 1,040 methods (Cmd+K)"
      >
        <span aria-hidden>🔍</span> Search 1,040 methods…
        <kbd className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[0.65rem] font-bold">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] grid items-start justify-center bg-black/30 p-4 pt-[10vh] backdrop-blur-md" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Search meditations">
      <div className="liquid-strong animate-sheet-up squircle-lg w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="liquid-segment" role="tablist" aria-label="Palette mode">
            {(["search", "ask"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`pill px-4 py-1.5 text-xs font-bold transition ${mode === m ? "bg-[var(--ink)] text-[var(--bg)] shadow" : "opacity-60 hover:opacity-100"}`}
              >
                {m === "search" ? "🔍 Search" : "🪷 Ask Bodhi"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span aria-hidden>{mode === "search" ? "🔍" : "🪷"}</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              if (e.key === "Enter") {
                if (mode === "ask") ask();
                else go();
              }
            }}
            placeholder={mode === "search" ? "Try 'koan for doubt'… 'sleep 15 min'… 'tara'…" : "Ask: 'anxious, 10 min, what should I sit?' ↵"}
            className="w-full bg-transparent text-[0.95rem] outline-none placeholder:opacity-50"
            aria-label={mode === "search" ? "Search meditation methods" : "Ask Bodhi Guide"}
          />
          <kbd className="rounded-md bg-black/10 px-2 py-0.5 font-mono text-[0.65rem]">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {mode === "ask" ? (
            <div className="px-3 py-3">
              {!answer && !asking && (
                <p className="py-4 text-center text-sm opacity-70">Ask in plain words — mood + minutes works best. ↵ to consult the canon.</p>
              )}
              {asking && <p className="py-4 text-center text-sm animate-pulse">☸ consulting 1,040 methods…</p>}
              {answer && (
                <div className="liquid-card rounded-2xl p-4 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{answer}</p>
                  {hits.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {hits.slice(0, 3).map((h) => (
                        <button key={h.slug} onClick={() => go(h)} className="flex w-full items-center gap-3 rounded-2xl bg-black/5 px-3 py-2 text-left hover:bg-black/10">
                          <span className="grid h-8 w-8 place-items-center rounded-xl text-sm text-white" style={{ background: h.color }}>{h.symbol}</span>
                          <span className="truncate text-xs font-bold">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-4 text-center text-sm opacity-70">
              {dq ? (
                <>No match — try &apos;breath&apos;, &apos;metta&apos;, &apos;koan&apos;, &apos;sleep&apos;… 🙏</>
              ) : (
                <>
                  <p>Start typing to search the Great Canon…</p>
                  {(recents.length > 0 || favs.length > 0) && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[0.7rem]">
                      {recents.slice(0, 3).map((s) => (
                        <Link key={s} href={`/library/${s}`} onClick={() => setOpen(false)} className="liquid-chip pill px-3 py-1 font-bold">↩ {s.split("-").slice(0, 2).join(" ")}</Link>
                      ))}
                      {favs.slice(0, 3).map((s) => (
                        <Link key={`f-${s}`} href={`/library/${s}`} onClick={() => setOpen(false)} className="liquid-chip pill px-3 py-1 font-bold">♥ {s.split("-").slice(0, 2).join(" ")}</Link>
                      ))}
                    </div>
                  )}
                  {total > 0 && <p className="mt-2 text-xs opacity-60">{total} methods indexed</p>}
                </>
              )}
            </div>
          ) : (
            hits.map((h, i) => (
              <button
                key={h.slug}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h)}
                onFocus={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${i === active ? "bg-black/10" : ""}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm text-white" style={{ background: h.color }}>{h.symbol}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{h.name}</span>
                  <span className="block truncate text-xs opacity-60">{h.tradition} · {h.category} · {(h.durations ?? []).slice(0, 3).join("/")}{h.durations?.length ? "m" : ""}</span>
                </span>
                <span className="text-xs font-bold opacity-60">→</span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5 text-[0.68rem] opacity-60">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <Link href="/library" className="font-bold underline" onClick={() => setOpen(false)}>Full library →</Link>
        </div>
      </div>
    </div>
  );
}
