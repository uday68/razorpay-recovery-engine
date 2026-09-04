import React from "react";

export interface TrendAreaChartProps {
  title?: string;
  subtitle?: string;
  recoveredRate?: string;
  unrecoveredRate?: string;
  className?: string;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  title = "Recovery Trajectory vs. Permanent Drop",
  subtitle = "Real-time 60-minute trailing rolling aggregate",
  recoveredRate = "54.26% Recovered",
  unrecoveredRate = "45.74% Terminal Drop",
  className = "",
}) => {
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
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-space-md font-badge-label text-badge-label">
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
            d="M 0,165 Q 90,140 180,150 T 360,110 T 540,80 T 720,60 L 780,50 L 780,210 L 0,210 Z"
            fill="url(#recoveredGrad)"
          />

          {/* Line paths */}
          <path
            d="M 0,165 Q 90,140 180,150 T 360,110 T 540,80 T 720,60 L 780,50"
            fill="none"
            stroke="#4edea3"
            strokeWidth="2.5"
          />
          <path
            d="M 0,185 Q 90,175 180,180 T 360,170 T 540,165 T 720,160 L 780,155"
            fill="none"
            stroke="#ffb4ab"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between font-mono-code text-[11px] text-outline mt-space-sm pt-space-xs border-t border-surface-container-high">
        <span>T - 60m</span>
        <span>T - 45m</span>
        <span>T - 30m</span>
        <span>T - 15m</span>
        <span className="text-secondary font-medium">Now (Live)</span>
      </div>
    </div>
  );
};

export default TrendAreaChart;

