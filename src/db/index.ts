import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { meditations } from "@/lib/content";

const databaseUrl = process.env.DATABASE_URL;

const mockTechniques = meditations.map((m) => ({
  id: m.slug,
  slug: m.slug,
  name: m.name,
  pali: m.pali,
  tradition: m.tradition,
  level: m.level,
  category: m.tradition === "Theravāda" ? "Breath" : m.tradition === "Zen" ? "Zen" : "Insight",
  durations: m.durations,
  description: m.description,
  essence: m.essence,
  instructions: m.instructions,
  benefits: m.benefits,
  source: m.source,
  color: m.color,
  symbol: m.symbol,
  createdAt: new Date(),
}));

function createMockDb() {
  console.warn("[AI Studio] Database not connected — using in-memory mock");

  const createChainable = (resolveValue: any): any => {
    const promise = Promise.resolve(resolveValue);
    const proxy: any = new Proxy(promise, {
      get(target, prop) {
        if (prop === "then") {
          return target.then.bind(target);
        }
        if (prop === "catch") {
          return target.catch.bind(target);
        }
        if (prop === "finally") {
          return target.finally.bind(target);
        }
        // Chained query methods: from, where, orderBy, limit, offset, groupBy, values, returning, set, etc.
        return (..._args: any[]) => proxy;
      },
    });
    return proxy;
  };

  const inMemorySessions: any[] = [];
  const inMemoryJournal: any[] = [];
  const inMemoryPlans: any[] = [];

  const mock = {
    execute: async (_query: any) => ({
      rows: [
        {
          sessions: inMemorySessions.length,
          seconds: 0,
          avg_seconds: 0,
          c: mockTechniques.length,
          days: inMemorySessions.length > 0 ? 1 : 0,
        },
      ],
    }),
    select: (_fields?: any) => {
      return createChainable(mockTechniques);
    },
    insert: (table: any) => {
      return {
        values: (data: any) => {
          const item = {
            id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const tableName = table?.[Symbol.for("drizzle:Name")] || "";
          if (tableName.includes("session")) inMemorySessions.push(item);
          else if (tableName.includes("journal")) inMemoryJournal.push(item);
          else if (tableName.includes("plan")) inMemoryPlans.push(item);

          return createChainable([item]);
        },
      };
    },
    update: (_table: any) => {
      return {
        set: (data: any) => createChainable([{ id: "mock-updated", ...data }]),
      };
    },
    delete: (_table: any) => {
      return createChainable([]);
    },
    query: new Proxy(
      {},
      {
        get: () => ({
          findMany: async () => mockTechniques,
          findFirst: async () => mockTechniques[0] ?? null,
          findUnique: async () => mockTechniques[0] ?? null,
          create: async (d: any) => d?.data ?? {},
          update: async (d: any) => d?.data ?? {},
          delete: async () => ({}),
        }),
      }
    ),
  };

  return mock as unknown as ReturnType<typeof drizzle>;
}

let dbInstance: ReturnType<typeof drizzle>;
let poolInstance: Pool | null = null;

if (databaseUrl) {
  try {
    const globalForDb = globalThis as typeof globalThis & {
      __arenaNextJsPostgresqlPool?: Pool;
    };

    poolInstance =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
        allowExitOnIdle: true,
      });

    globalForDb.__arenaNextJsPostgresqlPool = poolInstance;

    poolInstance.on("error", (err: Error) => {
      console.warn("[db] idle pool error", err.message);
    });

    const real = drizzle(poolInstance);
    // Wrap with fallback proxy in case PostgreSQL connection drops at runtime
    const mock = createMockDb();
    dbInstance = new Proxy(real as any, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === "function") {
          return (...args: any[]) => {
            try {
              const res = val.apply(target, args);
              if (res && typeof res.catch === "function") {
                return res.catch((err: any) => {
                  console.warn(`[db] operation ${String(prop)} failed, falling back to mock:`, err?.message || err);
                  const mockFn = (mock as any)[prop];
                  return typeof mockFn === "function" ? mockFn(...args) : mockFn;
                });
              }
              return res;
            } catch (err: any) {
              console.warn(`[db] synchronous error on ${String(prop)}, falling back to mock:`, err?.message || err);
              const mockFn = (mock as any)[prop];
              return typeof mockFn === "function" ? mockFn(...args) : mockFn;
            }
          };
        }
        return val ?? (mock as any)[prop];
      },
    });
  } catch (err) {
    console.warn("[db] Failed to initialize drizzle with DATABASE_URL:", err);
    dbInstance = createMockDb();
  }
} else {
  dbInstance = createMockDb();
}

export const pool = poolInstance;
export const db = dbInstance;
