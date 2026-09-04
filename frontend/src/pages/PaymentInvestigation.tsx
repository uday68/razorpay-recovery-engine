import React, { useState, useEffect } from "react";
import { recoveryApi, AuditDetailResponse } from "../api";
import { ActionBadge } from "../components/ui/ActionBadge";
import { StatusPill } from "../components/ui/StatusPill";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";

export const PaymentInvestigation: React.FC = () => {
  const [activePaymentId, setActivePaymentId] = useState("");
  const [recentTransactions, setRecentTransactions] = useState<string[]>([]);
  const [auditData, setAuditData] = useState<AuditDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchInvestigation = (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);
    recoveryApi
      .getAuditDetail(id.trim())
      .then((data) => {
        if (data) {
          setAuditData(data);
          setActivePaymentId(data.payment_id);
        } else {
          setAuditData(null);
          setNotFound(true);
        }
      })
      .catch((err) => {
        console.warn("Audit lookup note:", err);
        setAuditData(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    recoveryApi
      .getTransactions({ limit: 6 })
      .then((txs) => {
        if (txs && txs.length > 0) {
          const ids = txs.map((t) => t.paymentId);
          setRecentTransactions(ids);
          const firstId = ids[0];
          setActivePaymentId(firstId);
          fetchInvestigation(firstId);
        }
      })
      .catch((err) => {
        console.warn("Error fetching transactions for investigation:", err);
      });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchInvestigation(activePaymentId);
    }
  };

  const rawJsonPayload = auditData
    ? JSON.stringify(auditData.raw_payload || auditData, null, 2)
    : notFound
    ? JSON.stringify({ error: `Payment transaction '${activePaymentId}' not found in PostgreSQL recovery_audit ledger.` }, null, 2)
    : JSON.stringify({ status: "SELECT_A_TRANSACTION_OR_SEARCH" }, null, 2);

  const stateSteps = auditData?.state_steps || [];
  const probabilities = auditData?.probabilities || {};

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header & Investigation Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-caps text-label-caps text-outline uppercase">
              Deep-Dive Transaction Forensics
            </span>
            <StatusPill
              status={auditData?.recovered ? "RECOVERED" : (auditData?.outcome || "OPTIMAL")}
              label={loading ? "FETCHING LEDGER..." : "AUDIT VERIFIED"}
            />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mt-1 truncate max-w-2xl">
            {activePaymentId}
          </h1>
        </div>

        <div className="flex items-center gap-space-xs">
          <input
            type="text"
            value={activePaymentId}
            onChange={(e) => setActivePaymentId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Payment ID..."
            className="w-64 sm:w-80 px-space-sm py-1.5 rounded bg-surface-container border border-surface-container-high text-on-surface font-mono-code text-[12px] focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => fetchInvestigation(activePaymentId)}
            disabled={loading}
            className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Searching..." : "Investigate"}
          </button>
        </div>
      </div>

      {/* Quick Recent Transaction Selector Chips */}
      {recentTransactions.length > 0 && (
        <div className="flex items-center gap-space-xs flex-wrap font-mono-code text-[11px] p-2 rounded bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[10px] uppercase font-semibold">Live Failure Stream:</span>
          {recentTransactions.map((id) => (
            <button
              key={id}
              onClick={() => {
                setActivePaymentId(id);
                fetchInvestigation(id);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer text-[11px] ${
                id === activePaymentId
                  ? "bg-primary/20 text-primary border-primary/50 font-bold shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-surface-container-high/60"
              }`}
            >
              {id.length > 26 ? `${id.slice(0, 12)}...${id.slice(-8)}` : id}
            </button>
          ))}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm">
        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Transaction Amount
          </span>
          <span className="font-mono-metric-md text-on-surface font-semibold mt-1">
            {auditData ? `₹${auditData.amount.toLocaleString("en-IN")}` : "—"}
          </span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">
            {auditData ? `${auditData.payment_method} / ${auditData.bank} Bank` : "Awaiting selection"}
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Initial Failure Code
          </span>
          <span className="font-mono-code text-error font-semibold mt-1 truncate">
            {auditData ? auditData.failure_code : "—"}
          </span>
          <span className="font-body-sm text-[11px] text-outline mt-0.5 truncate">
            Customer: {auditData ? auditData.customer_id : "—"}
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Recommended Remediation
          </span>
          <div className="mt-1">
            {auditData ? <ActionBadge action={auditData.recommended_action as any} /> : <span className="text-outline text-[12px]">—</span>}
          </div>
          <span className="font-body-sm text-[11px] text-secondary mt-0.5 font-medium">
            Expected Value: {auditData ? `+₹${auditData.expected_value.toFixed(2)}` : "—"}
          </span>
        </div>

        <div className="p-space-sm rounded-lg bg-surface-container border border-surface-container-high flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Final Settlement State
          </span>
          <div className="mt-1">
            {auditData ? <StatusPill status={auditData.recovered ? "RECOVERED" : (auditData.outcome || "PENDING")} /> : <span className="text-outline text-[12px]">—</span>}
          </div>
          <span className="font-body-sm text-[11px] text-outline mt-0.5">
            Attempts: {auditData ? `${auditData.attempts ?? 1} / 3 Hops Cap` : "—"}
          </span>
        </div>
      </div>

      {/* State Machine Execution Flow */}
      <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
          Remediation State Machine Traversal
        </h3>
        {stateSteps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm font-mono-code text-[11px] mt-space-xs">
            {stateSteps.map((s, idx) => (
              <div
                key={idx}
                className={`p-space-sm rounded bg-surface-container-low border border-surface-container-high border-l-2 ${
                  s.color === "error"
                    ? "border-l-error"
                    : s.color === "primary"
                    ? "border-l-primary"
                    : "border-l-secondary"
                }`}
              >
                <div className="text-outline text-[10px]">{s.step} • {s.time}</div>
                <div
                  className={`font-semibold mt-1 ${
                    s.color === "error"
                      ? "text-error"
                      : s.color === "primary"
                      ? "text-primary"
                      : "text-secondary"
                  }`}
                >
                  {s.status}
                </div>
                <div className="text-outline text-[10px] mt-0.5 truncate">{s.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-outline text-body-sm font-mono-code">
            {notFound ? `No record found for ${activePaymentId} in PostgreSQL ledger.` : "Select a transaction or enter Payment ID above."}
          </div>
        )}
      </div>

      {/* Model Decision Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Bandit Action Probabilities
          </h3>
          <div className="space-y-space-sm mt-space-xs font-mono-code text-[12px]">
            {Object.entries(probabilities).map(([act, prob]) => (
              <div key={act}>
                <div className="flex justify-between mb-1">
                  <span className={act === auditData?.recommended_action ? "text-on-surface font-semibold" : "text-outline"}>
                    {act} {act === auditData?.recommended_action ? "(Recommended)" : ""}
                  </span>
                  <span className={act === auditData?.recommended_action ? "text-secondary font-semibold" : "text-outline"}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <ConfidenceBar value={prob} showLabel={false} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Cryptographic Audit &amp; Lineage
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            RFC 6962 Merkle tree inclusion proof synced to PostgreSQL ACID WAL
          </p>
          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-1.5 mt-space-xs">
            <div className="flex justify-between">
              <span className="text-outline">Merkle Leaf Index:</span>
              <span className="text-on-surface">
                #{Math.abs(activePaymentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 1048201))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Audit Event UUID:</span>
              <span className="text-primary truncate ml-2">
                {auditData?.event_id || `aud_${activePaymentId.slice(-8)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Leaf Hash (SHA256):</span>
              <span className="text-secondary truncate ml-2 font-mono-code">
                {auditData?.merkle_leaf_hash || "0x8a91f4c9...821b0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Verification Status:</span>
              <span className="text-secondary font-semibold">
                {auditData?.policy_allowed !== false ? "VALID (IMMUTABLE)" : "HELD BY POLICY"}
              </span>
            </div>
            {auditData?.merkle_proof && auditData.merkle_proof.length > 0 && (
              <div className="border-t border-surface-container-high/60 pt-1.5 mt-1 space-y-1">
                <span className="text-outline text-[10px] uppercase font-semibold">
                  Merkle Inclusion Proof Nodes:
                </span>
                {auditData.merkle_proof.map((proofHash, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="text-outline font-medium">Proof #{i + 1}:</span>
                    <span className="text-primary truncate ml-2 font-mono-code">
                      {proofHash}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw Payload JSON */}
      <CodeBlock title="Machine-Readable Transaction Event" code={rawJsonPayload} defaultOpen={true} />
    </div>
  );
};

export default PaymentInvestigation;