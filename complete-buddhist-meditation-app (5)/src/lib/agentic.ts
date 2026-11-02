import { buildPlanReply, moodReply, parseGuideQuery, scoreTechnique, type GuideContext, type ParsedIntent } from "./agent";

export type LiteTech = {
  slug: string; name: string; pali: string | null; tradition: string; level: string;
  category: string; durations: number[]; description: string; essence: string;
  color: string; symbol: string;
};

export type ScoredRec = LiteTech & { score: number; reason: string };

export type ReasoningStep = { label: string; detail: string };

export type AgentMemory = {
  streak?: number;
  totalSessions?: number;
  avgMinutes?: number;
  recentSlugs?: string[];
  favorites?: string[];
  hour?: number;
};

// ---- query expansion: typos, synonyms, time-of-day ----
const SYNONYMS: Record<string, string[]> = {
  sleep: ["evening", "unwinding", "before sleep", "body scan"],
  anxiety: ["anxious", "calming", "grounding"],
  anxious: ["anxiety", "calming", "grounding"],
  focus: ["concentration", "one-pointedness", "jhana"],
  anger: ["angry", "ill-will", "patience"],
  angry: ["anger", "metta", "forgiveness"],
  sad: ["sadness", "grief", "gentle"],
  walk: ["walking", "kinhin", "movement"],
  restless: ["restlessness", "walking", "movement"],
  tired: ["dull", "sleepy", "energy"],
  morning: ["dawn", "fresh", "begin"],
  night: ["evening", "sleep", "unwinding"],
  quick: ["short", "reset", "5", "10"],
  koan: ["zen", "doubt", "inquiry"],
  tara: ["tārā", "protection", "compassion"],
  breath: ["anapana", "breathing", "calming"],
};

export function expandQuery(input: string): string[] {
  const t = input.toLowerCase();
  const out = new Set<string>();
  for (const [k, syns] of Object.entries(SYNONYMS)) {
    if (t.includes(k)) syns.forEach((s) => out.add(s));
  }
  // time-of-day hint
  const h = new Date().getHours();
  if (h >= 21 || h < 5) out.add("before sleep");
  if (h >= 5 && h < 9) out.add("dawn");
  return [...out].slice(0, 8);
}

export function parseWithExpansion(input: string, ctx: GuideContext) {
  const intent = parseGuideQuery(input, ctx);
  const expanded = expandQuery(input);
  return { intent, expanded };
}

// ---- personalization: boost recents/favs, diversify categories ----
export function rankTechniques(
  candidates: LiteTech[],
  intent: ParsedIntent,
  memory: AgentMemory = {},
  limit = 6
): { recs: ScoredRec[]; steps: ReasoningStep[] } {
  const steps: ReasoningStep[] = [];
  steps.push({
    label: "Understanding",
    detail:
      intent.moods.length || intent.categories.length
        ? `Heard ${[...intent.moods, ...intent.categories].slice(0, 3).join(" · ")}${intent.minutes ? ` · ~${intent.minutes} min` : ""}.`
        : "Open sit — balancing calm + insight.",
  });

  const favSet = new Set(memory.favorites ?? []);
  const recentSet = new Set((memory.recentSlugs ?? []).slice(0, 12));

  const scored = candidates.map((c) => {
    const s = scoreTechnique(c, intent);
    let score = s.score;
    const reasons = [...s.reasons];
    if (favSet.has(c.slug)) {
      score += 4;
      if (reasons.length < 2) reasons.push("one of your saved");
    }
    if (recentSet.has(c.slug)) score -= 6; // novelty: don't repeat last sits
    // streak-aware: longer streak → slightly favor depth
    if ((memory.streak ?? 0) >= 7 && ["Intermediate", "Advanced"].includes(c.level)) score += 3;
    if ((memory.streak ?? 0) < 3 && c.level === "Beginner") score += 3;
    return { ...c, score, reason: reasons.join(" · ") || "a balanced sit for today" };
  });

  scored.sort((a, b) => b.score - a.score);

  // diversify: max 2 per category in top picks
  const picked: typeof scored = [];
  const perCat = new Map<string, number>();
  for (const c of scored) {
    if (picked.length >= limit) break;
    const n = perCat.get(c.category) ?? 0;
    if (n >= 2) continue;
    picked.push(c);
    perCat.set(c.category, n + 1);
  }
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (!picked.includes(c)) picked.push(c);
  }

  steps.push({
    label: "Searching",
    detail: `Scanned ${candidates.length} methods across ${new Set(candidates.map((c) => c.category)).size} families.`,
  });
  steps.push({
    label: "Ranking",
    detail: memory.favorites?.length
      ? `Personalized with your ${memory.favorites.length} saved + recent sits (novelty first).`
      : "Ranked by mood fit, time fit, and lineage.",
  });

  return { recs: picked, steps };
}

export function buildReply(intent: ParsedIntent, count: number, memory: AgentMemory = {}): string {
  const base = `${moodReply(intent.moods) ? moodReply(intent.moods) + " " : ""}${buildPlanReply(intent, count)}`;
  if ((memory.streak ?? 0) >= 7) return `${base} 🔥 ${memory.streak}-day thread — protect it gently.`;
  if (memory.hour != null && memory.hour >= 21) return `${base} 🌙 Late hour — I kept it gentle for sleep.`;
  if (memory.hour != null && memory.hour < 9) return `${base} 🌅 Fresh morning mind — a beautiful time to deepen.`;
  return base;
}

export function followUps(intent: ParsedIntent): string[] {
  const f: string[] = [];
  if (!intent.minutes) f.push("I have 10 minutes");
  if (!intent.moods.length) f.push("I'm feeling restless");
  f.push("Make it a 7-day plan");
  if (!intent.traditions.length) f.push("Something Zen-flavored");
  return f.slice(0, 3);
}

// ---- 7-day plan scaffolding (validated against real slugs server-side) ----
const PLAN_ARCHETYPES: Record<string, { categories: string[]; note: string }> = {
  calm: { categories: ["Breath", "Body", "Concentration"], note: "Downshift first, then steady." },
  focus: { categories: ["Concentration", "Zen", "Breath"], note: "One object, held tenderly." },
  heart: { categories: ["Heart", "Compassion", "Devotion"], note: "Soften, then radiate." },
  sleep: { categories: ["Breath", "Body", "Devotion"], note: "Slow + soften toward rest." },
  insight: { categories: ["Insight", "Wisdom", "Body"], note: "See clearly, hold lightly." },
  energy: { categories: ["Movement", "Zen", "Breath"], note: "Wake the body, brighten mind." },
  balanced: { categories: ["Breath", "Heart", "Body", "Insight", "Zen", "Devotion", "Movement"], note: "A little of each jewel." },
};

export function planArchetype(goal: string): { categories: string[]; note: string; key: string } {
  const g = goal.toLowerCase();
  if (/sleep|insomnia|rest|evening|unwind/.test(g)) return { ...PLAN_ARCHETYPES.sleep, key: "sleep" };
  if (/focus|concentrat|study|work|exam|adhd|distract/.test(g)) return { ...PLAN_ARCHETYPES.focus, key: "focus" };
  if (/anxi|stress|calm|panic|overwhelm/.test(g)) return { ...PLAN_ARCHETYPES.calm, key: "calm" };
  if (/anger|forgiv|relationship|grief|sad|compassion|heart|love|metta/.test(g)) return { ...PLAN_ARCHETYPES.heart, key: "heart" };
  if (/insight|wisdom|vipassana|emptiness/.test(g)) return { ...PLAN_ARCHETYPES.insight, key: "insight" };
  if (/energy|dull|tired|morning|sluggish/.test(g)) return { ...PLAN_ARCHETYPES.energy, key: "energy" };
  return { ...PLAN_ARCHETYPES.balanced, key: "balanced" };
}

// ---- briefing: time-aware proactive nudge ----
export function briefingCopy(hour: number, streak = 0, totalSessions = 0): { greeting: string; suggestion: string; minutes: number; moodHint: string } {
  if (hour >= 5 && hour < 9)
    return {
      greeting: streak > 0 ? `Good morning — ${streak}-day flame still lit.` : "Good morning, noble friend.",
      suggestion: totalSessions === 0 ? "Begin with 5 kind minutes of breath." : "Morning mind is fresh — deepen with 15–20 min.",
      minutes: totalSessions === 0 ? 5 : 15,
      moodHint: "dawn clarity",
    };
  if (hour >= 12 && hour < 14)
    return { greeting: "Midday bell.", suggestion: "A 5–10 min reset keeps the afternoon kind.", minutes: 10, moodHint: "midday reset" };
  if (hour >= 18 && hour < 21)
    return { greeting: "Evening unwinding.", suggestion: "Release the day — body scan or mettā, 10–15 min.", minutes: 10, moodHint: "unwinding" };
  if (hour >= 21 || hour < 5)
    return { greeting: "Night is for softening.", suggestion: "Slow breath, warm heart — 10 gentle minutes toward sleep.", minutes: 10, moodHint: "sleep" };
  return { greeting: streak >= 7 ? `Steady one — ${streak} days.` : "Welcome back.", suggestion: "A 10-minute sit fits any day.", minutes: 10, moodHint: "balanced" };
}

// ---- debrief: post-session reflection ----
export function debriefCopy(input: { moodBefore?: number | null; moodAfter?: number | null; minutes: number; techniqueName: string }): {
  headline: string; insight: string; journalPrompt: string;
} {
  const { moodBefore, moodAfter, minutes, techniqueName } = input;
  const delta = moodBefore != null && moodAfter != null ? moodAfter - moodBefore : null;
  if (delta != null && delta > 0)
    return {
      headline: "🪷 Your heart brightened.",
      insight: `${minutes} min of ${techniqueName} softened something. Noticing what helps is how a practice becomes yours.`,
      journalPrompt: "What specifically softened — body, story, or breath? One line, so tomorrow's you remembers the way back.",
    };
  if (delta != null && delta < 0)
    return {
      headline: "🌧 Heavier now — that too is data.",
      insight: `Sitting didn't fix it; it revealed it. ${techniqueName} held space for ${minutes} min — that counts double.`,
      journalPrompt: "Name what weighed, kindly, without solving. Heaviness named loosens.",
    };
  return {
    headline: "✦ Sitting complete.",
    insight: `${minutes} min of ${techniqueName}. The merit isn't in feeling special — it's in returning.`,
    journalPrompt: "One honest line: body, feeling, mind — what did you notice?",
  };
}
