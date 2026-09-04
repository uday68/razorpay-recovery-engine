import React from "react";

export interface BanditArm {
  name: string;
  strategy: string;
  winRate: number;
  trials: number;
  ev: number;
  isLeader?: boolean;
}

export interface BanditArmRewardChartProps {
  arms?: BanditArm[];
}

const defaultArms: BanditArm[] = [
  {
    name: "AI Decision Engine (RF + EV Max + Safety Gate)",
    strategy: "Random Forest Probability Estimation + EV Optimization + Policy Gate",
    winRate: 54.26,
    trials: 2978,
    ev: 2772.30,
    isLeader: true,
  },
  {
    name: "Rule-Based Heuristic Baseline",
    strategy: "Static Failure Code Dispatch Rules (No ML)",
    winRate: 51.34,
    trials: 2978,
    ev: 2600.34,
  },
  {
    name: "Naive Immediate Retry Baseline",
    strategy: "Always RETRY_NOW on Failure (Legacy Default)",
    winRate: 39.39,
    trials: 2978,
    ev: 2025.25,
  },
];

export const BanditArmRewardChart: React.FC<BanditArmRewardChartProps> = ({
  arms = defaultArms,
}) => {
  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60">
      <div className="flex items-center justify-between mb-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            3-Way Policy Strategy Yield Comparison
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Controlled deterministic evaluation across 10,000 synthetic payments (Seed 42)
          </p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary uppercase px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
          SIMULATED BENCHMARK
        </span>
      </div>

      <div className="space-y-space-md mt-space-xs">
        {arms.map((arm, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center justify-between font-mono-code text-[12px]">
              <span className="text-on-surface font-medium">
                {arm.name}{" "}
                {arm.isLeader && (
                  <span className="text-secondary ml-1 font-label-caps text-[10px] uppercase">
                    [Highest EV &amp; Recovery]
                  </span>
                )}
              </span>
              <span className="text-secondary font-semibold">
                {arm.winRate}% (₹{arm.ev.toFixed(2)} EV)
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  arm.isLeader ? "bg-secondary" : "bg-tertiary/70"
                }`}
                style={{ width: `${arm.winRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-body-sm text-[11px] text-outline">
              <span>{arm.strategy}</span>
              <span className="font-mono-code">
                {arm.trials.toLocaleString()} trials
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BanditArmRewardChart;
