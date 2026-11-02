// Seed A: breath 80 + body 100 = 180 techniques
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0;
const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-a${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [10, 20, 30]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#b45309", symbol: o.symbol || "◉" }); }

const breathBases = [
  ["Counting Exhalations", "Ganana", "Count each exhalation 1 to 10, then begin again. When lost, smile and restart at 1.", "MN 118"],
  ["Counting Inhalations", "Ganana", "Count inhalations 1 to 10 to energize a dull mind and sharpen attention.", "Visuddhimagga VIII"],
  ["Nostril Touch", "Phutthana", "Rest attention at the nostril rim where air kisses skin; know long, short, coarse and fine breaths.", "MN 118"],
  ["Upper-Lip Awareness", "Uttarottha", "Feel the faint brush of breath on the upper lip — a refined object for deep samadhi.", "Visuddhimagga"],
  ["Abdominal Rise-Fall", "Udayabbaya", "Follow the belly rise and fall; note silently rising, falling in Mahasi style.", "Mahasi Sayadaw"],
  ["Whole-Body Breathing", "Sabbakaya", "Breathe as if the whole body inhales; feel breath pervading limbs and skin.", "MN 118 tetrad I"],
  ["Calming Formations", "Passambhaya", "With each exhale soften shoulders, jaw and belly; tranquilize the body-fabricator.", "MN 118 step 4"],
  ["Rapture with Breath", "Piti", "Notice the pleasant thrill as breath calms; bathe in it without grasping.", "MN 118 tetrad II"],
  ["Gladdening the Mind", "Abhippamodaya", "Use breath to brighten a heavy mind; recall gratitude, then breathe joy.", "MN 118"],
  ["Concentrating Mind", "Samadaha", "Gather mind onto one breath-point until it stays like a flame in still air.", "MN 118"],
  ["Liberating the Mind", "Vimocaya", "Watch craving release its grip with each out-breath; practice letting go.", "MN 118"],
  ["Impermanence Breathing", "Aniccanupassi", "See each breath born and dying; nothing to hold — insight through breath.", "MN 118 tetrad IV"],
  ["Cessation Breathing", "Nirodha", "Contemplate fading of greed, hate and delusion with every exhalation.", "SN 54"],
  ["Extended Exhale", "Digha-assasa", "Inhale 4, exhale 6 to 8; lengthen out-breath to soothe anxiety and insomnia.", "Traditional"],
  ["Equal Breathing", "Samavutti", "Balance inhale and exhale to equal counts; steady the nervous system.", "Traditional"],
  ["Breath and Nimitta", "Nimitta", "When a light or stillness-sign appears, rest gently on it; do not chase it.", "Visuddhimagga VIII"],
  ["Breath at Heart", "Hadaya", "Feel breath resonating in the chest-heart; soften the heart each cycle.", "Thai Forest"],
  ["Breath Sweeping", "Cara", "Sweep attention with breath from nostrils to navel and back like a shuttle.", "Pa-Auk method"],
  ["Paused Breath", "Virama", "Rest in the natural pause after exhale; dwell in stillness.", "Zen breath"],
  ["Gratitude Breathing", "Katannu", "Inhale receiving life gifts, exhale offering thanks to all beings.", "Contemporary"],
];
const lenses = [["Dawn Sit", "Beginner", "at first light when mind is fresh"], ["Midday Reset", "All Levels", "amid activity to return to center"], ["Evening Unwinding", "Beginner", "to release the day holding"], ["Deepening Round", "Intermediate", "for experienced sitters refining attention"]];
let bi = 0;
outer: for (const [bName, pali, how, src] of breathBases) {
  for (const [lens, level, when] of lenses) {
    bi++;
    mk({ name: `Anapana — ${bName} · ${lens}`, pali: `Anapanasati · ${pali}`, tradition: "Theravāda", level, category: "Breath", description: `${how} Practice ${when}. Variation ${bi} of the Buddha's mindfulness-of-breathing, isolating ${bName.toLowerCase()} so attention matures without overwhelm.`, essence: "Breathing in, I arrive. Breathing out, I release.", instructions: ["Sit erect yet soft; rock gently, then become still.", `Establish attention: ${how}`, "Know each breath clearly without controlling it.", "When distracted, label thinking and return kindly.", "Widen to whole-body breathing near the end.", "Dedicate merit: may all beings breathe freely."], benefits: ["Steadies attention", "Calms nervous system", "Builds samadhi"], source: src, symbol: "◉" });
    if (bi >= 80) break outer;
  }
}

const parts32 = [["Hair of Head","Kesa","Reflect on hair: impermanent, unattractive when detached, not-self."],["Body Hair","Loma","Body hair grows unbidden — nature, not mine."],["Nails","Nakha","Cut nails are discarded without grief — so too the body."],["Teeth","Danta","Teeth decay despite care; see the body as unreliable."],["Skin","Taco","Skin wraps impurity in beauty; look beneath."],["Flesh","Mamsam","Flesh is woundable and impermanent — hold with compassion."],["Sinews","Nharu","Sinews bind bone like rope; body as strung parts."],["Bones","Atthi","Contemplate the skeleton within; stark architecture."],["Bone Marrow","Atthiminjam","Marrow hidden in bone — unseen inner processes."],["Kidneys","Vakkam","Kidneys filter silently; honor quiet work."],["Heart"," Hadayam","Heart beats without permission; life is given."],["Liver","Yakanam","Liver processes all; interdependence of organs."],["Diaphragm","Kilomakam","Breathing muscle — link body to breath."],["Spleen","Pihakam","Small and hidden, serving like humble virtues."],["Lungs","Papphasam","Lungs exchange world and self; where do I end?"],["Intestines","Antam","Coiled processing — digestion as impersonal nature."],["Mesentery","Antagunam","Bindings within bindings; intricate web."],["Stomach Contents","Udariyam","Delicious becomes otherwise — craving transforms."],["Excrement","Karisam","Reflect with clarity, not disgust."],["Bile","Pittam","Bitter fluid; body balances beyond control."],["Phlegm","Semham","Mucus comes and goes; observe without identifying."],["Pus","Pubbo","When wounded pus appears — body neither pure nor impure."],["Blood","Lohitam","Blood circulates life; generosity of body."],["Sweat","Sedo","Sweat beads in effort; honor laboring body."],["Fat","Medo","Fat stores and insulates; no part is me."],["Tears","Assu","Tears of grief and joy — feelings made visible."],["Grease","Vasa","Oils lubricate joints; unseen conditions."],["Saliva","Khelo","Saliva aids taste then is spat — changing value."],["Mucus","Singhanika","Humbling equality of the body."],["Joint Oil","Lasika","Fluid eases motion; gratitude for ease."],["Urine","Muttam","Body releases daily; mind release likewise."],["Brain","Matthalungam","Brain thinks I — yet tissue, impermanent, not-self."]];
const elements = [["Earth Element","Pathavi","Solidity: bones, teeth, flesh — hardness."],["Water Element","Apo","Cohesion: blood, sweat, tears — fluidity."],["Fire Element","Tejo","Temperature: warmth, fever, chill."],["Air Element","Vayo","Motion: breath, pulse, inner winds."],["Space Element","Akasa","Cavities: nostrils, ears, mouth."]];
const postures = [["Sitting Posture","Nisajja","Know sitting precisely; body sits, no sitter."],["Standing Posture","Thiti","Stand and know standing; balance as meditation."],["Walking Posture","Gamana","Walk slowly knowing each phase."],["Lying Posture","Sayana","Lie mindfully; lion posture for rest."],["Daily Activities","Sampajanna","Know every bend, stretch and reach."],["Eating Contemplation","Bhojane","Eat knowing taste and swallowing; moderation."]];
const charnel = [["Bloated Corpse","Uddhumataka","Swollen body after death — this body too."],["Livid Corpse","Vinilaka","Discolored corpse; beauty is impermanent."],["Festering Corpse","Vipubbaka","Oozing corpse; urgency to practice."],["Fissured Corpse","Vicchiddaka","Body as parts, not a self."],["Gnawed Corpse","Vikkhayitaka","All bodies return to food chain."],["Scattered Corpse","Vikkhittaka","Dispersal of aggregates."],["Skeleton with Flesh","Sathika","Bones with sinews — body reduced."],["Bare Skeleton","Sathika III","Bones alone; what remains of me?"],["Bleached Bones","Setthi","White bones fade too."],["Heaped Bones","Punjakata","Pile of year-old bones; time devours."],["Rotted Dust","Palala","Bones crumbled to dust; final letting go."],["Cemetery Gate","Susana","I too shall die; live urgently and kindly."]];
const bodyAll = [
  ...parts32.map(([a,b,c]) => ({ t: `Body Contemplation — ${a}`, p: `Dvattimsakara · ${b}`, d: c, lvl: "Intermediate", src: "MN 10 Kayanupassana" })),
  ...elements.map(([a,b,c]) => ({ t: `Element Meditation — ${a}`, p: `Dhatu · ${b}`, d: c, lvl: "Intermediate", src: "MN 140 Dhatuvibhanga" })),
  ...parts32.slice(0,25).map(([a,b]) => ({ t: `Repulsiveness — ${a}`, p: `Patikula · ${b}`, d: `See ${a.toLowerCase()} as impermanent and not-self to cool sensual lust.`, lvl: "Advanced", src: "Visuddhimagga XI" })),
  ...postures.map(([a,b,c]) => ({ t: `Mindful Posture — ${a}`, p: `Iriyapatha · ${b}`, d: c, lvl: "Beginner", src: "MN 10 Satipatthana" })),
  ...charnel.map(([a,b,c]) => ({ t: `Charnel Ground — ${a}`, p: `Sivathika · ${b}`, d: c, lvl: "Advanced", src: "MN 10 Charnel contemplations" })),
];
bodyAll.slice(0, 100).forEach((x, idx) => {
  mk({ name: x.t, pali: x.p, tradition: "Theravāda", level: x.lvl, category: "Body", description: `${x.d} Part ${idx+1} of the foundations-of-mindfulness body series. Sit or lie comfortably, bring kind attention to this object, and observe arising and passing without grasping.`, essence: "In this body I dwell, attentive and at peace.", instructions: ["Settle posture; take three grounding breaths.", `Bring attention to the object: ${x.d}`, "Note sensations, feelings and thoughts that arise.", "See impermanence: arising, staying, dissolving.", "If aversion or fascination arises, note it gently.", "Close with whole-body awareness and metta."], benefits: ["Grounds mind in body", "Cools lust and fear", "Builds insight into not-self"], source: x.src, symbol: "❀", color: "#047857" });
});

console.log(`A built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`A inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
