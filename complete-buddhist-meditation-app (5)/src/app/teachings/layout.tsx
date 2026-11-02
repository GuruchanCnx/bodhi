import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dhamma Teachings",
  description:
    "Four Noble Truths, Noble Eightfold Path, Three Marks of Existence, Five Precepts vow-tracker, and searchable sutta passages.",
};

export default function TeachingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
