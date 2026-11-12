import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider, ToastProvider } from "@/components/chrome";
import { Ambient, MobileTabs, SiteFooter, SiteHeader } from "@/components/site-chrome";
import SwRegister from "@/components/sw-register";
import GuideLazy from "@/components/guide-lazy";
import OneHandNav from "@/components/one-hand-nav";
import CommandPalette from "@/components/command-palette";

export const metadata: Metadata = {
  title: { default: "Bodhi — Buddhist Meditation Sanctuary", template: "%s · Bodhi" },
  description:
    "Sit, breathe, awaken. 1,040 guided Buddhist meditations, singing-bowl timer, Dhamma teachings, journal, and an agentic guide — now in iOS 27 Liquid Glass.",
  keywords: ["meditation", "buddhist", "mindfulness", "vipassana", "metta", "zazen", "breathing", "dhamma", "liquid glass"],
  authors: [{ name: "Bodhi Sanctuary" }],
  openGraph: {
    title: "Bodhi — Buddhist Meditation Sanctuary",
    description: "1,040 guided meditations · bowl timer · Dhamma · journal · agentic guide · Liquid Glass.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1536, height: 1024, alt: "A brass singing bowl and lotus on warm paper at dawn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bodhi — Meditation Sanctuary",
    description: "Sit, breathe, awaken — 1,040 guided Buddhist meditations.",
    images: ["/og-image.png"],
  },
  applicationName: "Bodhi",
  appleWebApp: {
    capable: true,
    title: "Bodhi",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  metadataBase: new URL("https://bodhi.sanctuary"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0c0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen antialiased">
        <SwRegister />
        <a href="#main" className="skip-link">Skip to content ↓</a>
        <ThemeProvider>
          <ToastProvider>
            <Ambient />
            <SiteHeader />
            <main id="main" className="relative z-10 transition-transform duration-300 ease-out">
              {children}
            </main>
            <MobileTabs />
            <OneHandNav />
            <CommandPalette showButton={false} />
            <GuideLazy />
            <SiteFooter />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
