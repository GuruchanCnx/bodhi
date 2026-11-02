"use client";

import Link from "next/link";
import { FoldHint, SplitPane } from "@/components/adaptive";
import { InstallButton, ReminderBell, DataControls } from "@/components/platform";
import ThemeToggleClient from "@/components/theme-toggle";
import { useTheme } from "@/components/chrome";

function Appearance() {
  const { mode, resolved } = useTheme();
  return (
    <section className="liquid-card squircle p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Appearance</p>
      <h2 className="font-display ios-title mt-1 text-2xl">Dawn, dusk, or follow the sun</h2>
      <div className="mt-4 flex items-center gap-4">
        <ThemeToggleClient />
        <div>
          <p className="text-sm font-semibold">
            {mode === "dawn" ? "Dawn — warm light sanctuary" : mode === "dusk" ? "Dusk — deep night sanctuary" : "Auto — follows your system"}
          </p>
          <p className="text-xs opacity-70">Currently rendering {resolved === "dusk" ? "🌙 Dusk" : "☀️ Dawn"} · Liquid Glass adapts to both.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs opacity-80">
        <li>✦ Reduce Transparency (system setting) swaps blur for solid surfaces automatically.</li>
        <li>✦ Reduce Motion (system setting) stills petals, orbs, and aurora drift.</li>
        <li>✦ Large text &amp; high contrast respected through semantic color tokens.</li>
      </ul>
    </section>
  );
}

function Shortcuts() {
  const rows = [
    ["⌘K / Ctrl K", "Search the 1,040-method canon"],
    ["Space", "Start / pause / resume a sit"],
    ["F", "Focus mode in the Meditation Hall"],
    ["M", "Mute the singing bowl"],
    ["↑ ↓ ↵", "Navigate the command palette"],
    ["Esc", "Close any sheet or palette"],
  ];
  return (
    <section className="liquid-card squircle p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Keyboard</p>
      <h2 className="font-display ios-title mt-1 text-2xl">Move like water</h2>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 text-xs">
            <dt className="liquid-chip pill shrink-0 px-2.5 py-1 font-mono font-bold">{k}</dt>
            <dd className="text-right opacity-80">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function About() {
  return (
    <section className="liquid-card squircle p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">About</p>
      <h2 className="font-display ios-title mt-1 text-2xl">Bodhi · Sanctuary</h2>
      <p className="mt-2 text-xs leading-relaxed opacity-80">
        1,048 meditation methods across Theravāda, Zen, Mahāyāna, Tibetan and Pure Land lineages —
        bowl timer, Dhamma library, journal, journey analytics, and an agentic Guide that reasons in
        the open. Built with Next.js + PostgreSQL; your practice data never leaves this sanctuary.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link href="/library" className="liquid-chip pill px-3 py-1.5 font-bold">Great Canon</Link>
        <Link href="/plan" className="liquid-chip pill px-3 py-1.5 font-bold">7-day plans</Link>
        <Link href="/privacy" className="liquid-chip pill px-3 py-1.5 font-bold">Privacy</Link>
        <Link href="/journey" className="liquid-chip pill px-3 py-1.5 font-bold">Journey</Link>
      </div>
    </section>
  );
}

export default function SettingsClient() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <FoldHint className="mx-auto" />
      <div className="mx-auto mt-4 max-w-2xl text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">Sanctuary settings</p>
        <h1 className="font-display ios-title mt-2 text-balance text-4xl md:text-[2.75rem]">Tune the vessel</h1>
        <p className="mt-2 text-sm opacity-75">Appearance, reminders, install, and your data — all under your own roof.</p>
      </div>

      <div className="mt-8">
        <SplitPane
          storageKey="bodhi-settings-split"
          min={0.35}
          max={0.65}
          left={
            <div className="space-y-4">
              <Appearance />
              <ReminderBell />
              <Shortcuts />
            </div>
          }
          right={
            <div className="space-y-4">
              <section className="liquid-card squircle p-5">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Install</p>
                <h2 className="font-display ios-title mt-1 text-2xl">Keep the sanctuary close</h2>
                <p className="mt-1 text-xs opacity-70">Works offline for the shell, sits and cues; installs like a native app on iOS and Android.</p>
                <div className="mt-3">
                  <InstallButton />
                </div>
              </section>
              <DataControls />
              <About />
            </div>
          }
        />
      </div>
    </main>
  );
}
