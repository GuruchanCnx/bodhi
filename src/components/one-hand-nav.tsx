"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { playSoftTick, unlockAudio } from "@/lib/audio";

/**
 * Browser Haptic Feedback helper utilizing Navigator Vibration API.
 * Gracefully silent on unsupported devices or iOS without WebKit vibration flags.
 */
function vibrateHaptic(pattern: number | number[] = 15) {
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

export default function OneHandNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [handSide, setHandSide] = useState<"right" | "left">("right");
  const [reachabilityActive, setReachabilityActive] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedSide = localStorage.getItem("bodhi-onehand-side");
      if (savedSide === "left" || savedSide === "right") {
        setHandSide(savedSide);
      }
      const savedEnabled = localStorage.getItem("bodhi-onehand-enabled");
      if (savedEnabled !== null) {
        setEnabled(savedEnabled === "true");
      }
    } catch {}
  }, []);

  // Save side preference with haptic confirmation
  const toggleSide = () => {
    vibrateHaptic([12, 25, 12]);
    const nextSide = handSide === "right" ? "left" : "right";
    setHandSide(nextSide);
    unlockAudio();
    playSoftTick(920, 0.05);
    try {
      localStorage.setItem("bodhi-onehand-side", nextSide);
    } catch {}
  };

  // Toggle reachability mode (brings top screen content down into thumb zone)
  const toggleReachability = () => {
    vibrateHaptic(20);
    const nextState = !reachabilityActive;
    setReachabilityActive(nextState);
    unlockAudio();
    playSoftTick(nextState ? 740 : 880, 0.06);

    const mainEl = document.getElementById("main");
    if (mainEl) {
      if (nextState) {
        mainEl.style.transform = "translateY(36vh)";
      } else {
        mainEl.style.transform = "";
      }
    }
  };

  // Close reachability on route change
  useEffect(() => {
    if (reachabilityActive) {
      setReachabilityActive(false);
      const mainEl = document.getElementById("main");
      if (mainEl) mainEl.style.transform = "";
    }
    setIsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Robust target navigation that survives component unmounting
  const handleNavigate = (href: string) => {
    vibrateHaptic(15);
    unlockAudio();
    playSoftTick(800, 0.04);
    setIsOpen(false);
    router.push(href);
  };

  // Open search modal via custom event or global keydown
  const triggerSearch = () => {
    vibrateHaptic(15);
    unlockAudio();
    playSoftTick(720, 0.04);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("bodhi:open-search"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  const navItems = [
    { href: "/", label: "Home", icon: "🪷" },
    { href: "/practice", label: "Sit Timer", icon: "🔔" },
    { href: "/library", label: "Library", icon: "📚" },
    { href: "/teachings", label: "Teachings", icon: "📜" },
    { href: "/journal", label: "Journal", icon: "📖" },
    { href: "/journey", label: "Journey", icon: "📈" },
  ];

  if (!enabled) return null;

  return (
    <>
      {/* Reachability Top Dismissal Bar */}
      <AnimatePresence>
        {reachabilityActive && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => {
              vibrateHaptic(15);
              toggleReachability();
            }}
            className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-gradient-to-b from-amber-900/90 to-stone-900/80 px-4 py-3.5 text-xs font-bold text-amber-100 shadow-xl backdrop-blur-md"
            aria-label="One-Hand Reachability active. Tap to restore full screen"
          >
            <span>↕ One-Hand Reachability Active</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem]">
              Tap anywhere here to restore ↑
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Thumb Dock */}
      <div
        className={`fixed z-40 transition-all duration-300 ${
          handSide === "right" ? "right-3.5" : "left-3.5"
        }`}
        style={{ bottom: "max(5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))" }}
      >
        {/* Expanded Thumb Radial Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop dismiss */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  vibrateHaptic(10);
                  setIsOpen(false);
                }}
                className="fixed inset-0 z-10 bg-black/35 backdrop-blur-[2px]"
              />

              {/* Thumb Zone Card */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`absolute bottom-14 z-20 w-72 rounded-3xl border border-amber-900/20 bg-stone-900/95 p-3.5 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
                  handSide === "right" ? "right-0" : "left-0"
                }`}
              >
                {/* Header with Handedness & Indicator */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span className="text-sm">☸</span>
                    <span>One-Hand Hub</span>
                  </div>

                  {/* Toggle Handedness */}
                  <button
                    type="button"
                    onClick={toggleSide}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-bold text-stone-200 transition active:scale-95 hover:bg-white/20 hover:text-white"
                    title={`Switch to ${handSide === "right" ? "Left" : "Right"}-Hand mode`}
                  >
                    <span>{handSide === "right" ? "👉 Right Thumb" : "👈 Left Thumb"}</span>
                    <span className="opacity-50">⇄</span>
                  </button>
                </div>

                {/* Reachability Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    toggleReachability();
                    setIsOpen(false);
                  }}
                  className={`mt-2.5 flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-bold transition active:scale-98 ${
                    reachabilityActive
                      ? "bg-amber-500 text-stone-950 shadow-sm"
                      : "bg-white/10 text-stone-200 hover:bg-white/15"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">↕</span>
                    <span>Screen Reachability</span>
                  </span>
                  <span className="text-[0.65rem] opacity-75">
                    {reachabilityActive ? "Active" : "Pull Down"}
                  </span>
                </button>

                {/* Thumb Targets Grid — 3 columns with label cleanly below icon */}
                <div className="mt-2.5">
                  <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-wider text-amber-400/80">
                    Thumb Quick Targets
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => handleNavigate(item.href)}
                          className={`group relative flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 py-2 transition-all active:scale-95 ${
                            isActive
                              ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/60 shadow-inner"
                              : "bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
                          }`}
                          aria-label={`Open ${item.label}`}
                        >
                          <span className="text-xl leading-none transition-transform group-hover:scale-110">
                            {item.icon}
                          </span>
                          <span className="mt-1.5 block w-full truncate text-center text-[0.68rem] font-bold tracking-tight text-stone-300 group-hover:text-amber-100">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Search in Thumb Zone */}
                <button
                  type="button"
                  onClick={triggerSearch}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-stone-200 transition active:scale-98 hover:bg-white/15 hover:text-white"
                >
                  <span className="text-sm">🔍</span>
                  <span>Search 1,040 Methods</span>
                  <kbd className="rounded bg-black/30 px-1 py-0.5 text-[0.6rem] font-mono text-amber-300">⌘K</kbd>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* The Thumb Dial Trigger Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            vibrateHaptic(18);
            unlockAudio();
            playSoftTick(isOpen ? 640 : 880, 0.06);
            setIsOpen((v) => !v);
          }}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-stone-900 text-amber-300 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:scale-105 active:scale-95 ${
            isOpen ? "ring-2 ring-amber-400" : ""
          }`}
          aria-label="One-Hand Navigation Dial"
          aria-expanded={isOpen}
          title="One-Hand Navigation Hub (reach everything with your thumb)"
        >
          <span className="text-xl leading-none">
            {isOpen ? "✕" : "☸"}
          </span>

          {/* Hand indicator badge */}
          <span
            className={`absolute -bottom-1 grid h-4 w-4 place-items-center rounded-full bg-amber-600 text-[0.55rem] font-bold text-white shadow-xs ${
              handSide === "right" ? "-right-1" : "-left-1"
            }`}
            title={`${handSide === "right" ? "Right" : "Left"} Thumb`}
          >
            {handSide === "right" ? "R" : "L"}
          </span>
        </motion.button>
      </div>
    </>
  );
}
