"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { breathPatterns, meditations } from "@/lib/content";
import {
  AMBIENT_OPTIONS,
  AmbientKind,
  BELL_OPTIONS,
  BellStyle,
  playBell,
  playSoftTick,
  previewVoicePersona,
  setAmbientTrackVolume,
  speakCue,
  startAmbientTrack,
  stopAllAmbients,
  stopAmbientTrack,
  stopSpeech,
  unlockAudio,
  VOICE_PERSONAS,
  VoicePersonaId,
} from "@/lib/audio";
import { findTechniqueBySlug } from "@/lib/canon";
import { BreathingOrb } from "@/components/ui";
import { AgentDebrief } from "@/components/agent-widgets";
import { FoldHint } from "@/components/adaptive";
import { pushRecent, useLocalStorage, useToast, useWakeLock } from "@/components/chrome";

type Phase = "idle" | "prepare" | "sitting" | "paused" | "complete";

function PracticeInner() {
  const params = useSearchParams();
  const initialMinutes = Number(params.get("minutes") || "10");
  const initialTech = params.get("technique") || "anapanasati";
  const initialTab = params.get("tab") || "timer";
  const toast = useToast();

  const curatedSlugs = useMemo(() => new Set(meditations.map((m) => m.slug)), []);
  const [techniqueSlug, setTechniqueSlug] = useState(initialTech || "anapanasati");
  const [dbTech, setDbTech] = useState<{
    slug: string; name: string; pali: string | null; tradition: string; level: string;
    durations: number[]; description: string; essence: string; instructions: string[];
    benefits: string[]; source: string; color: string; symbol: string;
  } | null>(null);

  useEffect(() => {
    pushRecent(techniqueSlug);
    if (curatedSlugs.has(techniqueSlug)) {
      setDbTech(null);
      return;
    }
    let alive = true;
    const ctrl = new AbortController();
    fetch("/api/techniques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: techniqueSlug }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.technique) setDbTech(d.technique);
      })
      .catch(() => null);
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [techniqueSlug, curatedSlugs]);

  const meditation = useMemo(() => {
    const found = meditations.find((m) => m.slug === techniqueSlug);
    if (found) return found;
    const canonFound = findTechniqueBySlug(techniqueSlug);
    if (canonFound) {
      return {
        slug: canonFound.slug,
        name: canonFound.name,
        pali: canonFound.pali ?? "",
        tradition: canonFound.tradition as "Theravāda" | "Mahāyāna" | "Zen" | "Tibetan" | "All Traditions",
        level: canonFound.level as "Beginner" | "All Levels" | "Intermediate" | "Advanced",
        durations: canonFound.durations?.length ? canonFound.durations : [10, 20, 30],
        description: canonFound.description,
        essence: canonFound.essence,
        instructions: canonFound.instructions,
        cues: [
          { at: 0, text: "Arrive. Feel the body, the breath, the present moment." },
          { at: 0.3, text: canonFound.essence },
          { at: 0.6, text: "If lost in thought, return with kindness. Beginning again is the practice." },
          { at: 0.9, text: "Widen awareness. Breathe with the whole being." },
        ],
        benefits: canonFound.benefits,
        source: canonFound.source,
        color: canonFound.color,
        symbol: canonFound.symbol,
      };
    }
    if (dbTech) {
      return {
        slug: dbTech.slug,
        name: dbTech.name,
        pali: dbTech.pali ?? "",
        tradition: dbTech.tradition as "Theravāda" | "Mahāyāna" | "Zen" | "Tibetan" | "All Traditions",
        level: dbTech.level as "Beginner" | "All Levels" | "Intermediate" | "Advanced",
        durations: dbTech.durations?.length ? dbTech.durations : [10, 20, 30],
        description: dbTech.description,
        essence: dbTech.essence,
        instructions: dbTech.instructions,
        cues: [
          { at: 0, text: "Arrive. Feel the body, the breath, the present moment." },
          { at: 0.3, text: dbTech.essence },
          { at: 0.6, text: "If lost in thought, return with kindness. Beginning again is the practice." },
          { at: 0.9, text: "Widen awareness. Breathe with the whole being." },
        ],
        benefits: dbTech.benefits,
        source: dbTech.source,
        color: dbTech.color,
        symbol: dbTech.symbol,
      };
    }
    return meditations[0];
  }, [techniqueSlug, dbTech]);

  // Persisted prefs (instant, no server)
  const [minutes, setMinutes] = useState(initialMinutes >= 1 && initialMinutes <= 120 ? initialMinutes : 10);
  const [patternId, setPatternId] = useLocalStorage("bodhi-pattern", "anapana");
  const [intervalBells, setIntervalBells] = useLocalStorage("bodhi-bells", true);
  const [showBreath, setShowBreath] = useLocalStorage("bodhi-orb", true);
  const [soundOn, setSoundOn] = useLocalStorage("bodhi-sound", true);
  const [volume, setVolume] = useLocalStorage("bodhi-vol", 0.5);
  const [bellStyle, setBellStyle] = useLocalStorage<BellStyle>("bodhi-bell-style", "tibetan");
  const [ambientTrack1, setAmbientTrack1] = useLocalStorage<AmbientKind>("bodhi-ambient-t1", "rain");
  const [ambientTrack2, setAmbientTrack2] = useLocalStorage<AmbientKind>("bodhi-ambient-t2", "off");
  const [ambientVol1, setAmbientVol1] = useLocalStorage<number>("bodhi-ambient-vol1", 0.06);
  const [ambientVol2, setAmbientVol2] = useLocalStorage<number>("bodhi-ambient-vol2", 0.04);
  const [voicePersona, setVoicePersona] = useLocalStorage<VoicePersonaId>("bodhi-voice-persona", "ananda");
  const [voiceCues, setVoiceCues] = useLocalStorage("bodhi-voice", false);
  const [auditioningVoice, setAuditioningVoice] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [breathPulse, setBreathPulse] = useLocalStorage("bodhi-timer-breath-pulse", true);
  const [customOpen, setCustomOpen] = useState(false);

  const pattern = useMemo(
    () => breathPatterns.find((p) => p.id === patternId) ?? breathPatterns[0],
    [patternId]
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(minutes * 60);
  const [prepareCount, setPrepareCount] = useState(5);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(initialTab === "breath" ? "breath" : "timer");
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [debrief, setDebrief] = useState<string | null>(null);

  const totalSeconds = minutes * 60;
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rungRef = useRef<Set<number>>(new Set());
  const lastCueRef = useRef<string>("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useWakeLock(phase === "sitting");

  useEffect(() => {
    if (phase === "idle") setRemaining(totalSeconds);
  }, [totalSeconds, phase]);

  // unlock audio on first interaction (mobile policy)
  useEffect(() => {
    const fn = () => unlockAudio();
    window.addEventListener("pointerdown", fn, { once: true });
    return () => window.removeEventListener("pointerdown", fn);
  }, []);

  const elapsed = totalSeconds - remaining;
  const progress = totalSeconds ? elapsed / totalSeconds : 0;

  const currentCue = useMemo(() => {
    let cue = meditation.cues[0]?.text ?? "";
    for (const c of meditation.cues) {
      if (progress >= c.at) cue = c.text;
    }
    return cue;
  }, [progress, meditation]);

  // spoken cues (optional)
  useEffect(() => {
    if ((phase === "sitting" || phase === "paused") && voiceCues && currentCue !== lastCueRef.current) {
      lastCueRef.current = currentCue;
      speakCue(currentCue, true, voicePersona);
    }
    if (phase === "idle") lastCueRef.current = "";
  }, [currentCue, phase, voiceCues, voicePersona]);

  const clearTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    endAtRef.current = null;
  }, []);

  const finish = useCallback(() => {
    clearTick();
    setPhase("complete");
    stopAllAmbients();
    stopSpeech();
    if (soundOn) {
      playBell(9, volume, bellStyle);
      setTimeout(() => playBell(9, volume * 0.8, bellStyle), 2500);
      setTimeout(() => playBell(12, volume, bellStyle), 5500);
    }
    // agentic debrief (local, instant)
    const delta = moodBefore != null && moodAfter != null ? moodAfter - moodBefore : null;
    if (delta != null && delta > 0) setDebrief("🪷 Your heart brightened. What softened? Write one line so tomorrow's you remembers the way back.");
    else if (delta != null && delta < 0) setDebrief("🌧 Heavier now — that too is data, not failure. What weighed? Name it kindly; heaviness named loosens.");
    else setDebrief("✦ Sitting complete. One honest line: what did you notice in body, feeling, mind?");
  }, [clearTick, soundOn, volume, bellStyle, moodBefore, moodAfter]);

  const startSitting = useCallback(() => {
    setPhase("sitting");
    if (soundOn) playBell(7, volume, bellStyle);
    if (ambientTrack1 !== "off") startAmbientTrack(1, ambientTrack1, ambientVol1);
    if (ambientTrack2 !== "off") startAmbientTrack(2, ambientTrack2, ambientVol2);
    endAtRef.current = Date.now() + remaining * 1000;
    rungRef.current = new Set([0]);
  }, [soundOn, volume, bellStyle, ambientTrack1, ambientTrack2, ambientVol1, ambientVol2, remaining]);

  const begin = useCallback(() => {
    unlockAudio();
    setSaved(false);
    setDebrief(null);
    setMoodAfter(null);
    setNotes("");
    setRemaining(totalSeconds);
    rungRef.current = new Set();
    setPhase("prepare");
    setPrepareCount(5);
  }, [totalSeconds]);

  // prepare countdown
  useEffect(() => {
    if (phase !== "prepare") return;
    if (prepareCount <= 0) {
      startSitting();
      return;
    }
    if (soundOn && prepareCount <= 3) playSoftTick();
    const id = setTimeout(() => setPrepareCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, prepareCount, startSitting, soundOn]);

  // drift-corrected main timer (recalc from endAt, survives tab sleep)
  useEffect(() => {
    if (phase !== "sitting") return;
    if (!endAtRef.current) endAtRef.current = Date.now() + remaining * 1000;
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.round(((endAtRef.current ?? Date.now()) - Date.now()) / 1000));
      setRemaining(left);
      const frac = totalSeconds ? 1 - left / totalSeconds : 1;
      for (const q of [0.25, 0.5, 0.75]) {
        if (frac >= q && !rungRef.current.has(q)) {
          rungRef.current.add(q);
          if (intervalBells && soundOn) playBell(4, volume * 0.6, bellStyle);
        }
      }
      if (left <= 0) finish();
    }, 500);
    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, totalSeconds, intervalBells, soundOn, volume, bellStyle, finish, clearTick]);

  // pause keeps remaining; resume rebuilds endAt
  const pause = useCallback(() => {
    if (endAtRef.current) {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
    }
    clearTick();
    setPhase("paused");
    stopAllAmbients();
  }, [clearTick]);

  const resume = useCallback(() => {
    endAtRef.current = Date.now() + remaining * 1000;
    setPhase("sitting");
    if (ambientTrack1 !== "off") startAmbientTrack(1, ambientTrack1, ambientVol1);
    if (ambientTrack2 !== "off") startAmbientTrack(2, ambientTrack2, ambientVol2);
  }, [remaining, ambientTrack1, ambientTrack2, ambientVol1, ambientVol2]);

  const reset = useCallback(() => {
    clearTick();
    stopAllAmbients();
    stopSpeech();
    setPhase("idle");
    setRemaining(totalSeconds);
    rungRef.current = new Set();
  }, [clearTick, totalSeconds]);

  // Live multi-track adjustments during active sitting
  const handleTrackChange = useCallback((track: 1 | 2, kind: AmbientKind) => {
    unlockAudio();
    if (track === 1) {
      setAmbientTrack1(kind);
      if (phase === "sitting") {
        if (kind === "off") stopAmbientTrack(1);
        else startAmbientTrack(1, kind, ambientVol1);
      }
    } else {
      setAmbientTrack2(kind);
      if (phase === "sitting") {
        if (kind === "off") stopAmbientTrack(2);
        else startAmbientTrack(2, kind, ambientVol2);
      }
    }
  }, [phase, ambientVol1, ambientVol2, setAmbientTrack1, setAmbientTrack2]);

  const handleTrackVolume = useCallback((track: 1 | 2, val: number) => {
    if (track === 1) {
      setAmbientVol1(val);
      if (phase === "sitting" && ambientTrack1 !== "off") {
        setAmbientTrackVolume(1, val);
      }
    } else {
      setAmbientVol2(val);
      if (phase === "sitting" && ambientTrack2 !== "off") {
        setAmbientTrackVolume(2, val);
      }
    }
  }, [phase, ambientTrack1, ambientTrack2, setAmbientVol1, setAmbientVol2]);

  const applyHarmonyPreset = useCallback((t1: AmbientKind, t2: AmbientKind, v1 = 0.06, v2 = 0.04) => {
    unlockAudio();
    setAmbientTrack1(t1);
    setAmbientTrack2(t2);
    setAmbientVol1(v1);
    setAmbientVol2(v2);
    if (phase === "sitting") {
      stopAllAmbients();
      if (t1 !== "off") startAmbientTrack(1, t1, v1);
      if (t2 !== "off") startAmbientTrack(2, t2, v2);
    }
  }, [phase, setAmbientTrack1, setAmbientTrack2, setAmbientVol1, setAmbientVol2]);

  // keyboard: Space pause/resume, F focus, M mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space" && (phase === "sitting" || phase === "paused" || phase === "idle")) {
        e.preventDefault();
        if (phase === "sitting") pause();
        else if (phase === "paused") resume();
        else begin();
      }
      if (e.key.toLowerCase() === "f") setFocusMode((v) => !v);
      if (e.key.toLowerCase() === "m") setSoundOn(!soundOn);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, pause, resume, begin, soundOn, setSoundOn]);

  // breath guide cycler
  useEffect(() => {
    if (!breathActive) return;
    const seq: { label: string; dur: number }[] = [
      { label: `Inhale · ${pattern.inhale}`, dur: pattern.inhale * 1000 },
      ...(pattern.holdIn ? [{ label: `Hold · ${pattern.holdIn}`, dur: pattern.holdIn * 1000 }] : []),
      { label: `Exhale · ${pattern.exhale}`, dur: pattern.exhale * 1000 },
      ...(pattern.holdOut ? [{ label: `Rest · ${pattern.holdOut}`, dur: pattern.holdOut * 1000 }] : []),
    ];
    let i = 0;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (!alive) return;
      setBreathPhase(seq[i % seq.length].label);
      timer = setTimeout(() => {
        i++;
        step();
      }, seq[i % seq.length].dur);
    };
    step();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [breathActive, pattern]);

  const saveSession = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technique: techniqueSlug,
          title: meditation.name,
          durationSeconds: phase === "complete" ? totalSeconds : Math.max(30, elapsed),
          completed: phase === "complete",
          moodBefore,
          moodAfter,
          notes,
        }),
      });
      if (res.ok) {
        setSaved(true);
        toast("✦ Sitting saved to your Journey");
      } else toast("Could not save — offline?", "info");
    } catch {
      toast("Could not save — offline?", "info");
    } finally {
      setSaving(false);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.();
      else document.exitFullscreen?.();
    } catch {}
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const R = 120;
  const C = 2 * Math.PI * R;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-5 md:py-10" ref={wrapRef}>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">The Meditation Hall</p>
        <div className="mt-2 flex justify-center"><FoldHint /></div>
        <h1 className="font-display mt-2 text-balance text-4xl font-semibold md:text-5xl">Settle in. The bowl will call you.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-stone-600">
          Bowl synthesized live · drift-proof timer · wake-lock · dual-track ambient mixer · spoken cues · focus mode.
          Keys: <kbd className="rounded bg-stone-900/8 px-1.5 font-mono text-xs">Space</kbd> pause · <kbd className="rounded bg-stone-900/8 px-1.5 font-mono text-xs">F</kbd> focus · <kbd className="rounded bg-stone-900/8 px-1.5 font-mono text-xs">M</kbd> mute
        </p>
        <div className="mt-5 inline-flex rounded-full border border-amber-900/15 bg-white p-1">
          {(["timer", "breath"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${tab === t ? "bg-stone-900 text-amber-50" : "text-stone-600 hover:text-stone-900"}`}
            >
              {t === "timer" ? "🔔 Sitting Timer" : "🌬 Breath Guide"}
            </button>
          ))}
        </div>
      </div>

      {tab === "breath" ? (
        <section className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-amber-900/10 bg-[#1c1917] p-8 text-center text-stone-200 shadow-xl">
            <BreathingOrb pattern={pattern} phase={breathPhase} active={breathActive} />
            <button
              onClick={() => { unlockAudio(); setBreathActive((v) => !v); }}
              className={`mt-6 rounded-full px-8 py-3 text-sm font-bold transition ${breathActive ? "bg-white/10 text-amber-200 hover:bg-white/20" : "bg-amber-500 text-stone-950 hover:bg-amber-400"}`}
            >
              {breathActive ? "❚❚ Pause breath" : "▶ Begin breathing"}
            </button>
            <p className="mt-3 text-xs text-stone-400">Orb expands on inhale, contracts on exhale.</p>
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-7">
            <h3 className="font-display text-2xl font-semibold">Choose a rhythm</h3>
            <div className="mt-4 space-y-3">
              {breathPatterns.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPatternId(p.id)}
                  aria-pressed={patternId === p.id}
                  className={`w-full rounded-2xl border p-4 text-left transition ${patternId === p.id ? "border-amber-700 bg-amber-50 shadow" : "border-stone-200 hover:border-amber-600/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-stone-900">{p.name}</p>
                    <span className="rounded-full bg-stone-900 px-3 py-1 text-[0.7rem] font-bold text-amber-100">{p.cycles}</span>
                  </div>
                  {p.pali && <p className="text-xs italic text-amber-800">{p.pali}</p>}
                  <p className="mt-1 text-[0.83rem] text-stone-600">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className={`practice-grid mx-auto mt-8 grid max-w-6xl gap-6 ${focusMode ? "lg:grid-cols-[1fr]" : "lg:grid-cols-[340px_1fr_300px]"}`}>
          {/* LEFT */}
          {!focusMode && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Practice</h3>
                  <Link href="/library" className="text-[0.7rem] font-bold text-amber-700 hover:underline">1,040+ →</Link>
                </div>
                {!meditations.some((m) => m.slug === techniqueSlug) && (
                  <div className="mt-3 rounded-2xl border border-amber-700 bg-amber-50 p-3">
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-amber-800">From the canon</p>
                    <p className="text-sm font-bold text-stone-900">{meditation.name}</p>
                    <p className="text-xs text-stone-500">{meditation.pali}</p>
                    <Link href={`/library/${techniqueSlug}`} className="text-xs font-bold text-amber-800 hover:underline">Study →</Link>
                  </div>
                )}
                <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {meditations.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => phase === "idle" && setTechniqueSlug(m.slug)}
                      disabled={phase !== "idle"}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${techniqueSlug === m.slug ? "border-amber-700 bg-amber-50" : "border-stone-200 hover:border-amber-600/40"} ${phase !== "idle" ? "opacity-60" : ""}`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm text-white" style={{ background: m.color }}>
                        {m.symbol === " footsteps " ? "👣" : m.symbol}
                      </span>
                      <span>
                        <span className="block text-[0.83rem] font-bold text-stone-900">{m.name}</span>
                        <span className="block text-[0.7rem] text-stone-500">{m.pali} · {m.level}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Duration</h3>
                <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label="Duration minutes">
                  {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      disabled={phase !== "idle"}
                      onClick={() => setMinutes(m)}
                      aria-pressed={minutes === m}
                      className={`rounded-xl border py-2 text-sm font-bold transition ${minutes === m ? "border-stone-900 bg-stone-900 text-amber-50" : "border-stone-200 hover:border-amber-600"} ${phase !== "idle" ? "opacity-60" : ""}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCustomOpen((v) => !v)} className="mt-3 text-xs font-bold text-amber-800 underline underline-offset-2">
                  {customOpen ? "Hide custom" : "Custom duration…"}
                </button>
                {customOpen && (
                  <div className="mt-2">
                    <input type="range" min={2} max={90} value={minutes} disabled={phase !== "idle"} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-amber-700" aria-label="Custom minutes" />
                    <p className="text-center text-sm font-bold tabular-nums">{minutes} minutes</p>
                  </div>
                )}
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2">
                    <span className="font-medium text-stone-700">Sound enabled</span>
                    <input
                      type="checkbox"
                      checked={soundOn}
                      onChange={(e) => setSoundOn(e.target.checked)}
                      className="h-4 w-4 accent-amber-700"
                    />
                  </div>

                  {/* Bell Selection */}
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[0.72rem] font-bold uppercase tracking-wider text-amber-900">
                        🔔 Sacred Bell
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          playBell(5, volume, bellStyle);
                        }}
                        className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[0.7rem] font-bold text-amber-900 transition hover:bg-amber-500/25"
                      >
                        ♪ Test Bell
                      </button>
                    </div>
                    <select
                      value={bellStyle}
                      onChange={(e) => setBellStyle(e.target.value as BellStyle)}
                      className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 shadow-sm focus:border-amber-600 focus:outline-none"
                    >
                      {BELL_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[0.7rem] text-stone-500">
                      {BELL_OPTIONS.find((b) => b.id === bellStyle)?.description}
                    </p>
                  </div>

                  {/* iOS / Mobile Sound Guidance */}
                  <div className="rounded-xl border border-amber-900/10 bg-amber-50/80 p-2.5 text-[0.7rem] text-stone-600">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <span>📱</span>
                      <span>iPhone & iPad Sound Tip</span>
                    </div>
                    <p className="mt-0.5 leading-relaxed text-stone-600">
                      Ensure your side Silent/Mute switch is turned off (unmuted, no orange line) and volume is up so iOS allows bell chimes to ring.
                    </p>
                  </div>

                  {/* Multi-Track Ambient Soundscape Mixer */}
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🌧</span>
                        <label className="text-[0.72rem] font-bold uppercase tracking-wider text-amber-900">
                          Dual-Track Ambient Mixer
                        </label>
                      </div>
                      <span className="text-[0.65rem] font-semibold text-stone-500">
                        {ambientTrack1 !== "off" || ambientTrack2 !== "off" ? "2-Track Layering" : "Silent Sitting"}
                      </span>
                    </div>

                    {/* Quick Harmony Presets */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-wider text-stone-500">
                        <span>Harmony Blends</span>
                        <span className="text-amber-800 font-normal">One-tap pairings</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => applyHarmonyPreset("rain", "forest", 0.07, 0.04)}
                          className={`rounded-lg px-2 py-1 text-[0.66rem] font-bold transition ${
                            ambientTrack1 === "rain" && ambientTrack2 === "forest"
                              ? "bg-amber-800 text-amber-100 shadow-xs"
                              : "border border-stone-200/80 bg-white text-stone-600 hover:border-amber-400"
                          }`}
                        >
                          🌧🌲 Rain + Forest
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHarmonyPreset("creek", "om_drone", 0.06, 0.05)}
                          className={`rounded-lg px-2 py-1 text-[0.66rem] font-bold transition ${
                            ambientTrack1 === "creek" && ambientTrack2 === "om_drone"
                              ? "bg-amber-800 text-amber-100 shadow-xs"
                              : "border border-stone-200/80 bg-white text-stone-600 hover:border-amber-400"
                          }`}
                        >
                          🌊☸ Stream + 432Hz Om
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHarmonyPreset("noise", "rain", 0.05, 0.04)}
                          className={`rounded-lg px-2 py-1 text-[0.66rem] font-bold transition ${
                            ambientTrack1 === "noise" && ambientTrack2 === "rain"
                              ? "bg-amber-800 text-amber-100 shadow-xs"
                              : "border border-stone-200/80 bg-white text-stone-600 hover:border-amber-400"
                          }`}
                        >
                          🟤🌧 Brown Noise + Rain
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHarmonyPreset("off", "off", 0.05, 0.04)}
                          className={`rounded-lg px-2 py-1 text-[0.66rem] font-bold transition ${
                            ambientTrack1 === "off" && ambientTrack2 === "off"
                              ? "bg-stone-900 text-white shadow-xs"
                              : "border border-stone-200/80 bg-white text-stone-500 hover:border-amber-400"
                          }`}
                        >
                          🔇 Silence
                        </button>
                      </div>
                    </div>

                    {/* Track 1: Base Layer */}
                    <div className="mt-3.5 rounded-xl border border-stone-200/90 bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-amber-950">
                          <span className="grid h-4 w-4 place-items-center rounded bg-amber-100 text-[0.6rem] text-amber-800 font-bold">1</span>
                          <span>Layer 1 · Base Atmosphere</span>
                        </div>
                        <span className="text-[0.65rem] font-bold text-amber-800 capitalize">
                          {AMBIENT_OPTIONS.find((a) => a.id === ambientTrack1)?.name}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1">
                        {AMBIENT_OPTIONS.map((a) => (
                          <button
                            key={`t1-${a.id}`}
                            type="button"
                            onClick={() => handleTrackChange(1, a.id)}
                            className={`rounded-lg px-1.5 py-1 text-center text-[0.65rem] font-bold transition ${
                              ambientTrack1 === a.id
                                ? "bg-stone-900 text-amber-100 shadow-xs ring-1 ring-amber-400/50"
                                : "border border-stone-200 bg-stone-50/50 text-stone-600 hover:border-amber-500/40"
                            }`}
                          >
                            {a.name}
                          </button>
                        ))}
                      </div>

                      {ambientTrack1 !== "off" && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[0.62rem] font-semibold text-stone-400">Vol</span>
                          <input
                            type="range"
                            min="0.01"
                            max="0.15"
                            step="0.005"
                            value={ambientVol1}
                            onChange={(e) => handleTrackVolume(1, parseFloat(e.target.value))}
                            className="h-1.5 flex-1 cursor-pointer accent-amber-600"
                            aria-label="Layer 1 ambient volume"
                          />
                          <span className="w-8 text-right font-mono text-[0.62rem] font-bold text-stone-500">
                            {Math.round((ambientVol1 / 0.15) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Track 2: Texture & Harmony Layer */}
                    <div className="mt-2.5 rounded-xl border border-stone-200/90 bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-amber-950">
                          <span className="grid h-4 w-4 place-items-center rounded bg-amber-100 text-[0.6rem] text-amber-800 font-bold">2</span>
                          <span>Layer 2 · Texture &amp; Harmony</span>
                        </div>
                        <span className="text-[0.65rem] font-bold text-amber-800 capitalize">
                          {AMBIENT_OPTIONS.find((a) => a.id === ambientTrack2)?.name}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1">
                        {AMBIENT_OPTIONS.map((a) => (
                          <button
                            key={`t2-${a.id}`}
                            type="button"
                            onClick={() => handleTrackChange(2, a.id)}
                            className={`rounded-lg px-1.5 py-1 text-center text-[0.65rem] font-bold transition ${
                              ambientTrack2 === a.id
                                ? "bg-stone-900 text-amber-100 shadow-xs ring-1 ring-amber-400/50"
                                : "border border-stone-200 bg-stone-50/50 text-stone-600 hover:border-amber-500/40"
                            }`}
                          >
                            {a.name}
                          </button>
                        ))}
                      </div>

                      {ambientTrack2 !== "off" && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[0.62rem] font-semibold text-stone-400">Vol</span>
                          <input
                            type="range"
                            min="0.01"
                            max="0.15"
                            step="0.005"
                            value={ambientVol2}
                            onChange={(e) => handleTrackVolume(2, parseFloat(e.target.value))}
                            className="h-1.5 flex-1 cursor-pointer accent-amber-600"
                            aria-label="Layer 2 ambient volume"
                          />
                          <span className="w-8 text-right font-mono text-[0.62rem] font-bold text-stone-500">
                            {Math.round((ambientVol2 / 0.15) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice Persona */}
                  <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-amber-900">
                        <input
                          type="checkbox"
                          checked={voiceCues}
                          onChange={(e) => setVoiceCues(e.target.checked)}
                          className="h-3.5 w-3.5 accent-amber-700"
                        />
                        <span>🗣 Spoken Dhamma Cues</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          setAuditioningVoice(true);
                          previewVoicePersona(voicePersona);
                          setTimeout(() => setAuditioningVoice(false), 3000);
                        }}
                        className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[0.7rem] font-bold text-amber-900 transition hover:bg-amber-500/25"
                      >
                        {auditioningVoice ? "Speaking…" : "♪ Audition"}
                      </button>
                    </div>
                    <select
                      value={voicePersona}
                      disabled={!voiceCues}
                      onChange={(e) => setVoicePersona(e.target.value as VoicePersonaId)}
                      className={`mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 shadow-sm focus:border-amber-600 focus:outline-none ${
                        !voiceCues ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {VOICE_PERSONAS.map((vp) => (
                        <option key={vp.id} value={vp.id}>
                          {vp.name} · {vp.subtitle}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[0.7rem] text-stone-500 italic">
                      “{VOICE_PERSONAS.find((vp) => vp.id === voicePersona)?.sampleText}”
                    </p>
                  </div>

                  {/* Helpers: Bells & Orb */}
                  <div className="flex gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-xs">
                      <span>🔔 Intervals</span>
                      <input
                        type="checkbox"
                        checked={intervalBells}
                        onChange={(e) => setIntervalBells(e.target.checked)}
                        className="h-3.5 w-3.5 accent-amber-700"
                      />
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-xs">
                      <span>🌬 Breath orb</span>
                      <input
                        type="checkbox"
                        checked={showBreath}
                        onChange={(e) => setShowBreath(e.target.checked)}
                        className="h-3.5 w-3.5 accent-amber-700"
                      />
                    </label>
                  </div>

                  {/* Volume Slider */}
                  <label className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2 text-xs">
                    <span className="font-medium text-stone-700">Volume</span>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-amber-700"
                      aria-label="Sound volume"
                    />
                    <span className="w-8 text-right font-mono text-[0.7rem] text-stone-500">
                      {Math.round(volume * 100)}%
                    </span>
                  </label>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Heart right now?</p>
                  <div className="mt-2 flex gap-1.5" role="group" aria-label="Mood before">
                    {["😣", "😟", "😐", "🙂", "😊"].map((e, i) => (
                      <button
                        key={e}
                        onClick={() => setMoodBefore(i + 1)}
                        aria-pressed={moodBefore === i + 1}
                        className={`rounded-xl border px-2 py-1.5 text-lg transition ${
                          moodBefore === i + 1
                            ? "scale-110 border-amber-700 bg-amber-100"
                            : "border-stone-200 hover:border-amber-500"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CENTER */}
          <div
            className={`overflow-hidden rounded-[2rem] border border-amber-900/15 bg-[#1c1917] text-center text-stone-200 shadow-[0_30px_80px_rgba(28,25,23,0.35)] transition-all duration-700 ${
              (phase === "sitting" || phase === "paused") && breathPulse
                ? "animate-timer-breath"
                : ""
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="text-left">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-amber-500">{meditation.pali}</p>
                <h2 className="font-display text-xl font-semibold leading-tight text-amber-50 md:text-2xl">{meditation.name}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBreathPulse((v) => !v)}
                  className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
                    breathPulse
                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                      : "bg-white/10 text-stone-400 hover:bg-white/15"
                  }`}
                  aria-pressed={breathPulse}
                  title="4-4-4-4 Box Breathing visual guide (subtly expands and settles container)"
                >
                  <span className={breathPulse ? "animate-pulse mr-1" : "mr-1 opacity-60"}>🫁</span>
                  4-4-4-4
                </button>
                <button onClick={() => setFocusMode((v) => !v)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Toggle focus mode" title="Focus (F)">{focusMode ? "◧ exit" : "◧ focus"}</button>
                <button onClick={toggleFullscreen} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20" aria-label="Fullscreen">⛶</button>
              </div>
            </div>
            <p className="font-display px-6 pt-3 text-sm italic text-stone-400">“{meditation.essence}”</p>

            <div className="relative px-6 py-6">
              {phase === "prepare" ? (
                <div className="py-10" role="status">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">Settling…</p>
                  <p className="font-display mt-2 text-[6rem] font-semibold tabular-nums leading-none text-amber-100">{prepareCount}</p>
                  <p className="mt-3 text-sm text-stone-400">Spine tall. Face soft. Arrive.</p>
                </div>
              ) : phase === "complete" ? (
                <div className="py-4">
                  <p className="text-5xl" aria-hidden>🪷</p>
                  <h3 className="font-display mt-3 text-3xl font-semibold text-amber-100">Sādhu! Complete.</h3>
                  {debrief && <p className="mx-auto mt-2 max-w-sm text-sm italic text-amber-200/90">{debrief}</p>}
                  <div className="mx-auto mt-2 max-w-sm">
                    <AgentDebrief
                      techniqueName={meditation.name}
                      minutes={Math.round((phase === "complete" ? totalSeconds : elapsed) / 60)}
                      moodBefore={moodBefore}
                      moodAfter={moodAfter}
                      visible={phase === "complete"}
                    />
                  </div>
                  <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-white/5 p-5 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Heart now?</p>
                    <div className="mt-2 flex gap-1.5" role="group" aria-label="Mood after">
                      {["😣", "😟", "😐", "🙂", "😊"].map((e, i) => (
                        <button key={e} onClick={() => setMoodAfter(i + 1)} aria-pressed={moodAfter === i + 1} className={`rounded-xl border px-2 py-1.5 text-xl transition ${moodAfter === i + 1 ? "scale-110 border-amber-400 bg-amber-400/20" : "border-white/15 hover:border-amber-400"}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A few words… (saved to Journey)" className="mt-3 w-full rounded-xl border border-white/15 bg-transparent p-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none" rows={3} aria-label="Session notes" />
                    {!saved ? (
                      <button onClick={saveSession} disabled={saving} className="mt-3 w-full rounded-full bg-amber-500 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400 disabled:opacity-50">
                        {saving ? "Saving…" : "✦ Save this sitting"}
                      </button>
                    ) : (
                      <div className="mt-3 rounded-xl bg-emerald-500/15 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
                        ✓ Saved. <Link href="/journey" className="underline">View Journey →</Link>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex justify-center gap-3">
                    <button onClick={reset} className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold hover:border-amber-400">Sit again</button>
                    <Link href="/journal" className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold hover:bg-white/20">Journal →</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative mx-auto" style={{ width: 280, height: 280 }} role="timer" aria-label={`${fmt(remaining)} remaining`}>
                    <svg width="280" height="280" className="-rotate-90" aria-hidden>
                      <circle cx="140" cy="140" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
                      <circle cx="140" cy="140" r={R} stroke="url(#gold)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: "stroke-dashoffset 0.5s linear" }} />
                      <defs>
                        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <div>
                        <p className="font-display text-6xl font-semibold tabular-nums text-amber-50">{fmt(remaining)}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
                          {phase === "paused" ? "❚❚ Paused" : phase === "sitting" ? "● Sitting" : `${minutes} min · ready`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {showBreath && (phase === "sitting" || phase === "paused") && (
                    <div className="mx-auto -mt-2 mb-2 scale-[0.55] opacity-80" aria-hidden>
                      <BreathingOrb pattern={pattern} phase={phase === "paused" ? "Paused" : breathPhase} active={phase === "sitting"} />
                    </div>
                  )}
                  <div className="mx-auto mt-2 max-w-md rounded-2xl bg-white/5 px-5 py-4" aria-live="polite">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-amber-500">Dhamma cue</p>
                    <p className="font-display mt-1 text-lg italic leading-snug text-stone-100">“{currentCue}”</p>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {phase === "idle" && (
                      <button onClick={begin} className="rounded-full bg-amber-500 px-10 py-3.5 text-sm font-bold text-stone-950 shadow-lg transition hover:bg-amber-400">
                        🔔 Begin {minutes}-minute sit
                      </button>
                    )}
                    {phase === "sitting" && (
                      <>
                        <button onClick={pause} className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold hover:border-amber-400">❚❚ Pause</button>
                        <button onClick={() => { if (soundOn) playBell(4, volume * 0.6, bellStyle); reset(); }} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-stone-400 hover:text-stone-200">End</button>
                      </>
                    )}
                    {phase === "paused" && (
                      <>
                        <button onClick={resume} className="rounded-full bg-amber-500 px-8 py-3 text-sm font-bold text-stone-950 hover:bg-amber-400">▶ Resume</button>
                        <button onClick={reset} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold">Reset</button>
                        <button onClick={finish} className="rounded-full border border-emerald-400/50 px-6 py-3 text-sm font-semibold text-emerald-300">Complete ✓</button>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudio();
                        if (soundOn) playBell(5, volume, bellStyle);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-white/20 hover:text-amber-100"
                    >
                      <span>🔔 Tap to Test Sound</span>
                    </button>
                    <span className="text-[0.72rem] text-stone-500">Space pauses · F focuses</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {!focusMode && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">How to sit</h3>
                <ol className="mt-3 space-y-2.5">
                  {meditation.instructions.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.82rem] leading-relaxed text-stone-600">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-900/10 text-[0.65rem] font-bold text-amber-900">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs italic text-amber-900">📜 {meditation.source}</p>
              </div>
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Benefits</h3>
                <ul className="mt-2 space-y-1.5 text-[0.83rem] text-stone-600">
                  {meditation.benefits.map((b) => <li key={b}>✦ {b}</li>)}
                </ul>
                <Link href={`/library/${meditation.slug}`} className="mt-3 inline-block text-xs font-bold text-amber-800 hover:underline">
                  Read full guide →
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-5 py-20 text-center text-stone-500">Preparing the hall…</main>}>
      <PracticeInner />
    </Suspense>
  );
}
