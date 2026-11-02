"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStorage, useToast } from "./chrome";

/* ---------------- PWA install prompt ---------------- */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function useInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!evt) return false;
    await evt.prompt();
    const res = await evt.userChoice;
    setEvt(null);
    return res.outcome === "accepted";
  };
  return { canInstall: !!evt, installed, install };
}

export function InstallButton({ className = "" }: { className?: string }) {
  const { canInstall, installed, install } = useInstallPrompt();
  const toast = useToast();
  if (installed) return <span className={`text-xs font-semibold opacity-70 ${className}`}>✓ Installed — Bodhi lives on your device.</span>;
  if (!canInstall) return <span className={`text-xs opacity-60 ${className}`}>Install from your browser menu (Add to Home Screen).</span>;
  return (
    <button
      onClick={async () => {
        const ok = await install();
        toast(ok ? "✦ Bodhi installed to your home screen" : "Install dismissed", ok ? "ok" : "info");
      }}
      className={`liquid-prominent pressable pill px-5 py-2.5 text-xs font-bold ${className}`}
    >
      📲 Install Bodhi app
    </button>
  );
}

/* ---------------- Daily meditation reminder ---------------- */
export function ReminderBell({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useLocalStorage("bodhi-reminder-on", false);
  const [time, setTime] = useLocalStorage("bodhi-reminder-time", "08:00");
  const [perm, setPerm] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const lastFired = useRef<string>("");
  const toast = useToast();

  useEffect(() => {
    if (typeof Notification === "undefined") setPerm("unsupported");
    else setPerm(Notification.permission as typeof perm);
  }, []);

  // In-page scheduler: fires once per day at the chosen time while the app is open.
  useEffect(() => {
    if (!on || perm !== "granted") return;
    const check = () => {
      const now = new Date();
      const [hh, mm] = time.split(":").map((n) => parseInt(n, 10) || 0);
      const today = now.toISOString().slice(0, 10);
      if (now.getHours() === hh && now.getMinutes() === mm && lastFired.current !== today) {
        lastFired.current = today;
        try {
          new Notification("🪷 Bodhi — time to sit", {
            body: "Even 5 mindful minutes keeps the thread alive. The bowl is waiting.",
            icon: "/icon.svg",
            tag: "bodhi-daily",
          });
        } catch {}
        toast("🪷 Reminder: time to sit", "info");
      }
    };
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [on, time, perm, toast]);

  const request = async () => {
    if (typeof Notification === "undefined") {
      toast("Notifications not supported here", "info");
      return;
    }
    const res = await Notification.requestPermission();
    setPerm(res as typeof perm);
    if (res === "granted") {
      setOn(true);
      toast("🔔 Daily sit reminder on");
    } else toast("Notifications blocked in browser settings", "info");
  };

  return (
    <div className={compact ? "" : "rounded-2xl border border-amber-900/10 bg-white/60 p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">🔔 Daily sit reminder</p>
          <p className="text-xs opacity-70">
            {perm === "unsupported"
              ? "This browser can't show reminders."
              : perm === "denied"
                ? "Blocked — enable notifications in browser settings."
                : on
                  ? "Gentle nudge every day at your chosen hour."
                  : "A quiet bell to return to the cushion."}
          </p>
        </div>
        {perm === "granted" ? (
          <button
            onClick={() => {
              setOn(!on);
              toast(on ? "Reminder paused" : "🔔 Reminder on");
            }}
            aria-pressed={on}
            className={`liquid-chip pressable pill px-4 py-2 text-xs font-bold ${on ? "!bg-emerald-600 !text-white" : ""}`}
          >
            {on ? "On" : "Off"}
          </button>
        ) : (
          <button onClick={request} disabled={perm === "unsupported"} className="liquid-prominent pressable pill px-4 py-2 text-xs font-bold disabled:opacity-40">
            Enable
          </button>
        )}
      </div>
      {(perm === "granted" || on) && (
        <label className="mt-3 flex items-center gap-3 text-xs font-semibold">
          <span>Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="liquid-field pill px-3 py-1.5 text-xs"
          />
          <span className="opacity-60">local time · app-open nudges</span>
        </label>
      )}
    </div>
  );
}

/* ---------------- Data export / import / reset ---------------- */
export function DataControls() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    setBusy(true);
    try {
      const [sessions, entries, plans] = await Promise.all([
        fetch("/api/sessions?limit=500").then((r) => r.json()),
        fetch("/api/journal?limit=500").then((r) => r.json()),
        fetch("/api/agent?action=plans").then((r) => r.json()),
      ]);
      const payload = {
        app: "bodhi-sanctuary",
        exportedAt: new Date().toISOString(),
        sessions: sessions.sessions ?? [],
        journal: entries.entries ?? [],
        plans: plans.plans ?? [],
        favorites: JSON.parse(localStorage.getItem("bodhi-favs") || "[]"),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bodhi-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("⤓ Backup downloaded");
    } catch {
      toast("Export failed", "info");
    } finally {
      setBusy(false);
    }
  };

  const importData = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let imported = 0;
      for (const s of data.sessions ?? []) {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technique: s.technique, title: s.title, durationSeconds: s.durationSeconds,
            completed: s.completed ?? true, moodBefore: s.moodBefore, moodAfter: s.moodAfter, notes: s.notes,
          }),
        });
        imported++;
      }
      for (const j of data.journal ?? []) {
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: j.title, content: j.content, mood: j.mood, prompt: j.prompt, gratitude: j.gratitude }),
        });
        imported++;
      }
      if (Array.isArray(data.favorites)) localStorage.setItem("bodhi-favs", JSON.stringify(data.favorites));
      toast(`✦ Restored ${imported} records`);
    } catch {
      toast("Import failed — is it a Bodhi backup?", "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
      <p className="text-sm font-bold">📦 Your data</p>
      <p className="text-xs opacity-70">Everything lives in your sanctuary database — export anytime (JSON), restore on any device.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={exportData} disabled={busy} className="liquid-chip pressable pill px-4 py-2 text-xs font-bold disabled:opacity-50">
          ⤓ Export backup
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="liquid-chip pressable pill px-4 py-2 text-xs font-bold disabled:opacity-50">
          ⤒ Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          aria-label="Import backup file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
