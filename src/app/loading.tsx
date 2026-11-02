export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-20 text-center" aria-busy="true" aria-label="Loading">
      <p className="font-display text-5xl" aria-hidden>🪷</p>
      <p className="font-display mt-4 text-2xl italic text-stone-600">Arranging the cushions…</p>
      <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-36 rounded-3xl" />
        ))}
      </div>
    </main>
  );
}
