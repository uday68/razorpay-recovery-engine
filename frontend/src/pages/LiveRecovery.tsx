import React, { useState, useEffect, useRef } from "react";
import { recoveryApi, LiveRecoveryStreamResponse } from "../api";
import { TransactionRowData } from "../components/recovery/TransactionTable";
import { StatCard } from "../components/ui/StatCard";
import { SearchFilterBar } from "../components/ui/SearchFilterBar";
import { TrendAreaChart } from "../components/charts/TrendAreaChart";
import { TransactionTable } from "../components/recovery/TransactionTable";
import { DecisionLineageDrawer } from "../components/recovery/DecisionLineageDrawer";
import { KafkaLagMonitor } from "../components/system/KafkaLagMonitor";

interface ToastEvent {
  id: number;
  paymentId: string;
  bank: string;
  method: string;
  amount: number;
  action: string;
  recovered: boolean;
  ev: number;
}

const ACTION_COLOUR: Record<string, string> = {
  RETRY_NOW:     "text-green-400",
  RETRY_LATER:   "text-cyan-400",
  SEND_REMINDER: "text-yellow-400",
  NO_ACTION:     "text-zinc-400",
};

const Toast: React.FC<{ event: ToastEvent; onDismiss: () => void }> = ({ event, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, []);

  const fmtInr = (v: number) =>
    v >= 100000 ? `Rs.${(v / 100000).toFixed(1)}L`
    : v >= 1000  ? `Rs.${(v / 1000).toFixed(1)}K`
    : `Rs.${v.toFixed(0)}`;

  const actionCls = ACTION_COLOUR[event.action] ?? "text-white";

  return (
    <div className="flex items-start gap-3 bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 shadow-xl min-w-[300px] max-w-[360px] animate-fade-in">
      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${event.recovered ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-on-surface-variant truncate">{event.paymentId}</span>
          <span className="text-xs text-on-surface-variant">{event.bank}/{event.method}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-bold ${actionCls}`}>{event.action}</span>
          <span className="text-xs text-on-surface-variant">EV {fmtInr(event.ev)}</span>
          <span className={`text-xs font-semibold ml-auto ${event.recovered ? "text-green-400" : "text-red-400"}`}>
            {event.recovered ? "RECOVERED" : "FAILED"}
          </span>
        </div>
        <div className="text-xs text-on-surface-variant mt-0.5">
          {fmtInr(event.amount)} - Pipeline - PostgreSQL audit
        </div>
      </div>
      <button onClick={onDismiss} className="text-on-surface-variant hover:text-on-surface text-xs mt-0.5">x</button>
    </div>
  );
};

export const LiveRecovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRowData[]>([]);
  const [streamStatus, setStreamStatus] = useState<LiveRecoveryStreamResponse | null>(null);
  const [injecting, setInjecting] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [autoStream, setAutoStream] = useState(false);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const toastCounter = useRef(0);
  const autoStreamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStreamData = () => {
    recoveryApi
      .getLiveStreamStatus()
      .then((data) => { if (data) setStreamStatus(data); })
      .catch(() => {});
    recoveryApi
      .getTransactions({
        gateway: selectedGateway !== "ALL" ? selectedGateway : undefined,
        status:  selectedStatus !== "ALL" ? selectedStatus : undefined,
        search:  searchQuery || undefined,
      })
      .then((txs) => { if (txs && txs.length > 0) setTransactions(txs); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStreamData();
    const interval = setInterval(fetchStreamData, 5000);
    return () => clearInterval(interval);
  }, [selectedGateway, selectedStatus, searchQuery]);

  useEffect(() => {
    if (autoStream) {
      autoStreamRef.current = setInterval(() => { runSingleInject(true); }, 3000);
    } else {
      if (autoStreamRef.current) clearInterval(autoStreamRef.current);
    }
    return () => { if (autoStreamRef.current) clearInterval(autoStreamRef.current); };
  }, [autoStream]);

  const runSingleInject = async (silent = false): Promise<TransactionRowData | null> => {
    try {
      const result = await recoveryApi.injectEvent();
      const input = (result.input || {}) as Record<string, unknown>;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}.${now.getMilliseconds().toString().padStart(3,"0")}`;
      const row: TransactionRowData = {
        paymentId:     String(result.payment_id || input.payment_id || "unknown"),
        timestamp:     timeStr,
        method:        String(input.payment_method || "UPI"),
        bank:          String(input.bank || "HDFC"),
        amount:        Number(input.amount || 0),
        failureCode:   String(input.failure_code || "UNKNOWN"),
        expectedValue: Number(result.expected_value || 0),
        action:        (result.executed_action || result.recommended_action || "NO_ACTION") as any,
        status:        result.recovered ? "RECOVERED" : "FAILED",
      };
      setTransactions((prev) => [row, ...prev]);
      const toast: ToastEvent = {
        id: ++toastCounter.current,
        paymentId: row.paymentId,
        bank: row.bank,
        method: row.method,
        amount: row.amount,
        action: row.action as string,
        recovered: Boolean(result.recovered),
        ev: row.expectedValue,
      };
      setToasts((prev) => [toast, ...prev].slice(0, 5));
      if (!silent) setTimeout(fetchStreamData, 1200);
      return row;
    } catch (err) {
      console.error("Inject failed:", err);
      return null;
    }
  };

  const handleInjectTestEvent = async () => {
    setInjecting(true);
    await runSingleInject(false);
    setInjecting(false);
  };

  const handleBurst = async () => {
    setBursting(true);
    for (let i = 0; i < 5; i++) {
      await runSingleInject(i < 4);
      await new Promise((r) => setTimeout(r, 400));
    }
    fetchStreamData();
    setBursting(false);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const kafkaPartitions = streamStatus?.partitions?.map((p) => ({
    partition:     p.partition,
    currentOffset: p.current_offset,
    logEndOffset:  p.log_end_offset,
    lag:           p.lag,
    status:        (p.status as "NORMAL" | "CONGESTED") || "NORMAL",
  }));

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <Toast key={t.id} event={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>

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

        {/* Demo control buttons */}
        <div className="flex items-center gap-space-xs flex-wrap">

          {/* Auto-Stream toggle */}
          <button
            onClick={() => setAutoStream((v) => !v)}
            className={[
              "h-8 px-space-md rounded-lg flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95 font-badge-label text-badge-label font-semibold",
              autoStream
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant"
            ].join(" ")}
          >
            <span className={`w-2 h-2 rounded-full ${autoStream ? "bg-white animate-ping" : "bg-secondary"}`} />
            {autoStream ? "Stop Auto-Stream" : "Auto-Stream (3s)"}
          </button>

          {/* Burst Mode */}
          <button
            onClick={handleBurst}
            disabled={bursting || autoStream}
            className="h-8 px-space-md rounded-lg bg-secondary-container hover:bg-secondary hover:text-on-secondary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 font-badge-label text-badge-label font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">flash_on</span>
            {bursting ? "Bursting..." : "Burst x5"}
          </button>

          {/* Single inject */}
          <button
            onClick={handleInjectTestEvent}
            disabled={injecting || autoStream}
            className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary hover:text-on-primary text-on-surface flex items-center gap-space-xs transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 font-badge-label text-badge-label font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            {injecting ? "Routing..." : "Inject Event"}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard title="Streaming Rate" value={streamStatus ? streamStatus.streaming_rate : "1,840/s"} subtitle="Events/sec ingested" delta="Normal Flow" deltaType="positive" icon="speed" />
        <StatCard title="Instant Recovery (p95)" value={streamStatus ? streamStatus.instant_recovery_p95 : "54.26%"} subtitle="Automated retry success" delta="+6.61% vs Rule" deltaType="positive" icon="verified" />
        <StatCard title="Decision P99 Latency" value={streamStatus ? streamStatus.decision_p99_latency_ms : "2.14ms"} subtitle="Go to Python HTTP SLA" delta="< 10ms target" deltaType="positive" icon="timer" />
        <StatCard title="Active Kafka Lag" value={streamStatus ? streamStatus.kafka_lag_msgs : "11 msgs"} subtitle="Across 4 active partitions" delta="Dynamic Jitter" deltaType="neutral" icon="schedule" />
      </div>

      <TrendAreaChart
        recoveredRate={streamStatus?.instant_recovery_p95 ? `${streamStatus.instant_recovery_p95} Recovered` : undefined}
        data={streamStatus?.trend_data && streamStatus.trend_data.length > 0 ? streamStatus.trend_data : undefined}
      />

      <KafkaLagMonitor partitions={kafkaPartitions} />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGateway={selectedGateway}
        onGatewayChange={setSelectedGateway}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <TransactionTable
        transactions={transactions.length > 0 ? transactions : undefined}
        onInspect={(id) => setSelectedTx(id)}
      />

      <DecisionLineageDrawer
        paymentId={selectedTx || ""}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

export default LiveRecovery;
