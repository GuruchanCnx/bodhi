"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { BreathPattern } from "@/lib/content";

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="liquid-chip pill inline-flex items-center gap-2 px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="font-display ios-title mt-4 text-balance text-4xl leading-[1.05] md:text-[2.75rem]">
        {title}
      </h2>
      {sub && <p className="mt-3 text-pretty text-[0.95rem] leading-relaxed opacity-75">{sub}</p>}
      <div className={`mt-5 flex items-center gap-2 ${align === "center" ? "justify-center" : ""}`} aria-hidden>
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--accent)]" />
        <span className="text-[var(--accent)]">☸</span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--accent)]" />
      </div>
    </div>
  );
}

export const Mandala = memo(function Mandala({ size = 420, className = "" }: { size?: number; className?: string }) {
  const spokes = useMemo(() => Array.from({ length: 16 }), []);
  const dots = useMemo(() => Array.from({ length: 12 }), []);
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" className={`animate-mandala gpu ${className}`} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" opacity="0.35" className="text-[var(--accent)]">
        {[40, 68, 96, 124, 152, 180].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} strokeWidth={i % 2 ? 0.7 : 1.2} />
        ))}
        {spokes.map((_, i) => {
          const a = (i * Math.PI) / 8;
          return (
            <line key={i} x1={200 + Math.cos(a) * 40} y1={200 + Math.sin(a) * 40} x2={200 + Math.cos(a) * 180} y2={200 + Math.sin(a) * 180} strokeWidth="0.6" opacity="0.5" />
          );
        })}
        {dots.map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={200 + Math.cos(a) * 110} cy={200 + Math.sin(a) * 110} r="10" strokeWidth="0.9" />;
        })}
        <circle cx="200" cy="200" r="14" strokeWidth="1.4" />
        <circle cx="200" cy="200" r="5" fill="currentColor" opacity="0.6" stroke="none" />
      </g>
    </svg>
  );
});

export const BreathingOrb = memo(function BreathingOrb({
  pattern, phase, active,
}: { pattern: BreathPattern; phase: string; active: boolean }) {
  const total = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut || 8;
  return (
    <div
      className="relative mx-auto grid place-items-center"
      style={{ width: 300, height: 300, ["--breath-cycle" as string]: `${total}s` }}
      role="img"
      aria-label={active ? `Breathing guide: ${phase}` : "Breathing guide ready"}
    >
      <div className="breath-ripple absolute inset-6 rounded-full border border-amber-500/40" style={{ animationPlayState: active ? "running" : "paused" }} />
      <div className="breath-ripple absolute inset-6 rounded-full border border-amber-500/30" style={{ animationDelay: "1.2s", animationPlayState: active ? "running" : "paused" }} />
      <div className="ensō-ring absolute inset-10 rounded-full" />
      <div
        className="breath-orb absolute inset-16 rounded-full"
        style={{
          animationPlayState: active ? "running" : "paused",
          background: "radial-gradient(circle at 35% 30%, #fde68a 0%, #f59e0b 28%, #b45309 62%, #451a03 100%)",
          boxShadow: "0 0 90px 18px rgba(217,119,6,0.35), inset 0 0 40px rgba(255,255,255,0.25)",
        }}
      />
      <div className="liquid-strong pill absolute inset-0 m-auto grid h-28 w-28 place-items-center !rounded-full">
        <div className="text-center">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] opacity-70">{active ? phase : "Ready"}</p>
          <p className="font-display text-3xl font-semibold" aria-hidden>{active ? <PhaseCount key={phase} /> : "☸"}</p>
        </div>
      </div>
      <p className="absolute -bottom-1 text-xs font-medium opacity-70">{pattern.cycles}</p>
    </div>
  );
});

function PhaseCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{n + 1}</>;
}

export function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="liquid-card pressable squircle px-5 py-4 text-center">
      <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{label}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}

export const Petals = memo(function Petals({ count = 8 }: { count?: number }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.visibilityState === "hidden") return;
    setEnabled(true);
  }, []);
  const petals = useMemo(() => {
    const isSmall = typeof window !== "undefined" && window.innerWidth < 640;
    const n = isSmall ? Math.min(4, count) : count;
    return Array.from({ length: n }).map((_, i) => ({
      left: (i * 97 + 13) % 100,
      delay: (i * 1.9) % 14,
      dur: 13 + ((i * 3.7) % 10),
      size: 9 + ((i * 7) % 10),
    }));
  }, [count]);
  if (!enabled) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <span key={i} className="gpu absolute" style={{ left: `${p.left}%`, top: "-5vh", fontSize: p.size, opacity: 0.45, animation: `petal-fall ${p.dur}s linear ${p.delay}s infinite`, willChange: "transform, opacity" }}>
          🌸
        </span>
      ))}
    </div>
  );
});

export function SkeletonCard() {
  return (
    <div className="liquid-card squircle overflow-hidden p-5" aria-hidden>
      <div className="skeleton h-10 w-10 rounded-2xl" />
      <div className="skeleton mt-3 h-5 w-3/4 rounded-full" />
      <div className="skeleton mt-2 h-4 w-1/2 rounded-full" />
      <div className="skeleton mt-3 h-12 w-full rounded-2xl" />
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`liquid-card squircle ${className}`}>{children}</div>;
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

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}
