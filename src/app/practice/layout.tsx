import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitting Timer",
  description:
    "Singing-bowl meditation timer: drift-proof countdown, interval bells, breath guide, ambient rain, spoken Dhamma cues, wake-lock and focus mode.",
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
