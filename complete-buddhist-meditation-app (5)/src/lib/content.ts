export type BreathPattern = {
  id: string;
  name: string;
  pali?: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  cycles: string;
};

export const breathPatterns: BreathPattern[] = [
  {
    id: "anapana",
    name: "Anāpāna Natural Breath",
    pali: "Ānāpānasati",
    description: "Simply observe the natural breath without controlling it. The foundation of all Buddhist meditation.",
    inhale: 4,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    cycles: "Natural rhythm",
  },
  {
    id: "box",
    name: "Box Breathing",
    pali: "Samavṛtti",
    description: "Equal four-count phases to steady the nervous system before sitting. Used to settle restlessness.",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    cycles: "4 · 4 · 4 · 4",
  },
  {
    id: "478",
    name: "Deep Calming Breath",
    description: "Extended exhale activates the parasympathetic system — ideal for evening practice and anxiety.",
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    cycles: "4 · 7 · 8",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    description: "Slow 5.5 breaths per minute. Research-backed rhythm for heart coherence and samādhi.",
    inhale: 5,
    holdIn: 0,
    exhale: 5,
    holdOut: 0,
    cycles: "5 · 5",
  },
  {
    id: "metta-breath",
    name: "Mettā Breath",
    pali: "Mettā Bhāvanā",
    description: "Breathe in receiving kindness, breathe out radiating it to all beings in six directions.",
    inhale: 4,
    holdIn: 2,
    exhale: 6,
    holdOut: 0,
    cycles: "4 · 2 · 6",
  },
];

export type Meditation = {
  slug: string;
  name: string;
  pali: string;
  tradition: "Theravāda" | "Mahāyāna" | "Zen" | "Tibetan" | "All Traditions";
  level: "Beginner" | "All Levels" | "Intermediate" | "Advanced";
  durations: number[];
  description: string;
  essence: string;
  instructions: string[];
  cues: { at: number; text: string }[];
  benefits: string[];
  source: string;
  color: string;
  symbol: string;
};

export const meditations: Meditation[] = [
  {
    slug: "anapanasati",
    name: "Mindfulness of Breathing",
    pali: "Ānāpānasati",
    tradition: "Theravāda",
    level: "Beginner",
    durations: [5, 10, 20, 30, 45],
    description:
      "The Buddha's core meditation, taught in the Ānāpānasati Sutta. Rest attention at the nostrils or abdomen and know each in-breath and out-breath with clear, gentle awareness.",
    essence: "Breathing in, I calm my body. Breathing out, I smile.",
    instructions: [
      "Sit with spine erect yet relaxed — on cushion, chair, or bench. Rest hands gently.",
      "Close eyes softly. Take three deep, intentional breaths to arrive.",
      "Rest attention where the breath is clearest: nostrils, chest, or belly rise and fall.",
      "Mentally note 'in' on inhalation, 'out' on exhalation — without controlling the breath.",
      "When the mind wanders (it will), smile, label it 'thinking', and return to the breath.",
      "In the final minutes, widen awareness to the whole body sitting and breathing.",
      "End by dedicating merit: 'May all beings be happy and free.'",
    ],
    cues: [
      { at: 0, text: "Arrive. Feel the weight of the body, the contact with the earth." },
      { at: 0.15, text: "Soften the shoulders. Relax the jaw. Let the breath breathe itself." },
      { at: 0.35, text: "Know the in-breath as in-breath. Know the out-breath as out-breath." },
      { at: 0.55, text: "If lost in thought, return with kindness. Beginning again is the practice." },
      { at: 0.75, text: "Rest in the pause between breaths. Calm, clear, present." },
      { at: 0.9, text: "Expand awareness to the whole body. Breathe with the whole being." },
    ],
    benefits: ["Calms anxiety & restlessness", "Builds concentration (samādhi)", "Foundation for insight (vipassanā)"],
    source: "Majjhima Nikāya 118 — Ānāpānasati Sutta",
    color: "#b45309",
    symbol: "◉",
  },
  {
    slug: "vipassana",
    name: "Insight Meditation",
    pali: "Vipassanā",
    tradition: "Theravāda",
    level: "Intermediate",
    durations: [15, 30, 45, 60],
    description:
      "Systematic observation of body, feelings, mind, and phenomena as taught in the Satipaṭṭhāna Sutta. See the three marks: impermanence, unsatisfactoriness, and not-self.",
    essence: "Whatever arises, know it as it is — arising and passing away.",
    instructions: [
      "Begin with 5 minutes of ānāpānasati to steady the mind.",
      "Sweep attention slowly through the body from crown to feet. Note sensations: warmth, tingling, pressure.",
      "Label experience softly: 'hearing, hearing', 'aching', 'thinking', 'pleasant', 'unpleasant'.",
      "Observe how each sensation arises, stays a moment, and dissolves. Nothing to hold.",
      "When emotions arise, feel them in the body rather than following the story.",
      "Rest in choiceless awareness — open to whatever is most prominent.",
      "Close by contemplating impermanence: 'All conditioned things pass away.'",
    ],
    cues: [
      { at: 0, text: "Steady the mind on the breath. Let stillness gather." },
      { at: 0.2, text: "Begin the body sweep. Notice sensation without judging." },
      { at: 0.4, text: "Note: arising… passing. Pleasant, unpleasant, neutral." },
      { at: 0.6, text: "If emotion comes, where do you feel it in the body? Breathe with it." },
      { at: 0.8, text: "Rest in open awareness. Let everything come and go." },
      { at: 0.92, text: "Contemplate: sabbe saṅkhārā aniccā — all formations are impermanent." },
    ],
    benefits: ["Deep insight into impermanence", "Dissolves reactivity & clinging", "Path to liberation"],
    source: "Majjhima Nikāya 10 — Satipaṭṭhāna Sutta",
    color: "#0f766e",
    symbol: "☸",
  },
  {
    slug: "metta",
    name: "Loving-Kindness",
    pali: "Mettā Bhāvanā",
    tradition: "All Traditions",
    level: "Beginner",
    durations: [10, 15, 20, 30],
    description:
      "The systematic cultivation of boundless goodwill. Radiate kindness first to yourself, then a benefactor, friend, neutral person, difficult person, and finally all beings.",
    essence: "May all beings be happy. May all beings be free from suffering.",
    instructions: [
      "Recall your own goodness. Place a hand on the heart and offer: 'May I be happy, may I be safe.'",
      "Picture a benefactor — someone who has cared for you. Radiate the same wishes to them.",
      "Bring to mind a dear friend. Feel joy in their happiness.",
      "Bring a neutral person — a shopkeeper, a stranger. Recognize our shared wish to be happy.",
      "Gently bring a difficult person. Begin with small difficulties. Wish them freedom from suffering.",
      "Radiate outward: this room, this town, this world, in all directions — boundless as the sky.",
      "Rest in the warm afterglow. Let loving-kindness be your dwelling place.",
    ],
    cues: [
      { at: 0, text: "Hand on heart. Offer kindness to yourself: May I be happy, may I be at peace." },
      { at: 0.18, text: "Picture your benefactor smiling. May you be happy, may you be safe." },
      { at: 0.36, text: "A dear friend. Rejoice in their wellbeing. May your happiness continue." },
      { at: 0.54, text: "A neutral person. Just like me, they wish to be happy." },
      { at: 0.7, text: "A difficult person. May you be free from suffering. May we both be at peace." },
      { at: 0.86, text: "Radiate in all directions — above, below, around. Sabbe sattā sukhitattā." },
    ],
    benefits: ["Dissolves anger & resentment", "Improves sleep & relationships", "Blissful, radiant mind"],
    source: "Sutta Nipāta 1.8 — Karaṇīya Mettā Sutta",
    color: "#be123c",
    symbol: "♥",
  },
  {
    slug: "zazen",
    name: "Just Sitting",
    pali: "Zazen · Shikantaza",
    tradition: "Zen",
    level: "All Levels",
    durations: [10, 20, 25, 40],
    description:
      "Sōtō Zen's formless meditation: sit with dignity, follow the breath lightly, and let thoughts pass like clouds. No gaining mind — sitting itself is enlightenment.",
    essence: "Sitting itself is the koan. Nothing to attain, nowhere to go.",
    instructions: [
      "Sit in lotus, half-lotus, burmese, or seiza. Rock gently, then settle immovable like a mountain.",
      "Eyes half-open, gaze cast down at 45°. Tongue to palate, chin tucked slightly.",
      "Left hand cradles right, thumbs lightly touching — the cosmic mudrā resting on the feet.",
      "Breathe naturally through the nose, deep into the hara (belly). Count exhalations 1–10 if needed.",
      "Think not-thinking: when thoughts come, neither grasp nor suppress — let them dissolve.",
      "Sit with the posture of a Buddha. Upright, vast, present.",
      "Rise slowly with gasshō — palms together — bowing to all beings.",
    ],
    cues: [
      { at: 0, text: "Settle like a mountain. Rock, straighten, become still." },
      { at: 0.2, text: "Half-open eyes. Soft gaze. Breathe into the hara." },
      { at: 0.4, text: "Count the exhalations 1 to 10, then begin again." },
      { at: 0.6, text: "Drop the counting. Just sit. Think not-thinking." },
      { at: 0.8, text: "Body and mind fall away. Sitting is itself Buddha." },
      { at: 0.95, text: "Prepare to rise. Gasshō. Bow to all beings." },
    ],
    benefits: ["Profound stillness", "Embodied presence & posture", "Direct realization of buddha-nature"],
    source: "Dōgen Zenji — Fukanzazengi",
    color: "#1e293b",
    symbol: "●",
  },
  {
    slug: "tonglen",
    name: "Giving and Taking",
    pali: "Tonglen",
    tradition: "Tibetan",
    level: "Intermediate",
    durations: [10, 15, 25, 35],
    description:
      "Tibetan lojong practice of exchanging self for others: breathe in suffering as dark smoke, transform it in the heart, and breathe out relief as luminous light.",
    essence: "Breathe in pain, breathe out compassion. Let the heart become boundless.",
    instructions: [
      "Begin with bodhicitta motivation: 'By this practice may all beings be free.'",
      "Rest in openness a moment — mind like vast sky.",
      "Bring to mind someone suffering. See their pain as thick grey smoke.",
      "Breathe in the smoke through the nostrils into the heart, where it dissolves a hard knot of self-clinging.",
      "Breathe out cool, luminous moonlight carrying relief, joy, and whatever they need.",
      "Extend gradually: loved ones, strangers, enemies, all beings in all realms.",
      "End resting in luminous emptiness, dedicating all merit to all beings.",
    ],
    cues: [
      { at: 0, text: "Set the motivation: may this practice benefit all beings." },
      { at: 0.15, text: "Rest the mind like vast sky. Open, spacious, tender." },
      { at: 0.3, text: "See their suffering as smoke. Breathe it in. Let it dissolve self-clinging." },
      { at: 0.5, text: "Breathe out moonlight — relief, cooling, joy. Give them what they need." },
      { at: 0.7, text: "Expand: friends, strangers, enemies — all beings everywhere." },
      { at: 0.88, text: "Rest in luminosity. Dedicate the merit: may all be free." },
    ],
    benefits: ["Awakens fearless compassion", "Transforms aversion to suffering", "Loosens self-grasping"],
    source: "Atisha — Seven Points of Mind Training (Lojong)",
    color: "#7c3aed",
    symbol: "☾",
  },
  {
    slug: "body-scan",
    name: "Sweeping Body Awareness",
    pali: "Kāyagatāsati",
    tradition: "Theravāda",
    level: "Beginner",
    durations: [10, 20, 30],
    description:
      "A gentle lying or sitting journey of attention through the body. Releases stored tension and anchors the mind in direct sensation — a doorway to the first foundation of mindfulness.",
    essence: "In this body I will dwell, attentive and at peace.",
    instructions: [
      "Lie down or sit comfortably. Let the eyes close. Feel the whole body at once.",
      "Bring attention to the crown. Notice whatever is there — or its absence.",
      "Move slowly down: forehead, eyes, jaw, throat — softening each region as you pass.",
      "Continue through shoulders, arms, hands, chest, belly, back, hips, legs, feet.",
      "Where you meet tension, breathe into it. Let the out-breath carry softening.",
      "Rest in whole-body awareness — vibrating, alive, breathing.",
      "Wiggle fingers and toes. Rise gently, carrying gentleness into movement.",
    ],
    cues: [
      { at: 0, text: "Arrive in the body. Feel its weight, its warmth, its aliveness." },
      { at: 0.2, text: "Crown, forehead, eyes… soften each doorway as you pass." },
      { at: 0.4, text: "Shoulders, arms, hands. Breathe space into any holding." },
      { at: 0.6, text: "Chest, belly, back. Let the breath massage from within." },
      { at: 0.8, text: "Hips, legs, feet. Root into the earth." },
      { at: 0.92, text: "Whole body breathing. Whole body at peace." },
    ],
    benefits: ["Releases physical tension", "Improves sleep & body awareness", "Gentle entry for beginners"],
    source: "Satipaṭṭhāna Sutta — Kāyānupassanā",
    color: "#047857",
    symbol: "❀",
  },
  {
    slug: "walking",
    name: "Walking Meditation",
    pali: "Caṅkamana",
    tradition: "Theravāda",
    level: "All Levels",
    durations: [10, 15, 30],
    description:
      "Meditation in motion, practiced by the Buddha himself between sittings. Walk slowly with full awareness of each lifting, moving, and placing of the foot.",
    essence: "Peace is every step. The earth kisses our feet with every landing.",
    instructions: [
      "Choose a straight path of 10–20 paces. Stand, hands clasped, and feel standing.",
      "Note silently: 'lifting, moving, placing' with each step. Walk slower than usual.",
      "Feel the heel, sole, toes; weight shifting; balance and sway.",
      "At the end of the path, pause. Note 'stopping, turning, standing' — then walk back.",
      "When the mind wanders, stop, smile, return to the feet.",
      "Gradually expand awareness: legs, whole body moving through space.",
      "End standing, feeling gratitude for the earth that holds you.",
    ],
    cues: [
      { at: 0, text: "Stand. Feel the feet, the balance, the whole body standing." },
      { at: 0.2, text: "Begin: lifting… moving… placing. Slow and dignified." },
      { at: 0.45, text: "Feel each texture beneath the feet. Kiss the earth with your steps." },
      { at: 0.65, text: "Arriving at the end: stopping… turning… standing." },
      { at: 0.85, text: "Expand to the whole body walking through space." },
      { at: 0.95, text: "Stand in gratitude. Peace is every step." },
    ],
    benefits: ["Bridges sitting & daily life", "Energizes drowsy mind", "Deeply grounding"],
    source: "Aṅguttara Nikāya 5.29 — Caṅkama Sutta",
    color: "#92400e",
    symbol: " footsteps ",
  },
  {
    slug: "contemplation-death",
    name: "Mindfulness of Death",
    pali: "Maraṇasati",
    tradition: "Theravāda",
    level: "Advanced",
    durations: [15, 20, 30],
    description:
      "A profound reflection on impermanence and the preciousness of this human life. Not morbid — clarifying. It strips away the trivial and reveals what truly matters.",
    essence: "This life is fleeting as breath on a mirror. How shall I live today?",
    instructions: [
      "Sit steadily. Contemplate: 'My death is certain; its time is uncertain.'",
      "Reflect on the body: this body too is of the nature to age, sicken, and die.",
      "Contemplate the five daily recollections: I am subject to aging, illness, death, separation, and am heir to my actions.",
      "Ask: 'If tonight were my last night, what would I let go of? Whom would I forgive?'",
      "Feel the preciousness of this breath — a gift not guaranteed to repeat.",
      "Resolve: 'Let me live this day with mindfulness, kindness, and urgency.'",
      "End with mettā — cherishing this brief, luminous life and all beings sharing it.",
    ],
    cues: [
      { at: 0, text: "Death is certain. Its hour is unknown. Let this clarify the heart." },
      { at: 0.25, text: "This body: subject to aging, illness, death. Hold it with tenderness." },
      { at: 0.45, text: "All I love will change. Whom would you forgive tonight?" },
      { at: 0.65, text: "This breath may be your last gift. Breathe it fully." },
      { at: 0.85, text: "Resolve: to live this day awake, kind, and free." },
      { at: 0.95, text: "Mettā for all brief lives. May we use this precious birth well." },
    ],
    benefits: ["Cuts through procrastination", "Deep gratitude & priorities", "Fearlessness & urgency (saṃvega)"],
    source: "Aṅguttara Nikāya 6.20 — Maraṇassati Sutta",
    color: "#44403c",
    symbol: "◌",
  },
];

export type Quote = { text: string; source: string };

export const quotes: Quote[] = [
  { text: "Peace comes from within. Do not seek it without.", source: "The Buddha — Dhammapada" },
  { text: "You only lose what you cling to.", source: "The Buddha" },
  { text: "Better than a thousand hollow words is one word that brings peace.", source: "Dhammapada, v.100" },
  { text: "All that we are arises with our thoughts. With our thoughts we make the world.", source: "Dhammapada, v.1" },
  { text: "Holding onto anger is like grasping a hot coal to throw at someone — you are the one who gets burned.", source: "Attributed to the Buddha" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", source: "Aṅguttara Nikāya 3.129" },
  { text: "No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.", source: "Dhammapada, v.165" },
  { text: "Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is an eternal law.", source: "Dhammapada, v.5" },
  { text: "The mind is everything. What you think, you become.", source: "The Buddha" },
  { text: "If you truly loved yourself, you could never hurt another.", source: "The Buddha" },
  { text: "Breathing in, I calm my body. Breathing out, I smile.", source: "Thích Nhất Hạnh" },
  { text: "Smile, breathe, and go slowly.", source: "Thích Nhất Hạnh" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", source: "Thích Nhất Hạnh" },
  { text: "Walk as if you are kissing the earth with your feet.", source: "Thích Nhất Hạnh" },
  { text: "Meditation is not evasion. It is a serene encounter with reality.", source: "Thích Nhất Hạnh" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", source: "The Buddha" },
  { text: "Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship.", source: "Dhammapada, v.204" },
  { text: "Just as a candle cannot burn without fire, men cannot live without a spiritual life.", source: "The Buddha" },
  { text: "Patience is the highest austerity. Nibbāna is supreme, say the Buddhas.", source: "Dhammapada, v.184" },
  { text: "As rain breaks through an ill-thatched house, so passion breaks through an unreflecting mind.", source: "Dhammapada, v.13" },
  { text: "In separateness lies the world's great misery; in compassion lies the world's true strength.", source: "The Buddha" },
  { text: "Everything that has a beginning has an ending. Make your peace with that and all will be well.", source: "The Buddha — Mahāparinibbāna Sutta" },
  { text: "To understand everything is to forgive everything.", source: "The Buddha" },
  { text: "Radiate boundless love towards the entire world.", source: "Mettā Sutta" },
];

export const eightfoldPath = [
  { name: "Right View", pali: "Sammā Diṭṭhi", description: "Seeing the Four Noble Truths — understanding suffering, its cause, its end, and the path.", practice: "Study the Dhamma daily. Question your assumptions." },
  { name: "Right Intention", pali: "Sammā Saṅkappa", description: "Intentions of renunciation, goodwill, and harmlessness rather than craving and ill-will.", practice: "Begin each sit by setting a compassionate motivation." },
  { name: "Right Speech", pali: "Sammā Vācā", description: "Truthful, kind, helpful speech — abstaining from lying, harshness, gossip, and idle chatter.", practice: "Pause before speaking. Is it true, kind, timely?" },
  { name: "Right Action", pali: "Sammā Kammanta", description: "Acting with non-harming: honoring the precepts in body — no killing, stealing, or sexual misconduct.", practice: "Keep the Five Precepts as your daily vow." },
  { name: "Right Livelihood", pali: "Sammā Ājīva", description: "Earning a living without harming beings — avoiding weapons, intoxicants, exploitation.", practice: "Review: does my work reduce suffering?" },
  { name: "Right Effort", pali: "Sammā Vāyāma", description: "The four great efforts: prevent unwholesome states, abandon them, cultivate the wholesome, maintain them.", practice: "Notice hindrances and gently abandon them." },
  { name: "Right Mindfulness", pali: "Sammā Sati", description: "Sustained awareness of body, feelings, mind, and phenomena — the heart of this app.", practice: "Return to the breath 21 times a day." },
  { name: "Right Concentration", pali: "Sammā Samādhi", description: "The four jhānas — deep, unified stillness born of seclusion and letting go.", practice: "Sit daily. Let samādhi ripen naturally." },
];

export const fourNobleTruths = [
  { n: "I", title: "Dukkha — There is suffering", body: "Birth, aging, illness, death, separation from the loved, association with the disliked, not getting what one wants — all carry suffering. Even pleasant things, being impermanent, cannot fully satisfy." },
  { n: "II", title: "Samudaya — Suffering has a cause", body: "Craving (taṇhā): craving for pleasure, for existence, for non-existence. Clinging to what changes is the origin of sorrow." },
  { n: "III", title: "Nirodha — Suffering can end", body: "Nibbāna — the complete fading and cessation of craving. A peace beyond conditions, realizable here and now." },
  { n: "IV", title: "Magga — There is a path", body: "The Noble Eightfold Path: view, intention, speech, action, livelihood, effort, mindfulness, concentration. Walked step by step, breath by breath." },
];

export const fivePrecepts = [
  { name: "Not to kill", pali: "Pāṇātipātā veramaṇī", detail: "Honor all life — from insects to humans. Practice harmlessness in thought and deed." },
  { name: "Not to steal", pali: "Adinnādānā veramaṇī", detail: "Take only what is freely given. Respect others' time, trust, and belongings." },
  { name: "No sexual misconduct", pali: "Kāmesu micchācārā veramaṇī", detail: "Honor fidelity, consent, and gentleness in intimate relations." },
  { name: "Not to lie", pali: "Musāvādā veramaṇī", detail: "Speak truth with kindness. Abandon gossip, harshness, and deceit." },
  { name: "No intoxicants", pali: "Surāmeraya-majja veramaṇī", detail: "Keep the mind clear and heedful. Abstain from drink and drugs that cloud awareness." },
];

export const journalPrompts = [
  "What is alive in me right now — body, heart, mind?",
  "What am I clinging to that I could loosen, just a little?",
  "Whom do I need to forgive — including myself?",
  "What small kindness did I witness or offer today?",
  "What does my suffering want to teach me?",
  "How did my sitting practice feel today? What did I notice?",
  "What would I do today if I truly remembered life is brief?",
  "What am I grateful for that I usually overlook?",
  "Where did I act with mindfulness today? Where did I forget?",
  "What intention do I set for tomorrow?",
];

export function dailyItem<T>(list: T[], date = new Date()): T {
  const dayIndex =
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return list[((dayIndex % list.length) + list.length) % list.length];
}
