"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { playSoftTick, unlockAudio } from "@/lib/audio";

export default function OneHandNav() {
  const pathname = usePathname();
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

  // Save side preference
  const toggleSide = () => {
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

  // Open command palette via custom event or keyboard simulation
  const triggerSearch = () => {
    setIsOpen(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  const navItems = [
    { href: "/", label: "Home", icon: "🪷", color: "#d97706" },
    { href: "/practice", label: "Sit Timer", icon: "🔔", color: "#b45309" },
    { href: "/library", label: "Library", icon: "📚", color: "#059669" },
    { href: "/journey", label: "Journey", icon: "📈", color: "#2563eb" },
    { href: "/journal", label: "Journal", icon: "📖", color: "#7c3aed" },
    { href: "/teachings", label: "Teachings", icon: "📜", color: "#a16207" },
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
            onClick={toggleReachability}
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
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-10 bg-black/30 backdrop-blur-[2px]"
              />

              {/* Thumb Zone Card */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
                className={`absolute bottom-14 z-20 w-64 rounded-3xl border border-amber-900/20 bg-stone-900/95 p-3.5 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-lg ${
                  handSide === "right" ? "right-0" : "left-0"
                }`}
              >
                {/* Header with Handedness & Reachability Switch */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span>☸</span>
                    <span>One-Hand Hub</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Handedness */}
                    <button
                      type="button"
                      onClick={toggleSide}
                      className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-bold text-stone-300 transition hover:bg-white/20 hover:text-white"
                      title={`Switch to ${handSide === "right" ? "Left" : "Right"}-Hand mode`}
                    >
                      {handSide === "right" ? "👉 Right Hand" : "👈 Left Hand"}
                    </button>
                  </div>
                </div>

                {/* Reachability Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    toggleReachability();
                    setIsOpen(false);
                  }}
                  className={`mt-2.5 flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-bold transition ${
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

                {/* Thumb Targets Grid */}
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          unlockAudio();
                          playSoftTick(800, 0.04);
                          setIsOpen(false);
                        }}
                        className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                            : "bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Quick Search in Thumb Zone */}
                <button
                  type="button"
                  onClick={triggerSearch}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/10"
                >
                  <span>🔍</span>
                  <span>Search 1,040 Methods</span>
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
            unlockAudio();
            playSoftTick(isOpen ? 640 : 880, 0.06);
            setIsOpen((v) => !v)}
          }
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
