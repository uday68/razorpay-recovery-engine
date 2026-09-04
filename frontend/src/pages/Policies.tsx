import React from "react";
import { PolicyRuleCard } from "../components/recovery/PolicyRuleCard";
import { PolicySimulationSandbox } from "../components/recovery/PolicySimulationSandbox";

export const Policies: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Deterministic Recovery Policies
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                4 ACTIVE HARD-GATES ENFORCED
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Compliance safety floors, card network rules, and RBI customer cooling limits evaluated prior to action dispatch
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm">
            Create New Policy Gate
          </button>
        </div>
      </div>

      {/* Policy Simulation Sandbox */}
      <PolicySimulationSandbox />

      {/* Active Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <PolicyRuleCard
          id="POL-01"
          priority="P0 CRITICAL"
          name="Low Confidence Drop Safety Floor"
          description="If model predicted win probability falls below 50%, prevent expensive secondary dispatch and permanently drop."
          triggerCondition="predicted_probability < 0.50"
          actionOverride="NO_ACTION (Permanent Drop)"
          enabledByDefault={true}
          triggersToday={418}
        />

        <PolicyRuleCard
          id="POL-02"
          priority="P0 CRITICAL"
          name="High-Value Transaction Human/Review Gate"
          description="Transactions with ticket size greater than ?1,00,000 must not auto-retry immediately without fraud checks."
          triggerCondition="amount > 100000 && risk_score > 0.30"
          actionOverride="SEND_REMINDER (Hold for Approval)"
          enabledByDefault={true}
          triggersToday={24}
        />

        <PolicyRuleCard
          id="POL-03"
          priority="P1 HIGH"
          name="Gateway Circuit Breaker Auto-Backoff"
          description="When bank partner error rate crosses 15%, immediately route subsequent transactions into exponential backoff queue."
          triggerCondition="gateway_error_rate > 15%"
          actionOverride="RETRY_LATER (Jittered Backoff)"
          enabledByDefault={true}
          triggersToday={92}
        />

        <PolicyRuleCard
          id="POL-04"
          priority="P2 STANDARD"
          name="Maximum Lifecycle Retry Ceiling"
          description="Enforces strict 3-hop retry cap to prevent duplicate authorizations and RBI customer annoyance mandates."
          triggerCondition="attempt_count >= 3"
          actionOverride="NO_ACTION (Max Hops Exceeded)"
          enabledByDefault={true}
          triggersToday={631}
        />
      </div>
    </div>
  );
};

export default Policies;

