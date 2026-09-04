import React from "react";

export interface KafkaPartitionLag {
  partition: number;
  currentOffset?: number | null;
  logEndOffset?: number | null;
  lag?: number | null;
  status: string;
}

export interface KafkaLagMonitorProps {
  topic?: string;
  partitions?: KafkaPartitionLag[];
}

const defaultPartitions: KafkaPartitionLag[] = [
  { partition: 0, status: "ACTIVE" },
  { partition: 1, status: "ACTIVE" },
  { partition: 2, status: "ACTIVE" },
];

export const KafkaLagMonitor: React.FC<KafkaLagMonitorProps> = ({
  topic = "recovery.payment.failed",
  partitions = defaultPartitions,
}) => {
  const hasLagData = partitions.some((p) => p.lag !== null && p.lag !== undefined);
  const totalLag = hasLagData ? partitions.reduce((sum, p) => sum + (p.lag || 0), 0) : null;

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Kafka Partition Status: {topic}
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Topic partition topology (3 partitions configured on broker localhost:9092)
          </p>
        </div>
        <div className="flex items-center gap-space-xs font-mono-code text-[11px]">
          <span className="text-outline">Broker Status:</span>
          <span className="text-secondary font-bold px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
            {hasLagData ? `${totalLag} msgs lag` : "BROKER ONLINE (Lag Uninstrumented)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm mt-space-xs">
        {partitions.map((p) => (
          <div
            key={p.partition}
            className="flex flex-col p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-primary font-semibold">
                Partition #{p.partition}
              </span>
              <span className="text-secondary font-medium">
                {p.lag !== null && p.lag !== undefined ? `${p.lag} lag` : p.status || "ACTIVE"}
              </span>
            </div>
            <div className="flex justify-between text-outline text-[10px] mt-1">
              <span>Offset: {p.currentOffset !== null && p.currentOffset !== undefined ? p.currentOffset : "Uninstrumented"}</span>
              <span>Head: {p.logEndOffset !== null && p.logEndOffset !== undefined ? p.logEndOffset : "Uninstrumented"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KafkaLagMonitor;
