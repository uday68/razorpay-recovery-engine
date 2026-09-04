import React from "react";
import { StatCard } from "../components/ui/StatCard";
import { WorkerClusterStatus } from "../components/system/WorkerClusterStatus";
import { LatencyHistogram } from "../components/charts/LatencyHistogram";
import { KafkaLagMonitor } from "../components/system/KafkaLagMonitor";
import { CircuitBreakerCard } from "../components/system/CircuitBreakerCard";

export const SystemHealth: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
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
                ALL CLUSTER SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Observability and health metrics for the Go Executor daemon (:8080), Kafka brokers, and database write-ahead logs
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button className="h-8 px-space-md rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface font-badge-label text-badge-label transition-colors">
            Run Health Probe
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Go Executor Throughput"
          value="5,410 ops/s"
          subtitle="Cluster aggregate"
          delta="Normal Load"
          deltaType="positive"
          icon="memory"
        />
        <StatCard
          title="Kafka Ingestion Lag"
          value="11 msgs"
          subtitle="4 active partitions"
          delta="< 50 target"
          deltaType="positive"
          icon="sync_alt"
        />
        <StatCard
          title="P99 Execution Time"
          value="4.87ms"
          subtitle="Deterministic retry limit"
          delta="< 10ms SLA"
          deltaType="positive"
          icon="speed"
        />
        <StatCard
          title="PostgreSQL WAL Sync"
          value="0.14ms"
          subtitle="Cryptographic audit sync"
          delta="Synchronous"
          deltaType="positive"
          icon="storage"
        />
      </div>

      {/* Go Worker Daemon Cluster Status */}
      <WorkerClusterStatus />

      {/* Latency Distribution Histogram */}
      <LatencyHistogram />

      {/* Kafka Partition Lag Monitor */}
      <KafkaLagMonitor />

      {/* Banking Partner Circuit Breakers */}
      <CircuitBreakerCard />
    </div>
  );
};

export default SystemHealth;

