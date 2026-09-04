import React from "react";

export interface KafkaPartitionLag {
  partition: number;
  currentOffset: number;
  logEndOffset: number;
  lag: number;
  status: "NORMAL" | "CONGESTED";
}

export interface KafkaLagMonitorProps {
  topic?: string;
  partitions?: KafkaPartitionLag[];
}

const defaultPartitions: KafkaPartitionLag[] = [
  { partition: 0, currentOffset: 894102, logEndOffset: 894104, lag: 2, status: "NORMAL" },
  { partition: 1, currentOffset: 912800, logEndOffset: 912803, lag: 3, status: "NORMAL" },
  { partition: 2, currentOffset: 881940, logEndOffset: 881941, lag: 1, status: "NORMAL" },
  { partition: 3, currentOffset: 904320, logEndOffset: 904325, lag: 5, status: "NORMAL" },
];

export const KafkaLagMonitor: React.FC<KafkaLagMonitorProps> = ({
  topic = "recovery.payment.failed",
  partitions = defaultPartitions,
}) => {
  const totalLag = partitions.reduce((sum, p) => sum + p.lag, 0);

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Kafka Consumer Group Lag: {topic}
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Partition offset consumption rate vs broker commit log
          </p>
        </div>
        <div className="flex items-center gap-space-xs font-mono-code text-[11px]">
          <span className="text-outline">Total Consumer Lag:</span>
          <span className="text-secondary font-bold px-space-xs py-0.5 rounded bg-secondary/10 border border-secondary/20">
            {totalLag} msgs
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm mt-space-xs">
        {partitions.map((p) => (
          <div
            key={p.partition}
            className="flex flex-col p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-primary font-semibold">
                Partition #{p.partition}
              </span>
              <span className="text-secondary font-medium">{p.lag} lag</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, p.lag * 10))}%` }}
              />
            </div>
            <div className="flex justify-between text-outline text-[10px] mt-1">
              <span>Offset: {p.currentOffset}</span>
              <span>Head: {p.logEndOffset}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KafkaLagMonitor;

