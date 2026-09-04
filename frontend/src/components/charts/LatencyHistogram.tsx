import React from "react";
import { LatencyBucket } from "../../api";

export interface LatencyHistogramProps {
  p50?: number;
  p95?: number;
  p99?: number;
  /** Real latency histogram buckets from GET /v1/system/health latency_histogram field */
  buckets?: LatencyBucket[];
}

const defaultBuckets: LatencyBucket[] = [
  { bucket: "< 1.0ms",     count: 4280, percentage: 65 },
  { bucket: "1.0 - 2.5ms", count: 1820, percentage: 25 },
  { bucket: "2.5 - 5.0ms", count: 420,  percentage: 7  },
  { bucket: "5.0 - 10ms",  count: 120,  percentage: 2  },
  { bucket: "> 10ms",      count: 32,   percentage: 1  },
];

function bucketColor(bucket: string): string {
  if (bucket.startsWith(">")) return "bg-error";
  if (bucket.startsWith("5.0")) return "bg-primary";
  if (bucket.startsWith("2.5")) return "bg-tertiary";
  return "bg-secondary";
}

export const LatencyHistogram: React.FC<LatencyHistogramProps> = ({
  p50,
  p95,
  p99,
  buckets,
}) => {
  const usingDefaults = !buckets || buckets.length === 0;
  const displayBuckets = usingDefaults ? defaultBuckets : buckets;

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
          {p50 !== undefined ? (
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-secondary">
              p50: {p50.toFixed(2)}ms
            </span>
          ) : null}
          {p95 !== undefined ? (
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary">
              p95: {p95.toFixed(2)}ms
            </span>
          ) : null}
          {p99 !== undefined ? (
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-error">
              p99: {p99.toFixed(2)}ms
            </span>
          ) : null}
          {usingDefaults && (
            <span className="px-space-xs py-0.5 rounded text-[10px] uppercase font-bold bg-outline/10 text-outline border border-outline/20">
              SIMULATED BENCHMARK
            </span>
          )}
        </div>
      </div>

      <div className="space-y-space-xs mt-space-xs">
        {displayBuckets.map((b, idx) => (
          <div key={idx} className="flex items-center gap-space-sm">
            <span className="font-mono-code text-[11px] text-outline w-24 text-right">
              {b.bucket}
            </span>
            <div className="flex-1 h-3 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bucketColor(b.bucket)}`}
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

