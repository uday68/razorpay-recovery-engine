import React from "react";

export interface LatencyBucket {
  range: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface LatencyHistogramProps {
  p50?: number;
  p95?: number;
  p99?: number;
  buckets?: LatencyBucket[];
}

const defaultBuckets: LatencyBucket[] = [
  { range: "< 1.0ms", count: 4280, percentage: 65, color: "bg-secondary" },
  { range: "1.0 - 2.5ms", count: 1820, percentage: 25, color: "bg-secondary" },
  { range: "2.5 - 5.0ms", count: 420, percentage: 7, color: "bg-tertiary" },
  { range: "5.0 - 10ms", count: 120, percentage: 2, color: "bg-primary" },
  { range: "> 10ms", count: 32, percentage: 1, color: "bg-error" },
];

export const LatencyHistogram: React.FC<LatencyHistogramProps> = ({
  p50 = 0.82,
  p95 = 2.14,
  p99 = 4.87,
  buckets = defaultBuckets,
}) => {
  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60">
      <div className="flex items-center justify-between mb-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Go Executor Decision Latency Profile
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Target SLA: p99 &lt; 10.0ms (Sub-millisecond high-frequency routing)
          </p>
        </div>
        <div className="flex items-center gap-space-sm font-mono-code text-[11px]">
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-secondary">
            p50: {p50}ms
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary">
            p95: {p95}ms
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-error">
            p99: {p99}ms
          </span>
        </div>
      </div>

      <div className="space-y-space-xs mt-space-xs">
        {buckets.map((b, idx) => (
          <div key={idx} className="flex items-center gap-space-sm">
            <span className="font-mono-code text-[11px] text-outline w-24 text-right">
              {b.range}
            </span>
            <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  b.color || "bg-secondary"
                }`}
                style={{ width: `${b.percentage}%` }}
              />
            </div>
            <span className="font-mono-code text-[11px] text-on-surface w-16 text-right">
              {b.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatencyHistogram;

