export default function JourneyLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16" aria-busy="true">
      <div className="mx-auto max-w-xl text-center">
        <div className="skeleton mx-auto h-6 w-36 rounded-full" />
        <div className="skeleton mx-auto mt-4 h-11 w-2/3 rounded-2xl" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </main>
  );
}
