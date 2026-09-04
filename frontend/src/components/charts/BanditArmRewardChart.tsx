import React from "react";

export interface BanditArm {
  name: string;
  strategy: string;
  winRate: number; // percentage
  trials: number;
  ev: number;
  isLeader?: boolean;
}

export interface BanditArmRewardChartProps {
  arms?: BanditArm[];
}

const defaultArms: BanditArm[] = [
  {
    name: "Arm A (AI Contextual Bandit v2.4)",
    strategy: "Thompson Sampling + Policy Hard-Gate",
    winRate: 54.26,
    trials: 12450,
    ev: 412.5,
    isLeader: true,
  },
  {
    name: "Arm B (Rule Baseline v1.1)",
    strategy: "Static Deterministic Overrides",
    winRate: 47.65,
    trials: 6240,
    ev: 328.0,
  },
  {
    name: "Arm C (Naive Auto-Retry)",
    strategy: "Immediate Unconditioned Re-dispatch",
    winRate: 31.12,
    trials: 3120,
    ev: 194.2,
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
            Multi-Armed Bandit Cohort Yield
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Continuous Bayesian exploration vs exploitation across live traffic
          </p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary uppercase px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
          Statistically Significant (p &lt; 0.001)
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
                    [Selected Leader]
                  </span>
                )}
              </span>
              <span className="text-secondary font-semibold">
                {arm.winRate}% (?{arm.ev} EV)
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

