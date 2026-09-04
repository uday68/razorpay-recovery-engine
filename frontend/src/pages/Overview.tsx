import React, { useState } from "react";
import { StatCard } from "../components/ui/StatCard";
import { TrendAreaChart } from "../components/charts/TrendAreaChart";
import { CircuitBreakerCard } from "../components/system/CircuitBreakerCard";
import { TransactionTable } from "../components/recovery/TransactionTable";
import { DecisionLineageDrawer } from "../components/recovery/DecisionLineageDrawer";

export const Overview: React.FC = () => {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Top Command Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-space-2xs min-w-0">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Recovery Control Tower
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
              <span className="font-label-caps text-label-caps tracking-wider uppercase">
                PRODUCTION RUNTIME — HDFC / RAZORPAY / CASHFREE CLUSTER
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            AI-powered autonomous remediation orchestration across high-velocity failed transactions
          </p>
        </div>

        {/* Action Toolset */}
        <div className="flex items-center gap-space-xs flex-wrap">
          <button className="h-8 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center gap-space-xs transition-colors cursor-pointer shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-[16px] text-outline">file_download</span>
            <span className="font-badge-label text-badge-label">Export Telemetry CSV</span>
          </button>
          <button className="h-8 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center gap-space-xs transition-colors cursor-pointer shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
            <span className="font-badge-label text-badge-label">Configure Thresholds</span>
          </button>
          <button className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary hover:text-on-primary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95">
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span className="font-badge-label text-badge-label font-semibold">Simulate Batch Failure</span>
          </button>
        </div>
      </div>

      {/* KPI Density Strip (5 Modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
        <StatCard
          title="At-Risk Revenue"
          value="?15.14M"
          subtitle="4,281 failed txns today"
          delta="+2.4% vs yday"
          deltaType="negative"
          icon="trending_up"
        />
        <StatCard
          title="Recovered Revenue"
          value="?8.26M"
          subtitle="54.26% recovered volume"
          delta="+?1.12M baseline"
          deltaType="positive"
          icon="payments"
        />
        <StatCard
          title="Recovery Rate"
          value="54.26%"
          subtitle="Target: >50.00%"
          delta="+6.61% vs Rule"
          deltaType="positive"
          icon="verified"
        />
        <StatCard
          title="AI Revenue Lift"
          value="+6.61%"
          subtitle="+?520K incremental"
          delta="5 Seeds Validated"
          deltaType="positive"
          icon="auto_mode"
        />
        <StatCard
          title="Active In-Flight"
          value="127 active"
          subtitle="84 queue · 43 exec"
          delta="lag 8ms"
          deltaType="neutral"
          icon="bolt"
        />
      </div>

      {/* Chart & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <TrendAreaChart />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">
                  Recovery Engine Mode
                </span>
                <span className="px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-mono-code text-[11px] font-semibold border border-secondary/20">
                  AUTONOMOUS
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-2">
                Contextual Bandit + Safe Gate
              </h3>
              <p className="font-body-sm text-body-sm text-outline mt-1">
                Bandit model dynamically balances exploration and exploitation with strict deterministic policy boundaries.
              </p>
            </div>
            <div className="mt-4 p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-outline">Thompson Sampling:</span>
                <span className="text-secondary font-medium">ENABLED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Decision Latency:</span>
                <span className="text-secondary font-medium">0.82ms (p50)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Kafka Worker Group:</span>
                <span className="text-primary font-medium">recovery-worker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banking Partner Health */}
      <CircuitBreakerCard />

      {/* Live Transaction Ledger */}
      <TransactionTable onInspect={(id) => setSelectedTx(id)} />

      {/* Decision Lineage Inspector Drawer */}
      <DecisionLineageDrawer
        paymentId={selectedTx || ""}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

export default Overview;

