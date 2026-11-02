import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Journey",
  description:
    "Practice analytics: day streaks, minutes, 14-day chart, practice mandala, agentic coaching and CSV export of your meditation record.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
