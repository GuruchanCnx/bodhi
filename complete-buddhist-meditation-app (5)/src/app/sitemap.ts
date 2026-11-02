import type { MetadataRoute } from "next";
import { meditations } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bodhi.sanctuary";
  const staticPages = ["", "/practice", "/library", "/teachings", "/journal", "/journey", "/plan", "/settings", "/privacy"].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/plan" || p === "/settings" ? 0.7 : 0.8,
  }));
  const roots = meditations.map((m) => ({
    url: `${base}/library/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticPages, ...roots];
}
