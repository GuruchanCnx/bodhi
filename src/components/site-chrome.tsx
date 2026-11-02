"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CommandPalette from "./command-palette";
import ThemeToggleClient from "./theme-toggle";
import { useScrolled } from "./chrome";

function LotusMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.4" opacity="0.5" className="text-[var(--accent)]" />
      <circle cx="20" cy="20" r="14.5" stroke="currentColor" strokeWidth="1" opacity="0.35" className="text-[var(--accent)]" />
      <path d="M20 8c2.2 3 2.2 6.5 0 9.5-2.2-3-2.2-6.5 0-9.5Z" fill="#b45309" />
      <path d="M11.5 12.5c3.2 1 5.4 3.4 6.2 6.7-3.2-1-5.4-3.4-6.2-6.7Z" fill="#d97706" />
      <path d="M28.5 12.5c-3.2 1-5.4 3.4-6.2 6.7 3.2-1 5.4-3.4 6.2-6.7Z" fill="#d97706" />
      <path d="M8 20c3-.8 6.2-.2 8.6 1.9-3 .8-6.2.2-8.6-1.9Z" fill="#92400e" />
      <path d="M32 20c-3-.8-6.2-.2-8.6 1.9 3 .8 6.2.2 8.6-1.9Z" fill="#92400e" />
      <path d="M11 27.5c2.4-2.2 5.6-2.9 8.6-2-2.4 2.2-5.6 2.9-8.6 2Z" fill="#a16207" />
      <path d="M29 27.5c-2.4-2.2-5.6-2.9-8.6-2 2.4 2.2 5.6 2.9 8.6 2Z" fill="#a16207" />
      <circle cx="20" cy="22.5" r="1.6" fill="#78350f" />
    </svg>
  );
}

const links = [
  { href: "/practice", label: "Practice" },
  { href: "/library", label: "Library" },
  { href: "/teachings", label: "Teachings" },
  { href: "/journal", label: "Journal" },
  { href: "/journey", label: "Journey" },
];

export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      {/* dawn aurora */}
      <div className="ambient-blob ambient-dawn-only" style={{ width: "52vw", height: "52vw", left: "-12vw", top: "-14vw", background: "radial-gradient(circle, #fde68a 0%, #f59e0b55 45%, transparent 70%)" }} />
      <div className="ambient-blob ambient-dawn-only" style={{ width: "44vw", height: "44vw", right: "-10vw", top: "8vh", background: "radial-gradient(circle, #fecaca 0%, #fb923c44 50%, transparent 70%)", animationDelay: "-8s" }} />
      <div className="ambient-blob ambient-dawn-only" style={{ width: "36vw", height: "36vw", left: "20vw", top: "60vh", background: "radial-gradient(circle, #a7f3d055 0%, transparent 70%)", animationDelay: "-16s" }} />
      {/* dusk aurora */}
      <div className="ambient-blob ambient-dusk-only" style={{ width: "55vw", height: "55vw", left: "-14vw", top: "-16vw", background: "radial-gradient(circle, #7c2d1244 0%, #451a0355 50%, transparent 70%)" }} />
      <div className="ambient-blob ambient-dusk-only" style={{ width: "48vw", height: "48vw", right: "-12vw", top: "10vh", background: "radial-gradient(circle, #92400e33 0%, #78350f33 50%, transparent 70%)", animationDelay: "-10s" }} />
      <div className="ambient-blob ambient-dusk-only" style={{ width: "40vw", height: "40vw", left: "24vw", top: "62vh", background: "radial-gradient(circle, #4c1d9533 0%, transparent 70%)", animationDelay: "-18s" }} />
      <div className="paper-grain absolute inset-0" />
    </div>
  );
}

export function SiteHeader() {
  const scrolled = useScrolled(16);
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-40 px-3 pt-3 md:px-5" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      <header className={`liquid-nav pill mx-auto flex max-w-6xl items-center justify-between gap-3 py-2 pl-3 pr-2 md:py-2.5 md:pl-4 md:pr-2.5 ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="pressable flex items-center gap-2.5 rounded-full" aria-label="Bodhi home">
          <span className="liquid-chip pill grid h-10 w-10 place-items-center">
            <LotusMark />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-[1.3rem] font-semibold tracking-wide">Bodhi</span>
            <span className="block text-[0.58rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">Sanctuary · iOS 27</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`pressable pill px-3.5 py-2 text-sm font-medium transition ${
                  active ? "bg-[var(--ink)] text-[var(--bg)] shadow-lg" : "opacity-75 hover:opacity-100 hover:bg-white/20"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <span className="mx-1 hidden lg:inline"><CommandPalette /></span>
          <ThemeToggleClient />
          <Link href="/practice" className="liquid-prominent pressable pill ml-1 px-5 py-2.5 text-sm font-bold">
            Sit Now ☸
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleClient compact />
          <details className="group relative">
            <summary className="liquid-chip pressable pill cursor-pointer list-none px-4 py-2 text-sm font-bold [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              ☰
            </summary>
            <div className="liquid-strong animate-sheet-up squircle absolute right-0 top-12 z-50 flex w-56 flex-col overflow-hidden p-1.5">
              <Link href="/" className="rounded-2xl px-4 py-2.5 text-sm hover:bg-white/20">🪷 Home</Link>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={`rounded-2xl px-4 py-2.5 text-sm hover:bg-white/20 ${pathname === l.href ? "bg-white/20 font-bold" : ""}`}>
                  {l.label}
                </Link>
              ))}
              <Link href="/practice" className="liquid-prominent mt-1 rounded-2xl px-4 py-2.5 text-center text-sm font-bold">Sit Now ☸</Link>
            </div>
          </details>
        </div>
      </header>
      {/* saffron hairline refracted through glass */}
      <div className="mx-auto mt-2 h-[2px] max-w-6xl overflow-hidden rounded-full opacity-70" aria-hidden>
        <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      </div>
    </div>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: "🪷" },
    { href: "/practice", label: "Sit", icon: "🔔" },
    { href: "/library", label: "Library", icon: "📚" },
    { href: "/journal", label: "Journal", icon: "📖" },
    { href: "/journey", label: "Path", icon: "📈" },
  ];
  return (
    <nav
      className="liquid-nav pill fixed inset-x-3 z-40 flex items-center justify-around px-2 py-2 md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label="Mobile"
    >
      {items.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`pressable flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[0.65rem] font-bold transition ${
              active ? "bg-[var(--ink)] text-[var(--bg)] shadow-lg" : "opacity-70"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-20 px-3 pb-28 md:px-5 md:pb-8">
      <div className="liquid mx-auto max-w-6xl overflow-hidden squircle-lg">
        <div className="grid gap-10 p-8 md:grid-cols-4 md:p-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="liquid-chip pill grid h-11 w-11 place-items-center"><LotusMark /></span>
              <span className="font-display text-2xl font-semibold">Bodhi</span>
              <span className="liquid-chip pill px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest opacity-70">Liquid Glass</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-70">
              A quiet place to practice the Buddha&apos;s path — 1,040 methods, bowl timer, Dhamma,
              journal, and an agentic guide. Dawn warms · Dusk restores.
            </p>
            <p className="font-display mt-4 text-lg italic opacity-90">“Sabbe sattā sukhitattā — May all beings be happy.”</p>
            <div className="mt-5 flex gap-2">
              <Link href="/practice" className="liquid-prominent pressable pill px-5 py-2.5 text-xs font-bold">Begin sitting →</Link>
              <Link href="/library" className="liquid-chip pressable pill px-5 py-2.5 text-xs font-bold">Great Canon →</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Practice</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/practice">Meditation Timer</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/library">Great Canon · 1,040</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/plan">7-Day Plans</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/teachings">Dhamma Teachings</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/journal">Reflection Journal</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/journey">Your Journey</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/settings">Settings &amp; Data</Link></li>
              <li><Link className="opacity-75 hover:opacity-100 hover:underline" href="/privacy">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">The Path</h4>
            <ul className="mt-4 space-y-2.5 text-sm opacity-70">
              <li>Four Noble Truths</li>
              <li>Noble Eightfold Path</li>
              <li>Five Precepts</li>
              <li>Brahmavihāras</li>
              <li className="pt-2 text-xs">Sādhu · Sādhu · Sādhu 🙏</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center text-xs opacity-60">
          Dedication of merit — may the goodness of this practice ripple to all beings everywhere.
        </div>
      </div>
    </footer>
  );
}
