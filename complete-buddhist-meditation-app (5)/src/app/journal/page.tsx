"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { journalPrompts, dailyItem } from "@/lib/content";
import { SectionHeading, SkeletonCard } from "@/components/ui";
import { FoldHint } from "@/components/adaptive";
import { cachedFetch, useDebounced, useToast } from "@/components/chrome";

type Entry = {
  id: string; title: string; content: string; mood: string | null;
  prompt: string | null; gratitude: string | null; createdAt: string;
};

const moods = ["🌧 Difficult", "🌫 Cloudy", "🍃 Neutral", "🌤 Clear", "☀️ Radiant"];

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [prompt, setPrompt] = useState(dailyItem(journalPrompts));
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const dq = useDebounced(search, 250);
  const toast = useToast();

  // autosave draft (survives navigation/crash)
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("bodhi-draft") || "{}");
      if (d.content && !editing) {
        setTitle(d.title || ""); setContent(d.content || "");
        setMood(d.mood || ""); setGratitude(d.gratitude || "");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem("bodhi-draft", JSON.stringify({ title, content, mood, gratitude }));
    } catch {}
  }, [title, content, mood, gratitude, editing]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await cachedFetch<{ entries: Entry[] }>("/api/journal?limit=100", 15_000);
      setEntries(data.entries ?? []);
    } catch {
      try {
        const res = await fetch("/api/journal?limit=100");
        const data = await res.json();
        setEntries(data.entries ?? []);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const words = useMemo(() => (content.trim() ? content.trim().split(/\s+/).length : 0), [content]);

  const save = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    const optimistic: Entry = {
      id: editing ?? `tmp-${Date.now()}`,
      title: title || "Untitled reflection",
      content, mood: mood || null, prompt: editing ? null : prompt,
      gratitude: gratitude || null, createdAt: new Date().toISOString(),
    };
    const prev = entries;
    if (!editing) setEntries((e) => [optimistic, ...e]);
    try {
      if (editing) {
        await fetch("/api/journal", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing, title: optimistic.title, content, mood, gratitude }),
        });
        toast("✓ Reflection updated");
      } else {
        const res = await fetch("/api/journal", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: optimistic.title, content, mood, gratitude, prompt }),
        });
        if (res.ok) toast("✦ Reflection saved");
      }
      setTitle(""); setContent(""); setMood(""); setGratitude("");
      setEditing(null);
      try { localStorage.removeItem("bodhi-draft"); } catch {}
      setPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)]);
      // bust cache
      await fetch("/api/journal?limit=100").then((r) => r.json()).then((d) => setEntries(d.entries ?? [])).catch(() => load(true));
    } catch {
      setEntries(prev);
      toast("Could not save — offline?", "info");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Release this entry? (delete)")) return;
    const prev = entries;
    setEntries((e) => e.filter((x) => x.id !== id));
    try {
      await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
      toast("Released 🍂");
    } catch {
      setEntries(prev);
    }
  };

  const startEdit = (e: Entry) => {
    setEditing(e.id); setTitle(e.title); setContent(e.content);
    setMood(e.mood ?? ""); setGratitude(e.gratitude ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportAll = () => {
    const text = entries.map((e) => `# ${e.title}\n${new Date(e.createdAt).toLocaleString()} ${e.mood ?? ""}\n\n${e.content}\n\nGrateful: ${e.gratitude ?? "—"}\n---`).join("\n\n");
    const blob = new Blob([text || "No entries yet."], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bodhi-journal.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filtered = useMemo(
    () => entries.filter((e) => !dq || (e.title + e.content + (e.gratitude ?? "")).toLowerCase().includes(dq.toLowerCase())),
    [entries, dq]
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <SectionHeading
        eyebrow="Sati Journal · autosaved drafts"
        title="After sitting, put the heart into words"
        sub="Wise reflection (yoniso manasikāra). Drafts autosave locally · {entries.length} reflections · export anytime."
      />

      <div className="mt-3 flex justify-center"><FoldHint /></div>
      <div className="dual-h mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="h-fit rounded-[1.75rem] border border-amber-900/10 bg-white p-6 shadow-sm md:p-7 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">{editing ? "Edit reflection" : "New reflection"}</h2>
            {editing && (
              <button onClick={() => { setEditing(null); setTitle(""); setContent(""); setMood(""); setGratitude(""); }} className="text-xs font-bold text-stone-400 hover:text-stone-600">
                Cancel ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)])}
            className="mt-3 w-full rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm italic text-amber-900 transition hover:bg-amber-100"
          >
            ✦ Contemplate: “{prompt}” <span className="ml-1 not-italic font-bold">↻</span>
          </button>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — e.g. Morning sit, rain…" className="mt-4 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm outline-none focus:border-amber-700" aria-label="Title" maxLength={200} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What arose? Body, feelings, mind — uncensored… (⌘+Enter to save)" rows={7} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); }} className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-amber-700" aria-label="Reflection" />
          <div className="mt-1 flex justify-between text-[0.7rem] text-stone-400">
            <span>{words} words · draft autosaved ✓</span>
            <span>⌘+Enter saves</span>
          </div>
          <input value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="🙏 One gratitude…" className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm outline-none focus:border-amber-700" aria-label="Gratitude" maxLength={500} />
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-500">Weather of the heart</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Mood">
            {moods.map((m) => (
              <button key={m} onClick={() => setMood(m)} aria-pressed={mood === m} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${mood === m ? "border-amber-700 bg-amber-100 text-amber-900" : "border-stone-200 text-stone-500 hover:border-amber-600"}`}>
                {m}
              </button>
            ))}
          </div>
          <button onClick={save} disabled={saving || !content.trim()} className="mt-5 w-full rounded-full bg-stone-900 py-3.5 text-sm font-bold text-amber-50 transition hover:bg-amber-900 disabled:opacity-40">
            {saving ? "Saving…" : editing ? "✓ Update reflection" : "✦ Save reflection"}
          </button>
        </div>

        <div>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reflections…" className="w-full rounded-full border border-amber-900/15 bg-white px-5 py-3 text-sm outline-none focus:border-amber-700" aria-label="Search reflections" />
            <button onClick={exportAll} className="shrink-0 rounded-full border border-stone-300 px-4 py-2 text-xs font-bold hover:border-amber-700" title="Export as Markdown">⤓</button>
          </div>
          {loading ? (
            <div className="mt-4 grid gap-4"><SkeletonCard /><SkeletonCard /></div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-amber-900/25 bg-white/60 p-10 text-center">
              <p className="text-4xl">📖</p>
              <p className="font-display mt-3 text-xl font-semibold">A blank page, full of potential</p>
              <p className="mt-1 text-sm text-stone-500">Your first reflection awaits after your next sit.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {filtered.map((e) => (
                <article key={e.id} className="cv-auto rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold leading-snug">{e.title}</h3>
                      <p className="mt-0.5 text-xs text-stone-400">
                        {new Date(e.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        {e.mood ? ` · ${e.mood}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => startEdit(e)} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold hover:border-amber-700 hover:text-amber-800">Edit</button>
                      <button onClick={() => remove(e.id)} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-400 hover:border-red-400 hover:text-red-600" aria-label="Delete">✕</button>
                    </div>
                  </div>
                  {e.prompt && <p className="mt-2 text-xs italic text-amber-800">Prompt: “{e.prompt}”</p>}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{e.content}</p>
                  {e.gratitude && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[0.83rem] text-amber-900">🙏 Grateful for: {e.gratitude}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
