"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { hapticTap } from "@/lib/haptics";

export interface JournalChartEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  prompt: string | null;
  gratitude: string | null;
  createdAt: string;
}

interface WeatherMeta {
  level: number;
  label: string;
  emoji: string;
  color: string;
}

const WEATHER_META: Record<number, WeatherMeta> = {
  1: { level: 1, label: "Difficult", emoji: "🌧", color: "#ef4444" },
  2: { level: 2, label: "Cloudy", emoji: "🌫", color: "#94a3b8" },
  3: { level: 3, label: "Neutral", emoji: "🍃", color: "#eab308" },
  4: { level: 4, label: "Clear", emoji: "🌤", color: "#f59e0b" },
  5: { level: 5, label: "Radiant", emoji: "☀️", color: "#10b981" },
};

export function parseHeartWeather(mood: string | null | undefined): number | null {
  if (!mood) return null;
  const lower = mood.toLowerCase();
  if (lower.includes("difficult") || mood.includes("🌧")) return 1;
  if (lower.includes("cloudy") || mood.includes("🌫")) return 2;
  if (lower.includes("neutral") || mood.includes("🍃")) return 3;
  if (lower.includes("clear") || mood.includes("🌤")) return 4;
  if (lower.includes("radiant") || mood.includes("☀️") || mood.includes("☀")) return 5;
  return null;
}

type ValidPoint = {
  entry: JournalChartEntry;
  score: number;
  date: Date;
};

export default function JournalMoodChart({ entries }: { entries: JournalChartEntry[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(640);
  const [rangeFilter, setRangeFilter] = useState<"all" | "14" | "7">("all");
  const [activePoint, setActivePoint] = useState<{
    point: ValidPoint;
    x: number;
    y: number;
  } | null>(null);

  // Measure container width smoothly for responsive D3 rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    updateWidth();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const allMoodEntries = useMemo(() => {
    return entries
      .map((entry) => {
        const score = parseHeartWeather(entry.mood);
        if (score === null) return null;
        return {
          entry,
          score,
          date: new Date(entry.createdAt),
        };
      })
      .filter((x): x is ValidPoint => x !== null && !Number.isNaN(x.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entries]);

  const validData = useMemo(() => {
    if (rangeFilter === "7") return allMoodEntries.slice(-7);
    if (rangeFilter === "14") return allMoodEntries.slice(-14);
    return allMoodEntries;
  }, [allMoodEntries, rangeFilter]);

  const stats = useMemo(() => {
    if (validData.length === 0) {
      return {
        avg: 0,
        shift: 0,
        brightPct: 0,
        dominant: WEATHER_META[3],
        insightText: "Log reflections with Weather of the heart to reveal emotional patterns.",
      };
    }

    const avg = validData.reduce((sum, p) => sum + p.score, 0) / validData.length;
    const brightCount = validData.filter((p) => p.score >= 4).length;
    const brightPct = Math.round((brightCount / validData.length) * 100);

    // Compute shift between first half and second half
    const mid = Math.max(1, Math.floor(validData.length / 2));
    const earlyAvg = validData.slice(0, mid).reduce((s, p) => s + p.score, 0) / mid;
    const recentSlice = validData.slice(mid);
    const recentAvg =
      recentSlice.length > 0
        ? recentSlice.reduce((s, p) => s + p.score, 0) / recentSlice.length
        : earlyAvg;
    const shift = Number((recentAvg - earlyAvg).toFixed(2));

    // Dominant weather
    const counts = new Map<number, number>();
    for (const p of validData) {
      counts.set(p.score, (counts.get(p.score) || 0) + 1);
    }
    let bestLevel = 3;
    let bestCount = -1;
    for (const [lvl, c] of counts.entries()) {
      if (c > bestCount) {
        bestCount = c;
        bestLevel = lvl;
      }
    }

    let insightText =
      "Notice how inner weather passes like clouds — neither clinging to sun nor resisting rain.";
    if (validData.length >= 2 && shift >= 0.4) {
      insightText = `Skies are clearing (+${shift.toFixed(1)} recent shift). Consistent reflection is helping steady the heart.`;
    } else if (validData.length >= 2 && shift <= -0.4) {
      insightText = `More overcast weather lately (${shift.toFixed(1)}). Naming difficulty kindly in words is itself transformative practice.`;
    } else if (brightPct >= 65) {
      insightText = `${brightPct}% Clear or Radiant reflections — gratitude and mindfulness are ripening steadily.`;
    }

    return {
      avg: Number(avg.toFixed(1)),
      shift,
      brightPct,
      dominant: WEATHER_META[bestLevel] ?? WEATHER_META[3],
      insightText,
    };
  }, [validData]);

  // Render D3 SVG trend line & area
  useEffect(() => {
    if (!svgRef.current || validData.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = Math.max(300, containerWidth - 48);
    const height = 240;
    const margin = { top: 20, right: 28, bottom: 38, left: 48 };
    const innerW = Math.max(120, width - margin.left - margin.right);
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const defs = svg.append("defs");

    const lineGrad = defs
      .append("linearGradient")
      .attr("id", "journal-weather-line")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    lineGrad.append("stop").attr("offset", "0%").attr("stop-color", "#b45309");
    lineGrad.append("stop").attr("offset", "55%").attr("stop-color", "#f59e0b");
    lineGrad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981");

    const areaGrad = defs
      .append("linearGradient")
      .attr("id", "journal-weather-area")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    areaGrad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(245, 158, 11, 0.28)");
    areaGrad.append("stop").attr("offset", "70%").attr("stop-color", "rgba(180, 83, 9, 0.08)");
    areaGrad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(180, 83, 9, 0.0)");

    const xScale = d3
      .scalePoint<string>()
      .domain(validData.map((_, i) => `${i}`))
      .range([0, innerW])
      .padding(0.08);

    const yScale = d3.scaleLinear().domain([1, 5]).range([innerH, 0]);

    // Grid lines & weather ticks
    [1, 2, 3, 4, 5].forEach((lvl) => {
      const yPos = yScale(lvl);
      const meta = WEATHER_META[lvl];
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("stroke", lvl === 3 ? "rgba(180, 83, 9, 0.22)" : "rgba(120, 113, 108, 0.14)")
        .attr("stroke-dasharray", lvl === 3 ? "none" : "3,3")
        .attr("stroke-width", 1);

      g.append("text")
        .attr("x", -10)
        .attr("y", yPos + 4)
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("fill", "#78716c")
        .text(`${meta.emoji} ${lvl}`);
    });

    const points = validData.map((p, idx) => ({ ...p, idx }));

    const areaGen = d3
      .area<ValidPoint & { idx: number }>()
      .x((d) => xScale(`${d.idx}`) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.score))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(points)
      .attr("fill", "url(#journal-weather-area)")
      .attr("d", areaGen);

    const lineGen = d3
      .line<ValidPoint & { idx: number }>()
      .x((d) => xScale(`${d.idx}`) ?? 0)
      .y((d) => yScale(d.score))
      .curve(d3.curveMonotoneX);

    const path = g
      .append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", "url(#journal-weather-line)")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("d", lineGen);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const pathNode = path.node();
    if (pathNode && !reduceMotion) {
      const totalLen = pathNode.getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLen} ${totalLen}`)
        .attr("stroke-dashoffset", totalLen)
        .transition()
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
    }

    // X-axis date ticks
    const step = Math.max(1, Math.floor(points.length / 6));
    points.forEach((p, idx) => {
      if (idx % step === 0 || idx === points.length - 1) {
        const xPos = xScale(`${idx}`) ?? 0;
        const fmtDate = p.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        g.append("text")
          .attr("x", xPos)
          .attr("y", innerH + 22)
          .attr("text-anchor", idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "600")
          .attr("fill", "#a8a29e")
          .text(fmtDate);
      }
    });

    // Interactive Data Nodes
    const dotsGroup = g.append("g");
    points.forEach((p) => {
      const cx = xScale(`${p.idx}`) ?? 0;
      const cy = yScale(p.score);
      const color = WEATHER_META[p.score]?.color ?? "#f59e0b";

      const dot = dotsGroup
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 5.5)
        .attr("fill", "#ffffff")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .style("cursor", "pointer");

      dotsGroup
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 16)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseenter", () => {
          dot.attr("r", 7.5).attr("stroke-width", 3.5);
          setActivePoint({ point: p, x: cx + margin.left, y: cy + margin.top });
        })
        .on("mouseleave", () => {
          dot.attr("r", 5.5).attr("stroke-width", 2.5);
          setActivePoint(null);
        })
        .on("click", () => {
          hapticTap();
          setActivePoint((curr) =>
            curr?.point.entry.id === p.entry.id
              ? null
              : { point: p, x: cx + margin.left, y: cy + margin.top }
          );
        });
    });
  }, [validData, containerWidth]);

  const roundedAvg = Math.min(5, Math.max(1, Math.round(stats.avg || 3)));

  return (
    <section
      ref={containerRef}
      aria-label="Weather of the heart mood trend"
      className="relative rounded-[1.75rem] border border-amber-900/10 bg-white p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber-800">
            Citta · Weather of the Heart
          </p>
          <h2 className="font-display mt-0.5 text-2xl font-semibold text-stone-900">
            Emotional weather across reflections
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {allMoodEntries.length} mood-tagged {allMoodEntries.length === 1 ? "entry" : "entries"} · {stats.insightText}
          </p>
        </div>

        {/* Interactive timeframe filter */}
        <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1" role="group" aria-label="Chart range">
          {(
            [
              { id: "all", label: `All (${allMoodEntries.length})` },
              { id: "14", label: "Last 14" },
              { id: "7", label: "Last 7" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                hapticTap();
                setRangeFilter(f.id);
                setActivePoint(null);
              }}
              aria-pressed={rangeFilter === f.id}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                rangeFilter === f.id
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {validData.length >= 2 ? (
        <>
          {/* Summary metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
                Avg Heart Weather
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums text-stone-900">
                  {stats.avg}
                </span>
                <span className="text-xs font-semibold text-stone-400">/ 5.0</span>
                <span className="text-base">{WEATHER_META[roundedAvg].emoji}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
                Recent Shift
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-display text-2xl font-bold tabular-nums ${
                    stats.shift > 0
                      ? "text-emerald-700"
                      : stats.shift < 0
                      ? "text-amber-700"
                      : "text-stone-700"
                  }`}
                >
                  {stats.shift > 0 ? `+${stats.shift}` : stats.shift}
                </span>
                <span className="text-xs text-stone-500">
                  {stats.shift > 0 ? "brightening" : stats.shift < 0 ? "tender" : "steady"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
                Clear &amp; Radiant
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums text-emerald-700">
                  {stats.brightPct}%
                </span>
                <span className="text-xs text-stone-500">of logs</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
                Prevailing Sky
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg">{stats.dominant.emoji}</span>
                <span className="font-display text-xl font-bold text-stone-900">
                  {stats.dominant.label}
                </span>
              </div>
            </div>
          </div>

          {/* D3 SVG Canvas */}
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/35 to-white pt-2">
            <svg
              ref={svgRef}
              className="w-full select-none"
              style={{ minHeight: "210px", maxHeight: "260px" }}
              role="img"
              aria-label="D3 trend line of Weather of the heart across journal reflections"
            />

            {activePoint && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full transform rounded-xl border border-stone-200 bg-stone-900/95 px-3 py-2 text-xs text-stone-100 shadow-xl backdrop-blur"
                style={{
                  left: Math.min(Math.max(110, activePoint.x), containerWidth - 130),
                  top: Math.max(68, activePoint.y - 10),
                }}
              >
                <p className="max-w-[210px] truncate font-bold text-amber-300">
                  {activePoint.point.entry.title}
                </p>
                <p className="mt-0.5 text-[0.7rem] text-stone-300">
                  {activePoint.point.date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {WEATHER_META[activePoint.point.score]?.emoji}{" "}
                  {WEATHER_META[activePoint.point.score]?.label}
                </p>
                {activePoint.point.entry.gratitude && (
                  <p className="mt-1 max-w-[210px] truncate text-[0.68rem] italic text-emerald-300">
                    🙏 {activePoint.point.entry.gratitude}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-amber-900/20 bg-amber-50/30 p-7 text-center">
          <p className="text-2xl">🌤</p>
          <p className="mt-2 text-sm font-semibold text-stone-800">
            {validData.length === 1
              ? "1 reflection has Weather of the heart tagged — log 1 more to reveal your D3 curve."
              : "Tag Weather of the heart when saving reflections"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-stone-500">
            Choose from 🌧 Difficult to ☀️ Radiant below your reflection to chart your emotional weather across days.
          </p>
        </div>
      )}
    </section>
  );
}
