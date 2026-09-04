import React from "react";
import { StatCard } from "../components/ui/StatCard";
import { BanditArmRewardChart } from "../components/charts/BanditArmRewardChart";

export const Experiments: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Recovery Experiments &amp; Bandits
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                BAYESIAN THOMPSON SAMPLING (ACTIVE)
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Multi-Armed Bandit (MAB) reinforcement experiments testing routing policies against real production volume
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm">
            Launch New Experiment Arm
          </button>
        </div>
      </div>

      {/* Experiment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Active Bandit Arms"
          value="3 Cohorts"
          subtitle="Bayesian exploration"
          delta="Dynamic Alloc"
          deltaType="positive"
          icon="science"
        />
        <StatCard
          title="Optimal Arm Yield"
          value="54.26%"
          subtitle="AI Contextual Bandit (Arm A)"
          delta="+6.61% vs Static"
          deltaType="positive"
          icon="military_tech"
        />
        <StatCard
          title="Exploration Ratio"
          value="10.0%"
          subtitle="Epsilon greedy ceiling"
          delta="Safety Protected"
          deltaType="neutral"
          icon="explore"
        />
        <StatCard
          title="Statistical Significance"
          value="p < 0.001"
          subtitle="Confidence: 99.9%"
          delta="Chi-Square Verified"
          deltaType="positive"
          icon="verified"
        />
      </div>

      {/* Main Multi-Armed Bandit Chart */}
      <BanditArmRewardChart />

      {/* Cohort Strategy Matrix */}
      <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
          Strategy Cohort Configuration Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono-code text-[12px]">
            <thead>
              <tr className="border-b border-surface-container-high bg-surface-container-lowest/50 font-label-caps text-label-caps text-outline uppercase">
                <th className="py-space-sm px-space-base">Cohort Arm</th>
                <th className="py-space-sm px-space-base">Decision Model</th>
                <th className="py-space-sm px-space-base">Traffic Allocation</th>
                <th className="py-space-sm px-space-base">Mean Recovery EV</th>
                <th className="py-space-sm px-space-base">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              <tr className="hover:bg-surface-container-high/30">
                <td className="py-space-sm px-space-base text-primary font-semibold">
                  Arm A (Candidate Leader)
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  Contextual Bandit v2.4 + Thompson Sampling
                </td>
                <td className="py-space-sm px-space-base text-secondary font-semibold">
                  70.0% (Adaptive)
                </td>
                <td className="py-space-sm px-space-base text-secondary font-semibold">
                  +?412.50
                </td>
                <td className="py-space-sm px-space-base">
                  <span className="px-space-xs py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20 text-[10px]">
                    EXPLOITING (WINNER)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-high/30">
                <td className="py-space-sm px-space-base text-tertiary font-semibold">
                  Arm B (Control Baseline)
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  Rule-Based Static Baseline v1.1
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  20.0% (Fixed Control)
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  +?328.00
                </td>
                <td className="py-space-sm px-space-base">
                  <span className="px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/20 text-[10px]">
                    BENCHMARK
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-high/30">
                <td className="py-space-sm px-space-base text-outline font-semibold">
                  Arm C (Naive Explorer)
                </td>
                <td className="py-space-sm px-space-base text-on-surface">
                  Instant Retries (Zero Context)
                </td>
                <td className="py-space-sm px-space-base text-outline">
                  10.0% (Safety Floor)
                </td>
                <td className="py-space-sm px-space-base text-error">
                  +?194.20
                </td>
                <td className="py-space-sm px-space-base">
                  <span className="px-space-xs py-0.5 rounded bg-error/10 text-error border border-error/20 text-[10px]">
                    DEGRADED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Experiments;

