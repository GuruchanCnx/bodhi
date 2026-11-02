"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="text-5xl" aria-hidden>🌧</p>
      <h1 className="font-display mt-4 text-3xl font-semibold">A cloud passed over the sanctuary</h1>
      <p className="mt-2 text-sm text-stone-600">
        Even the Buddha met storms. Breathe once, then try again.
        {error.digest && <span className="mt-1 block font-mono text-xs text-stone-400">{error.digest}</span>}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-amber-50 hover:bg-amber-900">
          Try again ↺
        </button>
        <a href="/" className="rounded-full border border-stone-300 px-6 py-3 text-sm font-bold hover:border-amber-700">Home</a>
      </div>
    </main>
  );
}
