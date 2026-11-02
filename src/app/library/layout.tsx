import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Great Canon — 1,040 Guided Methods",
  description:
    "Search 1,048 Buddhist meditation methods: breath, body, brahmaviharas, kasinas, koans, lojong, mantras, walking, death contemplations and everyday Zen.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
