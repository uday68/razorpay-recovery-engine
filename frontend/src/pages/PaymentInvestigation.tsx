import React, { useState, useEffect } from "react";
import { recoveryApi, AuditDetailResponse } from "../api";
import { ActionBadge } from "../components/ui/ActionBadge";
import { StatusPill } from "../components/ui/StatusPill";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";

export const PaymentInvestigation: React.FC = () => {
  const [activePaymentId, setActivePaymentId] = useState("pay_9281a182_live");
  const [auditData, setAuditData] = useState<AuditDetailResponse | null>(null);

  const fetchInvestigation = (id: string) => {
    recoveryApi
      .getAuditDetail(id)
      .then((data) => {
        if (data) setAuditData(data);
      })
      .catch(console.warn);
  };

  useEffect(() => {
    fetchInvestigation(activePaymentId);
  }, []);

  const mockPayload = JSON.stringify(
    {
      event_id: "evt-9281-a182",
      event_type: "PAYMENT_FAILED",
      payment_id: activePaymentId,
      customer_id: "cust_9281_hdfc",
      amount: 5200.0,
      payment_method: "UPI",
      bank: "HDFC",
      failure_code: "BANK_TIMEOUT",
      timestamp: "2026-09-04T07:42:19.412Z",
      success_rate: 0.82,
      recovery_rate: 0.54,
    },
    null,
    2
  );

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header & Investigation Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Deep-Dive Transaction Forensics
            </span>
            <StatusPill status="OPTIMAL" label="INVESTIGATION COMPLETE" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mt-1">
            {activePaymentId}
          </h1>
        </div>

        <div className="flex items-center gap-space-xs">
          <input
            type="text"
            value={activePaymentId}
            onChange={(e) => setActivePaymentId(e.target.value)}
            placeholder="Search Payment ID..."
            className="px-space-sm py-1.5 rounded bg-surface-container border border-surface-container-high text-on-surface font-mono-code text-[12px] focus:outline-none focus:border-primary"
          />
          <button onClick={() => fetchInvestigation(activePaymentId)} className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm">
        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Transaction Amount
          </span>
          <span className="font-mono-metric-md text-on-surface font-semibold mt-1">
            ?5,200.00
          </span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">
            UPI Intent / HDFC Bank
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Initial Failure Code
          </span>
          <span className="font-mono-code text-error font-semibold mt-1">
            BANK_TIMEOUT
          </span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">
            504 Gateway Gateway Timeout
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Recommended Remediation
          </span>
          <div className="mt-1">
            <ActionBadge action="RETRY_NOW" />
          </div>
          <span className="font-body-sm text-[11px] text-secondary mt-0.5 font-medium">
            Expected Value: +?416.00
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Final Settlement State
          </span>
          <div className="mt-1">
            <StatusPill status="RECOVERED" />
          </div>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">
            Settled via ICICI Failover Route
          </span>
        </div>
      </div>

      {/* State Machine Execution Flow */}
      <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
          Remediation State Machine Traversal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm font-mono-code text-[11px] mt-space-xs">
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high border-l-2 border-l-error">
            <div className="text-outline text-[10px]">STEP 1: 07:42:19.412</div>
            <div className="text-error font-semibold mt-1">PAYMENT_FAILED</div>
            <div className="text-outline text-[10px] mt-0.5">HDFC UPI Timeout</div>
          </div>
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high border-l-2 border-l-primary">
            <div className="text-outline text-[10px]">STEP 2: +1.2ms</div>
            <div className="text-primary font-semibold mt-1">AI_DECISION_ENGINE</div>
            <div className="text-outline text-[10px] mt-0.5">P(Recovery) = 0.82</div>
          </div>
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high border-l-2 border-l-secondary">
            <div className="text-outline text-[10px]">STEP 3: +4.8ms</div>
            <div className="text-secondary font-semibold mt-1">POLICY_GATE_PASSED</div>
            <div className="text-outline text-[10px] mt-0.5">Breaker Closed / EV &gt; 50</div>
          </div>
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high border-l-2 border-l-secondary">
            <div className="text-outline text-[10px]">STEP 4: +240ms</div>
            <div className="text-secondary font-semibold mt-1">RECOVERED_SUCCESS</div>
            <div className="text-outline text-[10px] mt-0.5">PostgreSQL WAL #481029</div>
          </div>
        </div>
      </div>

      {/* Model Decision Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Bandit Action Probabilities
          </h3>
          <div className="space-y-space-sm mt-space-xs font-mono-code text-[12px]">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-on-surface">RETRY_NOW (Recommended)</span>
                <span className="text-secondary font-semibold">82.0%</span>
              </div>
              <ConfidenceBar value={0.82} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-outline">RETRY_LATER (Backoff)</span>
                <span className="text-outline">12.0%</span>
              </div>
              <ConfidenceBar value={0.12} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-outline">SEND_REMINDER</span>
                <span className="text-outline">5.0%</span>
              </div>
              <ConfidenceBar value={0.05} showLabel={false} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-outline">NO_ACTION</span>
                <span className="text-outline">1.0%</span>
              </div>
              <ConfidenceBar value={0.01} showLabel={false} />
            </div>
          </div>
        </div>

        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Cryptographic Audit &amp; Lineage
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            RFC 6962 Merkle tree inclusion proof synced to PostgreSQL ACID WAL
          </p>
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-1 mt-space-xs">
            <div className="flex justify-between">
              <span className="text-outline">Merkle Leaf Index:</span>
              <span className="text-on-surface">#4,192,801</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Audit Event UUID:</span>
              <span className="text-primary truncate ml-2">aud_9281_77a1_00f</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Leaf Hash (SHA256):</span>
              <span className="text-secondary truncate ml-2">0x8a91f4c9...821b0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Verification Status:</span>
              <span className="text-secondary font-semibold">VALID (IMMUTABLE)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Payload JSON */}
      <CodeBlock title="Machine-Readable Transaction Event" code={mockPayload} defaultOpen={true} />
    </div>
  );
};

export default PaymentInvestigation;

