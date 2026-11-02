export default function LibraryLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16" aria-busy="true">
      <div className="mx-auto max-w-xl text-center">
        <div className="skeleton mx-auto h-6 w-32 rounded-full" />
        <div className="skeleton mx-auto mt-4 h-11 w-3/4 rounded-2xl" />
        <div className="skeleton mx-auto mt-3 h-5 w-1/2 rounded-full" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-36 rounded-3xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-56 rounded-3xl" />
        ))}
      </div>
    </main>
  );
}
