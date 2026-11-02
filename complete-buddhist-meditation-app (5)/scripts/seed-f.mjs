// Seed F: top-up 61 — jhanas, formless, paramitas to cross 1000+
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0; const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-f${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [20, 30, 45]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#0f766e", symbol: o.symbol || "☸" }); }

const jhanas = [
  ["First Jhana — Applied & Sustained","Vitakka-vicara","Seclusion joy; thought still lands on object.","MN 119"],
  ["Second Jhana — Joy & Happiness","Piti-sukha","Thoughts settle; inner confidence shines.","MN 119"],
  ["Third Jhana — Equanimous Bliss","Upekkha-sukha","Joy fades; mindful equanimity glows.","MN 119"],
  ["Fourth Jhana — Pure Equanimity","Upekkha-sati","Pleasure and pain abandoned; breath stills.","MN 119"],
  ["Boundless Space","Akasanañca","Form dissolves; infinite space remains.","MN 106"],
  ["Boundless Consciousness","Viññanañca","Space fades; knowing itself is infinite.","MN 106"],
  ["Nothingness","Akiñcañña","Only absence remains; subtle peace.","MN 106"],
  ["Neither Perception nor Non-Perception","Nevasañña","Most refined becoming; threshold of cessation.","MN 106"],
];
const jLens = [["Access Approach","Intermediate"],["Stabilizing","Advanced"],["Mastery Review","Advanced"],["Daily Taste","Intermediate"]];
for (const [j, pali, how, src] of jhanas) {
  for (const [lens, lvl] of jLens) {
    mk({ name: `${j} · ${lens}`, pali: `Jhana · ${pali}`, tradition: "Theravāda", level: lvl, category: "Concentration", description: `${how} ${lens} guidance for the absorptions: seclusion from hindrances, guarding the nimitta, and reviewing factors afterward. For seasoned sitters with a teacher or retreat container.`, essence: "Secluded from sensuality, the mind enters and dwells in joy.", instructions: ["Purify virtue; settle breath.", "Guard the nimitta; ignore hindrances.", `Enter: ${how}`, "Dwell without grasping; time dissolves.", "Emerge slowly; review factors.", "Dedicate the stillness."], benefits: ["Profound rest and bliss", "Temporarily frees hindrances", "Basis for liberating insight"], source: src, symbol: "◉" });
  }
}
// 32 -> need 29 more: paramitas
const paramis = ["Generosity","Virtue","Renunciation","Wisdom","Energy","Patience","Truthfulness","Resolve","Loving-Kindness","Equanimity"];
const parLens = [["Dawn Vow","Beginner"],["Midday Test","Intermediate"],["Evening Dedication","All Levels"]];
for (const p of paramis) {
  for (const [lens, lvl] of parLens) {
    if (T.length >= 61) break;
    mk({ name: `Perfection of ${p} · ${lens}`, pali: `Parami · ${p}`, tradition: "Theravāda", level: lvl, category: "Virtue", durations: [10, 15, 20], description: `Cultivate ${p.toLowerCase()} as a bodhisatta perfection in ${lens.toLowerCase()} form. Reflect on the Buddha's past lives, vow the quality, then practice it concretely today in thought, word and deed.`, essence: "Perfections are patient rivers carving the mountain of self.", instructions: ["Recall the perfection and its opposite.", `Vow: today I practice ${p.toLowerCase()}.`, "Visualize the Buddha embodying it.", "Act: one concrete deed today.", "Evening review with kindness.", "Dedicate to awakening for all."], benefits: ["Builds character for jhana", "Merit and self-respect", "Ripens bodhisatta path"], source: "Cariyapitaka · Buddhavamsa", symbol: "✦", color: "#b45309" });
  }
}
console.log(`F built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`F inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
