import React, { useState, useEffect } from "react";
import {
  recoveryApi,
  AuditDetailResponse,
  SHAPExplanationResponse,
  RFC6962MerkleProofResponse,
  VerifyProofResponse,
} from "../api";
import { ActionBadge } from "../components/ui/ActionBadge";
import { StatusPill } from "../components/ui/StatusPill";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";

export const PaymentInvestigation: React.FC = () => {
  const [activePaymentId, setActivePaymentId] = useState("");
  const [recentTransactions, setRecentTransactions] = useState<string[]>([]);
  const [auditData, setAuditData] = useState<AuditDetailResponse | null>(null);
  const [shapData, setShapData] = useState<SHAPExplanationResponse | null>(null);
  const [merkleProof, setMerkleProof] = useState<RFC6962MerkleProofResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyProofResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchInvestigation = (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setNotFound(false);
    setVerificationResult(null);

    Promise.allSettled([
      recoveryApi.getAuditDetail(id.trim()),
      recoveryApi.getSHAPExplanation(id.trim()),
      recoveryApi.getRFC6962Proof(id.trim()),
    ])
      .then(([auditRes, shapRes, merkleRes]) => {
        if (auditRes.status === "fulfilled" && auditRes.value) {
          setAuditData(auditRes.value);
          setActivePaymentId(auditRes.value.payment_id);
        } else {
          setAuditData(null);
          setNotFound(true);
        }

        if (shapRes.status === "fulfilled" && shapRes.value) {
          setShapData(shapRes.value);
        } else {
          setShapData(null);
        }

        if (merkleRes.status === "fulfilled" && merkleRes.value) {
          setMerkleProof(merkleRes.value);
        } else {
          setMerkleProof(null);
        }
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

  const handleVerifyProof = () => {
    if (!merkleProof) return;
    setVerifying(true);
    recoveryApi
      .verifyMerkleProof({
        leaf_hash: merkleProof.leaf_hash,
        leaf_index: merkleProof.leaf_index,
        tree_size: merkleProof.tree_size,
        audit_path: merkleProof.audit_path,
        expected_root: merkleProof.root_hash,
      })
      .then((res) => setVerificationResult(res))
      .catch((err) => console.error("Verification failed:", err))
      .finally(() => setVerifying(false));
  };

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
              label={loading ? "FETCHING LEDGER..." : "AUDIT RECORD"}
            />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mt-1 truncate max-w-2xl">
            {activePaymentId || "Awaiting Selection"}
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
            className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Inspecting..." : "Investigate"}
          </button>
        </div>
      </div>

      {/* Quick Switcher */}
      {recentTransactions.length > 0 && (
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
          <span className="font-label-caps text-label-caps text-outline shrink-0 mr-1">
            Recent Payments:
          </span>
          {recentTransactions.map((pid) => (
            <button
              key={pid}
              onClick={() => {
                setActivePaymentId(pid);
                fetchInvestigation(pid);
              }}
              className={`px-space-sm py-1 rounded text-[11px] font-mono-code transition-colors cursor-pointer shrink-0 border ${
                activePaymentId === pid
                  ? "bg-primary-container text-on-primary-container border-primary font-semibold"
                  : "bg-surface-container text-outline border-surface-container-high hover:border-outline"
              }`}
            >
              {pid}
            </button>
          ))}
        </div>
      )}

      {/* State Machine Transition Timeline */}
      <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            State Execution Lifecycle
          </h3>
          <span className="font-label-caps text-label-caps text-outline">
            {stateSteps.length} Recorded Steps
          </span>
        </div>

        {stateSteps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-xs mt-space-xs">
            {stateSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px]"
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

      {/* SHAP Model Explanations & Action Probabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* SHAP TreeExplainer Waterfall */}
        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
              SHAP Feature Attributions (TreeExplainer)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-secondary/10 text-secondary border border-secondary/30 font-semibold">
              REAL SHAPLEY VALUES
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            Calculated via TreeSHAP on Random Forest ({shapData?.model_name || "100 Estimators"}). Base Value:{" "}
            <span className="font-mono-code text-on-surface font-semibold">{shapData ? (shapData.base_value * 100).toFixed(1) + "%" : "..."}</span>
          </p>

          {shapData ? (
            <div className="space-y-2.5 mt-space-xs font-mono-code text-[11px]">
              {shapData.attributions.map((attr) => {
                const isPositive = attr.direction === "POSITIVE";
                const widthPct = Math.min(100, Math.abs(attr.shap_value) * 300);
                return (
                  <div key={attr.feature} className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-on-surface font-medium truncate max-w-[280px]">
                        #{attr.importance_rank} {attr.feature}
                      </span>
                      <span className={`font-semibold ${isPositive ? "text-secondary" : "text-error"}`}>
                        {isPositive ? "+" : ""}{(attr.shap_value * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full ${isPositive ? "bg-secondary" : "bg-error"}`}
                        style={{ width: `${Math.max(5, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-surface-container-high flex justify-between text-[12px] font-semibold">
                <span className="text-on-surface">Final Model Output Probability:</span>
                <span className="text-primary">{(shapData.output_probability * 100).toFixed(2)}% ({shapData.prediction_label})</span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-outline text-body-sm font-mono-code">
              Loading SHAP explanations...
            </div>
          )}
        </div>

        {/* Action Probabilities & RFC 6962 Cryptographic Proof */}
        <div className="flex flex-col gap-space-lg">
          {/* Action Probabilities */}
          <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
              Candidate Action Probabilities
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

          {/* RFC 6962 Cryptographic Merkle Proof */}
          <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                RFC 6962 Merkle Inclusion Proof
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-primary/10 text-primary border border-primary/30 font-semibold">
                RFC 6962 COMPLIANT
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-outline">
              Leaf prefix <code className="text-primary font-mono-code">0x00</code>, Node prefix <code className="text-primary font-mono-code">0x01</code>, power-of-2 split tree.
            </p>

            {merkleProof && (
              <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-2 mt-space-xs">
                <div className="flex justify-between">
                  <span className="text-outline">Leaf Index / Size:</span>
                  <span className="text-on-surface font-mono-code">
                    {merkleProof.leaf_index} / {merkleProof.tree_size} leaves
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Leaf Hash (0x00):</span>
                  <span className="text-secondary truncate ml-2 font-mono-code max-w-[240px]">
                    {merkleProof.leaf_hash}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Merkle Root:</span>
                  <span className="text-primary truncate ml-2 font-mono-code max-w-[240px]">
                    {merkleProof.root_hash}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Audit Path Steps:</span>
                  <span className="text-on-surface font-mono-code">
                    {merkleProof.audit_path.length} sibling hashes
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-surface-container-high">
                  <button
                    onClick={handleVerifyProof}
                    disabled={verifying}
                    className="px-3 py-1 rounded bg-secondary text-on-secondary text-[11px] font-semibold hover:bg-secondary-container transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify Proof Cryptographically"}
                  </button>

                  {verificationResult && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      verificationResult.valid
                        ? "bg-secondary/20 text-secondary border border-secondary"
                        : "bg-error/20 text-error border border-error"
                    }`}>
                      {verificationResult.valid ? "✓ VERIFIED VALID" : "✗ VERIFICATION FAILED"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw Payload JSON */}
      <CodeBlock title="Machine-Readable Audit Record (PostgreSQL)" code={rawJsonPayload} defaultOpen={true} />
    </div>
  );
};

export default PaymentInvestigation;
