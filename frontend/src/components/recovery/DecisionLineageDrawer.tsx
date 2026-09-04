import React from "react";
import { ActionBadge } from "../ui/ActionBadge";
import { StatusPill } from "../ui/StatusPill";
import { CodeBlock } from "../ui/CodeBlock";

export interface DecisionLineageDrawerProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionLineageDrawer: React.FC<DecisionLineageDrawerProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const mockPayload = JSON.stringify(
    {
      event_id: `evt-${paymentId}`,
      event_type: "PAYMENT_FAILED",
      payment_id: paymentId,
      customer_id: "cust_781290",
      amount: 5200.0,
      payment_method: "UPI",
      bank: "HDFC",
      failure_code: "BANK_TIMEOUT",
      timestamp: "2026-09-04T07:34:18.821Z",
      success_rate: 0.82,
      recovery_rate: 0.54,
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface-container border-l border-surface-container-high h-full overflow-y-auto p-space-lg flex flex-col gap-space-md shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps text-outline uppercase">
                Decision Lineage Inspector
              </span>
              <StatusPill status="OPTIMAL" />
            </div>
            <h2 className="font-mono-metric-md text-mono-metric-md text-on-surface font-semibold mt-1">
              {paymentId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Action & Expected Value Banner */}
        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Engine Execution Result
            </span>
            <div className="mt-1">
              <ActionBadge action="RETRY_NOW" />
            </div>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Expected Value
            </span>
            <span className="font-mono-code text-[14px] text-secondary font-semibold mt-1">
              +?416.00 (80% Win)
            </span>
          </div>
        </div>

        {/* Feature Attribution (Contextual Bandit signals) */}
        <div className="flex flex-col gap-space-xs p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Model Feature Attribution (Bandit Weights)
          </span>
          <div className="space-y-1.5 font-mono-code text-[11px] mt-1">
            <div className="flex justify-between">
              <span className="text-outline">Historical Bank Success Rate:</span>
              <span className="text-secondary font-medium">+0.42 (High)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Failure Code Recovery Propensity:</span>
              <span className="text-secondary font-medium">+0.31 (Transient)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Gateway Circuit Breaker Health:</span>
              <span className="text-secondary font-medium">1.00 (Closed / Green)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Traffic Peak Hour Congestion:</span>
              <span className="text-error font-medium">-0.08 (Minor Risk)</span>
            </div>
          </div>
        </div>

        {/* Deterministic Policy Gate Verification */}
        <div className="flex flex-col gap-space-xs p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Deterministic Compliance & Policy Gates
          </span>
          <div className="space-y-1.5 font-body-sm text-[12px] mt-1">
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>RBI Mandatory Customer Cooling Window respected</span>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>HDFC Gateway Circuit Breaker: Healthy (Trip rate &lt; 5%)</span>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Hard recovery floor (&gt; ?50.00 EV) satisfied</span>
            </div>
          </div>
        </div>

        {/* Machine-Readable JSON Payload */}
        <CodeBlock title="Raw Event Payload" code={mockPayload} defaultOpen={true} />

        {/* Cryptographic Merkle Root Verification */}
        <div className="flex items-center justify-between p-space-sm rounded bg-surface-container-lowest font-mono-code text-[11px] text-outline border border-surface-container-high/40">
          <span className="truncate mr-2">
            Merkle Hash: 0x9f83a21...d8e192
          </span>
          <span className="text-secondary font-medium whitespace-nowrap">
            WAL Verified ?
          </span>
        </div>
      </div>
    </div>
  );
};

export default DecisionLineageDrawer;

