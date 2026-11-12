// Bodhi Sanctuary — Premium Synthesized Audio Engine & Guided Voices
// Web Audio API synthesized sacred instruments, organic ambient soundscapes & Web Speech voice personas
// Fully optimized for iOS Safari (mobile WebKit), Android Chrome & desktop browsers

let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;
let isAudioUnlocked = false;
let silentAudioEl: HTMLAudioElement | null = null;

// Tiny 44-byte silent WAV data URI to unlock and promote iOS audio session category
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

/**
 * Ensures a single shared AudioContext, initialized with iOS WebKit fallbacks.
 */
export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Bulletproof unlock function for iOS Safari and mobile browsers.
 * Plays a 1-sample silent WebAudio buffer and a silent HTML5 audio element
 * synchronously inside a user gesture call-stack.
 */
export function unlockAudio(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const ac = getAudioContext();
    if (ac) {
      if (ac.state === "suspended") {
        void ac.resume().catch(() => {});
      }
      // Prime Web Audio hardware via a silent buffer source
      try {
        const buf = ac.createBuffer(1, 1, 22050);
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.connect(ac.destination);
        src.start(0);
      } catch {}
    }

    // Prime HTML5 Audio element for iOS audio session promotion
    if (!silentAudioEl) {
      try {
        silentAudioEl = new Audio(SILENT_WAV);
        silentAudioEl.preload = "auto";
        silentAudioEl.setAttribute("playsinline", "true");
      } catch {}
    }
    if (silentAudioEl) {
      silentAudioEl.play().catch(() => {});
    }

    // Prime Web Speech API for iOS Safari voice cues
    if ("speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}
    }

    isAudioUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

// Auto-register touch/click unlock listener on client load
if (typeof window !== "undefined") {
  const events = ["touchstart", "touchend", "pointerdown", "mousedown", "click", "keydown"];
  const handleFirstInteraction = () => {
    unlockAudio();
    if (isAudioUnlocked) {
      events.forEach((ev) => window.removeEventListener(ev, handleFirstInteraction, true));
    }
  };
  events.forEach((ev) => {
    window.addEventListener(ev, handleFirstInteraction, { capture: true, passive: true });
  });
}

export type BellStyle = "tibetan" | "temple_gong" | "tingsha" | "mokugyo" | "chimes";

export const BELL_OPTIONS: { id: BellStyle; name: string; description: string; previewNote: string }[] = [
  { id: "tibetan", name: "Tibetan Singing Bowl (432Hz)", description: "Warm harmonic brass resonance with healing overtone shimmer", previewNote: "432 Hz" },
  { id: "temple_gong", name: "Kyoto Temple Bell (Kansho)", description: "Deep, solemn bronze bell with lingering sub-bass decay", previewNote: "108 Hz" },
  { id: "tingsha", name: "Tingsha Monastic Cymbals", description: "Crystal-clear pure high frequency with gentle binaural beating", previewNote: "2400 Hz" },
  { id: "mokugyo", name: "Zen Temple Mokugyo (Fish Drum)", description: "Warm hollow wooden percussion for mindful pacing", previewNote: "Wood" },
  { id: "chimes", name: "Himalayan Wind Chimes", description: "Delicate pentatonic shimmer in mountain breeze", previewNote: "Chimes" },
];

/**
 * Synthesizes a sacred contemplative bell with harmonic partials.
 * Handles iOS suspended audio context asynchronously so delayed bells (e.g. after countdown)
 * always sound reliably.
 */
export function playBell(
  duration = 7,
  volume = 0.5,
  freqOrStyle: number | BellStyle = 432,
  styleArg?: BellStyle
) {
  try {
    const ac = getAudioContext();
    if (!ac) return;

    // If context is suspended (common on iOS when timer fires outside gesture),
    // resume and immediately execute once active.
    if (ac.state === "suspended") {
      void ac.resume().then(() => {
        playBell(duration, volume, freqOrStyle, styleArg);
      }).catch(() => {});
      return;
    }

    const safeVolume = Math.max(0.01, Math.min(1.0, volume));
    const now = ac.currentTime;
    const t = Math.max(now, 0.001) + 0.03;

    let baseFreq = 432;
    let style: BellStyle = "tibetan";
    if (typeof freqOrStyle === "string") {
      style = freqOrStyle as BellStyle;
    } else if (typeof freqOrStyle === "number") {
      baseFreq = freqOrStyle;
      if (styleArg) style = styleArg;
    }

    if (style === "tingsha") {
      // High pure frequency with gentle binaural beating (2400Hz & 2415Hz)
      const freqs = [2400, 2415, 4805];
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, safeVolume * 0.75), t + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 5));
      master.connect(ac.destination);

      for (const f of freqs) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 4.8);
      }
      return;
    }

    if (style === "temple_gong") {
      // Kyoto deep bell: 108Hz fundamental + sub-harmonics
      const gongPartials: [number, number][] = [
        [0.5, 0.45],
        [1, 1],
        [1.33, 0.35],
        [1.85, 0.28],
        [2.42, 0.15],
      ];
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, safeVolume * 0.95), t + 0.04);
      master.gain.exponentialRampToValueAtTime(0.0001, t + duration * 1.3);
      master.connect(ac.destination);

      for (const [ratio, amp] of gongPartials) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = ratio < 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(108 * ratio, now);
        g.gain.setValueAtTime(amp, now);
        g.gain.exponentialRampToValueAtTime(0.0001, t + duration * (0.8 + 0.3 * Math.random()));
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + duration * 1.4);
      }
      return;
    }

    if (style === "mokugyo") {
      // Wooden block percussive click + hollow cavity
      const click = ac.createOscillator();
      const clickGain = ac.createGain();
      click.type = "sine";
      click.frequency.setValueAtTime(540, now);
      click.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.setValueAtTime(safeVolume * 0.9, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      click.connect(clickGain);
      clickGain.connect(ac.destination);
      click.start(t);
      click.stop(t + 0.3);

      const resonance = ac.createOscillator();
      const resGain = ac.createGain();
      resonance.type = "triangle";
      resonance.frequency.setValueAtTime(320, now);
      resGain.gain.setValueAtTime(0.0001, now);
      resGain.gain.setValueAtTime(safeVolume * 0.45, t);
      resGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      resonance.connect(resGain);
      resGain.connect(ac.destination);
      resonance.start(t);
      resonance.stop(t + 0.6);
      return;
    }

    if (style === "chimes") {
      // Himalayan wind chime cascade
      const notes = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
      notes.forEach((freq, idx) => {
        const delay = t + idx * 0.12 + Math.random() * 0.05;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.setValueAtTime(0.0001, delay);
        g.gain.exponentialRampToValueAtTime(safeVolume * 0.35, delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, delay + 3.5);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start(delay);
        osc.stop(delay + 3.8);
      });
      return;
    }

    // Default: Tibetan Singing Bowl (432Hz)
    const partials: [number, number][] = [
      [1, 1],
      [2.01, 0.48],
      [2.74, 0.32],
      [3.76, 0.24],
      [5.4, 0.14],
    ];
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.001, safeVolume), t + 0.035);
    master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    master.connect(ac.destination);

    for (const [ratio, amp] of partials) {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      const g = ac.createGain();
      g.gain.setValueAtTime(amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration * (0.65 + 0.3 * Math.random()));
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.frequency.linearRampToValueAtTime(baseFreq * ratio * 1.002, t + duration);
      osc.stop(t + duration + 0.1);
    }
  } catch {
    /* ignore */
  }
}

export function playSoftTick(freq = 880, vol = 0.08) {
  try {
    const ac = getAudioContext();
    if (!ac) return;
    if (ac.state === "suspended") {
      void ac.resume();
      return;
    }
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    /* noop */
  }
}

export type AmbientKind = "off" | "rain" | "creek" | "forest" | "noise" | "om_drone";

export const AMBIENT_OPTIONS: { id: AmbientKind; name: string; description: string }[] = [
  { id: "off", name: "Silence", description: "Quiet sitting without ambient accompaniment" },
  { id: "rain", name: "Monastery Rain", description: "Gentle rain on temple eaves with rolling calm" },
  { id: "creek", name: "Bamboo Forest Creek", description: "Soft natural water flowing over river stones" },
  { id: "forest", name: "Night Hermitage", description: "Subtle forest night shimmer and evening breeze" },
  { id: "noise", name: "Deep Brown Noise", description: "Warm grounding ocean swell for anxious minds" },
  { id: "om_drone", name: "432Hz Om Solfeggio Drone", description: "Subtle harmonic binaural drone for deep samadhi" },
];

export interface AmbientTrackHandle {
  stop: () => void;
  setVolume: (vol: number) => void;
  kind: AmbientKind;
  volume: number;
}

const activeAmbientTracks: {
  track1: AmbientTrackHandle | null;
  track2: AmbientTrackHandle | null;
} = {
  track1: null,
  track2: null,
};

function createAmbientTrackNode(
  ac: AudioContext,
  kind: AmbientKind,
  initialVol: number
): AmbientTrackHandle | null {
  if (kind === "off") return null;

  const safeVol = Math.max(0.0001, Math.min(1.0, initialVol));

  if (kind === "om_drone") {
    // 432Hz + 216Hz + 108Hz harmonic soothing drone
    const freqs = [108, 216, 432, 434];
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, ac.currentTime);
    master.gain.linearRampToValueAtTime(safeVol * 0.65, ac.currentTime + 1.5);
    master.connect(ac.destination);

    const oscs = freqs.map((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.value = 1 / (i + 1.5);
      osc.connect(g);
      g.connect(master);
      osc.start();
      return osc;
    });

    return {
      kind,
      volume: safeVol,
      setVolume: (v: number) => {
        try {
          const target = Math.max(0.0001, Math.min(1.0, v)) * 0.65;
          master.gain.cancelScheduledValues(ac.currentTime);
          master.gain.linearRampToValueAtTime(target, ac.currentTime + 0.15);
        } catch {}
      },
      stop: () => {
        try {
          master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.8);
          setTimeout(() => {
            oscs.forEach((o) => {
              try { o.stop(); } catch {}
            });
            try { master.disconnect(); } catch {}
          }, 800);
        } catch {}
      },
    };
  }

  // Noise-buffer based ambients (Rain, Creek, Forest, Brown Noise)
  const len = ac.sampleRate * 3;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  const left = buf.getChannelData(0);
  const right = buf.getChannelData(1);

  let lastOutL = 0.0;
  let lastOutR = 0.0;

  for (let i = 0; i < len; i++) {
    const whiteL = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;

    if (kind === "noise") {
      // Brown noise
      lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
      lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
      left[i] = lastOutL * 3.5;
      right[i] = lastOutR * 3.5;
    } else if (kind === "creek") {
      // Pink / trickle water noise
      lastOutL = (lastOutL + 0.05 * whiteL) / 1.05;
      lastOutR = (lastOutR + 0.05 * whiteR) / 1.05;
      left[i] = (lastOutL + whiteL * 0.2) * 1.5;
      right[i] = (lastOutR + whiteR * 0.2) * 1.5;
    } else {
      left[i] = whiteL;
      right[i] = whiteR;
    }
  }

  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = ac.createBiquadFilter();
  if (kind === "rain") {
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
  } else if (kind === "creek") {
    filter.type = "lowpass";
    filter.frequency.value = 1200;
  } else if (kind === "forest") {
    filter.type = "highpass";
    filter.frequency.value = 3500;
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 450;
  }

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.linearRampToValueAtTime(safeVol, ac.currentTime + 1.2);

  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start();

  return {
    kind,
    volume: safeVol,
    setVolume: (v: number) => {
      try {
        const target = Math.max(0.0001, Math.min(1.0, v));
        g.gain.cancelScheduledValues(ac.currentTime);
        g.gain.linearRampToValueAtTime(target, ac.currentTime + 0.15);
      } catch {}
    },
    stop: () => {
      try {
        g.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.8);
        setTimeout(() => {
          try { src.stop(); } catch {}
          try { g.disconnect(); } catch {}
        }, 800);
      } catch {}
    },
  };
}

export function startAmbientTrack(
  trackNum: 1 | 2,
  kind: AmbientKind,
  volume = 0.05
): () => void {
  try {
    const key = trackNum === 1 ? "track1" : "track2";
    const existing = activeAmbientTracks[key];

    if (kind === "off") {
      stopAmbientTrack(trackNum);
      return () => {};
    }

    const ac = getAudioContext();
    if (!ac) return () => {};
    if (ac.state === "suspended") {
      void ac.resume();
    }

    // If same sound is already playing on this track, smoothly update volume
    if (existing && existing.kind === kind) {
      existing.setVolume(volume);
      existing.volume = volume;
      return () => stopAmbientTrack(trackNum);
    }

    // Stop current track before switching soundscape
    if (existing) {
      existing.stop();
      activeAmbientTracks[key] = null;
    }

    const handle = createAmbientTrackNode(ac, kind, volume);
    activeAmbientTracks[key] = handle;
    return () => stopAmbientTrack(trackNum);
  } catch {
    return () => {};
  }
}

export function setAmbientTrackVolume(trackNum: 1 | 2, volume: number) {
  const key = trackNum === 1 ? "track1" : "track2";
  const existing = activeAmbientTracks[key];
  if (existing) {
    existing.setVolume(volume);
    existing.volume = volume;
  }
}

export function stopAmbientTrack(trackNum: 1 | 2) {
  try {
    const key = trackNum === 1 ? "track1" : "track2";
    activeAmbientTracks[key]?.stop();
    activeAmbientTracks[key] = null;
  } catch {}
}

export function stopAllAmbients() {
  stopAmbientTrack(1);
  stopAmbientTrack(2);
}

// Backward-compatible single-track methods
export function startAmbient(kind: AmbientKind = "rain", volume = 0.05) {
  return startAmbientTrack(1, kind, volume);
}

export function stopAmbient() {
  stopAllAmbients();
}

// =================== GUIDED VOICE PERSONAS ===================

export type VoicePersonaId = "ananda" | "tara" | "bodhidharma" | "prajna";

export interface VoicePersona {
  id: VoicePersonaId;
  name: string;
  subtitle: string;
  description: string;
  pitch: number;
  rate: number;
  gender: "male" | "female";
  sampleText: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "ananda",
    name: "Ananda",
    subtitle: "Gentle Theravāda Monk",
    description: "Deep, grounding, unhurried cadence carrying the warmth of monastic presence",
    pitch: 0.85,
    rate: 0.82,
    gender: "male",
    sampleText: "Breathing in, arrive gently in this body. Breathing out, release the day.",
  },
  {
    id: "tara",
    name: "Tara",
    subtitle: "Compassionate Sister",
    description: "Soothing maternal clarity that softens anxiety and opens the heart to mettā",
    pitch: 1.05,
    rate: 0.85,
    gender: "female",
    sampleText: "May your heart be at ease. Receive this breath like a kind friend.",
  },
  {
    id: "bodhidharma",
    name: "Bodhidharma",
    subtitle: "Zen Master",
    description: "Slow, resonant, penetrating stillness pointing directly at your original nature",
    pitch: 0.78,
    rate: 0.78,
    gender: "male",
    sampleText: "When you sit, just sit. Nothing to add, nothing to take away.",
  },
  {
    id: "prajna",
    name: "Prajna",
    subtitle: "Contemporary Mindful Guide",
    description: "Balanced, natural, modern contemplative presence with clear gentle phrasing",
    pitch: 0.98,
    rate: 0.88,
    gender: "female",
    sampleText: "Rest in the pause between thoughts. Clear, awake, fully here.",
  },
];

export function speakCue(
  text: string,
  enabled: boolean,
  personaId: VoicePersonaId = "ananda",
  volume = 0.9
) {
  try {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    // Clear queued utterances cleanly
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
    const u = new SpeechSynthesisUtterance(text);
    u.rate = persona.rate;
    u.pitch = persona.pitch;
    u.volume = volume;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const targetGender = persona.gender;
      const matched = voices.find((v) => {
        const name = v.name.toLowerCase();
        const isEnglish = v.lang.startsWith("en");
        if (!isEnglish) return false;
        if (targetGender === "female") {
          return name.includes("female") || name.includes("samantha") || name.includes("victoria") || name.includes("karen") || name.includes("serena") || name.includes("moira");
        } else {
          return name.includes("male") || name.includes("daniel") || name.includes("george") || name.includes("oliver") || name.includes("arthur") || name.includes("alex");
        }
      }) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

      if (matched) u.voice = matched;
    }

    // Delay 10ms for WebKit SpeechSynthesis bug on iOS
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(u);
      } catch {}
    }, 10);
  } catch {
    /* ignore */
  }
}

export function previewVoicePersona(personaId: VoicePersonaId) {
  unlockAudio();
  const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
  speakCue(persona.sampleText, true, personaId, 1.0);
}

export function stopSpeech() {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}
