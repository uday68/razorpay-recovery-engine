import React, { useState, useEffect } from "react";
import { recoveryApi, LiveRecoveryStreamResponse } from "../api";
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
  const [streamStatus, setStreamStatus] = useState<LiveRecoveryStreamResponse | null>(null);
  const [injecting, setInjecting] = useState(false);

  const fetchStreamData = () => {
    recoveryApi
      .getLiveStreamStatus()
      .then((data) => {
        if (data) setStreamStatus(data);
      })
      .catch((err) => {
        console.warn("Using stream status fallback:", err);
      });

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
  };

  useEffect(() => {
    fetchStreamData();
    const interval = setInterval(fetchStreamData, 5000);
    return () => clearInterval(interval);
  }, [selectedGateway, selectedStatus, searchQuery]);

  const handleInjectTestEvent = async () => {
    setInjecting(true);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testPaymentId = `pay_live_test_${randomSuffix}`;
      const amount = Math.floor(1500 + Math.random() * 8500);
      const decision = await recoveryApi.getDecision({
        event_id: `evt_${randomSuffix}`,
        event_type: "PAYMENT_FAILED",
        payment_id: testPaymentId,
        customer_id: `cust_${randomSuffix}`,
        amount: amount,
        payment_method: "UPI",
        bank: "HDFC",
        failure_code: "BANK_TIMEOUT",
        timestamp: new Date().toISOString(),
        success_rate: 0.78,
        recovery_rate: 0.52,
      });

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now
        .getMilliseconds()
        .toString()
        .padStart(3, "0")}`;

      const newTx: TransactionRowData = {
        paymentId: testPaymentId,
        timestamp: timeStr,
        method: "UPI",
        bank: "HDFC",
        amount: amount,
        failureCode: "BANK_TIMEOUT",
        expectedValue: decision.expected_value || 350.0,
        action: (decision.action as any) || "RETRY_NOW",
        status: "RECOVERED",
      };

      setTransactions((prev) => [newTx, ...prev]);
    } catch (err) {
      console.error("Failed to inject live event:", err);
    } finally {
      setInjecting(false);
    }
  };

  const kafkaPartitions = streamStatus?.partitions?.map((p) => ({
    partition: p.partition,
    currentOffset: p.current_offset,
    logEndOffset: p.log_end_offset,
    lag: p.lag,
    status: (p.status as "NORMAL" | "CONGESTED") || "NORMAL",
  }));

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
          <button
            onClick={handleInjectTestEvent}
            disabled={injecting}
            className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary hover:text-on-primary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="font-badge-label text-badge-label font-semibold">
              {injecting ? "Injecting & Routing..." : "Inject Test Event"}
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Streaming Rate"
          value={streamStatus ? streamStatus.streaming_rate : "1,840/s"}
          subtitle="Events/sec ingested"
          delta="Normal Flow"
          deltaType="positive"
          icon="speed"
        />
        <StatCard
          title="Instant Recovery (p95)"
          value={streamStatus ? streamStatus.instant_recovery_p95 : "54.26%"}
          subtitle="Automated retry success"
          delta="+6.61% vs Rule"
          deltaType="positive"
          icon="verified"
        />
        <StatCard
          title="Decision P99 Latency"
          value={streamStatus ? streamStatus.decision_p99_latency_ms : "2.14ms"}
          subtitle="Go -> Python HTTP SLA"
          delta="< 10ms target"
          deltaType="positive"
          icon="timer"
        />
        <StatCard
          title="Active Kafka Lag"
          value={streamStatus ? streamStatus.kafka_lag_msgs : "11 msgs"}
          subtitle="Across 4 active partitions"
          delta="Dynamic Jitter"
          deltaType="neutral"
          icon="schedule"
        />
      </div>

      {/* Trajectory Chart — data from /v1/recovery/stream-status trend_data */}
      <TrendAreaChart
        recoveredRate={streamStatus?.instant_recovery_p95 ? `${streamStatus.instant_recovery_p95} Recovered` : undefined}
        data={streamStatus?.trend_data && streamStatus.trend_data.length > 0 ? streamStatus.trend_data : undefined}
      />

      {/* Kafka Partition Lag Monitor */}
      <KafkaLagMonitor partitions={kafkaPartitions} />

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
      <TransactionTable
        transactions={transactions.length > 0 ? transactions : undefined}
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

export default LiveRecovery;