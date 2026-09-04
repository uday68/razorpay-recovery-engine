import React, { useState, useEffect } from "react";
import { recoveryApi } from "../api";
import { TransactionRowData } from "../components/recovery/TransactionTable";
import { StatCard } from "../components/ui/StatCard";
import { SearchFilterBar } from "../components/ui/SearchFilterBar";
import { TrendAreaChart } from "../components/charts/TrendAreaChart";
import { TransactionTable } from "../components/recovery/TransactionTable";
import { DecisionLineageDrawer } from "../components/recovery/DecisionLineageDrawer";
import { KafkaLagMonitor } from "../components/system/KafkaLagMonitor";

export const LiveRecovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRowData[]>([]);

  useEffect(() => {
    recoveryApi
      .getTransactions({
        gateway: selectedGateway !== "ALL" ? selectedGateway : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      })
      .then((txs) => {
        if (txs && txs.length > 0) setTransactions(txs);
      })
      .catch((err) => {
        console.warn("Using offline transactions:", err);
      });
  }, [selectedGateway, selectedStatus, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Live Recovery Stream
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                KAFKA REALTIME INGESTION ACTIVE
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Live execution pipeline routing events through Go Executor (:8080) and Python ML Engine (:8000)
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary hover:text-on-primary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="font-badge-label text-badge-label font-semibold">Inject Test Event</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Streaming Rate"
          value="1,840/s"
          subtitle="Events/sec ingested"
          delta="Normal Flow"
          deltaType="positive"
          icon="speed"
        />
        <StatCard
          title="Instant Recovery (p95)"
          value="54.26%"
          subtitle="Automated retry success"
          delta="+6.61% vs Rule"
          deltaType="positive"
          icon="verified"
        />
        <StatCard
          title="Decision P99 Latency"
          value="2.14ms"
          subtitle="Go -> Python HTTP SLA"
          delta="< 10ms target"
          deltaType="positive"
          icon="timer"
        />
        <StatCard
          title="Active Backoff Queue"
          value="43 txns"
          subtitle="Awaiting exponential timer"
          delta="Dynamic Jitter"
          deltaType="neutral"
          icon="schedule"
        />
      </div>

      {/* Trajectory Chart */}
      <TrendAreaChart />

      {/* Kafka Partition Lag Monitor */}
      <KafkaLagMonitor />

      {/* Search & Filter Controls */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGateway={selectedGateway}
        onGatewayChange={setSelectedGateway}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Real-time Ledger */}
      <TransactionTable transactions={transactions.length > 0 ? transactions : undefined} onInspect={(id) => setSelectedTx(id)} />

      {/* Decision Lineage Drawer */}
      <DecisionLineageDrawer
        paymentId={selectedTx || ""}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

export default LiveRecovery;

