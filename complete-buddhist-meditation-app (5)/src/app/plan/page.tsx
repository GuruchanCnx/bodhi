import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanBuilder } from "@/components/agent-widgets";
import { SectionHeading } from "@/components/ui";
import PlanFromQuery from "./plan-client";

export const metadata: Metadata = {
  title: "7-Day Practice Plan",
  description: "An agentic 7-day meditation program woven from 1,040 canon methods around your goal.",
};

export default function PlanPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <SectionHeading
        eyebrow="Agentic programs"
        title="Your week, woven by Bodhi"
        sub="Name a goal and daily minutes. The Guide picks 7 real methods — no repeats, matched to your time — and saves the program to your sanctuary."
      />
      <div className="mt-8">
        <Suspense fallback={<PlanBuilder />}>
          <PlanFromQuery />
        </Suspense>
      </div>
      <div className="liquid-card squircle mt-6 p-6 text-sm leading-relaxed opacity-90">
        <p className="font-bold">How plans work ☸</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Each day maps to a real canon technique (validated slug — never invented).</li>
          <li>Days rotate families (breath → body → heart…) so one door deepens without dullness.</li>
          <li>Save + activate to pin it; your Journey will reflect the sits as you complete them.</li>
        </ul>
      </div>
    </main>
  );
}
