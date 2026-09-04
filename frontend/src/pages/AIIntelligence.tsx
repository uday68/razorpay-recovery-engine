import React, { useState, useEffect } from "react";
import { recoveryApi, AIModelHealthResponse } from "../api";
import { StatCard } from "../components/ui/StatCard";
import { CalibrationCurve } from "../components/charts/CalibrationCurve";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";

export const AIIntelligence: React.FC = () => {
  const [modelHealth, setModelHealth] = useState<AIModelHealthResponse | null>(null);

  useEffect(() => {
    recoveryApi.getAIModelHealth().then(setModelHealth).catch(console.warn);
  }, []);
  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              AI Decision Intelligence &amp; Drift
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                MODEL INFERENCE HEALTHY (PSI &lt; 0.05)
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Continuous Bayesian contextual bandit monitoring, model calibration, and real-time concept drift tracking
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm">
            Trigger Retraining Pipeline
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Brier Calibration Score"
          value="0.084"
          subtitle="Target: < 0.100"
          delta="Well Calibrated"
          deltaType="positive"
          icon="tune"
        />
        <StatCard
          title="Inference Latency (P95)"
          value="1.84ms"
          subtitle="FastAPI / Torch C-Lib"
          delta="< 5ms SLA"
          deltaType="positive"
          icon="bolt"
        />
        <StatCard
          title="Population Stability Index"
          value="0.038"
          subtitle="Drift threshold: 0.10"
          delta="No Concept Drift"
          deltaType="positive"
          icon="waves"
        />
        <StatCard
          title="Model Version"
          value="v2.4.1"
          subtitle="Updated 14h ago"
          delta="Active Champion"
          deltaType="neutral"
          icon="verified"
        />
      </div>

      {/* Model Calibration Curve */}
      <CalibrationCurve />

      {/* Feature Importance & Drift Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Live Global Feature Attribution (SHAP Signals)
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Relative weight of context variables driving recovery recommendations
          </p>

          <div className="space-y-space-sm mt-space-xs font-mono-code text-[12px]">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">Historical Bank Success Rate</span>
                <span className="text-secondary font-medium">38.4%</span>
              </div>
              <ConfidenceBar value={0.384} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">Payment Method (UPI vs Card)</span>
                <span className="text-secondary font-medium">24.2%</span>
              </div>
              <ConfidenceBar value={0.242} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">Failure Reason Category (Transient)</span>
                <span className="text-secondary font-medium">19.8%</span>
              </div>
              <ConfidenceBar value={0.198} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">Peak Hourly Congestion Index</span>
                <span className="text-secondary font-medium">11.6%</span>
              </div>
              <ConfidenceBar value={0.116} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">Customer Recency Factor</span>
                <span className="text-secondary font-medium">6.0%</span>
              </div>
              <ConfidenceBar value={0.06} showLabel={false} />
            </div>
          </div>
        </div>

        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Feature Distribution Drift (KS Test)
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Kolmogorov-Smirnov distance comparing training baseline vs live 24h window
          </p>

          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-2 mt-space-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-on-surface font-medium">HDFC Bank Latency Profile</span>
                <div className="text-outline text-[10px]">p-value = 0.42 (Stable)</div>
              </div>
              <span className="text-secondary font-semibold">STABLE</span>
            </div>
            <div className="flex justify-between items-center border-t border-surface-container-high/40 pt-1.5">
              <div>
                <span className="text-on-surface font-medium">UPI 504 Timeout Frequency</span>
                <div className="text-outline text-[10px]">p-value = 0.38 (Normal)</div>
              </div>
              <span className="text-secondary font-semibold">STABLE</span>
            </div>
            <div className="flex justify-between items-center border-t border-surface-container-high/40 pt-1.5">
              <div>
                <span className="text-on-surface font-medium">SBI NetBanking Volume Ratio</span>
                <div className="text-outline text-[10px]">p-value = 0.14 (Minor shift)</div>
              </div>
              <span className="text-tertiary font-semibold">WATCHING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntelligence;

