"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { quotes, type Quote } from "@/lib/content";
import { useToast } from "@/components/chrome";

export default function DharmaQuoteWidget() {
  const [index, setIndex] = useState(() => {
    // Pick daily quote based on calendar day or random
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return day % quotes.length;
  });
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const currentQuote = useMemo<Quote>(() => quotes[index] || quotes[0], [index]);

  const nextQuote = () => {
    setIndex((prev) => (prev + 1) % quotes.length);
  };

  const copyVerse = () => {
    const text = `“${currentQuote.text}” — ${currentQuote.source}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Verse copied to clipboard ✦");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-900/15 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-stone-100/60 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-900/15 bg-white/80 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber-900 shadow-xs">
          <span>☸</span>
          <span>Dharma Contemplation</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyVerse}
            aria-label="Copy verse"
            title="Copy verse"
            className="rounded-full border border-stone-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-stone-600 transition hover:border-amber-700 hover:text-amber-900"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          <button
            onClick={nextQuote}
            aria-label="Next contemplative quote"
            title="Next verse"
            className="inline-flex items-center gap-1 rounded-full border border-stone-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-stone-600 transition hover:border-amber-700 hover:text-amber-900"
          >
            <span>↻</span>
            <span>Inspire me</span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <blockquote className="font-display text-balance text-xl italic font-medium leading-relaxed text-stone-900 md:text-[1.35rem]">
            “{currentQuote.text}”
          </blockquote>
          <p className="mt-2 text-xs font-semibold tracking-wide text-amber-800">
            — {currentQuote.source}
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/practice?minutes=10"
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-bold text-amber-50 shadow-sm transition hover:bg-amber-900 hover:shadow"
          >
            <span>🔔 Sit with this verse</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
