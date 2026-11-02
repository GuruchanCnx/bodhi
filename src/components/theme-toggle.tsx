"use client";

import { useState } from "react";
import { useTheme, type ThemeMode } from "./chrome";

const OPTIONS: { id: ThemeMode; icon: string; label: string; hint: string }[] = [
  { id: "dawn", icon: "☀️", label: "Dawn", hint: "Warm light sanctuary" },
  { id: "auto", icon: "◐", label: "Auto", hint: "Follows system + sunset" },
  { id: "dusk", icon: "🌙", label: "Dusk", hint: "Deep night sanctuary" },
];

export default function ThemeToggleClient({ compact = false }: { compact?: boolean }) {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.id === mode) ?? OPTIONS[1];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Theme: ${current.label} (resolved ${resolved}). Change theme`}
        aria-expanded={open}
        title={`${current.label} · ${current.hint} — click to change`}
        className="liquid-chip pressable pill grid h-9 w-9 place-items-center text-base"
      >
        <span aria-hidden>{resolved === "dusk" ? "🌙" : "☀️"}</span>
        {mode === "auto" && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-600 text-[0.55rem] text-white ring-2 ring-[var(--bg)]" aria-hidden>
            A
          </span>
        )}
      </button>

      {open && (
        <>
          <button aria-hidden tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div
            role="menu"
            aria-label="Appearance"
            className="liquid-strong animate-sheet-up squircle absolute right-0 top-11 z-50 w-60 overflow-hidden p-2"
          >
            <p className="px-3 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] opacity-60">
              Appearance
            </p>
            <div className="liquid-segment w-full" role="group" aria-label="Theme mode">
              {OPTIONS.map((o) => (
                <button
                  key={o.id}
                  role="menuitemradio"
                  aria-checked={mode === o.id}
                  onClick={() => {
                    setMode(o.id);
                    setOpen(false);
                  }}
                  className={`pressable flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[0.7rem] font-bold transition ${
                    mode === o.id
                      ? "bg-[var(--ink)] text-[var(--bg)] shadow-lg"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className="text-base" aria-hidden>{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
            <p className="px-3 py-2 text-[0.7rem] leading-snug opacity-60">
              {compact ? "" : ""}
              Auto follows your system and melts into Dusk after sunset — like iOS Night Shift for the soul.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
