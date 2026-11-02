"use client";

import { useState } from "react";
import Link from "next/link";

type Rec = {
  slug: string; name: string; tradition: string; category: string;
  durations: number[]; essence: string; color: string; symbol: string; reason: string;
};

export default function TodayPath() {
  const [minutes, setMinutes] = useState(10);
  const [mood, setMood] = useState("anxious");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I feel ${mood}, I have ${minutes} minutes, plan my sit`,
          context: { minutes, mood },
        }),
      });
      const data = await res.json();
      setReply(data.reply ?? null);
      setRecs(data.recommendations ?? []);
    } catch {
      setReply("The canon is quiet right now — try Ānāpānasati for 10 minutes. 🙏");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-strong squircle-lg overflow-hidden">
      <div className="p-6 md:p-8">
        <p className="liquid-chip pill inline-flex px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[var(--accent)]">✦ Agentic · Today&apos;s Path</p>
        <h3 className="font-display ios-title mt-3 text-2xl md:text-3xl">
          Answer two questions. Receive a path.
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="block">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Minutes you have</span>
            <div className="liquid-segment mt-2" role="group" aria-label="Minutes">
              {[5, 10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  aria-pressed={minutes === m}
                  className={`pressable pill px-4 py-2 text-sm font-bold transition ${minutes === m ? "bg-[var(--ink)] text-[var(--bg)] shadow-lg" : "opacity-70 hover:opacity-100"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Weather of the heart</span>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="liquid-field pill mt-2 w-full px-4 py-2.5 text-sm outline-none"
            >
              {["anxious", "stressed", "restless", "dull", "distracted", "angry", "sad", "grief", "focus", "compassion", "sleep", "grateful", "doubt"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={loading}
              className="liquid-prominent pressable pill w-full px-7 py-3 text-sm font-bold disabled:opacity-50 md:w-auto"
            >
              {loading ? "☸ consulting…" : "Reveal my path ✦"}
            </button>
          </div>
        </div>

        {reply && (
          <div className="animate-fade-up mt-5 rounded-2xl bg-white/5 p-5">
            <p className="text-sm italic leading-relaxed text-stone-200">“{reply}”</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {recs.slice(0, 3).map((r, i) => (
                <div key={r.slug} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-base text-white" style={{ background: r.color }}>{r.symbol}</span>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-400">Step {i + 1} · {r.category}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-snug text-amber-50">{r.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs italic text-stone-400">“{r.essence}”</p>
                  <div className="mt-3 flex gap-1.5">
                    <Link href={`/practice?technique=${r.slug}&minutes=${minutes}`} className="flex-1 rounded-full bg-amber-500 py-1.5 text-center text-xs font-bold text-stone-950 hover:bg-amber-400">
                      Sit {minutes}m
                    </Link>
                    <Link href={`/library/${r.slug}`} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold hover:border-amber-400">
                      Study
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
