"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QUICK_INTENTS } from "@/lib/agent";
import { useToast } from "./chrome";

type Rec = {
  slug: string; name: string; tradition: string; level: string; category: string;
  durations: number[]; essence: string; color: string; symbol: string; reason: string;
};
type Step = { label: string; detail: string };
type Msg = {
  role: "user" | "guide"; text: string; recs?: Rec[];
  actions?: { label: string; href: string }[]; steps?: Step[]; followUps?: string[];
};

const HISTORY_KEY = "bodhi-guide-history-v2";

function loadHistory(): Msg[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Msg[];
    if (Array.isArray(raw) && raw.length) return raw.slice(-20);
  } catch {}
  return [
    {
      role: "guide",
      text: "🪷 I am Bodhi Guide — your agentic companion through 1,040 methods. Tell me minutes + mood (e.g. “anxious, 10 min”) and I'll chart a path. I remember this conversation, explain my reasoning, and can build 7-day plans.",
    },
  ];
}

export default function GuideChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [liveSteps, setLiveSteps] = useState<Step[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [streak, setStreak] = useState<number | undefined>(undefined);
  const [proactive, setProactive] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    setMsgs(loadHistory());
    fetch("/api/stats").then((r) => r.json()).then((d) => setStreak(d?.totals?.streak)).catch(() => {});
    // proactive briefing (once per session)
    fetch("/api/agent?action=briefing")
      .then((r) => r.json())
      .then((d) => {
        if (d?.greeting && d?.suggestion) setProactive(`${d.greeting} ${d.suggestion}`);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-20)));
    } catch {}
  }, [msgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: open ? "smooth" : "auto", block: "end" });
  }, [msgs, open, streamText, liveSteps]);

  const favorites = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem("bodhi-favs") || "[]");
    } catch {
      return [];
    }
  };

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const history = [...msgs, { role: "user" as const, text: message }].slice(-10);
    setMsgs(history);
    setBusy(true);
    setStreamText("");
    setLiveSteps([]);

    // Try SSE streaming first, fall back to JSON
    try {
      const res = await fetch("/api/guide?stream=1", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          message,
          context: { streak, favorites: favorites() },
          history: history.map((m) => ({ role: m.role, text: m.text.slice(0, 300) })),
        }),
      });
      const ctype = res.headers.get("content-type") || "";
      if (res.ok && ctype.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let final: Msg | null = null;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const lines = part.split("\n");
            let ev = "";
            const dataLines: string[] = [];
            for (const ln of lines) {
              if (ln.startsWith("event:")) ev = ln.slice(6).trim();
              else if (ln.startsWith("data:")) dataLines.push(ln.slice(5).trim());
            }
            if (!dataLines.length) continue;
            try {
              const data = JSON.parse(dataLines.join("\n"));
              if (ev === "step") setLiveSteps((s) => [...s.slice(-4), data as Step]);
              else if (ev === "token") setStreamText(String((data as { text: string }).text || ""));
              else if (ev === "done") {
                final = {
                  role: "guide",
                  text: (data as { reply: string }).reply ?? "…",
                  recs: (data as { recommendations: Rec[] }).recommendations ?? [],
                  actions: (data as { actions: { label: string; href: string }[] }).actions ?? [],
                  steps: (data as { steps: Step[] }).steps ?? [],
                  followUps: (data as { followUps: string[] }).followUps ?? [],
                };
              }
            } catch {}
          }
        }
        setLiveSteps([]);
        setStreamText("");
        setMsgs((m) => [...m, final ?? { role: "guide", text: "The bowl trembles — try again. 🙏" }]);
        return;
      }
      // non-stream fallback
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        {
          role: "guide",
          text: data.reply ?? "…",
          recs: data.recommendations ?? [],
          actions: data.actions ?? [],
          steps: data.steps ?? [],
          followUps: data.followUps ?? [],
        },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "guide", text: "The bowl trembles — connection broke. Breathe once, then try again. 🙏" }]);
      toast("Guide unreachable — offline?", "info");
    } finally {
      setBusy(false);
      setLiveSteps([]);
      setStreamText("");
    }
  };

  const listen = () => {
    try {
      const SR = (window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown }).webkitSpeechRecognition || (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition;
      if (!SR) {
        toast("Voice input not supported here", "info");
        return;
      }
      const Rec = SR as new () => { lang: string; interimResults: boolean; onresult: ((e: { results: { [k: number]: { [j: number]: { transcript: string } } } }) => void) | null; start: () => void };
      const rec = new Rec();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setInput(t);
        send(t);
      };
      rec.start();
      toast("🎙 Listening… speak your heart", "info");
    } catch {
      toast("Voice unavailable", "info");
    }
  };

  const speak = (text: string) => {
    try {
      if (!("speechSynthesis" in window)) return;
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(text.replace(/[*#]/g, "").slice(0, 400));
      u.rate = 0.92;
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch {}
  };

  const clearHistory = () => {
    const fresh: Msg[] = [{ role: "guide", text: "🪷 Fresh cushion. What does your heart need today — minutes + mood?" }];
    setMsgs(fresh);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh));
    } catch {}
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Bodhi Guide" : "Open Bodhi Guide"}
        className="liquid-prominent pressable fixed bottom-24 right-4 z-[70] grid h-14 w-14 place-items-center !rounded-full text-2xl md:bottom-6 md:right-6"
      >
        {open ? "✕" : "🪷"}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-emerald-400 ring-2 ring-[var(--bg)]" aria-hidden />}
      </button>

      {open && (
        <div className="liquid-strong animate-sheet-up fixed bottom-[5.5rem] right-3 z-[70] flex h-[min(640px,74vh)] w-[min(410px,calc(100vw-1.5rem))] flex-col overflow-hidden !rounded-[1.75rem] md:bottom-24 md:right-6" role="dialog" aria-label="Bodhi Guide chat" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-500/20 text-xl">🪷</span>
              <div>
                <p className="text-sm font-bold leading-tight">Bodhi Guide</p>
                <p className="text-[0.68rem] text-emerald-300">● streams · remembers · {streak != null ? `🔥 ${streak}-day` : "online"}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={clearHistory} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Clear conversation" title="Fresh start">↺</button>
              <button onClick={listen} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Voice input">🎙</button>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Close">✕</button>
            </div>
          </div>

          {proactive && msgs.length <= 1 && (
            <button onClick={() => send("Plan my sit for right now")} className="mx-4 mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-left text-xs leading-relaxed hover:bg-amber-500/20">
              <span className="font-bold">✦ Proactive nudge — </span>{proactive} <span className="font-bold underline">Tap to plan →</span>
            </button>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[0.83rem] leading-relaxed ${m.role === "user" ? "liquid-prominent" : "liquid-card"}`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.role === "guide" && (
                    <button onClick={() => speak(m.text)} className="mt-1.5 text-[0.68rem] font-bold opacity-60 hover:opacity-100">
                      {speaking ? "⏹ stop voice" : "🔊 listen"}
                    </button>
                  )}
                  {m.steps && m.steps.length > 0 && (
                    <details className="mt-2 rounded-xl bg-black/5 p-2 text-[0.7rem]">
                      <summary className="cursor-pointer font-bold opacity-70">☸ How I reasoned</summary>
                      <ul className="mt-1.5 space-y-1">
                        {m.steps.map((s, j) => (
                          <li key={j}><span className="font-bold">{s.label}:</span> {s.detail}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {m.recs && m.recs.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {m.recs.slice(0, 4).map((r) => (
                        <Link key={r.slug} href={`/library/${r.slug}`} className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-white/40 p-2.5 transition hover:border-amber-600/50">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm text-white" style={{ background: r.color }}>{r.symbol}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold">{r.name}</span>
                            <span className="block truncate text-[0.68rem] opacity-70">{r.reason} · {(r.durations ?? []).slice(0, 3).join("/")}m</span>
                          </span>
                        </Link>
                      ))}
                      <div className="flex gap-1.5">
                        {(m.recs[0]?.durations ?? [10]).slice(0, 2).map((d) => (
                          <Link key={d} href={`/practice?technique=${m.recs![0].slug}&minutes=${d}`} className="liquid-prominent flex-1 rounded-full py-1.5 text-center text-[0.7rem] font-bold">
                            🔔 Sit {d}m
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <Link key={a.href + a.label} href={a.href} className="liquid-chip pill px-3 py-1 text-[0.7rem] font-bold">
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.followUps && m.followUps.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.followUps.map((f) => (
                        <button key={f} onClick={() => send(f)} className="rounded-full bg-black/5 px-3 py-1 text-[0.68rem] font-semibold opacity-80 hover:opacity-100">
                          {f} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(busy || streamText) && (
              <div className="flex justify-start">
                <div className="liquid-card max-w-[88%] rounded-2xl px-4 py-3 text-sm">
                  {liveSteps.length > 0 && (
                    <ul className="mb-2 space-y-1 text-[0.7rem] opacity-70">
                      {liveSteps.map((s, i) => (
                        <li key={i}>☸ <span className="font-bold">{s.label}</span> — {s.detail}</li>
                      ))}
                    </ul>
                  )}
                  <span>{streamText || "☸ consulting the canon…"}</span>
                  <span className="animate-pulse">▍</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="liquid border-x-0 border-b-0 px-3 pb-3 pt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {QUICK_INTENTS.slice(0, 4).map((q) => (
                <button key={q.label} onClick={() => send(q.query)} className="liquid-chip pressable pill shrink-0 px-3 py-1.5 text-[0.68rem] font-bold">
                  {q.label}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How is your heart? How many minutes?"
                className="liquid-field pill w-full px-4 py-2.5 text-sm outline-none placeholder:opacity-50 focus:border-[var(--accent)]"
                aria-label="Message Bodhi Guide"
              />
              <button type="submit" disabled={busy || !input.trim()} className="liquid-prominent pressable pill shrink-0 px-4 py-2.5 text-sm font-bold disabled:opacity-40" aria-label="Send">
                ↑
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
