export default function PracticeLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16" aria-busy="true">
      <div className="mx-auto max-w-xl text-center">
        <div className="skeleton mx-auto h-6 w-40 rounded-full" />
        <div className="skeleton mx-auto mt-4 h-12 w-3/4 rounded-2xl" />
        <div className="skeleton mx-auto mt-3 h-5 w-2/3 rounded-full" />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr_300px]">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </main>
  );
}
