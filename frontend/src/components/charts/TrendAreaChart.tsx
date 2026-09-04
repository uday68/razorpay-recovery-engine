import React, { useState } from "react";
import { TrajectoryPoint } from "../../api";

export type TimeRange = "1H" | "24H" | "7D" | "30D";

export interface TrendAreaChartProps {
  title?: string;
  subtitle?: string;
  recoveredRate?: string;
  unrecoveredRate?: string;
  className?: string;
  onRangeChange?: (range: TimeRange) => void;
  /** Real trajectory series from GET /v1/analytics/overview-summary or /v1/recovery/stream-status */
  data?: TrajectoryPoint[];
}

const SVG_W = 780;
const SVG_H = 200;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;

/** Normalise a series of y-values into [PAD_TOP, SVG_H - PAD_BOTTOM] SVG space */
function normaliseSeries(points: TrajectoryPoint[], field: "recovered" | "failed"): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const vals = points.map((p) => p[field]);
  const max = Math.max(...vals, 1);
  return points.map((p, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * SVG_W,
    y: SVG_H - PAD_BOTTOM - ((p[field] / max) * (SVG_H - PAD_TOP - PAD_BOTTOM)),
  }));
}

function toPolyline(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function toAreaPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
  const lastX = pts[pts.length - 1].x.toFixed(1);
  const firstX = pts[0].x.toFixed(1);
  return `M ${line} L ${lastX},${SVG_H} L ${firstX},${SVG_H} Z`;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  title = "Recovery Trajectory vs. Permanent Drop",
  subtitle = "Real-time rolling aggregate across payment switches",
  recoveredRate = "54.26% Recovered",
  unrecoveredRate = "45.74% Terminal Drop",
  className = "",
  onRangeChange,
  data,
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>("24H");

  const handleRange = (range: TimeRange) => {
    setActiveRange(range);
    onRangeChange?.(range);
  };

  const getAxisLabels = () => {
    switch (activeRange) {
      case "1H":
        return ["T - 60m", "T - 45m", "T - 30m", "T - 15m", "Now (Live)"];
      case "24H":
        return ["T - 24h", "T - 18h", "T - 12h", "T - 6h", "Current Hour"];
      case "7D":
        return ["Day -7", "Day -5", "Day -3", "Yesterday", "Today"];
      case "30D":
        return ["Week 1", "Week 2", "Week 3", "Week 4", "Month to Date"];
    }
  };

  const hasData = data && data.length >= 2;
  const recoveredPts = hasData ? normaliseSeries(data, "recovered") : [];
  const failedPts = hasData ? normaliseSeries(data, "failed") : [];

  return (
    <div
      className={`flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            {title}
          </h3>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            {subtitle} ({activeRange} Window)
          </p>
        </div>

        {/* Time Range Selector & Legend */}
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-1 p-0.5 rounded bg-surface-container-low border border-surface-container-high font-badge-label text-badge-label">
            {(["1H", "24H", "7D", "30D"] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRange(r)}
                className={`px-space-xs py-0.5 rounded transition-colors ${
                  activeRange === r
                    ? "bg-surface-container-high text-primary font-semibold border border-primary/20"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-space-sm font-badge-label text-badge-label">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-on-surface">{recoveredRate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-error" />
              <span className="text-outline">{unrecoveredRate}</span>
            </div>
            {!hasData && (
              <span className="px-space-xs py-0.5 rounded text-[10px] uppercase font-bold bg-outline/10 text-outline border border-outline/20">
                SIMULATED BENCHMARK
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full h-48 overflow-hidden">
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        >
          <defs>
            <linearGradient id="recoveredGrad" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#4edea3" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="failedGrad" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[20, 70, 120, 170].map((y) => (
            <line key={y} stroke="#232a34" strokeDasharray="3 3" strokeWidth="1" x1="0" x2={SVG_W} y1={y} y2={y} />
          ))}

          {hasData ? (
            <>
              {/* Real trajectory: area fill */}
              <path d={toAreaPath(recoveredPts)} fill="url(#recoveredGrad)" />
              {/* Real trajectory: recovered line */}
              <polyline
                points={toPolyline(recoveredPts)}
                fill="none"
                stroke="#4edea3"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Real trajectory: failed line */}
              <polyline
                points={toPolyline(failedPts)}
                fill="none"
                stroke="#ffb4ab"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              {/* Static fallback — labelled SIMULATED BENCHMARK in legend */}
              <path
                d={
                  activeRange === "1H"
                    ? "M 0,140 Q 120,110 240,130 T 480,90 T 720,50 L 780,40 L 780,210 L 0,210 Z"
                    : "M 0,165 Q 90,140 180,150 T 360,110 T 540,80 T 720,60 L 780,50 L 780,210 L 0,210 Z"
                }
                fill="url(#recoveredGrad)"
                className="transition-all duration-500"
              />
              <path
                d={
                  activeRange === "1H"
                    ? "M 0,140 Q 120,110 240,130 T 480,90 T 720,50 L 780,40"
                    : "M 0,165 Q 90,140 180,150 T 360,110 T 540,80 T 720,60 L 780,50"
                }
                fill="none"
                stroke="#4edea3"
                strokeWidth="2.5"
                className="transition-all duration-500"
              />
              <path
                d={
                  activeRange === "1H"
                    ? "M 0,175 Q 120,160 240,170 T 480,155 T 720,145 L 780,135"
                    : "M 0,185 Q 90,175 180,180 T 360,170 T 540,165 T 720,160 L 780,155"
                }
                fill="none"
                stroke="#ffb4ab"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                className="transition-all duration-500"
              />
            </>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between font-mono-code text-[11px] text-outline mt-space-sm pt-space-xs border-t border-surface-container-high">
        {getAxisLabels().map((label, idx) => (
          <span
            key={idx}
            className={idx === 4 ? "text-secondary font-medium" : ""}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TrendAreaChart;


