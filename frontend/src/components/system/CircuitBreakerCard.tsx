import React from "react";
import { StatusPill } from "../ui/StatusPill";

export interface GatewayBreaker {
  name: string;
  type: string;
  state: "CLOSED" | "HALF_OPEN" | "OPEN";
  failureRate: number; // percentage
  threshold: number;
  lastTrip: string;
}

export interface CircuitBreakerCardProps {
  gateways?: GatewayBreaker[];
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
  gateways = defaultGateways,
}) => {
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
        {gateways.map((gw) => {
          const isHealthy = gw.state === "CLOSED";
          const isWarning = gw.state === "HALF_OPEN";

          return (
            <div
              key={gw.name}
              className="flex flex-col p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-on-surface font-medium truncate">
                  {gw.name}
                </span>
                <StatusPill
                  status={
                    isHealthy
                      ? "OPTIMAL"
                      : isWarning
                      ? "PENDING"
                      : "FAILED"
                  }
                  label={gw.state}
                />
              </div>
              <span className="font-body-sm text-[11px] text-outline">
                {gw.type}
              </span>

              <div className="mt-1 space-y-1 pt-space-2xs border-t border-surface-container-high/40">
                <div className="flex justify-between">
                  <span className="text-outline">Error Rate:</span>
                  <span
                    className={`font-semibold ${
                      isHealthy
                        ? "text-secondary"
                        : isWarning
                        ? "text-tertiary"
                        : "text-error"
                    }`}
                  >
                    {gw.failureRate}% / {gw.threshold}% max
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Last Tripped:</span>
                  <span className="text-outline">{gw.lastTrip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CircuitBreakerCard;

