import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reflection Journal",
  description:
    "Mindfulness journal with contemplation prompts, mood weather, gratitude, autosaved drafts and Markdown export — wise reflection after every sit.",
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
