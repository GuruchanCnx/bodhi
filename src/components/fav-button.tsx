"use client";

import { useEffect, useState } from "react";
import { hapticFavorite } from "@/lib/haptics";

export default function FavButton({ slug, name }: { slug: string; name: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("bodhi-favs") || "[]") as string[];
      setSaved(favs.includes(slug));
    } catch {}
  }, [slug]);
  const toggle = () => {
    try {
      const favs = JSON.parse(localStorage.getItem("bodhi-favs") || "[]") as string[];
      const isAdding = !favs.includes(slug);
      hapticFavorite(isAdding);
      const next = isAdding ? [slug, ...favs].slice(0, 100) : favs.filter((x) => x !== slug);
      localStorage.setItem("bodhi-favs", JSON.stringify(next));
      setSaved(next.includes(slug));
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-95 ${saved ? "bg-rose-700 text-white" : "border border-stone-300 bg-white hover:border-rose-500 hover:text-rose-600"}`}
    >
      {saved ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
