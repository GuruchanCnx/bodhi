// Singing-bowl bell synthesized with Web Audio — reused context, volume + ambient + voice.
let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;

function getCtx(): AudioContext | null {
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
  getCtx();
}

export function playBell(duration = 6, volume = 0.5, baseFreq = 432) {
  try {
    const ac = getCtx();
    if (!ac) return;
    const t = ac.currentTime + 0.02;
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
    const ac = getCtx();
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

// Gentle rain / brown-noise ambience for sits (generated, no assets)
export function startAmbient(kind: "rain" | "noise" = "rain", volume = 0.05) {
  try {
    const ac = getCtx();
    if (!ac) return () => {};
    stopAmbient();
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = kind === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = kind === "rain" ? 2500 : 400;
    const g = ac.createGain();
    g.gain.value = volume;
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start();
    const handle = { stop: () => { try { src.stop(); } catch {} try { g.disconnect(); } catch {} } };
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

// Spoken Dhamma cues (optional, off by default) — uses device TTS, no network
export function speakCue(text: string, enabled: boolean, volume = 0.9) {
  try {
    if (!enabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 0.9;
    u.volume = volume;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function stopSpeech() {
  try {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {}
}
