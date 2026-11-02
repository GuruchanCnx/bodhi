import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Bodhi handles your practice data — local-first, no trackers, exportable anytime.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">Privacy</p>
      <h1 className="font-display ios-title mt-2 text-4xl md:text-5xl">Your practice, your data</h1>
      <div className="liquid-card squircle mt-6 space-y-5 p-6 text-sm leading-relaxed md:p-8">
        <section>
          <h2 className="font-semibold">Where your data lives</h2>
          <p className="mt-1 opacity-80">
            Sittings, reflections, and plans are stored in the sanctuary&apos;s PostgreSQL database
            behind this app. Nothing is sold, shared, or sent to third parties. There are no
            analytics scripts, no ad pixels, no cookies for tracking.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">What stays on your device</h2>
          <p className="mt-1 opacity-80">
            Theme mode, bookmarks, recent methods, timer preferences, drafts, and Guide conversation
            history are kept in your browser&apos;s localStorage so the sanctuary opens instantly. Clear
            them any time from Settings → Your data, or by clearing site data.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Voice features</h2>
          <p className="mt-1 opacity-80">
            Spoken cues and Guide voice input use your device&apos;s own speech engines
            (Web Speech). Transcripts are processed by the browser vendor when those engines require
            it — Bodhi never records or stores audio.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Export &amp; delete</h2>
          <p className="mt-1 opacity-80">
            Export a complete JSON backup from <Link href="/settings" className="font-semibold underline">Settings → Your data</Link>.
            Individual sittings and reflections can be deleted from your Journey and Journal at any
            moment — deletion is immediate and permanent.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">The promise</h2>
          <p className="mt-1 opacity-80">
            A meditation sanctuary should feel safe. If anything here ever needs to change, the
            change will be written here first, in plain language.
          </p>
        </section>
      </div>
    </main>
  );
}
