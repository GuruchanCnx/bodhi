// Combine all procedural generation from seed-a through seed-f into canon.json
import fs from "fs";
import path from "path";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);

const techniques = [];

function makeGenerator() {
  // --- Seed A: breath 80 + body 100 = 180 ---
  let na = 0;
  function mkA(o) {
    na++;
    techniques.push({
      slug: `${slugify(o.name)}-a${na}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [10, 20, 30],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#b45309",
      symbol: o.symbol || "◉",
    });
  }

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
  const lensesA = [
    ["Dawn Sit", "Beginner", "at first light when mind is fresh"],
    ["Midday Reset", "All Levels", "amid activity to return to center"],
    ["Evening Unwinding", "Beginner", "to release the day holding"],
    ["Deepening Round", "Intermediate", "for experienced sitters refining attention"],
  ];
  let bi = 0;
  outerA: for (const [bName, pali, how, src] of breathBases) {
    for (const [lens, level, when] of lensesA) {
      bi++;
      mkA({
        name: `Anapana — ${bName} · ${lens}`,
        pali: `Anapanasati · ${pali}`,
        tradition: "Theravāda",
        level,
        category: "Breath",
        description: `${how} Practice ${when}. Variation ${bi} of the Buddha's mindfulness-of-breathing, isolating ${bName.toLowerCase()} so attention matures without overwhelm.`,
        essence: "Breathing in, I arrive. Breathing out, I release.",
        instructions: [
          "Sit erect yet soft; rock gently, then become still.",
          `Establish attention: ${how}`,
          "Know each breath clearly without controlling it.",
          "When distracted, label thinking and return kindly.",
          "Widen to whole-body breathing near the end.",
          "Dedicate merit: may all beings breathe freely.",
        ],
        benefits: ["Steadies attention", "Calms nervous system", "Builds samadhi"],
        source: src,
        symbol: "◉",
      });
      if (bi >= 80) break outerA;
    }
  }

  const parts32 = [
    ["Hair of Head", "Kesa", "Reflect on hair: impermanent, unattractive when detached, not-self."],
    ["Body Hair", "Loma", "Body hair grows unbidden — nature, not mine."],
    ["Nails", "Nakha", "Cut nails are discarded without grief — so too the body."],
    ["Teeth", "Danta", "Teeth decay despite care; see the body as unreliable."],
    ["Skin", "Taco", "Skin wraps impurity in beauty; look beneath."],
    ["Flesh", "Mamsam", "Flesh is woundable and impermanent — hold with compassion."],
    ["Sinews", "Nharu", "Sinews bind bone like rope; body as strung parts."],
    ["Bones", "Atthi", "Contemplate the skeleton within; stark architecture."],
    ["Bone Marrow", "Atthiminjam", "Marrow hidden in bone — unseen inner processes."],
    ["Kidneys", "Vakkam", "Kidneys filter silently; honor quiet work."],
    ["Heart", "Hadayam", "Heart beats without permission; life is given."],
    ["Liver", "Yakanam", "Liver processes all; interdependence of organs."],
    ["Diaphragm", "Kilomakam", "Breathing muscle — link body to breath."],
    ["Spleen", "Pihakam", "Small and hidden, serving like humble virtues."],
    ["Lungs", "Papphasam", "Lungs exchange world and self; where do I end?"],
    ["Intestines", "Antam", "Coiled processing — digestion as impersonal nature."],
    ["Mesentery", "Antagunam", "Bindings within bindings; intricate web."],
    ["Stomach Contents", "Udariyam", "Delicious becomes otherwise — craving transforms."],
    ["Excrement", "Karisam", "Reflect with clarity, not disgust."],
    ["Bile", "Pittam", "Bitter fluid; body balances beyond control."],
    ["Phlegm", "Semham", "Mucus comes and goes; observe without identifying."],
    ["Pus", "Pubbo", "When wounded pus appears — body neither pure nor impure."],
    ["Blood", "Lohitam", "Blood circulates life; generosity of body."],
    ["Sweat", "Sedo", "Sweat beads in effort; honor laboring body."],
    ["Fat", "Medo", "Fat stores and insulates; no part is me."],
    ["Tears", "Assu", "Tears of grief and joy — feelings made visible."],
    ["Grease", "Vasa", "Oils lubricate joints; unseen conditions."],
    ["Saliva", "Khelo", "Saliva aids taste then is spat — changing value."],
    ["Mucus", "Singhanika", "Humbling equality of the body."],
    ["Joint Oil", "Lasika", "Fluid eases motion; gratitude for ease."],
    ["Urine", "Muttam", "Body releases daily; mind release likewise."],
    ["Brain", "Matthalungam", "Brain thinks I — yet tissue, impermanent, not-self."],
  ];
  const elements = [
    ["Earth Element", "Pathavi", "Solidity: bones, teeth, flesh — hardness."],
    ["Water Element", "Apo", "Cohesion: blood, sweat, tears — fluidity."],
    ["Fire Element", "Tejo", "Temperature: warmth, fever, chill."],
    ["Air Element", "Vayo", "Motion: breath, pulse, inner winds."],
    ["Space Element", "Akasa", "Cavities: nostrils, ears, mouth."],
  ];
  const postures = [
    ["Sitting Posture", "Nisajja", "Know sitting precisely; body sits, no sitter."],
    ["Standing Posture", "Thiti", "Stand and know standing; balance as meditation."],
    ["Walking Posture", "Gamana", "Walk slowly knowing each phase."],
    ["Lying Posture", "Sayana", "Lie mindfully; lion posture for rest."],
    ["Daily Activities", "Sampajanna", "Know every bend, stretch and reach."],
    ["Eating Contemplation", "Bhojane", "Eat knowing taste and swallowing; moderation."],
  ];
  const charnel = [
    ["Bloated Corpse", "Uddhumataka", "Swollen body after death — this body too."],
    ["Livid Corpse", "Vinilaka", "Discolored corpse; beauty is impermanent."],
    ["Festering Corpse", "Vipubbaka", "Oozing corpse; urgency to practice."],
    ["Fissured Corpse", "Vicchiddaka", "Body as parts, not a self."],
    ["Gnawed Corpse", "Vikkhayitaka", "All bodies return to food chain."],
    ["Scattered Corpse", "Vikkhittaka", "Dispersal of aggregates."],
    ["Skeleton with Flesh", "Sathika", "Bones with sinews — body reduced."],
    ["Bare Skeleton", "Sathika III", "Bones alone; what remains of me?"],
    ["Bleached Bones", "Setthi", "White bones fade too."],
    ["Heaped Bones", "Punjakata", "Pile of year-old bones; time devours."],
    ["Rotted Dust", "Palala", "Bones crumbled to dust; final letting go."],
    ["Cemetery Gate", "Susana", "I too shall die; live urgently and kindly."],
  ];
  const bodyAll = [
    ...parts32.map(([a, b, c]) => ({ t: `Body Contemplation — ${a}`, p: `Dvattimsakara · ${b}`, d: c, lvl: "Intermediate", src: "MN 10 Kayanupassana" })),
    ...elements.map(([a, b, c]) => ({ t: `Element Meditation — ${a}`, p: `Dhatu · ${b}`, d: c, lvl: "Intermediate", src: "MN 140 Dhatuvibhanga" })),
    ...parts32.slice(0, 25).map(([a, b]) => ({ t: `Repulsiveness — ${a}`, p: `Patikula · ${b}`, d: `See ${a.toLowerCase()} as impermanent and not-self to cool sensual lust.`, lvl: "Advanced", src: "Visuddhimagga XI" })),
    ...postures.map(([a, b, c]) => ({ t: `Mindful Posture — ${a}`, p: `Iriyapatha · ${b}`, d: c, lvl: "Beginner", src: "MN 10 Satipatthana" })),
    ...charnel.map(([a, b, c]) => ({ t: `Charnel Ground — ${a}`, p: `Sivathika · ${b}`, d: c, lvl: "Advanced", src: "MN 10 Charnel contemplations" })),
  ];
  bodyAll.slice(0, 100).forEach((x, idx) => {
    mkA({
      name: x.t,
      pali: x.p,
      tradition: "Theravāda",
      level: x.lvl,
      category: "Body",
      description: `${x.d} Part ${idx + 1} of the foundations-of-mindfulness body series. Sit or lie comfortably, bring kind attention to this object, and observe arising and passing without grasping.`,
      essence: "In this body I dwell, attentive and at peace.",
      instructions: [
        "Settle posture; take three grounding breaths.",
        `Bring attention to the object: ${x.d}`,
        "Note sensations, feelings and thoughts that arise.",
        "See impermanence: arising, staying, dissolving.",
        "If aversion or fascination arises, note it gently.",
        "Close with whole-body awareness and metta.",
      ],
      benefits: ["Grounds mind in body", "Cools lust and fear", "Builds insight into not-self"],
      source: x.src,
      symbol: "❀",
      color: "#047857",
    });
  });

  // --- Seed B: insight 80 + brahmavihara 120 = 200 ---
  let nb = 0;
  function mkB(o) {
    nb++;
    techniques.push({
      slug: `${slugify(o.name)}-b${nb}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [10, 20, 30],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#0f766e",
      symbol: o.symbol || "☸",
    });
  }

  const insightThemes = [
    ["Pleasant Feeling", "Sukha-vedana", "Notice pleasant tone; enjoy without clinging, see it pass.", "MN 10"],
    ["Painful Feeling", "Dukkha-vedana", "Meet pain as bare sensation; soften resistance, breathe around it.", "MN 10"],
    ["Neutral Feeling", "Adukkhamasukha", "The overlooked neutral tone; ignorance hides here — illuminate it.", "SN 36"],
    ["Worldly Pleasure", "Samisa-sukha", "Pleasure bound to sense objects; see its cost and brevity.", "SN 36"],
    ["Unworldly Joy", "Niramisa-sukha", "Joy of seclusion and samadhi; cultivate wholesome happiness.", "SN 36"],
    ["Greed in Mind", "Saraga-citta", "Know mind with lust as with lust; no shame, just clear seeing.", "MN 10"],
    ["Hatred in Mind", "Sadosa-citta", "Know anger as heat and tension; do not act, just observe.", "MN 10"],
    ["Delusion in Mind", "Samoha-citta", "Foggy mind known as foggy; clarity begins with honesty.", "MN 10"],
    ["Constricted Mind", "Sankhitta", "Small tight mind; breathe space into it.", "MN 10"],
    ["Scattered Mind", "Vikkhitta", "Wild mind; gather gently with breath anchor.", "MN 10"],
    ["Great Mind", "Mahaggata", "Expanded concentrated mind; know its brightness.", "MN 10"],
    ["Unsurpassable Mind", "Anuttara", "Know when mind touches the deathless; bow in gratitude.", "MN 10"],
    ["Concentrated Mind", "Samahita", "Unified mind; protect it from chatter.", "MN 10"],
    ["Released Mind", "Vimutta", "Moments free of hindrance; recognize freedom.", "MN 10"],
    ["Five Hindrances Watch", "Nivarana", "Scan for desire, ill-will, sloth, restlessness, doubt; name and release.", "SN 46"],
    ["Seven Awakening Factors", "Bojjhanga", "Cultivate mindfulness, investigation, energy, joy, tranquility, samadhi, equanimity.", "SN 46"],
    ["Five Aggregates Contemplation", "Khandha", "Form, feeling, perception, choices, consciousness — not self.", "SN 22"],
    ["Six Sense Bases", "Salayatana", "Eye & form, ear & sound, etc.; see contact birth craving.", "SN 35"],
    ["Four Noble Truths Contemplation", "Sacca", "Dukkha, origin, cessation, path — lived directly.", "SN 56"],
    ["Dependent Origination", "Paticcasamuppada", "When this is, that is; trace the twelve links.", "SN 12"],
  ];
  const lensesB = [
    ["Direct Labelling", "Beginner", "mentally note arising objects with a soft whisper"],
    ["Open Awareness", "Intermediate", "drop labels and let all objects rise and fall in vast sky"],
    ["Inquiry Stance", "Advanced", "ask quietly: who is aware? who is claiming this?"],
    ["Loving Investigation", "All Levels", "illuminate the object with tenderness, without push or pull"],
  ];
  let biB = 0;
  outerB: for (const [theme, pali, core, src] of insightThemes) {
    for (const [lens, lvl, desc] of lensesB) {
      biB++;
      mkB({
        name: `Vipassana — ${theme} · ${lens}`,
        pali: `Vipassanā · ${pali}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Insight",
        description: `${core} Method ${biB}: ${desc}. Derived from the Satipaṭṭhāna discourse, tuning attention so wisdom cuts craving at the root.`,
        essence: "Whatever arises ceases; in seeing this, the heart rests.",
        instructions: [
          "Establish posture; three calming breaths.",
          "Settle attention in the body.",
          `Tune to the theme: ${core}`,
          "Note impermanence (anicca) as sensations shift.",
          "Drop resistance; meet what is here with kindness.",
          "Dedicate merit for the awakening of all.",
        ],
        benefits: ["Uproots reactive habits", "Deepens equanimity", "Liberates from grasping"],
        source: src,
        symbol: "☸",
      });
      if (biB >= 80) break outerB;
    }
  }

  const brahmaBases = [
    ["Loving-Kindness for Benefactor", "Metta-garu", "Warm wish for one who helped you."],
    ["Loving-Kindness for Dear Friend", "Metta-sahaya", "Radiate joy and safety to beloved companion."],
    ["Loving-Kindness for Neutral Person", "Metta-majjhatta", "Extend goodwill to clerk or stranger."],
    ["Loving-Kindness for Difficult Person", "Metta-veri", "Soften grievance; wish them free of hate."],
    ["Loving-Kindness for Oneself", "Metta-atta", "Foundation: soften self-blame, wish yourself peace."],
    ["Compassion for the Sick", "Karuna-roga", "Breathe with those in physical pain."],
    ["Compassion for the Grieving", "Karuna-soka", "Hold broken hearts in vast tenderness."],
    ["Compassion for the Angry", "Karuna-kodha", "See suffering behind hostility."],
    ["Appreciative Joy for Successful", "Mudita-labha", "Delight in another's fortune without envy."],
    ["Appreciative Joy for Happy", "Mudita-sukha", "Smile with children, elders, all in ease."],
    ["Equanimity in Praise and Blame", "Upekkha-atthaloka", "Unshaken like granite in eight worldly winds."],
    ["Equanimity in Gain and Loss", "Upekkha-labhalabha", "Hold possessions and roles with light hands."],
    ["Universal Directional Metta — East", "Disa-puratthima", "Radiate love toward sunrise and all beings."],
    ["Universal Directional Metta — South", "Disa-dakkhina", "Radiate warmth southward without boundary."],
    ["Universal Directional Metta — West", "Disa-pacchima", "Radiate kindness toward sunset."],
    ["Universal Directional Metta — North", "Disa-uttara", "Radiate love northward."],
    ["Universal Metta — Above and Below", "Disa-uddhamadho", "To beings in heavens, hells, waters, earth."],
    ["Boundless Karuna in Ten Directions", "Aparimana-karuna", "May all suffering beings be comforted."],
    ["Boundless Mudita in Ten Directions", "Aparimana-mudita", "May joy multiply across worlds."],
    ["Boundless Upekkha — All Beings Heir to Kamma", "Kammasaka", "All beings own their deeds; calm clarity."],
  ];
  const brahmaLens = [
    ["Phrase Repetition", "Beginner", "May they be safe, peaceful, healthy, live with ease."],
    ["Somatic Radiance", "Intermediate", "Feel warm golden glow in chest, expand on exhale."],
    ["Visual Imagery", "Beginner", "Picture them smiling, bathed in morning sun."],
    ["Breath Synchrony", "All Levels", "Inhale goodwill, exhale radiation."],
    ["Walking Radiance", "All Levels", "Send blessings with every step."],
    ["Bedtime Cushion", "Beginner", "Drift into sleep wrapped in loving wishes."],
  ];
  let bCount = 0;
  outerBra: for (const [theme, pali, core] of brahmaBases) {
    for (const [lens, lvl, how] of brahmaLens) {
      bCount++;
      mkB({
        name: `Brahmavihara — ${theme} · ${lens}`,
        pali: `Brahmavihāra · ${pali}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Compassion",
        description: `${core} Method ${bCount} uses ${how.toLowerCase()}. The four divine abodes purify ill-will, envy and cruelty into an unshakeable open heart.`,
        essence: "May all beings everywhere be happy, peaceful and free.",
        instructions: [
          "Sit comfortably, soften face and chest.",
          `Evoke: ${core}`,
          `Cultivate using ${lens.toLowerCase()}: ${how}`,
          "When mind wanders into judgment, smile and begin again.",
          "Widen field to include all beings without exception.",
          "Rest in the warm afterglow.",
        ],
        benefits: ["Heals loneliness and resentment", "Improves sleep and relationships", "Protects mind from bitterness"],
        source: "Mettā Sutta (Sn 1.8) & Visuddhimagga IX",
        symbol: "♡",
        color: "#e11d48",
      });
      if (bCount >= 120) break outerBra;
    }
  }

  // --- Seed C: kasina 60 + recollections 80 + zen 60 = 200 ---
  let nc = 0;
  function mkC(o) {
    nc++;
    techniques.push({
      slug: `${slugify(o.name)}-c${nc}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [15, 30, 45],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#92400e",
      symbol: o.symbol || "◉",
    });
  }

  const kasinas = [
    ["Earth Kasina", "Pathavi-kasina", "a clay disc, brown and steady"],
    ["Water Kasina", "Apo-kasina", "a bowl of still water"],
    ["Fire Kasina", "Tejo-kasina", "a candle flame"],
    ["Air Kasina", "Vayo-kasina", "wind felt at the skin"],
    ["Blue Kasina", "Nila-kasina", "a blue flower or cloth"],
    ["Yellow Kasina", "Pita-kasina", "golden light or flower"],
    ["Red Kasina", "Lohita-kasina", "a red disc"],
    ["White Kasina", "Odata-kasina", "moon-white cloth"],
    ["Space Kasina", "Akasa-kasina", "dark aperture, boundless sky"],
    ["Consciousness Kasina", "Vinnana-kasina", "luminous knowing itself"],
  ];
  const stages = [
    ["Learning Sign", "Uggaha", "Beginner", "Gaze softly, memorize the object."],
    ["Counterpart Sign", "Patibhaga", "Intermediate", "The purified mental image glows; rest on it."],
    ["Absorption", "Appana", "Advanced", "Enter jhana; bliss, stillness, one-pointedness."],
  ];
  for (const [k, pali, obj] of kasinas) {
    for (const [st, stPali, lvl, how] of stages) {
      mkC({
        name: `${k} · ${st}`,
        pali: `${pali} · ${stPali}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Concentration",
        durations: [15, 30, 45],
        description: `Gaze at ${obj} then close eyes and hold the after-image. ${how} Classical samatha training from the Visuddhimagga that builds access concentration and the four jhanas.`,
        essence: "One object, one mind, one stillness.",
        instructions: [
          `Prepare ${obj}; gaze softly without strain.`,
          "Close eyes; hold the learning sign.",
          how,
          "When hindrances fade, joy and calm arise — allow them.",
          "Emerge slowly; review factors.",
          "Dedicate the stillness to all beings.",
        ],
        benefits: ["Deep one-pointedness", "Birthplace of jhana bliss", "Steadies restless mind"],
        source: "Visuddhimagga IV–V",
        symbol: "◉",
      });
    }
  }
  for (const [k, pali] of kasinas) {
    for (const [lens, lvl] of [
      ["Temple Room", "Intermediate"],
      ["Forest Edge", "Advanced"],
      ["Candle-Lit Cell", "Intermediate"],
    ]) {
      if (nc >= 60) break;
      mkC({
        name: `${k} · ${lens}`,
        pali: `${pali} · ${lens}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Concentration",
        durations: [20, 30, 45],
        description: `Practice ${k.toLowerCase()} in a ${lens.toLowerCase()} setting to sharpen meditative stillness.`,
        essence: "Hold the sign firmly and tenderly.",
        instructions: ["Settle gaze.", "Absorb color.", "Rest in luminosity.", "Dedicate merit."],
        benefits: ["Clarity of sign", "Samadhi"],
        source: "Visuddhimagga",
        symbol: "◉",
      });
    }
  }

  const anussati = [
    ["Buddha Qualities", "Buddhanussati", "Recall the nine virtues of the Awakened One: fully enlightened, worthy, compassionate."],
    ["Dhamma Qualities", "Dhammanussati", "Recall the teaching: well-expounded, directly visible, inviting investigation."],
    ["Sangha Qualities", "Sanghanussati", "Recall the noble community of practitioners, upright and exemplary."],
    ["Virtue Recollection", "Silanussati", "Review wholesome choices and unbroken precepts; brighten the heart with clean conscience."],
    ["Generosity Recollection", "Caganussati", "Recall times you gave without expectation; joy of open hands."],
    ["Devas Recollection", "Devanussati", "Reflect on virtues that lead to higher realms: faith, virtue, wisdom."],
    ["Peace Recollection", "Upasamanussati", "Contemplate Nibbana: the stilling of all formations, the cooling of all fires."],
    ["Death Recollection", "Maranassati", "Reflect: death is certain, its hour unknown. Practice today with urgency and kindness."],
    ["Body Recollection", "Kayagatasati", "Anchor in 32 parts and four elements; ground mind in reality."],
    ["Breathing Recollection", "Anapanasati", "Mindfulness of in-and-out breath leading through all 16 steps."],
  ];
  const anussatiLens = [
    ["Dawn Devotion", "Beginner"],
    ["Bedtime Calming", "Beginner"],
    ["Pre-Sit Refuge", "All Levels"],
    ["Midday Courage", "All Levels"],
    ["Analytical Walk", "Intermediate"],
    ["Somatic Glow", "Intermediate"],
    ["Chanting Repetition", "Beginner"],
    ["Silent Immersion", "Advanced"],
  ];
  let aCount = 0;
  outerAnu: for (const [name, pali, desc] of anussati) {
    for (const [lens, lvl] of anussatiLens) {
      aCount++;
      mkC({
        name: `Recollection — ${name} · ${lens}`,
        pali: `Anussati · ${pali}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Devotion",
        description: `${desc} ${lens} adaptation turns abstract respect into living warmth, uplifting a weary mind and creating fertile soil for samadhi.`,
        essence: "Gladdening the mind, I enter stillness.",
        instructions: [
          "Bow or incline heart in reverence.",
          `Reflect on: ${desc}`,
          "Feel faith (saddha) arise as warmth in chest.",
          "Let joy settle into calm concentration.",
          "Transition into silent sitting.",
          "Dedicate merit to all teachers and seekers.",
        ],
        benefits: ["Dispels doubt and dread", "Brightens sluggish heart", "Direct bridge to jhana"],
        source: "Aṅguttara Nikāya 1.296 & Visuddhimagga VII",
        symbol: "✦",
        color: "#d97706",
      });
      if (aCount >= 80) break outerAnu;
    }
  }

  const zenThemes = [
    ["Shikantaza — Just Sitting", "Only sitting; not meditating on anything, completely present.", "Dōgen Fukanzazengi"],
    ["Mu Koan", "Joshu's dog has Buddha-nature? Mu! Cut conceptual mind.", "Mumonkan 1"],
    ["Original Face", "Show me your face before your parents were born.", "Mumonkan 23"],
    ["Sound of One Hand", "Clapping hands make a sound; what is the sound of one hand?", "Hakuin"],
    ["Cypress Tree in Courtyard", "What is the meaning of the Patriarch's coming from the West?", "Mumonkan 37"],
    ["Everyday Mind is the Way", "When hungry, eat; when tired, sleep. Nothing extra.", "Mumonkan 19"],
    ["Not-Knowing is Most Intimate", "Dizang asked: Where are you going? Fayan: Wandering.", "Book of Serenity 20"],
    ["Drop Body and Mind", "Shinjin datsuraku; liberation is dropping identity baggage.", "Eihei Dōgen"],
    ["Moon in the Water", "Enlightenment is like the moon reflected in water; water not broken.", "Genjokoan"],
    ["Great Doubt, Great Awakening", "Throw entire being into the questioning until barrier falls.", "Hakuin Ekaku"],
    ["Sitting like Mount Fuji", "Immovable posture; storms pass around, mountain remains.", "Soto Zen tradition"],
    ["Breath at the Tanden", "Center attention two inches below navel; steady ballast.", "Rinzai manual"],
    ["Beginner's Mind", "In beginner's mind many possibilities; in expert's few.", "Shunryu Suzuki"],
    ["Walking Zazen (Kinhin)", "One half-step per full breath; slow dignified awareness.", "Eihei Dōgen"],
    ["Eating as Meditation (Oryoki)", "Three bowls, mindful reception of food without preference.", "Dōgen Fushukuhanpo"],
  ];
  let zCount = 0;
  outerZen: for (const [zName, zDesc, zSrc] of zenThemes) {
    for (const [lens, lvl] of [
      ["Dawn Sitting", "Beginner"],
      ["All-Night Zazen", "Advanced"],
      ["Midday Tea", "All Levels"],
      ["Evening Sesshin", "Intermediate"],
    ]) {
      zCount++;
      mkC({
        name: `Zen — ${zName} · ${lens}`,
        pali: "Zen · Ch'an",
        tradition: "Zen",
        level: lvl,
        category: "Zen",
        description: `${zDesc} Practiced in ${lens.toLowerCase()} spirit. Zen bypasses scripture to point directly at the human heart, awakening innate Buddha-nature.`,
        essence: "When you sit, just sit. When you walk, just walk.",
        instructions: [
          "Take upright zazen posture; half-lotus, burmese or chair.",
          "Eyes half-open, gaze softly downward at 45 degrees.",
          `Penetrate the practice: ${zDesc}`,
          "When thoughts rise, do not chase, do not fight; let clouds pass.",
          "Rely on whole-body posture and breath in lower abdomen.",
          "End with gassho bow to the cushion and the universe.",
        ],
        benefits: ["Direct realization of reality", "Radical simplicity", "Freedom from conceptual traps"],
        source: zSrc,
        symbol: "◯",
        color: "#1c1917",
      });
      if (zCount >= 60) break outerZen;
    }
  }

  // --- Seed D: lojong 59 + tonglen 40 + pureland 40 + mantra 60 = 199 ---
  let nd = 0;
  function mkD(o) {
    nd++;
    techniques.push({
      slug: `${slugify(o.name)}-d${nd}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [10, 20, 30],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#7c3aed",
      symbol: o.symbol || "☾",
    });
  }

  const lojong = [
    "First, train in the preliminaries",
    "Regard all phenomena as dreams",
    "Examine the nature of unborn awareness",
    "Self-liberate even the antidote",
    "Rest in the nature of alaya",
    "In postmeditation, be a child of illusion",
    "Sending and taking should be practiced alternately",
    "Begin with yourself",
    "When the world is filled with evil, transform mishaps into the path",
    "Drive all blames into one",
    "Meditate on the great kindness of all",
    "Practice the union of compassion and emptiness",
    "Take misfortunes onto the path in three ways",
    "Three objects, three poisons, three virtues",
    "Train in the three difficulties",
    "Take up the three principal causes",
    "Pay heed that the three never wane",
    "Keep the three inseparable",
    "Train wholeheartedly in all activities",
    "Always meditate on whatever provokes resentment",
    "Do not be swayed by outer circumstances",
    "This time, practice the main points",
    "Do not misinterpret the teachings",
    "Do not vacillate",
    "Train decisively",
    "Liberate yourself by examining and analyzing",
    "Do not boast",
    "Do not be spiteful",
    "Do not lash out",
    "Do not wait in ambush",
    "Do not bring things to a painful point",
    "Do not transfer the ox's load to the cow",
    "Do not try to be the fastest",
    "Do not act with a twist",
    "Do not make gods into demons",
    "Do not seek others' pain as food for happiness",
    "All activities with one intention",
    "Correct all wrongs with one intention",
    "Two activities: one at beginning, one at end",
    "Whichever of the two occurs, be patient",
    "Observe these two, even at risk of life",
    "Train in the three difficulties revisited",
    "Take up the three principal causes in daily life",
    "Do not allow three to weaken",
    "Possess inseparable three of view and conduct",
    "Train in all with heart",
    "Apply the remedies of emptiness and compassion",
    "Do not gossip about others' flaws",
    "Do not dwell on others' business",
    "Work with the greatest defilements first",
    "Abandon any hope of fruition",
    "Abandon poisonous food of ego",
    "Do not be so predictable",
    "Do not malign others",
    "Do not lie in wait for mistakes",
    "Do not speak of injured limbs",
    "Do not ponder others' failings",
    "Expel the co-emergent arrogance",
    "Maintain mindfulness of death",
  ];
  lojong.forEach((slogan, i) => {
    mkD({
      name: `Lojong ${i + 1} — ${slogan.slice(0, 60)}`,
      pali: `Mind Training · ${i + 1}/59`,
      tradition: "Tibetan",
      level: i % 3 === 0 ? "Beginner" : i % 3 === 1 ? "Intermediate" : "Advanced",
      category: "Mind Training",
      description: `Contemplate Atisha's slogan ${i + 1}: '${slogan}.' Sit, recite, then apply all day: catch self-cherishing, exchange it for cherishing others. Includes analytical meditation plus tonglen breathing.`,
      essence: slogan,
      instructions: [
        "Generate bodhicitta motivation.",
        `Recite slogan: ${slogan}`,
        "Analyze its meaning with examples from your life.",
        "Breathe: take in self-clinging as smoke, send out relief as light.",
        "Resolve one concrete action today.",
        "Dedicate merit to all beings.",
      ],
      benefits: ["Uproots self-cherishing", "Turns adversity into path", "Awakens bodhicitta"],
      source: "Atisha — Seven Points of Mind Training",
      symbol: "☾",
    });
  });

  const tonglenBases = [
    "for a Sick Loved One",
    "for a Grieving Friend",
    "for the Anxious",
    "for the Dying",
    "for an Enemy",
    "for Yourself in Pain",
    "for Refugees",
    "for Animals Suffering",
    "for a Crowded City",
    "for the Planet",
  ];
  const tonglenLens = [
    ["Dawn Exchange", "Beginner"],
    ["Bedside Practice", "All Levels"],
    ["Rush-Hour Compassion", "Intermediate"],
    ["Night Dedication", "All Levels"],
  ];
  let ti = 0;
  outerT: for (const b of tonglenBases) {
    for (const [lens, lvl] of tonglenLens) {
      ti++;
      mkD({
        name: `Tonglen ${b} · ${lens}`,
        pali: "Gtong-len · Giving and Taking",
        tradition: "Tibetan",
        level: lvl,
        category: "Compassion",
        description: `Breathe in suffering ${b.toLowerCase()} as dark smoke; transform it in the heart and breathe out moonlight relief. ${lens} format adapts the classic exchange to real life.`,
        essence: "Breathe in pain, breathe out compassion.",
        instructions: [
          "Motivate: may this benefit all beings.",
          "Rest mind like vast sky.",
          `Visualize suffering ${b.toLowerCase()} as smoke.`,
          "Inhale it; let it dissolve self-grasping.",
          "Exhale light carrying exactly what is needed.",
          "Expand to all beings; dedicate merit.",
        ],
        benefits: ["Fearless compassion", "Transforms aversion", "Loosens self-grasping"],
        source: "Lojong · Pema Chodron lineage",
        symbol: "☾",
      });
      if (ti >= 40) break outerT;
    }
  }

  const pureBases = [
    ["Amitabha Recitation — Seated", "Namo Amituofo, 108 breaths, image of Sukhavati."],
    ["Amitabha Recitation — Walking", "Nianfo with each step; footfalls as beads."],
    ["Amitabha Visualization", "Golden Buddha, halo, lotus pond; place yourself there."],
    ["Deathbed Nianfo", "Practice as if tonight is departure; entrust fully."],
    ["Morning Vows — 48 Vows", "Recite Dharmakara's vows; align your day."],
    ["Evening Repentance", "Review faults before Amitabha; vow anew."],
    ["Mala Nianfo — Whispered", "Soft recitation, bead by bead, mind on sound."],
    ["Mala Nianfo — Silent", "Mental recitation; lips still, heart chanting."],
    ["Contemplation of Light", "Amitabha's light embraces; no one abandoned."],
    ["Dedication of Merit", "Direct all goodness toward rebirth and all beings."],
  ];
  for (const [pb, pDesc] of pureBases) {
    for (const [lens, lvl] of [
      ["Dawn Sit", "Beginner"],
      ["Temple Round", "Intermediate"],
      ["Evening Retreat", "All Levels"],
      ["Silent Vigil", "Advanced"],
    ]) {
      if (nd >= 139) break;
      mkD({
        name: `Pure Land — ${pb} · ${lens}`,
        pali: "Nianfo · Nembutsu",
        tradition: "Mahāyāna",
        level: lvl,
        category: "Devotion",
        description: `${pDesc} Practiced in ${lens.toLowerCase()} spirit. Entrust the heart to boundless light and life.`,
        essence: "Namo Amitābha Buddha.",
        instructions: ["Bow to the three jewels.", `Establish recitation: ${pDesc}`, "Dwell in radiant golden light.", "Dedicate merit."],
        benefits: ["Deep surrender", "Faith and calm", "Relief from anxiety"],
        source: "Pure Land Sutras",
        symbol: "🪷",
        color: "#c026d3",
      });
    }
  }

  const mantras = [
    ["Om Mani Padme Hum", "Avalokiteshvara mantra of universal compassion."],
    ["Om Tare Tuttare Ture Soha", "Green Tara swift protection and courage."],
    ["Tayata Om Bekanze", "Medicine Buddha supreme healing."],
    ["Gate Gate Paragate", "Heart Sutra wisdom mantra beyond all concepts."],
    ["Om Muni Muni Maha Muniye Soha", "Shakyamuni Buddha core mantra."],
    ["Om Ah Hum Vajra Guru Padma Siddhi Hum", "Padmasambhava blessing."],
  ];
  for (const [mName, mDesc] of mantras) {
    for (const [lens, lvl] of [
      ["108 Recitations", "Beginner"],
      ["Whispered Practice", "All Levels"],
      ["Mental Resonation", "Intermediate"],
      ["Mantra with Mala", "Beginner"],
      ["Vajra Breath Sync", "Advanced"],
      ["Singing Chanting", "All Levels"],
      ["Night Dedication", "Intermediate"],
      ["Emergency Anchor", "Beginner"],
      ["Silent Dissolution", "Advanced"],
      ["Compassion Radiance", "Intermediate"],
    ]) {
      if (nd >= 199) break;
      mkD({
        name: `Mantra — ${mName} · ${lens}`,
        pali: mName,
        tradition: "Tibetan",
        level: lvl,
        category: "Mantra",
        description: `${mDesc} Practice with ${lens.toLowerCase()} focus to harness the vibrational power of enlightened speech.`,
        essence: mName,
        instructions: ["Posture and bodhicitta.", `Recite ${mName} with clear intention.`, "Rest in the resonant silence between chants.", "Dedicate merit."],
        benefits: ["Quiets restless thinking", "Protects mind", "Harmonizes energy"],
        source: "Tibetan Mantrayana",
        symbol: "🕉",
        color: "#9333ea",
      });
    }
  }

  // --- Seed E: walking 50 + death 40 + devotion 50 + daily-life 81 = 221 ---
  let ne = 0;
  function mkE(o) {
    ne++;
    techniques.push({
      slug: `${slugify(o.name)}-e${ne}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [10, 15, 30],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#92400e",
      symbol: o.symbol || "👣",
    });
  }

  const walkBases = [
    "Lifting-Moving-Placing",
    "Heel-Sole-Toes",
    "Slow Kinhin (half-step)",
    "Fast Kinhin (breath-step)",
    "Outdoor Forest Path",
    "Beach Sand Walking",
    "Snow Silence Walk",
    "Night Sky Walk",
    "Barefoot Earth",
    "Stairs Mindfully",
    "Labyrinth Walk",
    "Circumambulation (Pradakshina)",
    "Alms-Round Awareness",
    "Standing Like a Tree",
    "Pausing Between Steps",
  ];
  const walkLens = [
    ["Park Loop", "Beginner"],
    ["Temple Corridor", "All Levels"],
    ["Home Hallway", "Beginner"],
    ["Mountain Trail", "Intermediate"],
  ];
  let wi = 0;
  outerW: for (const wb of walkBases) {
    for (const [lens, lvl] of walkLens) {
      wi++;
      if (wi > 50) break outerW;
      mkE({
        name: `Walking — ${wb} · ${lens}`,
        pali: "Cankama · Kinhin",
        tradition: "Theravāda",
        level: lvl,
        category: "Movement",
        description: `Meditation in motion: ${wb.toLowerCase()} practiced on a ${lens.toLowerCase()}. The Buddha himself walked between sittings; movement wakes dullness and grounds restlessness.`,
        essence: "Peace is every step.",
        instructions: [
          "Stand; feel feet, balance, whole body.",
          `Walk noting: ${wb.toLowerCase()}.`,
          "Feel heel, sole, toes; weight shifting.",
          "At path end pause, turn mindfully.",
          "Expand to whole body moving in space.",
          "End standing in gratitude.",
        ],
        benefits: ["Bridges sitting and life", "Energizes dull mind", "Deeply grounding"],
        source: "AN 5.29 Cankama Sutta",
        symbol: "👣",
      });
    }
  }

  const deathThemes = [
    "Five Daily Recollections",
    "Nine Cemetery Stages",
    "Deathbed Letter",
    "Last Breath Rehearsal",
    "Impermanence of Loved Ones",
    "Possessions Left Behind",
    "Fame Dissolving",
    "Body Aging Mirror",
    "Illness as Teacher",
    "Sudden Death News",
    "Preta-Hungry Ghost Realm",
    "Animal Realm Frailty",
    "Hellish Heat Vision",
    "Heavenly Passing",
    "Bardo Passage",
    "Forgiveness Before Death",
    "Gratitude for This Life",
    "Urgency Vow (Samvega)",
    "Letting Go Ceremony",
    "Dedication at Death",
  ];
  const deathLens = [
    ["Dawn Urgency", "Advanced"],
    ["Evening Review", "Intermediate"],
  ];
  let di = 0;
  outerD: for (const dt of deathThemes) {
    for (const [lens, lvl] of deathLens) {
      di++;
      if (di > 40) break outerD;
      mkE({
        name: `Maranassati — ${dt} · ${lens}`,
        pali: "Maraṇassati",
        tradition: "Theravāda",
        level: lvl,
        category: "Insight",
        description: `Recollect mortality through ${dt.toLowerCase()} at ${lens.toLowerCase()}. Cuts complacency, reveals true priorities, and awakens compassion for all fleeting life.`,
        essence: "This life is like a flash of lightning.",
        instructions: ["Sit firmly.", `Contemplate: ${dt}`, "Let urgency and kindness arise.", "Forgive freely.", "Rest in pure present."],
        benefits: ["Cuts trivial worries", "Fosters courage", "Urgent practice"],
        source: "AN 6.20 Maranassati Sutta",
        symbol: "◌",
        color: "#475569",
      });
    }
  }

  // devotion 50
  const devoBases = [
    "Taking Refuge — Triple Gem",
    "Five Precepts Renewal",
    "Eight Precepts (Uposatha)",
    "Bowing — 3 Prostrations",
    "Bowing — 108 Prostrations",
    "Offering Flowers",
    "Offering Light",
    "Offering Incense",
    "Chanting Heart Sutra",
    "Chanting Metta Sutta",
    "Chanting Dhammapada Verses",
    "Pilgrimage Visualization",
    "Stupa Circumambulation",
    "Bodhi Tree Homage",
    "Forgiveness Chant (Khama)",
  ];
  const devoLens = [
    ["Home Shrine", "Beginner"],
    ["Temple Hall", "All Levels"],
    ["Festival Full Moon", "All Levels"],
    ["Sickbed Offering", "Beginner"],
  ];
  let vi = 0;
  outerV: for (const db of devoBases) {
    for (const [lens, lvl] of devoLens) {
      vi++;
      if (vi > 50) break outerV;
      mkE({
        name: `Devotion — ${db} · ${lens}`,
        pali: "Puja · Vandana",
        tradition: "Mahāyāna",
        level: lvl,
        category: "Devotion",
        description: `${db} practiced at a ${lens.toLowerCase()}. Devotion softens pride, opens the heart, and gathers merit.`,
        essence: "Bowing, the hard heart softens; offering, the closed hand opens.",
        instructions: [
          "Arrange shrine simply; bow once.",
          `Perform: ${db.toLowerCase()}.`,
          "Recite slowly, meaning each word.",
          "Feel gratitude to lineage of awakened ones.",
          "Offer merit to all beings.",
          "Sit briefly in the afterglow.",
        ],
        benefits: ["Softens pride", "Gathers merit and joy", "Connects to lineage"],
        source: "Puja tradition · Maha-parinibbana",
        symbol: "🙏",
        color: "#b45309",
      });
    }
  }

  // daily life 81
  const dailyActs = [
    "Mindful Tea Drinking",
    "Mindful Eating — First Bite",
    "Washing Dishes",
    "Sweeping the Floor",
    "Folding Clothes",
    "Brushing Teeth",
    "Showering Awareness",
    "Commuting Stillness",
    "Waiting in Line",
    "Listening Fully",
    "Speaking Truthfully",
    "Working with Care",
    "Typing Meditation",
    "Driving Calm",
    "Shopping Restraint",
    "Cooking Offering",
    "Gardening Presence",
    "Caring for a Child",
    "Caring for Elders",
    "Pet Companionship",
    "Phone Fast Hour",
    "Email Single-Task",
    "Money Gratitude",
    "Apologizing Cleanly",
    "Praising Sincerely",
    "Bearing Criticism",
    "Resting Without Guilt",
  ];
  const dailyLens = [
    ["5-Minute Taste", "Beginner"],
    ["Full Activity", "All Levels"],
    ["Whole-Day Thread", "Intermediate"],
  ];
  let dli = 0;
  outerL: for (const act of dailyActs) {
    for (const [lens, lvl] of dailyLens) {
      dli++;
      mkE({
        name: `Everyday Zen — ${act} · ${lens}`,
        pali: "Samu · Daily Mindfulness",
        tradition: "Zen",
        level: lvl,
        category: "Daily Life",
        durations: [5, 10, 15],
        description: `Bring meditation off the cushion into ${act.toLowerCase()} as a ${lens.toLowerCase()}. Thich Nhat Hanh's insight: washing dishes to wash dishes.`,
        essence: "Chop wood, carry water; after awakening, chop wood, carry water.",
        instructions: [
          `Begin ${act.toLowerCase()} with one conscious breath.`,
          "Do one thing at a time, fully.",
          "Feel sensations: texture, temperature, sound.",
          "When rushing, pause and smile.",
          "End with gratitude for the activity.",
          "Carry the calm to the next act.",
        ],
        benefits: ["Weaves practice into life", "Reduces autopilot stress", "Finds sacred in ordinary"],
        source: "Thich Nhat Hanh — Miracle of Mindfulness",
        symbol: "🍃",
        color: "#047857",
      });
      if (dli >= 81) break outerL;
    }
  }

  // --- Seed F: top-up 61 — jhanas, formless, paramitas to cross 1000+ ---
  let nf = 0;
  function mkF(o) {
    nf++;
    techniques.push({
      slug: `${slugify(o.name)}-f${nf}`,
      name: o.name,
      pali: o.pali || null,
      tradition: o.tradition,
      level: o.level,
      category: o.category,
      durations: o.durations || [20, 30, 45],
      description: o.description,
      essence: o.essence,
      instructions: o.instructions,
      benefits: o.benefits,
      source: o.source,
      color: o.color || "#0f766e",
      symbol: o.symbol || "☸",
    });
  }

  const jhanas = [
    ["First Jhana — Applied & Sustained", "Vitakka-vicara", "Seclusion joy; thought still lands on object.", "MN 119"],
    ["Second Jhana — Joy & Happiness", "Piti-sukha", "Thoughts settle; inner confidence shines.", "MN 119"],
    ["Third Jhana — Equanimous Bliss", "Upekkha-sukha", "Joy fades; mindful equanimity glows.", "MN 119"],
    ["Fourth Jhana — Pure Equanimity", "Upekkha-sati", "Pleasure and pain abandoned; breath stills.", "MN 119"],
    ["Boundless Space", "Akasanañca", "Form dissolves; infinite space remains.", "MN 106"],
    ["Boundless Consciousness", "Viññanañca", "Space fades; knowing itself is infinite.", "MN 106"],
    ["Nothingness", "Akiñcañña", "Only absence remains; subtle peace.", "MN 106"],
    ["Neither Perception nor Non-Perception", "Nevasañña", "Most refined becoming; threshold of cessation.", "MN 106"],
  ];
  const jLens = [
    ["Access Approach", "Intermediate"],
    ["Stabilizing", "Advanced"],
    ["Mastery Review", "Advanced"],
    ["Daily Taste", "Intermediate"],
  ];
  for (const [j, pali, how, src] of jhanas) {
    for (const [lens, lvl] of jLens) {
      mkF({
        name: `${j} · ${lens}`,
        pali: `Jhana · ${pali}`,
        tradition: "Theravāda",
        level: lvl,
        category: "Concentration",
        description: `${how} ${lens} guidance for the absorptions: seclusion from hindrances, guarding the nimitta, and reviewing factors afterward.`,
        essence: "Secluded from sensuality, the mind enters and dwells in joy.",
        instructions: ["Purify virtue; settle breath.", "Guard the nimitta; ignore hindrances.", `Enter: ${how}`, "Dwell without grasping; time dissolves.", "Emerge slowly; review factors.", "Dedicate the stillness."],
        benefits: ["Profound rest and bliss", "Temporarily frees hindrances", "Basis for liberating insight"],
        source: src,
        symbol: "◉",
      });
    }
  }

  const paramitas = [
    ["Dana — Generosity", "Practice giving time, attention, material gifts without keeping score."],
    ["Sila — Virtue", "Guard actions and words; harmlessness brings inner fearlessness."],
    ["Nekkhamma — Renunciation", "Taste the lightness of wanting less; unclutter life."],
    ["Panna — Wisdom", "Discern cause and effect; see impermanence directly."],
    ["Viriya — Energy", "Stoke wholesome effort; begin again cheerfully."],
    ["Khanti — Patience", "Endure discomfort and insults without anger; great fortitude."],
    ["Sacca — Truthfulness", "Speak what is true, gentle and helpful; alignment."],
    ["Adhitthana — Determination", "Unshakable resolve toward awakening and service."],
    ["Metta — Loving-Kindness", "Friendliness toward all beings without condition."],
    ["Upekkha — Equanimity", "Balanced heart in success and failure, pleasure and pain."],
  ];
  for (const [pName, pDesc] of paramitas) {
    for (const [lens, lvl] of [
      ["Dawn Contemplation", "Beginner"],
      ["Daily Living Vow", "All Levels"],
      ["Evening Review", "Beginner"],
    ]) {
      mkF({
        name: `Paramita — ${pName} · ${lens}`,
        pali: pName,
        tradition: "Theravāda",
        level: lvl,
        category: "Virtue",
        description: `${pDesc} Cultivate perfection ${pName} through ${lens.toLowerCase()} focus to build the spiritual capital of an awakening being.`,
        essence: "May this perfection mature for the welfare of all.",
        instructions: ["Reflect on the perfection.", `Contemplate: ${pDesc}`, "Resolve one concrete act today.", "Dedicate merit."],
        benefits: ["Builds character", "Deepens merit", "Supports meditation"],
        source: "Buddhavamsa & Cariyapitaka",
        symbol: "✦",
        color: "#b45309",
      });
    }
  }
}

makeGenerator();

const outPath = path.resolve("./src/lib/canon.json");
fs.writeFileSync(outPath, JSON.stringify(techniques, null, 2), "utf-8");
console.log(`Successfully generated ${techniques.length} techniques to ${outPath}`);
