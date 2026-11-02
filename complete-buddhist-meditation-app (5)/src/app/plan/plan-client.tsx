"use client";

import { useSearchParams } from "next/navigation";
import { PlanBuilder } from "@/components/agent-widgets";

export default function PlanFromQuery() {
  const params = useSearchParams();
  const goal = params.get("goal") || "";
  const minutes = Number(params.get("minutes") || "10");
  return <PlanBuilder initialGoal={goal} initialMinutes={Number.isFinite(minutes) && minutes >= 5 ? minutes : 10} />;
}
