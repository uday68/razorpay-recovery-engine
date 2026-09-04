import React, { useState } from "react";
import { StatCard } from "../components/ui/StatCard";
import { ToastContainer, ToastMessage } from "../components/ui/Toast";
import { TrendAreaChart } from "../components/charts/TrendAreaChart";
import { CircuitBreakerCard } from "../components/system/CircuitBreakerCard";
import { TransactionTable, TransactionRowData } from "../components/recovery/TransactionTable";
import { DecisionLineageDrawer } from "../components/recovery/DecisionLineageDrawer";
import {
  ConfigureThresholdsModal,
  ThresholdsConfig,
} from "../components/recovery/ConfigureThresholdsModal";

const initialTransactions: TransactionRowData[] = [
  {
    paymentId: "pay_9281a182",
    timestamp: "13:30:12.821",
    method: "UPI",
    bank: "HDFC",
    amount: 5200.0,
    failureCode: "BANK_TIMEOUT",
    expectedValue: 416.0,
    action: "RETRY_NOW",
    status: "RECOVERED",
  },
  {
    paymentId: "pay_9282c491",
    timestamp: "13:29:55.109",
    method: "CARD",
    bank: "ICICI",
    amount: 14850.0,
    failureCode: "GATEWAY_504",
    expectedValue: 890.0,
    action: "RETRY_LATER",
    status: "ROUTING",
  },
  {
    paymentId: "pay_9283e710",
    timestamp: "13:28:41.642",
    method: "NET_BANKING",
    bank: "SBI",
    amount: 23000.0,
    failureCode: "INTERNAL_ERROR",
    expectedValue: 120.0,
    action: "SEND_REMINDER",
    status: "PENDING",
  },
  {
    paymentId: "pay_9284f229",
    timestamp: "13:27:18.490",
    method: "UPI",
    bank: "AXIS",
    amount: 850.0,
    failureCode: "INSUFFICIENT_FUNDS",
    expectedValue: 0.0,
    action: "NO_ACTION",
    status: "FAILED",
  },
  {
    paymentId: "pay_9285b611",
    timestamp: "13:25:04.221",
    method: "UPI",
    bank: "HDFC",
    amount: 1950.0,
    failureCode: "NETWORK_CONGESTION",
    expectedValue: 156.0,
    action: "RETRY_NOW",
    status: "RECOVERED",
  },
];

export const Overview: React.FC = () => {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRowData[]>(initialTransactions);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);
  const [engineMode, setEngineMode] = useState<"AUTONOMOUS" | "SHADOW" | "MANUAL">("AUTONOMOUS");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Telemetry metrics state
  const [atRiskRevenue, setAtRiskRevenue] = useState(15.14);
  const [recoveredRevenue, setRecoveredRevenue] = useState(8.26);
  const [activeInFlight, setActiveInFlight] = useState(127);

  // Policy Thresholds configuration
  const [thresholds, setThresholds] = useState<ThresholdsConfig>({
    recoveryTarget: 50.0,
    gatewayTripRate: 15.0,
    evFloor: 50.0,
    maxHops: 3,
    autoRecoveryEnabled: true,
  });

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Export Telemetry CSV
  const handleExportCSV = () => {
    const headers =
      "Payment ID,Timestamp,Method,Bank,Amount (INR),Failure Code,Expected Value (INR),Engine Action,Status\n";
    const rows = transactions
      .map(
        (t) =>
          `${t.paymentId},${t.timestamp},${t.method},${t.bank},${t.amount},${t.failureCode},${t.expectedValue},${t.action},${t.status}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `razorpay-recovery-telemetry-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      id: Date.now().toString(),
      type: "success",
      title: "Telemetry CSV Exported",
      description: `Successfully exported ${transactions.length} recovery records.`,
    });
  };

  // 2. Simulate Batch Failure
  const handleSimulateBatch = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now
      .getMilliseconds()
      .toString()
      .padStart(3, "0")}`;

    const newSimulatedBatch: TransactionRowData[] = [
      {
        paymentId: `pay_sim_${randomSuffix}_hdfc`,
        timestamp: timeStr,
        method: "UPI",
        bank: "HDFC",
        amount: 3400.0,
        failureCode: "BANK_TIMEOUT",
        expectedValue: 272.0,
        action: "RETRY_NOW",
        status: "RECOVERED",
      },
      {
        paymentId: `pay_sim_${randomSuffix}_sbi`,
        timestamp: timeStr,
        method: "NET_BANKING",
        bank: "SBI",
        amount: 8900.0,
        failureCode: "GATEWAY_504",
        expectedValue: 356.0,
        action: "RETRY_LATER",
        status: "ROUTING",
      },
      {
        paymentId: `pay_sim_${randomSuffix}_icici`,
        timestamp: timeStr,
        method: "CARD",
        bank: "ICICI",
        amount: 18200.0,
        failureCode: "NETWORK_SURGE",
        expectedValue: 728.0,
        action: "RETRY_LATER",
        status: "PENDING",
      },
    ];

    setTransactions((prev) => [...newSimulatedBatch, ...prev]);
    setAtRiskRevenue((prev) => Number((prev + 0.03).toFixed(2)));
    setRecoveredRevenue((prev) => Number((prev + 0.02).toFixed(2)));
    setActiveInFlight((prev) => prev + 3);

    addToast({
      id: Date.now().toString(),
      type: "info",
      title: "Batch Failure Injected",
      description: "Injected 3 synthetic failure events across HDFC, SBI, and ICICI.",
    });
  };

  // 3. Toggle Engine Mode
  const handleCycleEngineMode = () => {
    const nextMode =
      engineMode === "AUTONOMOUS"
        ? "SHADOW"
        : engineMode === "SHADOW"
        ? "MANUAL"
        : "AUTONOMOUS";
    setEngineMode(nextMode);

    addToast({
      id: Date.now().toString(),
      type: nextMode === "AUTONOMOUS" ? "success" : "warning",
      title: `Engine Mode Switched to ${nextMode}`,
      description:
        nextMode === "AUTONOMOUS"
          ? "Autonomous high-frequency execution active."
          : nextMode === "SHADOW"
          ? "Running in shadow canary mode (zero live retry dispatch)."
          : "Manual mode: Requires human verification before secondary charge.",
    });
  };

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in relative">
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
                PRODUCTION RUNTIME - HDFC / RAZORPAY / CASHFREE CLUSTER
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            AI-powered autonomous remediation orchestration across high-velocity failed transactions
          </p>
        </div>

        {/* Action Toolset (All Buttons Wired & Interactive) */}
        <div className="flex items-center gap-space-xs flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-8 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center gap-space-xs transition-colors cursor-pointer shadow-sm active:scale-95"
            title="Export all current telemetry records as CSV"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">
              file_download
            </span>
            <span className="font-badge-label text-badge-label">
              Export Telemetry CSV
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsThresholdsOpen(true)}
            className="h-8 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface flex items-center gap-space-xs transition-colors cursor-pointer shadow-sm active:scale-95"
            title="Configure policy parameters and circuit trip thresholds"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">
              tune
            </span>
            <span className="font-badge-label text-badge-label">
              Configure Thresholds
            </span>
          </button>

          <button
            type="button"
            onClick={handleSimulateBatch}
            className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary hover:text-on-primary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95"
            title="Inject simulated payment failures to observe autonomous decisioning"
          >
            <span className="material-symbols-outlined text-[16px]">
              play_circle
            </span>
            <span className="font-badge-label text-badge-label font-semibold">
              Simulate Batch Failure
            </span>
          </button>
        </div>
      </div>

      {/* KPI Density Strip (5 Modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
        <StatCard
          title="At-Risk Revenue"
          value={`?${atRiskRevenue.toFixed(2)}M`}
          subtitle={`${(transactions.length * 856).toLocaleString()} failed txns today`}
          delta="+2.4% vs yday"
          deltaType="negative"
          icon="trending_up"
        />
        <StatCard
          title="Recovered Revenue"
          value={`?${recoveredRevenue.toFixed(2)}M`}
          subtitle="54.26% recovered volume"
          delta="+?1.12M baseline"
          deltaType="positive"
          icon="payments"
        />
        <StatCard
          title="Recovery Rate"
          value="54.26%"
          subtitle={`Target: >${thresholds.recoveryTarget.toFixed(2)}%`}
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
          value={`${activeInFlight} active`}
          subtitle={`${Math.round(activeInFlight * 0.65)} queue · ${Math.round(
            activeInFlight * 0.35
          )} exec`}
          delta="lag 8ms"
          deltaType="neutral"
          icon="bolt"
        />
      </div>

      {/* Chart & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <TrendAreaChart
            onRangeChange={(range) =>
              addToast({
                id: Date.now().toString(),
                type: "info",
                title: `Trajectory Window Updated: ${range}`,
                description: `Aggregating rolling telemetry across ${range} time window.`,
              })
            }
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-outline">
                  Recovery Engine Mode
                </span>
                <button
                  type="button"
                  onClick={handleCycleEngineMode}
                  className={`px-space-xs py-0.5 rounded font-mono-code text-[11px] font-semibold border transition-all cursor-pointer ${
                    engineMode === "AUTONOMOUS"
                      ? "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20"
                      : engineMode === "SHADOW"
                      ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      : "bg-tertiary/10 text-tertiary border-tertiary/30 hover:bg-tertiary/20"
                  }`}
                  title="Click to cycle execution mode"
                >
                  {engineMode} (CLICK TO CHANGE)
                </button>
              </div>

              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-2">
                {engineMode === "AUTONOMOUS"
                  ? "Contextual Bandit + Safe Gate"
                  : engineMode === "SHADOW"
                  ? "Shadow Mode (Evaluation Only)"
                  : "Manual Operator Approval Gate"}
              </h3>
              <p className="font-body-sm text-body-sm text-outline mt-1">
                {engineMode === "AUTONOMOUS"
                  ? "Bandit model dynamically balances exploration and exploitation with strict deterministic policy boundaries."
                  : engineMode === "SHADOW"
                  ? "Inference runs in parallel with static baselines to benchmark performance without dispatching secondary charges."
                  : "Every recommended recovery action is placed into a staging review queue awaiting manual release."}
              </p>
            </div>

            <div className="mt-4 p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-outline">Thompson Sampling:</span>
                <span className="text-secondary font-medium">
                  {thresholds.autoRecoveryEnabled ? "ENABLED" : "PAUSED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Decision Latency:</span>
                <span className="text-secondary font-medium">0.82ms (p50)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">EV Hard Floor:</span>
                <span className="text-primary font-medium">
                  = ?{thresholds.evFloor}.00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Kafka Worker Group:</span>
                <span className="text-primary font-medium">recovery-worker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banking Partner Health with Reset / Trip capability */}
      <CircuitBreakerCard
        onToggleBreaker={(name, state) =>
          addToast({
            id: Date.now().toString(),
            type: state === "CLOSED" ? "success" : "warning",
            title: `Circuit Breaker Altered: ${name}`,
            description: `Gateway switch state transitioned to ${state}.`,
          })
        }
      />

      {/* Live Transaction Ledger with Inspect handler */}
      <TransactionTable
        transactions={transactions}
        onInspect={(id) => setSelectedTx(id)}
      />

      {/* Decision Lineage Inspector Drawer */}
      <DecisionLineageDrawer
        paymentId={selectedTx || ""}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />

      {/* Configure Thresholds Modal */}
      <ConfigureThresholdsModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        currentConfig={thresholds}
        onSave={(newConfig) => {
          setThresholds(newConfig);
          addToast({
            id: Date.now().toString(),
            type: "success",
            title: "Thresholds Successfully Applied",
            description: `Target set to ${newConfig.recoveryTarget}%, Trip rate ${newConfig.gatewayTripRate}%, EV Floor ?${newConfig.evFloor}.`,
          });
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default Overview;

