"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Detects foldable / dual-screen ("Apple Duo") viewport segments.
 * Uses the CSS Viewport Segments spec (horizontal/vertical-viewport-segments: 2)
 * plus the legacy screen-spanning fallbacks from the Duo/Android spec.
 */
export function useFoldSegments(): {
  segments: 1 | 2;
  orientation: "single" | "horizontal" | "vertical";
} {
  const [state, setState] = useState<{ segments: 1 | 2; orientation: "single" | "horizontal" | "vertical" }>({
    segments: 1,
    orientation: "single",
  });

  useEffect(() => {
    const mqH = window.matchMedia("(horizontal-viewport-segments: 2)");
    const mqV = window.matchMedia("(vertical-viewport-segments: 2)");
    const mqSpan = window.matchMedia("(screen-spanning: single-fold-vertical), (screen-spanning: single-fold-horizontal)");

    const update = () => {
      if (mqH.matches) setState({ segments: 2, orientation: "horizontal" });
      else if (mqV.matches) setState({ segments: 2, orientation: "vertical" });
      else if (mqSpan.matches) setState({ segments: 2, orientation: "horizontal" });
      else setState({ segments: 1, orientation: "single" });
    };
    update();
    for (const mq of [mqH, mqV, mqSpan]) mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      for (const mq of [mqH, mqV, mqSpan]) mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return state;
}

/** Persisted, keyboard-accessible draggable splitter (desktop + foldables). */
export function SplitPane({
  left,
  right,
  storageKey = "bodhi-split",
  min = 0.3,
  max = 0.7,
  className = "",
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  storageKey?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [ratio, setRatio] = useState(0.42);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem(storageKey) || "");
      if (Number.isFinite(v) && v > min && v < max) setRatio(v);
    } catch {}
  }, [storageKey, min, max]);

  const commit = useCallback(
    (r: number) => {
      const clamped = Math.min(max, Math.max(min, r));
      setRatio(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {}
    },
    [min, max, storageKey]
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      commit((e.clientX - rect.left) / rect.width);
    };
    const up = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [commit]);

  return (
    <div ref={ref} className={`split-pane ${className}`} style={{ ["--split" as string]: `${ratio * 100}%` }}>
      <div className="split-left" style={{ minWidth: 0 }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round(max * 100)}
        tabIndex={0}
        className="split-handle"
        onPointerDown={(e) => {
          dragging.current = true;
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            commit(ratio - 0.02);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            commit(ratio + 0.02);
          } else if (e.key === "Home") {
            e.preventDefault();
            commit(min);
          } else if (e.key === "End") {
            e.preventDefault();
            commit(max);
          }
        }}
      >
        <span aria-hidden className="split-grip" />
      </div>
      <div className="split-right" style={{ minWidth: 0 }}>
        {right}
      </div>
    </div>
  );
}

/** Small indicator explaining the dual-screen layout (shown on foldables). */
export function FoldHint({ className = "" }: { className?: string }) {
  const { segments, orientation } = useFoldSegments();
  if (segments === 1) return null;
  return (
    <p className={`liquid-chip pill inline-flex items-center gap-2 px-3 py-1.5 text-[0.68rem] font-bold ${className}`} role="status">
      <span aria-hidden>🪗</span>
      {orientation === "horizontal"
        ? "Dual screens detected — cushion on the left, guidance on the right."
        : "Dual screens stacked — timer above, guidance below."}
    </p>
  );
}
