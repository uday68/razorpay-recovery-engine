import React, { useState } from "react";

export const PolicySimulationSandbox: React.FC = () => {
  const [confidenceFloor, setConfidenceFloor] = useState(65);
  const [timeoutTolerance, setTimeoutTolerance] = useState(800);
  const [maxRetries, setMaxRetries] = useState(3);

  const projectedRecoveryRate = (50 + (confidenceFloor - 50) * 0.15).toFixed(2);
  const projectedMonthlySavings = Math.round(confidenceFloor * 42000);

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Recovery Policy Simulation Sandbox
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Model the financial impact of policy parameter alterations against trailing 30-day traffic
          </p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary uppercase px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
          Zero Live Risk Sandbox
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Slider 1: Confidence Floor */}
        <div className="flex flex-col gap-1.5 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
          <div className="flex justify-between items-center">
            <label className="font-label-caps text-label-caps text-outline uppercase">
              ML Confidence Floor
            </label>
            <span className="font-mono-code text-[12px] text-primary font-medium">
              {confidenceFloor}%
            </span>
          </div>
          <input
            type="range"
            min="40"
            max="90"
            value={confidenceFloor}
            onChange={(e) => setConfidenceFloor(Number(e.target.value))}
            className="w-full accent-primary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-body-sm text-[11px] text-outline">
            Minimum predicted win probability required before dispatching
          </span>
        </div>

        {/* Slider 2: Timeout Tolerance */}
        <div className="flex flex-col gap-1.5 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
          <div className="flex justify-between items-center">
            <label className="font-label-caps text-label-caps text-outline uppercase">
              Gateway Timeout Tolerance
            </label>
            <span className="font-mono-code text-[12px] text-tertiary font-medium">
              {timeoutTolerance}ms
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={timeoutTolerance}
            onChange={(e) => setTimeoutTolerance(Number(e.target.value))}
            className="w-full accent-tertiary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-body-sm text-[11px] text-outline">
            Threshold before tagging gateway transaction as transient failure
          </span>
        </div>

        {/* Slider 3: Max Retries */}
        <div className="flex flex-col gap-1.5 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
          <div className="flex justify-between items-center">
            <label className="font-label-caps text-label-caps text-outline uppercase">
              Max Retry Attempts / Payment
            </label>
            <span className="font-mono-code text-[12px] text-secondary font-medium">
              {maxRetries} attempts
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={maxRetries}
            onChange={(e) => setMaxRetries(Number(e.target.value))}
            className="w-full accent-secondary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-body-sm text-[11px] text-outline">
            Maximum recovery hops allowed per individual payment lifecycle
          </span>
        </div>
      </div>

      {/* Simulation Result Projection */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-sm rounded bg-surface-container-highest/40 border border-surface-container-highest font-mono-code text-body-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary text-[20px]">
            query_stats
          </span>
          <div>
            <span className="text-outline text-[11px]">PROJECTED RECOVERY RATE:</span>
            <span className="text-secondary font-semibold ml-2">
              {projectedRecoveryRate}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <div>
            <span className="text-outline text-[11px]">ESTIMATED MONTHLY SAVINGS:</span>
            <span className="text-on-surface font-semibold ml-2">
              ?{(projectedMonthlySavings).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <button className="px-space-sm py-1.5 rounded bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase transition-colors">
          Apply Policy To Staging
        </button>
      </div>
    </div>
  );
};

export default PolicySimulationSandbox;

