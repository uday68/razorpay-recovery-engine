import React, { useState, useEffect } from "react";
import { StatusPill } from "../ui/StatusPill";

export interface GatewayBreaker {
  name: string;
  type: string;
  state: "CLOSED" | "HALF_OPEN" | "OPEN";
  failureRate: number;
  threshold: number;
  lastTrip: string;
}

export interface CircuitBreakerCardProps {
  initialGateways?: GatewayBreaker[];
  onToggleBreaker?: (name: string, newState: "CLOSED" | "OPEN") => void;
}

const defaultGateways: GatewayBreaker[] = [
  {
    name: "HDFC Bank UPI Switch",
    type: "UPI 2.0 / IMPS",
    state: "CLOSED",
    failureRate: 1.8,
    threshold: 15.0,
    lastTrip: "None in 24h",
  },
  {
    name: "ICICI Direct NetBanking",
    type: "Corporate NetBanking",
    state: "CLOSED",
    failureRate: 3.4,
    threshold: 20.0,
    lastTrip: "None in 24h",
  },
  {
    name: "SBI Payment Switch",
    type: "Core Banking Gateway",
    state: "HALF_OPEN",
    failureRate: 14.2,
    threshold: 20.0,
    lastTrip: "42m ago",
  },
  {
    name: "Axis Bank UPI Stack",
    type: "UPI 2.0 Direct",
    state: "CLOSED",
    failureRate: 2.1,
    threshold: 15.0,
    lastTrip: "None in 24h",
  },
];

export const CircuitBreakerCard: React.FC<CircuitBreakerCardProps> = ({
  initialGateways = defaultGateways,
  onToggleBreaker,
}) => {
  const [gateways, setGateways] = useState<GatewayBreaker[]>(initialGateways);

  useEffect(() => {
    if (initialGateways && initialGateways.length > 0) {
      setGateways(initialGateways);
    }
  }, [initialGateways]);

  const handleToggle = (index: number) => {
    setGateways((prev) =>
      prev.map((gw, i) => {
        if (i !== index) return gw;
        const newState = gw.state === "CLOSED" ? "OPEN" : "CLOSED";
        const newRate = newState === "CLOSED" ? 1.2 : gw.failureRate;
        onToggleBreaker?.(gw.name, newState);
        return {
          ...gw,
          state: newState,
          failureRate: newRate,
          lastTrip: newState === "OPEN" ? "Just Now (Manual Trip)" : "Reset to Normal",
        };
      })
    );
  };

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Banking Partner Circuit Breaker Status
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Automated trip gates preventing repeated downstream flooding
          </p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary uppercase px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
          Automated Recovery Enabled
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-sm mt-space-xs">
        {gateways.map((gw, idx) => {
          const isHealthy = gw.state === "CLOSED";
          const isWarning = gw.state === "HALF_OPEN";

          return (
            <div
              key={gw.name}
              className="flex flex-col p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] gap-1.5 justify-between transition-all"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="font-headline-sm text-[13px] text-on-surface font-semibold truncate">
                    {gw.name}
                  </h4>
                  <span className="text-outline text-[10px] truncate block">
                    {gw.type}
                  </span>
                </div>
                <StatusPill
                  status={gw.state}
                  label={gw.state}
                  pulse={isWarning}
                />
              </div>

              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-outline text-[10px]">
                  <span>Rolling Failure Rate:</span>
                  <span
                    className={
                      isHealthy
                        ? "text-secondary font-medium"
                        : isWarning
                        ? "text-tertiary font-medium"
                        : "text-error font-medium"
                    }
                  >
                    {gw.failureRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHealthy
                        ? "bg-secondary"
                        : isWarning
                        ? "bg-tertiary"
                        : "bg-error"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, (gw.failureRate / gw.threshold) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-outline text-[10px]">
                  <span>Trip Threshold:</span>
                  <span>{gw.threshold.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-surface-container-high text-[10px] text-outline">
                <span className="truncate">Last Trip: {gw.lastTrip}</span>
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border transition-colors cursor-pointer ${
                    gw.state === "CLOSED"
                      ? "bg-error/10 text-error hover:bg-error/20 border-error/30"
                      : "bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/30"
                  }`}
                >
                  {gw.state === "CLOSED" ? "Force Trip" : "Reset Breaker"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CircuitBreakerCard;