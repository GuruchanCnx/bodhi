import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bodhi — Buddhist Meditation Sanctuary",
    short_name: "Bodhi",
    description: "1,040 guided meditations, bowl timer, Dhamma, journal, agentic guide.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#b45309",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
