import React, { useState } from "react";
import { StatCard } from "../components/ui/StatCard";
import { SearchFilterBar } from "../components/ui/SearchFilterBar";
import { CodeBlock } from "../components/ui/CodeBlock";
import { TransactionTable } from "../components/recovery/TransactionTable";
import { DecisionLineageDrawer } from "../components/recovery/DecisionLineageDrawer";

export const AuditLog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const mockMerkleProof = JSON.stringify(
    {
      proof_version: "RFC-6962-V1",
      tree_height: 23,
      root_hash: "0x8fa928014e7a881920bcf81923049182a0912384729102938471920384729182",
      leaf_hash: "0x4e7a881920bcf81923049182a09123847291029384719203847291828fa92801",
      leaf_index: 4192801,
      wal_checkpoint: "0/18A9204",
      database: "PostgreSQL 16 ACID WAL",
      signature: "0x77c2901a...ed910a",
      timestamp: "2026-09-04T07:42:19.412Z",
    },
    null,
    2
  );

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Cryptographic Audit Log &amp; Lineage
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                POSTGRESQL WAL IMMUTABLE LEDGER
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            RFC 6962 verifiable Merkle hash chain proving every automated retry and policy decision
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface font-badge-label text-badge-label transition-colors">
            Verify Merkle Proof Offline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Total Audit Events"
          value="4,192,801"
          subtitle="Block height verified"
          delta="100% Intact"
          deltaType="positive"
          icon="verified_user"
        />
        <StatCard
          title="Merkle Tree Consistency"
          value="0 Hash Collisions"
          subtitle="SHA-256 binary tree"
          delta="Tamper Proof"
          deltaType="positive"
          icon="account_tree"
        />
        <StatCard
          title="WAL Sync Latency"
          value="0.14ms"
          subtitle="Synchronous durability"
          delta="ACID Safe"
          deltaType="positive"
          icon="check_circle"
        />
        <StatCard
          title="Retention Policy"
          value="7 Years"
          subtitle="RBI & PCI-DSS compliance"
          delta="Active Archival"
          deltaType="neutral"
          icon="lock_clock"
        />
      </div>

      {/* Merkle Root Payload Viewer */}
      <CodeBlock
        title="RFC 6962 Cryptographic Inclusion Proof"
        code={mockMerkleProof}
        defaultOpen={true}
      />

      {/* Search & Audit Table */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="filter: payment_id=pay_9281 block_index=4192801"
      />

      <TransactionTable
        title="Immutable Decision & Remediation Ledger"
        subtitle="Cryptographically verified event entries"
        onInspect={(id) => setSelectedTx(id)}
      />

      {/* Decision Lineage Drawer */}
      <DecisionLineageDrawer
        paymentId={selectedTx || ""}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

export default AuditLog;
