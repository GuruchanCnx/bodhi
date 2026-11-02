// Seed D: lojong 59 + tonglen 40 + pureland 40 + mantra 60 = 199
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
let n = 0; const T = [];
function mk(o) { n++; T.push({ slug: `${slugify(o.name)}-d${n}`, name: o.name, pali: o.pali || null, tradition: o.tradition, level: o.level, category: o.category, durations: JSON.stringify(o.durations || [10, 20, 30]), description: o.description, essence: o.essence, instructions: JSON.stringify(o.instructions), benefits: JSON.stringify(o.benefits), source: o.source, color: o.color || "#7c3aed", symbol: o.symbol || "☾" }); }

const lojong = ["First, train in the preliminaries","Regard all phenomena as dreams","Examine the nature of unborn awareness","Self-liberate even the antidote","Rest in the nature of alaya","In postmeditation, be a child of illusion","Sending and taking should be practiced alternately","Begin with yourself","When the world is filled with evil, transform mishaps into the path","Drive all blames into one","Meditate on the great kindness of all","Practice the union of compassion and emptiness","Take misfortunes onto the path in three ways","Three objects, three poisons, three virtues","Train in the three difficulties","Take up the three principal causes","Pay heed that the three never wane","Keep the three inseparable","Train wholeheartedly in all activities","Always meditate on whatever provokes resentment","Do not be swayed by outer circumstances","This time, practice the main points","Do not misinterpret the teachings","Do not vacillate","Train decisively","Liberate yourself by examining and analyzing","Do not boast","Do not be spiteful","Do not lash out","Do not wait in ambush","Do not bring things to a painful point","Do not transfer the ox's load to the cow","Do not try to be the fastest","Do not act with a twist","Do not make gods into demons","Do not seek others' pain as food for happiness","All activities with one intention","Correct all wrongs with one intention","Two activities: one at beginning, one at end","Whichever of the two occurs, be patient","Observe these two, even at risk of life","Train in the three difficulties revisited","Take up the three principal causes in daily life","Do not allow three to weaken","Possess inseparable three of view and conduct","Train in all with heart","Apply the remedies of emptiness and compassion","Do not gossip about others' flaws","Do not dwell on others' business","Work with the greatest defilements first","Abandon any hope of fruition","Abandon poisonous food of ego","Do not be so predictable","Do not malign others","Do not lie in wait for mistakes","Do not speak of injured limbs","Do not ponder others' failings","Expel the co-emergent arrogance","Maintain mindfulness of death","Commit to the five strengths","The mahayana instruction for ejection of consciousness","Daily practice in five strengths: resolve, familiarity, virtue seed, reproach of ego, aspiration"];
lojong.slice(0, 59).forEach((slogan, i) => {
  mk({ name: `Lojong ${i+1} — ${slogan.slice(0, 60)}`, pali: `Mind Training · ${i+1}/59`, tradition: "Tibetan", level: i % 3 === 0 ? "Beginner" : i % 3 === 1 ? "Intermediate" : "Advanced", category: "Mind Training", description: `Contemplate Atisha's slogan ${i+1}: '${slogan}.' Sit, recite, then apply all day: catch self-cherishing, exchange it for cherishing others. Includes analytical meditation plus tonglen breathing.`, essence: slogan, instructions: ["Generate bodhicitta motivation.", `Recite slogan: ${slogan}`, "Analyze its meaning with examples from your life.", "Breathe: take in self-clinging as smoke, send out relief as light.", "Resolve one concrete action today.", "Dedicate merit to all beings."], benefits: ["Uproots self-cherishing", "Turns adversity into path", "Awakens bodhicitta"], source: "Atisha — Seven Points of Mind Training", symbol: "☾" });
});

const tonglenBases = ["for a Sick Loved One","for a Grieving Friend","for the Anxious","for the Dying","for an Enemy","for Yourself in Pain","for Refugees","for Animals Suffering","for a Crowded City","for the Planet"];
const tonglenLens = [["Dawn Exchange","Beginner"],["Bedside Practice","All Levels"],["Rush-Hour Compassion","Intermediate"],["Night Dedication","All Levels"]];
let ti = 0;
outerT: for (const b of tonglenBases) {
  for (const [lens, lvl] of tonglenLens) {
    ti++;
    mk({ name: `Tonglen ${b} · ${lens}`, pali: "Gtong-len · Giving and Taking", tradition: "Tibetan", level: lvl, category: "Compassion", description: `Breathe in suffering ${b.toLowerCase()} as dark smoke; transform it in the heart and breathe out moonlight relief. ${lens} format adapts the classic exchange to real life — hospital, street, or cushion.`, essence: "Breathe in pain, breathe out compassion.", instructions: ["Motivate: may this benefit all beings.", "Rest mind like vast sky.", `Visualize suffering ${b.toLowerCase()} as smoke.`, "Inhale it; let it dissolve self-grasping.", "Exhale light carrying exactly what is needed.", "Expand to all beings; dedicate merit."], benefits: ["Fearless compassion", "Transforms aversion", "Loosens self-grasping"], source: "Lojong · Pema Chodron lineage", symbol: "☾" });
    if (ti >= 40) break outerT;
  }
}

const pureBases = [["Amitabha Recitation — Seated","Namo Amituofo, 108 breaths, image of Sukhavati."],["Amitabha Recitation — Walking","Nianfo with each step; footfalls as beads."],["Amitabha Visualization","Golden Buddha, halo, lotus pond; place yourself there."],["Deathbed Nianfo","Practice as if tonight is departure; entrust fully."],["Morning Vows — 48 Vows","Recite Dharmakara's vows; align your day."],["Evening Repentance","Review faults before Amitabha; vow anew."],["Mala Nianfo — Whispered","Soft recitation, bead by bead, mind on sound."],["Mala Nianfo — Silent","Mental recitation; lips still, heart chanting."],["Contemplation of Light","Amitabha's light embraces; no one abandoned."],["Dedication of Merit","Direct all goodness toward rebirth and all beings."]];
const pureLens = [["Beginner Welcome","Beginner"],["Daily Devotion","All Levels"],["Retreat Intensity","Intermediate"],["End-of-Life Care","All Levels"]];
let pi = 0;
outerP: for (const [pb, how] of pureBases) {
  for (const [lens, lvl] of pureLens) {
    pi++;
    mk({ name: `Pure Land — ${pb} · ${lens}`, pali: "Nianfo · Nembutsu", tradition: "Pure Land", level: lvl, category: "Devotion", durations: [10, 15, 20, 30], description: `${how} ${lens} format from Chinese-Japanese Pure Land. Faith, vows and practice: entrust to Amitabha, recite sincerely, and rest in other-power.`, essence: "Namo Amitabha — I entrust, I vow, I go.", instructions: ["Bow; settle; picture Sukhavati light.", `Recite: ${how}`, "Listen to your own voice returning.", "When doubt comes, entrust doubt too.", "Rest in gratitude.", "Dedicate: may all be born in the Pure Land."], benefits: ["Calms fear of death", "Opens entrusting heart", "Accessible to all"], source: "Larger Sukhavativyuha · Honen · Shinran", symbol: "❀", color: "#be123c" });
    if (pi >= 40) break outerP;
  }
}

const mantras = [["Om Mani Padme Hum","Avalokiteshvara, compassion jewel-lotus."],["Gate Gate Paragate","Heart Sutra mantra of gone-beyond."],["Om Ah Hum","Body, speech, mind purification."],["Om Tare Tuttare","Green Tara swift protection."],["Om Muni Muni","Shakyamuni's heart mantra."],["Medicine Buddha","Tayata Om Bekanze — healing."],["Amitabha Mantra","Om Ami Dewa Hrih — Sukhavati seed."],["Vajrasattva 100-Syllable","Purification of broken vows."],["Manjushri","Om A Ra Pa Ca Na — wisdom sword."],["White Tara","Long life and gentle healing."]];
const mantraWays = [["Silent Mental","Beginner","whisper-free, mind-only repetition."],["Whispered Breath","All Levels","barely audible, synced to breath."],["Sung Melody","All Levels","devotional singing, heart opening."],["Mala Counting","Beginner","108 beads, thumb rolling."],["Walking Mantra","Intermediate","steps as drumbeat for mantra."],["Retreat Accumulation","Advanced","10,000-count sessions with visualization."]];
let mi = 0;
outerM: for (const [mm, mean] of mantras) {
  for (const [way, lvl, how] of mantraWays) {
    mi++;
    mk({ name: `Mantra — ${mm} · ${way}`, pali: `Mantra-japa · ${mm}`, tradition: "Tibetan", level: lvl, category: "Mantra", description: `${mean} Practiced ${how} Includes refuge, visualization of the deity, mantra flow, dissolution and dedication — complete sadhana in miniature.`, essence: `${mm} — sound as the deity's body.`, instructions: ["Refuge and bodhicitta.", "Visualize deity above or as yourself.", `Recite ${mm} — ${how}`, "Let sound, breath and image merge.", "Dissolve into luminosity.", "Dedicate merit."], benefits: ["Focuses scattered mind", "Invokes blessing lineage", "Purifies speech karma"], source: "Sadhana tradition · Mani Kabum", symbol: "ॐ", color: "#7c3aed" });
    if (mi >= 60) break outerM;
  }
}

console.log(`D built: ${T.length}`);
const client = await pool.connect();
try {
  for (const r of T) {
    await client.query(`INSERT INTO meditation_techniques(slug,name,pali,tradition,level,category,durations,description,essence,instructions,benefits,source,color,symbol) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14) ON CONFLICT(slug) DO NOTHING`, [r.slug,r.name,r.pali,r.tradition,r.level,r.category,r.durations,r.description,r.essence,r.instructions,r.benefits,r.source,r.color,r.symbol]);
  }
  console.log(`D inserted ${T.length}`);
} finally { client.release(); await pool.end(); }
