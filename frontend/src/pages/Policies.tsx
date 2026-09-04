import React, { useState, useEffect } from "react";
import { recoveryApi, PolicyItem } from "../api";
import { PolicyRuleCard } from "../components/recovery/PolicyRuleCard";
import { PolicySimulationSandbox } from "../components/recovery/PolicySimulationSandbox";

export const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = () => {
    setLoading(true);
    recoveryApi
      .getPolicies()
      .then((data) => {
        if (data && data.length > 0) setPolicies(data);
      })
      .catch((err) => {
        console.warn("Using default policy rules:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const defaultPolicies: PolicyItem[] = [
    {
      id: "POL-01",
      tier: "P0",
      priority: "P0 CRITICAL",
      name: "Low Confidence Drop Safety Floor",
      description: "If model predicted win probability falls below 50%, prevent expensive secondary dispatch and permanently drop.",
      trigger_condition: "predicted_probability < 0.50",
      action_override: "NO_ACTION (Permanent Drop)",
      enabled: true,
      triggers_today: 418,
    },
    {
      id: "POL-02",
      tier: "P0",
      priority: "P0 CRITICAL",
      name: "High-Value Transaction Human/Review Gate",
      description: "Transactions with ticket size greater than ₹1,00,000 must not auto-retry immediately without fraud checks.",
      trigger_condition: "amount > 100000 && risk_score > 0.30",
      action_override: "SEND_REMINDER (Hold for Approval)",
      enabled: true,
      triggers_today: 24,
    },
    {
      id: "POL-03",
      tier: "P1",
      priority: "P1 HIGH",
      name: "Gateway Circuit Breaker Auto-Backoff",
      description: "When bank partner error rate crosses 15%, immediately route subsequent transactions into exponential backoff queue.",
      trigger_condition: "gateway_error_rate > 15%",
      action_override: "RETRY_LATER (Jittered Backoff)",
      enabled: true,
      triggers_today: 92,
    },
    {
      id: "POL-04",
      tier: "P2",
      priority: "P2 STANDARD",
      name: "Maximum Lifecycle Retry Ceiling",
      description: "Enforces strict 3-hop retry cap to prevent duplicate authorizations and RBI customer annoyance mandates.",
      trigger_condition: "attempt_count >= 3",
      action_override: "NO_ACTION (Max Hops Exceeded)",
      enabled: true,
      triggers_today: 631,
    },
  ];

  const ruleList = policies.length > 0 ? policies : defaultPolicies;

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
                {ruleList.length} ACTIVE HARD-GATES ENFORCED
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Compliance safety floors, card network rules, and RBI customer cooling limits evaluated prior to action dispatch
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Sync Engine Rules"}
          </button>
        </div>
      </div>

      {/* Policy Simulation Sandbox */}
      <PolicySimulationSandbox />

      {/* Active Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {ruleList.map((rule) => (
          <PolicyRuleCard
            key={rule.id}
            id={rule.id}
            priority={(rule.priority || `${rule.tier || "P1"} HIGH`) as any}
            name={rule.name}
            description={rule.description}
            triggerCondition={rule.trigger_condition}
            actionOverride={rule.action_override}
            enabledByDefault={rule.enabled}
            triggersToday={rule.triggers_today}
          />
        ))}
      </div>
    </div>
  );
};

export default Policies;