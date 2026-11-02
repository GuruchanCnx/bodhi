// Seed B: vedana/citta/dhamma 80 + brahmavihara 120 = 200
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0; const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-b${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [10, 20, 30]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#0f766e", symbol: o.symbol || "☸" }); }

// --- 80 insight themes ---
const insightThemes = [
  ["Pleasant Feeling","Sukha-vedana","Notice pleasant tone; enjoy without clinging, see it pass.","MN 10"],
  ["Painful Feeling","Dukkha-vedana","Meet pain as bare sensation; soften resistance, breathe around it.","MN 10"],
  ["Neutral Feeling","Adukkhamasukha","The overlooked neutral tone; ignorance hides here — illuminate it.","SN 36"],
  ["Worldly Pleasure","Samisa-sukha","Pleasure bound to sense objects; see its cost and brevity.","SN 36"],
  ["Unworldly Joy","Niramisa-sukha","Joy of seclusion and samadhi; cultivate wholesome happiness.","SN 36"],
  ["Greed in Mind","Saraga-citta","Know mind with lust as with lust; no shame, just clear seeing.","MN 10"],
  ["Hatred in Mind","Sadosa-citta","Know anger as heat and tension; do not act, just observe.","MN 10"],
  ["Delusion in Mind","Samoha-citta","Foggy mind known as foggy; clarity begins with honesty.","MN 10"],
  ["Constricted Mind","Sankhitta","Small tight mind; breathe space into it.","MN 10"],
  ["Scattered Mind","Vikkhitta","Wild mind; gather gently with breath anchor.","MN 10"],
  ["Great Mind","Mahaggata","Expanded concentrated mind; know its brightness.","MN 10"],
  ["Unsurpassable Mind","Anuttara","Know when mind touches the deathless; bow in gratitude.","MN 10"],
  ["Concentrated Mind","Samahita","Unified mind; protect it from chatter.","MN 10"],
  ["Released Mind","Vimutta","Moments free of hindrance; recognize freedom.","MN 10"],
  ["Five Hindrances Watch","Nivarana","Scan for desire, ill-will, sloth, restlessness, doubt; name and release.","SN 46"],
  ["Five Aggregates","Khandha","See form, feeling, perception, formations, consciousness as processes.","SN 22"],
  ["Six Sense Bases","Salayatana","Watch eye-forms, ear-sounds; contact births feeling — catch the link.","MN 148"],
  ["Seven Factors","Bojjhanga","Balance mindfulness, investigation, energy, joy, calm, concentration, equanimity.","SN 46"],
  ["Dependent Origination","Paticcasamuppada","Trace suffering back: feeling craves, craving clings; break one link.","SN 12"],
  ["Impermanence of Sound","Anicca-sadda","Hear sounds arise and vanish; world as echo.","Vipassana"],
];
const insightLenses = [["Morning Clarity","Beginner"],["Midday Check","All Levels"],["Evening Review","Beginner"],["Silent Retreat","Intermediate"]];
let ii = 0;
outer2: for (const [th, pali, how, src] of insightThemes) {
  for (const [lens, lvl] of insightLenses) {
    ii++;
    mk({ name: `Insight — ${th} · ${lens}`, pali: `Vipassana · ${pali}`, tradition: "Theravāda", level: lvl, category: "Insight", description: `${how} Part of the feeling-mind-phenomena series. ${lens} format keeps investigation sustainable: short, honest, repeated daily.`, essence: "Whatever arises, know it as it is — arising and passing.", instructions: ["Steady with 5 minutes of breath.", `Investigate: ${how}`, "Label softly: pleasant, unpleasant, thinking, knowing.", "Watch arising, persisting, dissolving.", "Rest in choiceless openness.", "Close contemplating impermanence."], benefits: ["Cuts reactivity", "Reveals impermanence", "Frees the heart"], source: src, symbol: "☸" });
    if (ii >= 80) break outer2;
  }
}

// --- 120 brahmavihara ---
const immeas = [
  ["Loving-Kindness","Metta","May you be happy, safe, healthy, at ease.","Karaniya Metta Sutta","♥","#be123c"],
  ["Compassion","Karuna","May you be free from suffering and its causes.","Karuna Sutta","� compassion".replace(" compassion",""),"#7c3aed"],
  ["Sympathetic Joy","Mudita","May your happiness continue and grow.","Mudita Sutta","✦","#b45309"],
  ["Equanimity","Upekkha","All beings are heirs to their actions; I care yet release.","Upekkha Sutta","◌","#0f766e"],
];
const beings = ["Yourself","a Benefactor","a Dear Friend","a Neutral Person","a Difficult Person","All Beings"];
const dirs = ["East","South","West","North","Above","Below"];
// fix compassion symbol
immeas[1][4] = "💧";
let bi2 = 0;
outer3: for (const [im, pali, phrase, src, sym, col] of immeas) {
  for (const being of beings) {
    for (const dir of dirs.slice(0, 5)) {
      bi2++;
      mk({ name: `${im} for ${being} — ${dir}`, pali: `Brahmavihara · ${pali}`, tradition: "All Traditions", level: bi2 % 3 === 0 ? "Intermediate" : "Beginner", category: "Heart", durations: [10, 15, 20, 30], description: `Radiate ${im.toLowerCase()} toward ${being.toLowerCase()} facing symbolically ${dir.toLowerCase()}. Recite inwardly: ${phrase} Hold their image lightly, feel warmth in the chest, and let the wish ripple outward.`, essence: phrase, instructions: ["Settle; place hand on heart.", `Picture ${being.toLowerCase()}; wish: ${phrase}`, "Repeat phrases slowly, meaning each word.", "When numb or flooded, return to yourself first.", "Expand to the direction and beyond.", "Rest in the afterglow."], benefits: ["Dissolves ill-will", "Heals relationships", "Brightens mind"], source: src, symbol: sym, color: col });
      if (bi2 >= 120) break outer3;
    }
    if (bi2 >= 120) break;
  }
}
console.log(`B built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`B inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
