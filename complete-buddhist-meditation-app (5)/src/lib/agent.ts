// Bodhi Guide — local agentic recommendation + NLU. No API key required.
// Parses natural language into structured practice filters and scores candidates.

export type GuideContext = {
  minutes?: number | null;
  mood?: string | null;
  goal?: string | null;
  tradition?: string | null;
  level?: string | null;
  streak?: number;
  recentTechnique?: string | null;
};

export type ParsedIntent = {
  minutes: number | null;
  moods: string[];
  traditions: string[];
  levels: string[];
  categories: string[];
  keywords: string[];
};

const MOOD_FAMILIES: Record<string, { categories: string[]; keywords: string[]; reply: string }> = {
  anxious: {
    categories: ["Breath", "Concentration", "Body"],
    keywords: ["calming", "extended exhale", "whole-body", "grounding", "box", "coherent"],
    reply: "Anxiety softens when the out-breath lengthens and the body is felt.",
  },
  stressed: {
    categories: ["Breath", "Body", "Daily Life"],
    keywords: ["unwinding", "reset", "evening", "sweeping", "tea"],
    reply: "For stress, we downshift the nervous system first — then insight.",
  },
  sleepy: {
    categories: ["Movement", "Zen", "Breath"],
    keywords: ["walking", "kinhin", "standing", "counting", "dawn"],
    reply: "Dullness lifts with movement, light, and upright energy.",
  },
  dull: {
    categories: ["Movement", "Zen", "Concentration"],
    keywords: ["walking", "koan", "counting", "bright"],
    reply: "Dullness lifts with movement and bright inquiry.",
  },
  angry: {
    categories: ["Heart", "Compassion"],
    keywords: ["loving-kindness", "metta", "difficult person", "patience", "forgiveness"],
    reply: "Anger is hot coal. We cool it with loving-kindness, starting small.",
  },
  sad: {
    categories: ["Heart", "Compassion", "Devotion"],
    keywords: ["compassion", "tonglen", "grief", "self", "gentle"],
    reply: "Sadness wants held, not fixed. We practice gentle holding.",
  },
  grief: {
    categories: ["Compassion", "Heart", "Wisdom"],
    keywords: ["tonglen", "grieving", "loving-kindness", "impermanence"],
    reply: "Grief is love with nowhere to go — we give it a vast sky.",
  },
  distracted: {
    categories: ["Concentration", "Breath", "Zen"],
    keywords: ["counting", "kasina", "one-pointedness", "anchor"],
    reply: "A scattered mind loves one simple anchor. We return, kindly, 100 times.",
  },
  focus: {
    categories: ["Concentration", "Zen"],
    keywords: ["jhana", "kasina", "koan", "absorption", "one-pointedness"],
    reply: "For depth, one object, held tenderly, until the mind unifies.",
  },
  compassion: {
    categories: ["Heart", "Compassion", "Mind Training"],
    keywords: ["tonglen", "lojong", "metta", "exchange", "bodhicitta"],
    reply: "To grow a boundless heart, we practice giving and taking.",
  },
  sleep: {
    categories: ["Breath", "Body", "Devotion"],
    keywords: ["evening", "unwinding", "body scan", "extended exhale", "before sleep"],
    reply: "For sleep, slow the breath, soften the body, release the day.",
  },
  fear: {
    categories: ["Devotion", "Heart", "Wisdom"],
    keywords: ["refuge", "recollection", "buddha", "protection", "death"],
    reply: "Fear eases in refuge — Buddha, Dhamma, Sangha — and clear seeing.",
  },
  doubt: {
    categories: ["Zen", "Wisdom", "Insight"],
    keywords: ["koan", "great doubt", "investigation", "kalama"],
    reply: "Doubt, held well, becomes the gate. We turn it into inquiry.",
  },
  grateful: {
    categories: ["Devotion", "Heart"],
    keywords: ["gratitude", "mudita", "joy", "generosity", "offering"],
    reply: "Gratitude is mudita ripening — we water it.",
  },
  beginner: {
    categories: ["Breath", "Body", "Daily Life"],
    keywords: ["beginner", "welcome", "first", "gentle", "taste"],
    reply: "Welcome. We start small — 5 kind minutes beat 30 forced ones.",
  },
};

const CATEGORY_ALIASES: Record<string, string> = {
  breath: "Breath",
  breathing: "Breath",
  anapana: "Breath",
  body: "Body",
  "body scan": "Body",
  metta: "Heart",
  kindness: "Heart",
  love: "Heart",
  compassion: "Compassion",
  tonglen: "Compassion",
  lojong: "Mind Training",
  koan: "Zen",
  zazen: "Zen",
  zen: "Zen",
  kasina: "Concentration",
  jhana: "Concentration",
  concentration: "Concentration",
  mantra: "Mantra",
  chant: "Mantra",
  nianfo: "Devotion",
  devotion: "Devotion",
  puja: "Devotion",
  walking: "Movement",
  kinhin: "Movement",
  death: "Wisdom",
  insight: "Insight",
  vipassana: "Insight",
  daily: "Daily Life",
  tea: "Daily Life",
  virtue: "Virtue",
  precept: "Virtue",
};

export function parseGuideQuery(input: string, ctx: GuideContext = {}): ParsedIntent {
  const text = input.toLowerCase();
  const moods: string[] = [];
  for (const k of Object.keys(MOOD_FAMILIES)) {
    if (text.includes(k) || (k === "stressed" && text.includes("stress"))) moods.push(k);
  }
  if (ctx.mood) {
    const m = ctx.mood.toLowerCase();
    if (MOOD_FAMILIES[m] && !moods.includes(m)) moods.push(m);
  }
  const traditions: string[] = [];
  const tradMap: Record<string, string> = {
    zen: "Zen",
    tibetan: "Tibetan",
    theravada: "Theravāda",
    "theravāda": "Theravāda",
    mahayana: "Mahāyāna",
    "mahāyāna": "Mahāyāna",
    "pure land": "Pure Land",
  };
  for (const [k, v] of Object.entries(tradMap)) if (text.includes(k)) traditions.push(v);
  if (ctx.tradition && ctx.tradition !== "All") traditions.push(ctx.tradition);

  const levels: string[] = [];
  for (const l of ["beginner", "intermediate", "advanced"]) if (text.includes(l)) levels.push(cap(l));
  if (ctx.level && ctx.level !== "All") levels.push(ctx.level);

  const categories: string[] = [];
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (text.includes(alias) && !categories.includes(cat)) categories.push(cat);
  }
  // mood-implied categories
  for (const m of moods) {
    for (const c of MOOD_FAMILIES[m].categories) if (!categories.includes(c)) categories.push(c);
  }

  let minutes: number | null = ctx.minutes ?? null;
  const minMatch = text.match(/(\d+)\s*(min|m\b|hour|hr)/);
  if (minMatch) {
    const n = parseInt(minMatch[1], 10);
    minutes = minMatch[2].startsWith("hour") || minMatch[2] === "hr" ? n * 60 : n;
    minutes = Math.max(2, Math.min(120, minutes));
  } else if (/\bquick\b|\bshort\b|\breset\b/.test(text)) minutes = minutes ?? 10;
  else if (/\bdeep\b|\blong\b|\bretreat\b/.test(text)) minutes = minutes ?? 30;

  const keywords = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 12);

  return { minutes, moods, traditions, levels, categories: categories.slice(0, 4), keywords };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function scoreTechnique(
  t: { name: string; description: string; category: string; tradition: string; durations: number[] },
  intent: ParsedIntent
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const hay = `${t.name} ${t.description}`.toLowerCase();

  if (intent.categories.includes(t.category)) {
    score += 30;
    reasons.push(`matches your ${t.category.toLowerCase()} need`);
  }
  if (intent.traditions.includes(t.tradition)) {
    score += 12;
    reasons.push(`${t.tradition} lineage`);
  }
  if (intent.minutes) {
    const ds = t.durations ?? [];
    if (ds.includes(intent.minutes)) {
      score += 18;
      reasons.push(`has a ${intent.minutes}-min sit`);
    } else if (ds.some((d) => Math.abs(d - intent.minutes!) <= 5)) {
      score += 10;
      reasons.push("close to your time");
    }
  }
  for (const m of intent.moods) {
    const fam = MOOD_FAMILIES[m];
    if (!fam) continue;
    if (fam.categories.includes(t.category)) score += 8;
    for (const kw of fam.keywords) {
      if (hay.includes(kw.toLowerCase())) {
        score += 6;
        if (reasons.length < 3) reasons.push(`good for ${m}`);
        break;
      }
    }
  }
  let kwHits = 0;
  for (const kw of intent.keywords) {
    if (kw.length > 3 && hay.includes(kw)) {
      score += 4;
      kwHits++;
      if (kwHits === 1 && reasons.length < 3) reasons.push(`matches “${kw}”`);
    }
  }
  // gentle diversity: prefer shorter names (root-like) slightly
  score += Math.max(0, 6 - t.name.length / 40);
  return { score, reasons: reasons.slice(0, 2) };
}

export function moodReply(moods: string[]): string | null {
  if (!moods.length) return null;
  return MOOD_FAMILIES[moods[0]]?.reply ?? null;
}

export const QUICK_INTENTS = [
  { label: "😮‍💨 Calm anxiety · 10m", query: "I feel anxious, I have 10 minutes, help me calm down" },
  { label: "😡 Soften anger", query: "I'm angry at someone, guide me to loving-kindness" },
  { label: "😴 Sleep deeply", query: "Help me unwind for sleep, 15 minutes gentle" },
  { label: "🧠 Deep focus · 20m", query: "I want deep concentration for 20 minutes" },
  { label: "🚶 Restless body", query: "I'm restless, I need walking meditation" },
  { label: "💔 Grief & compassion", query: "I'm grieving, I want tonglen compassion practice" },
];

export function buildPlanReply(intent: ParsedIntent, count: number): string {
  const bits: string[] = [];
  if (intent.moods.length) bits.push(`for ${intent.moods.join(" + ")}`);
  if (intent.minutes) bits.push(`in ~${intent.minutes} minutes`);
  if (intent.traditions.length) bits.push(`in ${intent.traditions.join("/")} style`);
  const head = bits.length ? `Here's a path ${bits.join(" ")}` : "Here's a path for today";
  return `${head} — ${count} hand-picked methods below. Start with the first; if the heart wants more, continue. Breathing in, I arrive.`;
}
