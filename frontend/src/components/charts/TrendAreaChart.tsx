import React, { useState } from "react";

export type TimeRange = "1H" | "24H" | "7D" | "30D";

export interface TrendAreaChartProps {
  title?: string;
  subtitle?: string;
  recoveredRate?: string;
  unrecoveredRate?: string;
  className?: string;
  onRangeChange?: (range: TimeRange) => void;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  title = "Recovery Trajectory vs. Permanent Drop",
  subtitle = "Real-time rolling aggregate across payment switches",
  recoveredRate = "54.26% Recovered",
  unrecoveredRate = "45.74% Terminal Drop",
  className = "",
  onRangeChange,
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
          </div>
        </div>
      </div>

      <div className="relative w-full h-48 overflow-hidden">
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 780 200"
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
          <line
            stroke="#232a34"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1="0"
            x2="780"
            y1="20"
            y2="20"
          />
          <line
            stroke="#232a34"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1="0"
            x2="780"
            y1="70"
            y2="70"
          />
          <line
            stroke="#232a34"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1="0"
            x2="780"
            y1="120"
            y2="120"
          />
          <line
            stroke="#232a34"
            strokeDasharray="3 3"
            strokeWidth="1"
            x1="0"
            x2="780"
            y1="170"
            y2="170"
          />

          {/* Area Shading */}
          <path
            d={
              activeRange === "1H"
                ? "M 0,140 Q 120,110 240,130 T 480,90 T 720,50 L 780,40 L 780,210 L 0,210 Z"
                : "M 0,165 Q 90,140 180,150 T 360,110 T 540,80 T 720,60 L 780,50 L 780,210 L 0,210 Z"
            }
            fill="url(#recoveredGrad)"
            className="transition-all duration-500"
          />

          {/* Line paths */}
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

