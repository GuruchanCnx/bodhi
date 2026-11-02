"use client";

import dynamic from "next/dynamic";

const GuideChat = dynamic(() => import("@/components/guide-chat"), {
  ssr: false,
  loading: () => null,
});

export default function GuideLazy() {
  return <GuideChat />;
}
