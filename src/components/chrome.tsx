"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// ---------- Theme: Dawn / Dusk / Auto (iOS-style) ----------
export type ThemeMode = "dawn" | "dusk" | "auto";
const ThemeCtx = createContext<{
  mode: ThemeMode;
  resolved: "dawn" | "dusk";
  setMode: (m: ThemeMode) => void;
  cycle: () => void;
}>({ mode: "auto", resolved: "dawn", setMode: () => {}, cycle: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}
// Back-compat for old callers expecting {dusk,toggle}
export function useDusk() {
  const { resolved, cycle } = useTheme();
  return { dusk: resolved === "dusk", toggle: cycle };
}

function systemIsDusk() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [systemDusk, setSystemDusk] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bodhi-theme") as ThemeMode | null;
      if (saved === "dawn" || saved === "dusk" || saved === "auto") setModeState(saved);
      else {
        // first visit: time-aware default, then follow system
        const h = new Date().getHours();
        if (h >= 20 || h < 6) setModeState("dusk");
      }
    } catch {}
    setSystemDusk(systemIsDusk());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e: MediaQueryListEvent) => setSystemDusk(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const resolved: "dawn" | "dusk" = mode === "auto" ? (systemDusk ? "dusk" : "dawn") : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dusk", resolved === "dusk");
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved === "dusk" ? "dark" : "light";
    try {
      localStorage.setItem("bodhi-theme", mode);
    } catch {}
    // keep theme-color in sync (address bar tint, like iOS)
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", resolved === "dusk" ? "#0e0c0a" : "#faf6ee");
  }, [resolved, mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const cycle = useCallback(
    () => setModeState((m) => (m === "dawn" ? "dusk" : m === "dusk" ? "auto" : "dawn")),
    []
  );

  const value = useMemo(() => ({ mode, resolved, setMode, cycle }), [mode, resolved, setMode, cycle]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// ---------- Scroll state for adaptive glass nav ----------
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > threshold));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return scrolled;
}

// ---------- Toasts (liquid) ----------
type Toast = { id: number; text: string; kind: "ok" | "info" };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});
export function useToast() {
  return useContext(ToastCtx);
}
let toastId = 0;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`liquid animate-fade-up pill pointer-events-auto px-5 py-2.5 text-sm font-semibold ${
              t.kind === "ok" ? "liquid-prominent" : ""
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Favorites + recents ----------
export function useFavorites() {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try {
      setFavs(JSON.parse(localStorage.getItem("bodhi-favs") || "[]"));
    } catch {}
  }, []);
  const toggle = useCallback((slug: string) => {
    setFavs((f) => {
      const next = f.includes(slug) ? f.filter((x) => x !== slug) : [slug, ...f].slice(0, 100);
      try {
        localStorage.setItem("bodhi-favs", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return { favs, toggle, has: useCallback((s: string) => favs.includes(s), [favs]) };
}

export function pushRecent(slug: string) {
  try {
    const raw = JSON.parse(localStorage.getItem("bodhi-recent") || "[]") as string[];
    const next = [slug, ...raw.filter((x) => x !== slug)].slice(0, 12);
    localStorage.setItem("bodhi-recent", JSON.stringify(next));
  } catch {}
}

export function useActivePath() {
  return usePathname();
}

export function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release: () => void } | null>(null);
  useEffect(() => {
    if (!active) {
      lockRef.current?.release?.();
      lockRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => void }> } };
        if (!nav.wakeLock) return;
        const lock = await nav.wakeLock.request("screen");
        if (cancelled) lock.release();
        else lockRef.current = lock;
      } catch {}
    })();
    return () => {
      cancelled = true;
      lockRef.current?.release?.();
      lockRef.current = null;
    };
  }, [active]);
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const memCache = new Map<string, { at: number; data: unknown }>();
export async function cachedFetch<T>(url: string, ttlMs = 60_000, signal?: AbortSignal): Promise<T> {
  const hit = memCache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const data = (await res.json()) as T;
  memCache.set(url, { at: Date.now(), data });
  if (memCache.size > 80) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  return data;
}
export function useMemoKey(...parts: (string | number)[]) {
  return useMemo(() => parts.join("|"), // eslint-disable-next-line react-hooks/exhaustive-deps
    parts);
}
