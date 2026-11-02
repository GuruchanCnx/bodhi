import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="text-5xl" aria-hidden>🍂</p>
      <h1 className="font-display mt-4 text-4xl font-semibold">This path has dissolved</h1>
      <p className="mt-2 text-sm text-stone-600">Like all formations, this page is impermanent — it was never here. Let&apos;s return to the breath.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-stone-900 px-6 py-3 text-sm font-bold text-amber-50 hover:bg-amber-900">Home 🪷</Link>
        <Link href="/library" className="rounded-full border border-stone-300 px-6 py-3 text-sm font-bold hover:border-amber-700">Library 📚</Link>
      </div>
    </main>
  );
}
