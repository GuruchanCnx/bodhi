// Bodhi Sanctuary — Premium Synthesized Audio Engine & Guided Voices
// Web Audio API synthesized sacred instruments, organic ambient soundscapes & Web Speech voice personas

let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  getAudioContext();
}

export type BellStyle = "tibetan" | "temple_gong" | "tingsha" | "mokugyo" | "chimes";

export const BELL_OPTIONS: { id: BellStyle; name: string; description: string; previewNote: string }[] = [
  { id: "tibetan", name: "Tibetan Singing Bowl (432Hz)", description: "Warm harmonic brass resonance with healing overtone shimmer", previewNote: "432 Hz" },
  { id: "temple_gong", name: "Kyoto Temple Bell (Kansho)", description: "Deep, solemn bronze bell with lingering sub-bass decay", previewNote: "108 Hz" },
  { id: "tingsha", name: "Tingsha Monastic Cymbals", description: "Crystal-clear pure high frequency with gentle binaural beating", previewNote: "2400 Hz" },
  { id: "mokugyo", name: "Zen Temple Mokugyo (Fish Drum)", description: "Warm hollow wooden percussion for mindful pacing", previewNote: "Wood" },
  { id: "chimes", name: "Himalayan Wind Chimes", description: "Delicate pentatonic shimmer in mountain breeze", previewNote: "Chimes" },
];

export function playBell(
  duration = 7,
  volume = 0.5,
  freqOrStyle: number | BellStyle = 432,
  styleArg?: BellStyle
) {
  try {
    const ac = getAudioContext();
    if (!ac) return;
    const t = ac.currentTime + 0.02;

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
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.7), t + 0.015);
      master.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 5));
      master.connect(ac.destination);

      for (const f of freqs) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 5);
      }
      return;
    }

    if (style === "temple_gong") {
      // Kyoto deep bell: 108Hz fundamental + sub-harmonics
      const gongPartials: [number, number][] = [
        [0.5, 0.4],
        [1, 1],
        [1.33, 0.35],
        [1.85, 0.28],
        [2.42, 0.15],
      ];
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, t);
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.9), t + 0.04);
      master.gain.exponentialRampToValueAtTime(0.0001, t + duration * 1.3);
      master.connect(ac.destination);

      for (const [ratio, amp] of gongPartials) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = ratio < 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(108 * ratio, t);
        g.gain.setValueAtTime(amp, t);
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
      click.frequency.setValueAtTime(540, t);
      click.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      clickGain.gain.setValueAtTime(volume * 0.9, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      click.connect(clickGain);
      clickGain.connect(ac.destination);
      click.start(t);
      click.stop(t + 0.3);

      const resonance = ac.createOscillator();
      const resGain = ac.createGain();
      resonance.type = "triangle";
      resonance.frequency.setValueAtTime(320, t);
      resGain.gain.setValueAtTime(volume * 0.4, t);
      resGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      resonance.connect(resGain);
      resGain.connect(ac.destination);
      resonance.start(t);
      resonance.stop(t + 0.6);
      return;
    }

    if (style === "chimes") {
      // Wind chime cascade
      const notes = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
      notes.forEach((freq, idx) => {
        const delay = t + idx * 0.12 + Math.random() * 0.06;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, delay);
        g.gain.setValueAtTime(0.0001, delay);
        g.gain.exponentialRampToValueAtTime(volume * 0.3, delay + 0.02);
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
      [2.01, 0.45],
      [2.74, 0.3],
      [3.76, 0.22],
      [5.4, 0.12],
    ];
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    master.connect(ac.destination);

    for (const [ratio, amp] of partials) {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * ratio, t);
      const g = ac.createGain();
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration * (0.6 + 0.35 * Math.random()));
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

export function playSoftTick(freq = 880, vol = 0.07) {
  try {
    const ac = getAudioContext();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.5);
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

export function startAmbient(kind: AmbientKind = "rain", volume = 0.05) {
  try {
    if (kind === "off") {
      stopAmbient();
      return () => {};
    }
    const ac = getAudioContext();
    if (!ac) return () => {};
    stopAmbient();

    if (kind === "om_drone") {
      // Synthesize 432Hz + 216Hz + 108Hz harmonic soothing drone
      const freqs = [108, 216, 432, 434]; // 2Hz beating binaural
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, ac.currentTime);
      master.gain.linearRampToValueAtTime(volume * 0.6, ac.currentTime + 2);
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

      const handle = {
        stop: () => {
          try {
            master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 1);
            setTimeout(() => {
              oscs.forEach((o) => {
                try { o.stop(); } catch {}
              });
              try { master.disconnect(); } catch {}
            }, 1000);
          } catch {}
        },
      };
      ambientNodes = handle;
      return handle.stop;
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
        // Pink / trickle noise
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
    g.gain.linearRampToValueAtTime(volume, ac.currentTime + 1.5);

    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start();

    const handle = {
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
    ambientNodes = handle;
    return handle.stop;
  } catch {
    return () => {};
  }
}

export function stopAmbient() {
  try {
    ambientNodes?.stop();
  } catch {}
  ambientNodes = null;
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
    window.speechSynthesis.cancel();

    const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
    const u = new SpeechSynthesisUtterance(text);
    u.rate = persona.rate;
    u.pitch = persona.pitch;
    u.volume = volume;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Find matching voice by persona gender and English language
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

    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function previewVoicePersona(personaId: VoicePersonaId) {
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
