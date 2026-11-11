"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  shape: "circle" | "rect" | "petal";
}

const SACRED_COLORS = [
  "#f59e0b", // Amber
  "#fbbf24", // Gold
  "#10b981", // Emerald
  "#34d399", // Mint
  "#d97706", // Ochre
  "#f472b6", // Lotus pink
  "#ffffff", // Diamond white
  "#fde68a", // Light gold
];

export function ConfettiBurstOverlay({
  bursts,
  onClear,
}: {
  bursts: { id: string; x: number; y: number }[];
  onClear: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((b) => (
        <SingleBurst key={b.id} id={b.id} originX={b.x} originY={b.y} onDone={() => onClear(b.id)} />
      ))}
    </div>
  );
}

function SingleBurst({
  id,
  originX,
  originY,
  onDone,
}: {
  id: string;
  originX: number;
  originY: number;
  onDone: () => void;
}) {
  const [particles] = useState<ConfettiParticle[]>(() => {
    const list: ConfettiParticle[] = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 40 + Math.random() * 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 20; // gentle upward bias
      const color = SACRED_COLORS[Math.floor(Math.random() * SACRED_COLORS.length)];
      const shapes: ("circle" | "rect" | "petal")[] = ["circle", "rect", "petal"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      list.push({
        id: i,
        x: originX,
        y: originY,
        vx,
        vy,
        color,
        size: shape === "petal" ? 10 : 6 + Math.random() * 5,
        rotation: (Math.random() - 0.5) * 360,
        shape,
      });
    }
    return list;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 1100);
    return () => clearTimeout(timer);
  }, [id, onDone]);

  return (
    <AnimatePresence>
      {particles.map((p) => {
        return (
          <motion.div
            key={p.id}
            initial={{
              x: originX,
              y: originY,
              scale: 0.2,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: originX + p.vx * 1.5,
              y: originY + p.vy * 1.5 + 45, // gravity pulls down slightly
              scale: [0.2, 1.2, 0.7, 0.4],
              opacity: [1, 1, 0.8, 0],
              rotate: p.rotation * 1.5,
            }}
            transition={{
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.shape === "rect" ? p.size * 0.5 : p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "petal" ? "60% 0 60% 0" : "2px",
              boxShadow: `0 0 8px ${p.color}88`,
            }}
          />
        );
      })}
    </AnimatePresence>
  );
}
