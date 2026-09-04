import React, { useState, useEffect } from "react";
import { recoveryApi, PolicyItem } from "../api";
import { PolicyRuleCard } from "../components/recovery/PolicyRuleCard";
import { PolicySimulationSandbox } from "../components/recovery/PolicySimulationSandbox";
import { ToastContainer, ToastMessage } from "../components/ui/Toast";

export const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New rule form state
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState("P0 CRITICAL");
  const [newDescription, setNewDescription] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newAction, setNewAction] = useState("RETRY_NOW");

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchPolicies = () => {
    setLoading(true);
    recoveryApi
      .getPolicies()
      .then((data) => {
        if (data && data.length > 0) {
          setPolicies(data);
          addToast({
            id: Date.now().toString(),
            type: "success",
            title: "Policies Synchronized",
            description: `Fetched ${data.length} active deterministic rules from engine.`,
          });
        }
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

  const handleToggleRule = (id: string, enabled: boolean) => {
    setPolicies((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled } : r))
    );
    addToast({
      id: Date.now().toString(),
      type: enabled ? "success" : "warning",
      title: `Policy Rule #${id} ${enabled ? "Enabled" : "Disabled"}`,
      description: `Rule state updated across runtime decision switches.`,
    });
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTrigger.trim()) return;

    const newRuleId = `POL-0${ruleList.length + 1}`;
    const createdRule: PolicyItem = {
      id: newRuleId,
      tier: newPriority.slice(0, 2),
      priority: newPriority,
      name: newName.trim(),
      description: newDescription.trim() || "Custom deterministic policy gate.",
      trigger_condition: newTrigger.trim(),
      action_override: newAction,
      enabled: true,
      triggers_today: 0,
    };

    setPolicies((prev) => [createdRule, ...prev]);
    setIsCreateOpen(false);

    // Reset form
    setNewName("");
    setNewDescription("");
    setNewTrigger("");

    addToast({
      id: Date.now().toString(),
      type: "success",
      title: `Gate #${newRuleId} Deployed`,
      description: `New safety rule "${createdRule.name}" active on cluster.`,
    });
  };

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in relative">
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

        <div className="flex items-center gap-space-xs flex-wrap">
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="h-8 px-space-md rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface font-badge-label text-badge-label transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">sync</span>
            <span>{loading ? "Syncing..." : "Sync Engine Rules"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span>Create New Policy Gate</span>
          </button>
        </div>
      </div>

      {/* Policy Simulation Sandbox */}
      <PolicySimulationSandbox
        onApply={(config) => {
          addToast({
            id: Date.now().toString(),
            type: "success",
            title: "Simulation Parameters Staged",
            description: `Applied Target: ${config.confidenceFloor}%, Timeout: ${config.timeoutTolerance}ms, Max Hops: ${config.maxRetries} (${config.projectedRecoveryRate}% recovery).`,
          });
        }}
      />

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
            onToggle={handleToggleRule}
          />
        ))}
      </div>

      {/* Create New Policy Gate Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container border border-surface-container-high rounded-xl p-space-lg flex flex-col gap-space-md shadow-2xl">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  gavel
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Create New Policy Gate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="flex flex-col gap-space-sm font-mono-code text-[12px]">
              <div>
                <label className="text-outline text-[11px] uppercase font-semibold">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. VIP Customer Instant Retry Fast-Track"
                  className="w-full mt-1 px-space-sm py-1.5 rounded bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="text-outline text-[11px] uppercase font-semibold">Priority Tier</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full mt-1 px-space-sm py-1.5 rounded bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="P0 CRITICAL">P0 CRITICAL</option>
                    <option value="P1 HIGH">P1 HIGH</option>
                    <option value="P2 STANDARD">P2 STANDARD</option>
                  </select>
                </div>
                <div>
                  <label className="text-outline text-[11px] uppercase font-semibold">Action Override</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full mt-1 px-space-sm py-1.5 rounded bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="RETRY_NOW">RETRY_NOW (Instant)</option>
                    <option value="RETRY_LATER">RETRY_LATER (Backoff)</option>
                    <option value="SEND_REMINDER">SEND_REMINDER (Hold)</option>
                    <option value="NO_ACTION">NO_ACTION (Drop)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-outline text-[11px] uppercase font-semibold">Trigger Condition</label>
                <input
                  type="text"
                  required
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="e.g. amount > 50000 && bank == 'HDFC'"
                  className="w-full mt-1 px-space-sm py-1.5 rounded bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-outline text-[11px] uppercase font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Compliance and customer protection rationale..."
                  className="w-full mt-1 px-space-sm py-1.5 rounded bg-surface-container-low border border-surface-container-high text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container-high mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-space-md py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-badge-label text-badge-label cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-space-md py-1.5 rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Deploy Gate to Staging
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default Policies;