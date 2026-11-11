"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

export interface SessionRecord {
  id: string;
  technique: string;
  title: string;
  durationSeconds: number;
  moodBefore: number | null;
  moodAfter: number | null;
  notes: string | null;
  createdAt: string;
}

const MOOD_META: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Agitated", emoji: "😣", color: "#ef4444" },
  2: { label: "Restless", emoji: "😟", color: "#f97316" },
  3: { label: "Balanced", emoji: "😐", color: "#eab308" },
  4: { label: "Peaceful", emoji: "🙂", color: "#10b981" },
  5: { label: "Serene", emoji: "😊", color: "#059669" },
};

export default function MoodTrendChart({ sessions }: { sessions: SessionRecord[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    session: SessionRecord;
    x: number;
    y: number;
  } | null>(null);
  const [rangeFilter, setRangeFilter] = useState<"all" | "10" | "20">("all");

  // Extract sessions with valid moodAfter in chronological order
  const validData = useMemo(() => {
    const withMood = sessions
      .filter((s) => typeof s.moodAfter === "number" && s.moodAfter >= 1 && s.moodAfter <= 5)
      .map((s) => ({
        ...s,
        date: new Date(s.createdAt),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (rangeFilter === "10") return withMood.slice(-10);
    if (rangeFilter === "20") return withMood.slice(-20);
    return withMood;
  }, [sessions, rangeFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (validData.length === 0) return { avg: 0, uplift: 0, highCount: 0 };
    const avg = validData.reduce((acc, s) => acc + (s.moodAfter ?? 0), 0) / validData.length;
    
    // Average uplift (moodAfter - moodBefore)
    const withBoth = validData.filter(
      (s) => typeof s.moodBefore === "number" && typeof s.moodAfter === "number"
    );
    const uplift = withBoth.length > 0
      ? withBoth.reduce((acc, s) => acc + ((s.moodAfter ?? 0) - (s.moodBefore ?? 0)), 0) / withBoth.length
      : 0;

    const highCount = validData.filter((s) => (s.moodAfter ?? 0) >= 4).length;

    return {
      avg: Number(avg.toFixed(1)),
      uplift: Number(uplift.toFixed(2)),
      highCount,
    };
  }, [validData]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || validData.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerRef.current.clientWidth || 640;
    const height = 260;
    const margin = { top: 20, right: 35, bottom: 40, left: 45 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Definitions (Gradients & Shadows)
    const defs = svg.append("defs");

    // Line stroke gradient
    const lineGrad = defs
      .append("linearGradient")
      .attr("id", "mood-line-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    lineGrad.append("stop").attr("offset", "0%").attr("stop-color", "#d97706");
    lineGrad.append("stop").attr("offset", "100%").attr("stop-color", "#10b981");

    // Area fill gradient
    const areaGrad = defs
      .append("linearGradient")
      .attr("id", "mood-area-grad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGrad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(16, 185, 129, 0.28)");
    areaGrad.append("stop").attr("offset", "75%").attr("stop-color", "rgba(217, 119, 6, 0.08)");
    areaGrad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(217, 119, 6, 0.0)");

    // Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(validData.map((d, i) => `${i}`))
      .range([0, innerW])
      .padding(0.1);

    const yScale = d3.scaleLinear().domain([1, 5]).range([innerH, 0]);

    // Horizontal Guideline Grid (Mood Levels 1 to 5)
    [1, 2, 3, 4, 5].forEach((level) => {
      const yPos = yScale(level);
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("stroke", level === 3 ? "rgba(180, 83, 9, 0.2)" : "rgba(120, 113, 108, 0.12)")
        .attr("stroke-dasharray", level === 3 ? "none" : "3,3")
        .attr("stroke-width", 1);

      // Y-axis label emoji + level
      g.append("text")
        .attr("x", -10)
        .attr("y", yPos + 4)
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("fill", "#78716c")
        .text(`${MOOD_META[level]?.emoji ?? ""} ${level}`);
    });

    // Area Generator
    const areaGenerator = d3
      .area<{ session: SessionRecord; index: number }>()
      .x((d) => xScale(`${d.index}`) ?? 0)
      .y0(innerH)
      .y1((d) => yScale(d.session.moodAfter ?? 3))
      .curve(d3.curveMonotoneX);

    const chartPoints = validData.map((d, i) => ({ session: d, index: i }));

    g.append("path")
      .datum(chartPoints)
      .attr("fill", "url(#mood-area-grad)")
      .attr("d", areaGenerator);

    // Line Generator
    const lineGenerator = d3
      .line<{ session: SessionRecord; index: number }>()
      .x((d) => xScale(`${d.index}`) ?? 0)
      .y((d) => yScale(d.session.moodAfter ?? 3))
      .curve(d3.curveMonotoneX);

    // Draw Line
    const path = g
      .append("path")
      .datum(chartPoints)
      .attr("fill", "none")
      .attr("stroke", "url(#mood-line-grad)")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("d", lineGenerator);

    // Line draw-in animation
    const pathNode = path.node();
    if (pathNode) {
      const totalLength = pathNode.getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
    }

    // X-Axis Date Labels (sample subset if many)
    const step = Math.max(1, Math.floor(validData.length / 6));
    validData.forEach((d, idx) => {
      if (idx % step === 0 || idx === validData.length - 1) {
        const xPos = xScale(`${idx}`) ?? 0;
        const fmtDate = d.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

        g.append("text")
          .attr("x", xPos)
          .attr("y", innerH + 22)
          .attr("text-anchor", idx === 0 ? "start" : idx === validData.length - 1 ? "end" : "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "600")
          .attr("fill", "#a8a29e")
          .text(fmtDate);
      }
    });

    // Data Circles (Interactive Nodes)
    const dotsGroup = g.append("g").attr("class", "dots");

    chartPoints.forEach((d) => {
      const cx = xScale(`${d.index}`) ?? 0;
      const cy = yScale(d.session.moodAfter ?? 3);
      const moodVal = d.session.moodAfter ?? 3;
      const moodColor = MOOD_META[moodVal]?.color ?? "#f59e0b";

      // Outer glow circle
      const dot = dotsGroup
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 5.5)
        .attr("fill", "#ffffff")
        .attr("stroke", moodColor)
        .attr("stroke-width", 2.5)
        .style("cursor", "pointer")
        .style("transition", "transform 0.2s ease");

      // Hover capture hit-area
      dotsGroup
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 14)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseenter", (event) => {
          dot.attr("r", 7.5).attr("stroke-width", 3.5);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoveredPoint({
              session: d.session,
              x: cx + margin.left,
              y: cy + margin.top,
            });
          }
        })
        .on("mouseleave", () => {
          dot.attr("r", 5.5).attr("stroke-width", 2.5);
          setHoveredPoint(null);
        });
    });
  }, [validData]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl border border-amber-900/10 bg-white p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-sm">
              📈
            </span>
            <h3 className="font-display text-xl font-semibold text-stone-900">
              Heart State Trajectory (Mood After Sit)
            </h3>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            D3 visual analysis tracking how sitting settles and brightens your mind over time
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 p-1">
          <button
            onClick={() => setRangeFilter("all")}
            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
              rangeFilter === "all"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setRangeFilter("20")}
            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
              rangeFilter === "20"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Last 20
          </button>
          <button
            onClick={() => setRangeFilter("10")}
            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
              rangeFilter === "10"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Last 10
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {validData.length >= 2 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
              Avg Post-Sit Mood
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-stone-900">
                {stats.avg}
              </span>
              <span className="text-xs font-semibold text-stone-400">/ 5.0</span>
              <span className="text-base">
                {stats.avg >= 4.5 ? "😊" : stats.avg >= 3.5 ? "🙂" : "😐"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
              Avg Heart Shift
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`font-display text-2xl font-bold ${
                  stats.uplift > 0
                    ? "text-emerald-700"
                    : stats.uplift < 0
                    ? "text-rose-600"
                    : "text-stone-700"
                }`}
              >
                {stats.uplift > 0 ? `+${stats.uplift}` : stats.uplift}
              </span>
              <span className="text-xs font-semibold text-stone-400">levels</span>
              <span className="text-xs">
                {stats.uplift > 0 ? "✨ uplift" : "grounded"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
              Serene Sittings
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-emerald-700">
                {stats.highCount}
              </span>
              <span className="text-xs text-stone-500">
                ({Math.round((stats.highCount / Math.max(1, validData.length)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-400">
              Tracked Sessions
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold text-stone-800">
                {validData.length}
              </span>
              <span className="text-xs text-stone-400">logged</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* D3 SVG Canvas */}
      {validData.length >= 2 ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-b from-stone-50/60 to-white pt-2">
          <svg
            ref={svgRef}
            className="w-full select-none"
            style={{ minHeight: "220px", maxHeight: "280px" }}
          />

          {/* Hover Tooltip Popup */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full transform rounded-xl border border-stone-200 bg-stone-900/95 px-3 py-2 text-xs text-stone-100 shadow-xl backdrop-blur"
              style={{
                left: hoveredPoint.x,
                top: hoveredPoint.y - 12,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">
                  {hoveredPoint.session.title}
                </span>
                <span className="rounded bg-white/10 px-1 text-[0.65rem] text-stone-300">
                  {Math.round(hoveredPoint.session.durationSeconds / 60)}m
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[0.72rem] text-stone-300">
                <span>Shift:</span>
                <span>
                  {hoveredPoint.session.moodBefore
                    ? MOOD_META[hoveredPoint.session.moodBefore]?.emoji ?? ""
                    : "—"}
                </span>
                <span>→</span>
                <span className="font-bold text-emerald-300">
                  {hoveredPoint.session.moodAfter
                    ? `${MOOD_META[hoveredPoint.session.moodAfter]?.emoji ?? ""} (${
                        MOOD_META[hoveredPoint.session.moodAfter]?.label ?? ""
                      })`
                    : "—"}
                </span>
              </div>
              {hoveredPoint.session.notes && (
                <p className="mt-1 max-w-[200px] truncate text-[0.68rem] italic text-stone-400">
                  “{hoveredPoint.session.notes}”
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
          <p className="text-3xl">🪷</p>
          <p className="mt-2 text-sm font-semibold text-stone-800">
            {validData.length === 1
              ? "1 session with mood logged. Complete 1 more to see your trajectory line!"
              : "No post-sitting mood records yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-stone-500">
            After finishing a sitting, select your heart state emoji (😣 to 😊) in the timer debrief.
            This D3 chart will map how each practice transforms anxiety into stillness.
          </p>
        </div>
      )}
    </div>
  );
}
