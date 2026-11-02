// Seed C: kasina 60 + recollections 80 + zen 60 = 200
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0; const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-c${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [15, 30, 45]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#92400e", symbol: o.symbol || "◉" }); }

// kasina 10 x stages
const kasinas = [["Earth Kasina","Pathavi-kasina","a clay disc, brown and steady"],["Water Kasina","Apo-kasina","a bowl of still water"],["Fire Kasina","Tejo-kasina","a candle flame"],["Air Kasina","Vayo-kasina","wind felt at the skin"],["Blue Kasina","Nila-kasina","a blue flower or cloth"],["Yellow Kasina","Pita-kasina","golden light or flower"],["Red Kasina","Lohita-kasina","a red disc"],["White Kasina","Odata-kasina","moon-white cloth"],["Space Kasina","Akasa-kasina","dark aperture, boundless sky"],["Consciousness Kasina","Vinnana-kasina","luminous knowing itself"]];
const stages = [["Learning Sign","Uggaha","Beginner","Gaze softly, memorize the object."],["Counterpart Sign","Patibhaga","Intermediate","The purified mental image glows; rest on it."],["Absorption","Appana","Advanced","Enter jhana; bliss, stillness, one-pointedness."]];
for (const [k, pali, obj] of kasinas) {
  for (const [st, stPali, lvl, how] of stages) {
    for (const dur of [[15, 30, 45], [20, 30, 45, 60]].slice(0, 1)) {
      mk({ name: `${k} · ${st}`, pali: `${pali} · ${stPali}`, tradition: "Theravāda", level: lvl, category: "Concentration", durations: dur, description: `Gaze at ${obj} then close eyes and hold the after-image. ${how} Classical samatha training from the Visuddhimagga that builds access concentration and the four jhanas.`, essence: "One object, one mind, one stillness.", instructions: [`Prepare ${obj}; gaze softly without strain.`, "Close eyes; hold the learning sign.", how, "When hindrances fade, joy and calm arise — allow them.", "Emerge slowly; review factors.", "Dedicate the stillness to all beings."], benefits: ["Deep one-pointedness", "Birthplace of jhana bliss", "Steadies restless mind"], source: "Visuddhimagga IV–V", symbol: "◉" });
    }
  }
}
// need 60: we have 30, double with indoor/outdoor lens
const extra = [];
for (const [k, pali] of kasinas) {
  for (const [lens, lvl] of [["Temple Room","Intermediate"],["Forest Edge","Advanced"],["Candle-Lit Cell","Intermediate"]]) {
    extra.push([k, pali, lens, lvl]);
    if (extra.length >= 30) break;
  }
  if (extra.length >= 30) break;
}
for (const [k, pali, lens, lvl] of extra) {
  mk({ name: `${k} · ${lens} Sitting`, pali, tradition: "Theravāda", level: lvl, category: "Concentration", description: `Practice the ${k.toLowerCase()} in a ${lens.toLowerCase()} setting. Environment shapes the sign: dim rooms sharpen light kasinas, forests deepen earth and space. Same method, new conditions for mastery.`, essence: "Wherever you sit, the object holds you.", instructions: ["Arrange setting and object with care.", "Gaze 5 minutes, then close eyes.", "Hold the mental sign with tenderness.", "Note hindrances; return without force.", "Rest in access stillness.", "Rise with gratitude."], benefits: ["Adapts samadhi to conditions", "Refines nimitta clarity", "Builds retreat readiness"], source: "Visuddhimagga · Pa-Auk", symbol: "◉" });
}

// recollections 10 x 8
const anussati = [
  ["Buddha","Buddhanussati","Itipi so Bhagava... — recall the Blessed One's nine qualities.","AN 11.12","#b45309"],
  ["Dhamma","Dhammanussati","Well-expounded is the Dhamma... — refuge in truth.","AN 11.12","#b45309"],
  ["Sangha","Sanghanussati","Well-practiced is the Sangha... — noble friendship.","AN 11.12","#b45309"],
  ["Virtue","Silanussati","Recall your own unbroken precepts; let gladness rise.","AN 11.12","#047857"],
  ["Generosity","Caganussati","Recall giving; the hand that gives never trembles.","AN 11.12","#be123c"],
  ["Devas","Devatanussati","Faith, virtue, learning, generosity, wisdom — qualities of bright beings.","AN 11.12","#7c3aed"],
  ["Death","Maranassati","Death is certain; its hour unknown — practice urgently.","AN 6.20","#44403c"],
  ["Body","Kayagatasati","This body of four elements, full of impurities — clarity over infatuation.","MN 119","#047857"],
  ["Breathing","Anapanassati","Sixteen steps of mindful breathing; the Tathagata's own dwelling.","MN 118","#b45309"],
  ["Peace","Upasamanussati","The stilling of formations, relinquishment — Nibbana as object.","AN 11.12","#0f766e"],
];
const recolLens = [["Dawn Recollection","Beginner"],["Noon Refuge","All Levels"],["Evening Gladness","Beginner"],["Retreat Depth","Intermediate"],["Fear Antidote","All Levels"],["Sickbed Comfort","All Levels"],["Before Sleep","Beginner"],["Festival Day","All Levels"]];
for (const [rec, pali, how, src, col] of anussati) {
  for (const [lens, lvl] of recolLens) {
    mk({ name: `Recollection of ${rec} · ${lens}`, pali, tradition: "Theravāda", level: lvl, category: "Devotion", description: `${how} In this ${lens.toLowerCase()} format, recollect slowly with phrase and image. Recollection (anussati) protects the mind, gladdens it, and turns faith into concentration.`, essence: "Recollecting the good, the mind grows bright.", instructions: ["Sit; recall the phrase or image.", `Contemplate: ${how}`, "Feel gladness and confidence arise.", "Rest the mind on that brightness.", "Extend gratitude outward.", "Resolve to embody what you recollect."], benefits: ["Gladdens and protects mind", "Builds faith and energy", "Antidote to fear"], source: src, symbol: "✦", color: col });
  }
}

// zen 60
const koans = ["Mu — Does a Dog Have Buddha-Nature?","The Sound of One Hand","Your Original Face","Wash Your Bowl","Drink Tea","The Cypress Tree in the Garden","No Water, No Moon","Everyday Mind Is the Way","Three Pounds of Flax","The Stone Mind","Nansen Kills the Cat","Joshu's Oak Tree","Hyakujo's Fox","The Flag Moves, Mind Moves","Two Hands Clap","What Is Buddha? Dry Shit-Stick","Bodhidharma's Vast Emptiness","Zhaozhou's Cup of Tea","The Bridge Flows, Water Stands","Snow in a Silver Bowl","Dogen's Dropping Body-Mind","Hakuin's Song of Zazen","The Bull Passes the Window","A Finger Points at the Moon","Killing Buddha on the Road","The Mountain Walks","Rice in the Bowl, Water in the Pail","Cold and Heat — No Avoidance","The Turtle under the Altar","The Stone Woman Gives Birth","One Candle Lights Ten Thousand","The Thief Becomes the Child","Sitting as Buddha","The Gale Blows Down the Leaves","Moonlight on Cold Pond","No Gate — Mumonkan Entry","The Flower Garland World","Tea-Life, Tea-Mind","Thunder Under Clear Sky","The Hermit and the Tiger","Iron Bull Roars","Bamboo Shadows Sweep Stairs","Old Mirror, No Dust","Wild Ducks Fly — Dogen and Tenzo","Just This — Genjokoan Sitting","Breath Counting 1–10 · Susokukan","Following Breath · Zuikukan","Shikantaza — Silent Illumination","Kinhin Between Bells","Kyosaku and Compassion","Bowing to the Cushion","Work as Practice · Samu","Eating as Ceremony · Oryoki","Great Doubt, Great Awakening","The Precepts as Koan","Vow to Save All Beings","Beginner's Mind — Shoshin","Nowhere to Stand — Huineng","Thunderous Silence"];
koans.slice(0, 60).forEach((k, i) => {
  mk({ name: `Zen — ${k}`, pali: "Koan · Zazen", tradition: "Zen", level: i % 4 === 0 ? "Beginner" : i % 4 === 1 ? "All Levels" : i % 4 === 2 ? "Intermediate" : "Advanced", category: "Zen", description: `Sit with the koan '${k}'. Present it to the teacher in dokusan; let great doubt mass in the belly until it shatters. Includes zazen posture, breath settling, and inquiry rounds for solitary or sangha practice.`, essence: "Great doubt, great awakening. Small doubt, small awakening.", instructions: ["Take mountain posture; half-open eyes.", "Settle breath into the hara.", `Hold the koan: ${k} — not thinking, not forgetting.`, "When wobbling, return to breath then koan.", "Carry the koan into walking and work.", "Bow out with gassho."], benefits: ["Cuts conceptual mind", "Awakens doubt-energy", "Direct seeing"], source: i < 48 ? "Mumonkan · Blue Cliff Record" : "Dogen · Hakuin · Soto-Rinzai", symbol: "●", color: "#1e293b" });
});

console.log(`C built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`C inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
