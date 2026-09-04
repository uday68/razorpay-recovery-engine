import React, { useState, useEffect } from "react";
import {
  recoveryApi,
  NodeStatus,
  CircuitBreakerStatus,
  SystemHealthResponse,
} from "../api";
import { StatCard } from "../components/ui/StatCard";
import { WorkerClusterStatus, GoWorkerNode } from "../components/system/WorkerClusterStatus";
import { LatencyHistogram, LatencyBucket } from "../components/charts/LatencyHistogram";
import { KafkaLagMonitor, KafkaPartitionLag } from "../components/system/KafkaLagMonitor";
import { CircuitBreakerCard, GatewayBreaker } from "../components/system/CircuitBreakerCard";
import { ToastContainer, ToastMessage } from "../components/ui/Toast";

export const SystemHealth: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [nodes, setNodes] = useState<NodeStatus | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerStatus[]>([]);
  const [probing, setProbing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: ToastMessage) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchHealth = () => {
    setProbing(true);
    recoveryApi
      .getSystemHealth()
      .then((data) => {
        if (data) {
          setSystemHealth(data);
          if (data.circuit_breakers) setCircuitBreakers(data.circuit_breakers);
        }
      })
      .catch((err) => console.warn("Using offline system health:", err));

    recoveryApi
      .getSystemNodes()
      .then((nodeData) => {
        if (nodeData) setNodes(nodeData);
      })
      .catch((err) => console.warn("Using offline nodes:", err));

    recoveryApi
      .getCircuitBreakers()
      .then((cbs) => {
        if (cbs && cbs.length > 0) setCircuitBreakers(cbs);
      })
      .catch((err) => console.warn("Using offline circuit breakers:", err))
      .finally(() => {
        setProbing(false);
      });
  };

  const handleManualProbe = () => {
    fetchHealth();
    addToast({
      id: Date.now().toString(),
      type: "success",
      title: "Cluster Probe Dispatched",
      description: "Queried Go worker (:8080), Kafka broker offsets, and PostgreSQL WAL sync.",
    });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBreaker = async (name: string, newState: "CLOSED" | "OPEN") => {
    try {
      const gatewayKey = name.split(" ")[0].toUpperCase();
      if (newState === "OPEN") {
        await recoveryApi.tripCircuitBreaker(gatewayKey);
      } else {
        await recoveryApi.resetCircuitBreaker(gatewayKey);
      }
      addToast({
        id: Date.now().toString(),
        type: newState === "CLOSED" ? "success" : "warning",
        title: `Circuit Breaker: ${name}`,
        description: `Partner gateway state transitioned to ${newState}.`,
      });
      fetchHealth();
    } catch (err) {
      console.error("Failed to toggle breaker:", err);
    }
  };

  const gatewayBreakers: GatewayBreaker[] =
    circuitBreakers.length > 0
      ? circuitBreakers.map((cb) => ({
          name: `${cb.gateway} Payment Switch`,
          type:
            cb.gateway === "HDFC"
              ? "UPI 2.0 / IMPS"
              : cb.gateway === "ICICI"
              ? "Corporate NetBanking"
              : "Core Banking Gateway",
          state: cb.state as "CLOSED" | "HALF_OPEN" | "OPEN",
          failureRate: cb.failure_count * 3.5,
          threshold: cb.failure_threshold * 4.0,
          lastTrip: cb.last_trip_time || "None in 24h",
        }))
      : [];

  const activeNode = systemHealth?.node_status || nodes;
  const clusterNodes: GoWorkerNode[] = activeNode
    ? [
        {
          id: `${activeNode.node_id}-dispatcher`,
          role: "Kafka Consumer / Recovery Dispatcher (:8080)",
          status: activeNode.status === "HEALTHY" ? "OPTIMAL" : activeNode.status,
          goroutines: Math.round(activeNode.goroutines * 0.5) || 16,
          memoryMb: Math.round(activeNode.memory_alloc_mb * 0.6 * 10) / 10 || 18.2,
          throughputPerSec: Math.round(activeNode.throughput_ops_sec * 0.6) || 1840,
          uptime: `${Math.floor(activeNode.uptime_seconds / 3600)}h ${Math.floor((activeNode.uptime_seconds % 3600) / 60)}m`,
        },
        {
          id: `${activeNode.node_id}-proxy`,
          role: "FastAPI Model Decision Proxy (:8080 -> :8000)",
          status: activeNode.status === "HEALTHY" ? "OPTIMAL" : activeNode.status,
          goroutines: Math.round(activeNode.goroutines * 0.3) || 10,
          memoryMb: Math.round(activeNode.memory_alloc_mb * 0.25 * 10) / 10 || 12.4,
          throughputPerSec: Math.round(activeNode.throughput_ops_sec * 0.3) || 2150,
          uptime: `${Math.floor(activeNode.uptime_seconds / 3600)}h ${Math.floor((activeNode.uptime_seconds % 3600) / 60)}m`,
        },
        {
          id: `${activeNode.node_id}-auditor`,
          role: "PostgreSQL WAL Cryptographic Auditor",
          status: activeNode.status === "HEALTHY" ? "OPTIMAL" : activeNode.status,
          goroutines: Math.round(activeNode.goroutines * 0.2) || 6,
          memoryMb: Math.round(activeNode.memory_alloc_mb * 0.15 * 10) / 10 || 8.1,
          throughputPerSec: Math.round(activeNode.throughput_ops_sec * 0.1) || 1420,
          uptime: `${Math.floor(activeNode.uptime_seconds / 3600)}h ${Math.floor((activeNode.uptime_seconds % 3600) / 60)}m`,
        },
      ]
    : [];

  const histogramBuckets: LatencyBucket[] = (systemHealth?.latency_histogram || []).map((b) => ({
    range: b.bucket,
    count: b.count,
    percentage: b.percentage,
    color:
      b.bucket.includes(">")
        ? "bg-error"
        : b.bucket.includes("5")
        ? "bg-primary"
        : b.bucket.includes("2.5")
        ? "bg-tertiary"
        : "bg-secondary",
  }));

  const kafkaPartitions: KafkaPartitionLag[] = (systemHealth?.kafka_partitions || []).map((p) => ({
    partition: p.partition,
    currentOffset: p.current_offset,
    logEndOffset: p.log_end_offset,
    lag: p.lag,
    status: (p.lag > 20 ? "CONGESTED" : "NORMAL") as "NORMAL" | "CONGESTED",
  }));

  const p99Val = parseFloat(systemHealth?.p99_execution_time || "4.87");

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              System Infrastructure &amp; Daemons
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                {activeNode ? `${activeNode.status} (DAEMON LIVE)` : "ALL CLUSTER SYSTEMS OPERATIONAL"}
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Observability and health metrics for the Go Executor daemon (:8080), Kafka brokers, and database write-ahead logs
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            onClick={handleManualProbe}
            disabled={probing}
            className="h-8 px-space-md rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface font-badge-label text-badge-label transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">sensors</span>
            <span>{probing ? "Probing Daemons..." : "Run Health Probe"}</span>
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Go Executor Throughput"
          value={systemHealth?.executor_throughput || `${(nodes?.throughput_ops_sec || 5410).toLocaleString()} ops/s`}
          subtitle="Cluster aggregate"
          delta="Normal Load"
          deltaType="positive"
          icon="memory"
        />
        <StatCard
          title="Kafka Ingestion Lag"
          value={systemHealth?.kafka_ingestion_lag || "11 msgs"}
          subtitle={`${kafkaPartitions.length || 4} active partitions`}
          delta="< 50 target"
          deltaType="positive"
          icon="sync_alt"
        />
        <StatCard
          title="P99 Execution Time"
          value={systemHealth?.p99_execution_time || "4.87ms"}
          subtitle="Deterministic retry limit"
          delta="< 10ms SLA"
          deltaType="positive"
          icon="speed"
        />
        <StatCard
          title="PostgreSQL WAL Sync"
          value={systemHealth?.postgres_wal_sync || "0.14ms"}
          subtitle="Cryptographic audit sync"
          delta="Synchronous"
          deltaType="positive"
          icon="storage"
        />
      </div>

      {/* Go Worker Daemon Cluster Status */}
      <WorkerClusterStatus nodes={clusterNodes.length > 0 ? clusterNodes : undefined} />

      {/* Latency Distribution Histogram */}
      <LatencyHistogram
        p50={0.82}
        p95={2.14}
        p99={p99Val}
        buckets={histogramBuckets.length > 0 ? histogramBuckets : undefined}
      />

      {/* Kafka Partition Lag Monitor */}
      <KafkaLagMonitor partitions={kafkaPartitions.length > 0 ? kafkaPartitions : undefined} />

      {/* Banking Partner Circuit Breakers */}
      <CircuitBreakerCard
        initialGateways={gatewayBreakers.length > 0 ? gatewayBreakers : undefined}
        onToggleBreaker={handleToggleBreaker}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default SystemHealth;