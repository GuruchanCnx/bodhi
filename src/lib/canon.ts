import rawCanon from "./canon.json";
import { meditations } from "./content";

export interface CanonTechnique {
  slug: string;
  name: string;
  pali: string | null;
  tradition: string;
  level: string;
  category: string;
  durations: number[];
  description: string;
  essence: string;
  instructions: string[];
  benefits: string[];
  source: string;
  color: string;
  symbol: string;
}

// Convert 8 root meditations to CanonTechnique shape
const rootCanon: CanonTechnique[] = meditations.map((m) => ({
  slug: m.slug,
  name: m.name,
  pali: m.pali,
  tradition: m.tradition,
  level: m.level,
  category:
    m.tradition === "Theravāda"
      ? "Breath"
      : m.tradition === "Zen"
      ? "Zen"
      : m.tradition === "Tibetan"
      ? "Compassion"
      : "Insight",
  durations: m.durations,
  description: m.description,
  essence: m.essence,
  instructions: m.instructions,
  benefits: m.benefits,
  source: m.source,
  color: m.color,
  symbol: m.symbol,
}));

// Full combined canon list (root 8 + generated 1042 = 1,050 total methods!)
export const allCanonTechniques: CanonTechnique[] = [
  ...rootCanon,
  ...(rawCanon as CanonTechnique[]),
];

// Fast O(1) slug map lookup
export const canonBySlug = new Map<string, CanonTechnique>();
for (const t of allCanonTechniques) {
  canonBySlug.set(t.slug, t);
}

export function findTechniqueBySlug(slug: string): CanonTechnique | null {
  return canonBySlug.get(slug) ?? null;
}

// Pre-computed facets for instant filtering without database overhead
export function getCanonFacets() {
  const traditions = new Set<string>();
  const levels = new Set<string>();
  const categories = new Set<string>();
  const catCounts: Record<string, number> = {};

  for (const t of allCanonTechniques) {
    traditions.add(t.tradition);
    levels.add(t.level);
    categories.add(t.category);
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  }

  return {
    traditions: Array.from(traditions).sort(),
    levels: Array.from(levels).sort(),
    categories: Array.from(categories).sort(),
    catCounts,
  };
}

export function queryCanon(options: {
  q?: string;
  tradition?: string;
  level?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  suggest?: boolean;
}) {
  const {
    q = "",
    tradition = "All",
    level = "All",
    category = "All",
    page = 1,
    pageSize = 24,
    suggest = false,
  } = options;

  let results = allCanonTechniques;

  // Filter tradition
  if (tradition && tradition !== "All") {
    results = results.filter((t) => t.tradition === tradition);
  }

  // Filter level
  if (level && level !== "All") {
    results = results.filter((t) => t.level === level);
  }

  // Filter category
  if (category && category !== "All") {
    results = results.filter((t) => t.category === category);
  }

  // Filter query tokens
  const cleanQ = q.trim().toLowerCase();
  if (cleanQ) {
    const tokens = cleanQ.split(/\s+/).filter((t) => t.length > 0);
    results = results.filter((t) => {
      const searchTarget = `${t.name} ${t.pali || ""} ${t.description} ${t.source} ${t.category} ${t.tradition}`.toLowerCase();
      return tokens.every((tok) => searchTarget.includes(tok));
    });
  }

  const total = results.length;
  const size = suggest ? 8 : pageSize;
  const start = (page - 1) * size;
  const paginated = results.slice(start, start + size);

  return {
    total,
    page,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)),
    techniques: paginated,
    facets: getCanonFacets(),
  };
}
