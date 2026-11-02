// Seed E: walking 50 + death 40 + devotion 50 + daily-life 81 = 221
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0; const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-e${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [10, 15, 30]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#92400e", symbol: o.symbol || "👣" }); }

// walking 50
const walkBases = ["Lifting-Moving-Placing","Heel-Sole-Toes","Slow Kinhin (half-step)","Fast Kinhin (breath-step)","Outdoor Forest Path","Beach Sand Walking","Snow Silence Walk","Night Sky Walk","Barefoot Earth","Stairs Mindfully","Labyrinth Walk","Circumambulation (Pradakshina)","Alms-Round Awareness","Standing Like a Tree","Pausing Between Steps"];
const walkLens = [["Park Loop","Beginner"],["Temple Corridor","All Levels"],["Home Hallway","Beginner"],["Mountain Trail","Intermediate"]];
let wi = 0;
outerW: for (const wb of walkBases) {
  for (const [lens, lvl] of walkLens) {
    wi++;
    if (wi > 50) break outerW;
    mk({ name: `Walking — ${wb} · ${lens}`, pali: "Cankama · Kinhin", tradition: "Theravāda", level: lvl, category: "Movement", description: `Meditation in motion: ${wb.toLowerCase()} practiced on a ${lens.toLowerCase()}. The Buddha himself walked between sittings; movement wakes dullness and grounds restlessness.`, essence: "Peace is every step.", instructions: ["Stand; feel feet, balance, whole body.", `Walk noting: ${wb.toLowerCase()}.`, "Feel heel, sole, toes; weight shifting.", "At path end pause, turn mindfully.", "Expand to whole body moving in space.", "End standing in gratitude."], benefits: ["Bridges sitting and life", "Energizes dull mind", "Deeply grounding"], source: "AN 5.29 Cankama Sutta", symbol: "👣" });
  }
}
// death 40
const deathThemes = ["Five Daily Recollections","Nine Cemetery Stages","Deathbed Letter","Last Breath Rehearsal","Impermanence of Loved Ones","Possessions Left Behind","Fame Dissolving","Body Aging Mirror","Illness as Teacher","Sudden Death News","Preta-Hungry Ghost Realm","Animal Realm Frailty","Hellish Heat Vision","Heavenly Passing","Bardo Passage","Forgiveness Before Death","Gratitude for This Life","Urgency Vow (Samvega)","Letting Go Ceremony","Dedication at Death"];
const deathLens = [["Dawn Urgency","Advanced"],["Evening Review","Intermediate"]];
let di = 0;
outerD: for (const dt of deathThemes) {
  for (const [lens, lvl] of deathLens) {
    di++;
    mk({ name: `Death Contemplation — ${dt} · ${lens}`, pali: "Maranasati", tradition: "Theravāda", level: lvl, category: "Wisdom", durations: [15, 20, 30], description: `${dt}: death is certain, its hour unknown. ${lens} format keeps this powerful practice safe — brief, guided, ending in metta and gratitude, never despair. Clarifies priorities and ignites practice.`, essence: "This life fleeting as breath on a mirror — how shall I live today?", instructions: ["Sit steadily; recall: death is certain.", `Contemplate: ${dt.toLowerCase()}.`, "Ask: if tonight were last, whom to forgive?", "Feel this breath as unrepeatable gift.", "Resolve to live awake, kind and free.", "End with metta for all brief lives."], benefits: ["Cuts procrastination", "Deep gratitude", "Fearlessness"], source: "AN 6.20 Maranassati Sutta", symbol: "◌", color: "#44403c" });
    if (di >= 40) break outerD;
  }
}
// devotion 50
const devoBases = ["Taking Refuge — Triple Gem","Five Precepts Renewal","Eight Precepts (Uposatha)","Bowing — 3 Prostrations","Bowing — 108 Prostrations","Offering Flowers","Offering Light","Offering Incense","Chanting Heart Sutra","Chanting Metta Sutta","Chanting Dhammapada Verses","Pilgrimage Visualization","Stupa Circumambulation","Bodhi Tree Homage","Forgiveness Chant (Khama)"];
const devoLens = [["Home Shrine","Beginner"],["Temple Hall","All Levels"],["Festival Full Moon","All Levels"],["Sickbed Offering","Beginner"]];
let vi = 0;
outerV: for (const db of devoBases) {
  for (const [lens, lvl] of devoLens) {
    vi++;
    if (vi > 50) break outerV;
    mk({ name: `Devotion — ${db} · ${lens}`, pali: "Puja · Vandana", tradition: "Mahāyāna", level: lvl, category: "Devotion", description: `${db} practiced at a ${lens.toLowerCase()}. Devotion softens pride, opens the heart, and gathers merit — the beautiful doorway many masters entered through before deep samadhi.`, essence: "Bowing, the hard heart softens; offering, the closed hand opens.", instructions: ["Arrange shrine simply; bow once.", `Perform: ${db.toLowerCase()}.`, "Recite slowly, meaning each word.", "Feel gratitude to lineage of awakened ones.", "Offer merit to all beings.", "Sit briefly in the afterglow."], benefits: ["Softens pride", "Gathers merit and joy", "Connects to lineage"], source: "Puja tradition · Maha-parinibbana", symbol: "🙏", color: "#b45309" });
  }
}
// daily life 81
const dailyActs = ["Mindful Tea Drinking","Mindful Eating — First Bite","Washing Dishes","Sweeping the Floor","Folding Clothes","Brushing Teeth","Showering Awareness","Commuting Stillness","Waiting in Line","Listening Fully","Speaking Truthfully","Working with Care","Typing Meditation","Driving Calm","Shopping Restraint","Cooking Offering","Gardening Presence","Caring for a Child","Caring for Elders","Pet Companionship","Phone Fast Hour","Email Single-Task","Money Gratitude","Apologizing Cleanly","Praising Sincerely","Bearing Criticism","Resting Without Guilt"];
const dailyLens = [["5-Minute Taste","Beginner"],["Full Activity","All Levels"],["Whole-Day Thread","Intermediate"]];
let dli = 0;
outerL: for (const act of dailyActs) {
  for (const [lens, lvl] of dailyLens) {
    dli++;
    mk({ name: `Everyday Zen — ${act} · ${lens}`, pali: "Samu · Daily Mindfulness", tradition: "Zen", level: lvl, category: "Daily Life", durations: [5, 10, 15], description: `Bring meditation off the cushion into ${act.toLowerCase()} as a ${lens.toLowerCase()}. Thich Nhat Hanh's insight: washing dishes to wash dishes, drinking tea to drink tea — enlightenment in the ordinary.`, essence: "Chop wood, carry water; after awakening, chop wood, carry water.", instructions: [`Begin ${act.toLowerCase()} with one conscious breath.`, "Do one thing at a time, fully.", "Feel sensations: texture, temperature, sound.", "When rushing, pause and smile.", "End with gratitude for the activity.", "Carry the calm to the next act."], benefits: ["Weaves practice into life", "Reduces autopilot stress", "Finds sacred in ordinary"], source: "Thich Nhat Hanh — Miracle of Mindfulness", symbol: "🍃", color: "#047857" });
    if (dli >= 81) break outerL;
  }
}

console.log(`E built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`E inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
