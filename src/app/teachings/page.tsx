"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { eightfoldPath, fivePrecepts, fourNobleTruths, quotes } from "@/lib/content";
import { SectionHeading } from "@/components/ui";
import { useDebounced } from "@/components/chrome";
import VowTracker from "@/components/vow-tracker";

const suttas = [
  { title: "Ānāpānasati Sutta — Mindfulness of Breathing", ref: "MN 118", body: "“Breathing in long, he knows: ‘I breathe in long.’ Breathing out short, he knows: ‘I breathe out short.’ He trains: ‘I shall breathe in experiencing the whole body… calming bodily formations.’”", theme: "Breath" },
  { title: "Satipaṭṭhāna Sutta — Four Foundations of Mindfulness", ref: "MN 10", body: "“Here a bhikkhu dwells contemplating the body in the body, ardent, clearly comprehending, mindful, having removed covetousness and displeasure in regard to the world.”", theme: "Mindfulness" },
  { title: "Mettā Sutta — Loving-Kindness", ref: "Sn 1.8", body: "“As a mother would risk her life to protect her child, her only child, even so should one cultivate a limitless heart with regard to all beings.”", theme: "Compassion" },
  { title: "Dhammacakkappavattana Sutta — Setting the Wheel in Motion", ref: "SN 56.11", body: "“This is the noble truth of suffering… This is the noble truth of the origin of suffering… of the cessation… of the way leading to cessation.” — the Buddha's first sermon.", theme: "Wisdom" },
  { title: "Dhammapada — Twin Verses", ref: "Dhp 1–2", body: "“Mind precedes all phenomena. Mind is their chief; they are all mind-wrought. If with an impure mind one speaks or acts, suffering follows as the wheel follows the ox's foot.”", theme: "Mind" },
  { title: "Kālāma Sutta — The Buddha's Charter of Inquiry", ref: "AN 3.65", body: "“Do not go by oral tradition… by logic… by appearances. But when you know for yourselves: these things are wholesome and lead to welfare — then live by them.”", theme: "Wisdom" },
  { title: "Anattalakkhaṇa Sutta — Not-Self", ref: "SN 22.59", body: "“Form is not-self. Feeling, perception, formations, consciousness are not-self. Seeing thus, the noble disciple grows disenchanted — and through dispassion is liberated.”", theme: "Insight" },
  { title: "Upajjhatthana Sutta — Five Daily Recollections", ref: "AN 5.57", body: "“I am subject to aging… illness… death… separation from all that is dear… I am the owner of my actions, heir to my actions.” Recollect daily to live urgently and kindly.", theme: "Reflection" },
  { title: "Heart Sutra — Form is Emptiness", ref: "Prajñāpāramitā", body: "“Form is emptiness, emptiness is form. No suffering, no cause, no cessation, no path — yet the bodhisattva, dwelling in this wisdom, reaches nirvāṇa.”", theme: "Emptiness" },
  { title: "Fukanzazengi — Universal Guide to Zazen", ref: "Dōgen", body: "“Think of not-thinking. How do you think of not-thinking? Non-thinking. This is the essential art of zazen. Zazen is the dharma-gate of great ease and joy.”", theme: "Zen" },
];

const tabs = ["Foundations", "Eightfold Path", "Precepts", "Suttas & Verses"] as const;

export default function TeachingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Foundations");
  const [suttaQ, setSuttaQ] = useState("");
  const dq = useDebounced(suttaQ, 200);

  const filteredSuttas = useMemo(
    () =>
      suttas.filter(
        (s) =>
          !dq ||
          (s.title + s.body + s.theme + s.ref).toLowerCase().includes(dq.toLowerCase())
      ),
    [dq]
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <SectionHeading
        eyebrow="Buddhadhamma · now with Guide"
        title="Teachings to carry into your sitting"
        sub="Read slowly. The Dhamma is not information but medicine — take one teaching and live with it for a day."
      />

      <div className="mt-6 rounded-3xl border border-amber-900/15 bg-[#1c1917] p-5 text-center text-stone-200 md:p-6">
        <p className="text-sm">🪷 Confused where to start? <span className="font-bold text-amber-300">Bodhi Guide</span> builds a study + sit plan from your mood.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link href="/library" className="rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400">Ask the Guide →</Link>
          <Link href="/practice" className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold hover:border-amber-400">Sit 10 min →</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Teachings sections">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${tab === t ? "bg-stone-900 text-amber-50 shadow-lg" : "border border-stone-300 bg-white text-stone-600 hover:border-amber-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Foundations" && (
        <section className="mt-10">
          <h2 className="font-display text-center text-3xl font-semibold">The Four Noble Truths</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-stone-500">The Buddha&apos;s first teaching — diagnosis, cause, prognosis, and prescription.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {fourNobleTruths.map((t) => (
              <div key={t.n} className="rounded-3xl border border-amber-900/10 bg-white p-7 shadow-sm">
                <span className="font-display text-5xl font-semibold text-amber-700/30">{t.n}</span>
                <h3 className="font-display mt-1 text-2xl font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{t.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-[#1c1917] p-8 text-center text-stone-300">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">The Three Marks of Existence</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { p: "Anicca", t: "Impermanence", d: "All conditioned things arise and pass. Nothing stays — not joy, not sorrow, not even this breath." },
                { p: "Dukkha", t: "Unsatisfactoriness", d: "Because things change, clinging to them as stable brings suffering. Peace comes from release." },
                { p: "Anattā", t: "Not-self", d: "Body, feelings, thoughts — none are a solid 'me'. Seeing this dissolves fear and opens compassion." },
              ].map((m) => (
                <div key={m.p} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="font-display text-2xl italic text-amber-300">{m.p}</p>
                  <p className="mt-1 font-bold text-amber-50">{m.t}</p>
                  <p className="mt-2 text-[0.83rem] leading-relaxed text-stone-400">{m.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "Eightfold Path" && (
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {eightfoldPath.map((f, i) => (
            <div key={f.name} className="rounded-3xl border border-amber-900/10 bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="font-display grid h-11 w-11 place-items-center rounded-full bg-stone-900 text-lg font-semibold text-amber-100">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-stone-900">{f.name}</h3>
                  <p className="text-xs italic text-amber-800">{f.pali}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{f.description}</p>
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[0.8rem] font-medium text-amber-900">🪷 Practice: {f.practice}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "Precepts" && (
        <section className="mx-auto mt-8 max-w-4xl">
          <VowTracker />
        </section>
      )}

      {tab === "Suttas & Verses" && (
        <section className="mt-10">
          <input
            value={suttaQ}
            onChange={(e) => setSuttaQ(e.target.value)}
            placeholder="Search the discourses — 'breath', 'kindness', 'death'…"
            className="mx-auto block w-full max-w-xl rounded-full border border-amber-900/20 bg-white px-6 py-3 text-sm outline-none focus:border-amber-700"
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredSuttas.map((s) => (
              <article key={s.title} className="rounded-3xl border border-amber-900/10 bg-white p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-900/8 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-amber-900">{s.theme}</span>
                  <span className="text-xs font-mono text-stone-400">{s.ref}</span>
                </div>
                <h3 className="font-display mt-2 text-xl font-semibold leading-snug">{s.title}</h3>
                <p className="font-display mt-2 border-l-2 border-amber-500 pl-4 text-[1.02rem] italic leading-relaxed text-stone-700">{s.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-[#1c1917] p-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Words to sit with</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {quotes.slice(0, 6).map((q) => (
                <p key={q.text} className="rounded-2xl bg-white/5 p-4 text-sm italic text-stone-300">
                  “{q.text}” <span className="mt-1 block text-xs not-italic text-amber-200/70">— {q.source}</span>
                </p>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
