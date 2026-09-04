import React from "react";
import { StatusPill } from "../ui/StatusPill";

export interface GoWorkerNode {
  id: string;
  role: string;
  status: "OPTIMAL" | "PROCESSING" | "DEGRADED" | string;
  goroutines: number;
  memoryMb: number;
  throughputPerSec: number;
  uptime: string;
}

export interface WorkerClusterStatusProps {
  nodes?: GoWorkerNode[];
}

const defaultNodes: GoWorkerNode[] = [
  {
    id: "worker-go-node-01",
    role: "Kafka Consumer / Recovery Dispatcher",
    status: "OPTIMAL",
    goroutines: 142,
    memoryMb: 48.2,
    throughputPerSec: 1840,
    uptime: "4d 18h",
  },
  {
    id: "worker-go-node-02",
    role: "FastAPI Model Decision Proxy (:8080)",
    status: "OPTIMAL",
    goroutines: 98,
    memoryMb: 36.4,
    throughputPerSec: 2150,
    uptime: "4d 18h",
  },
  {
    id: "worker-go-node-03",
    role: "PostgreSQL WAL Cryptographic Auditor",
    status: "OPTIMAL",
    goroutines: 64,
    memoryMb: 28.1,
    throughputPerSec: 1420,
    uptime: "2d 04h",
  },
];

export const WorkerClusterStatus: React.FC<WorkerClusterStatusProps> = ({
  nodes = defaultNodes,
}) => {
  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Go Execution Cluster &amp; Daemon Topology
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            High-concurrency Go worker fleet running on port :8080
          </p>
        </div>
        <span className="font-mono-code text-[11px] text-secondary font-medium">
          3/3 Nodes Healthy (Zero Panics)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-space-xs">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex flex-col p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-primary font-semibold truncate">
                {node.id}
              </span>
              <StatusPill status={node.status} />
            </div>
            <span className="font-body-sm text-[11px] text-outline">
              {node.role}
            </span>
            <div className="pt-space-2xs border-t border-surface-container-high/40 space-y-1 mt-1">
              <div className="flex justify-between">
                <span className="text-outline">Goroutines:</span>
                <span className="text-on-surface font-medium">{node.goroutines}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Resident Memory:</span>
                <span className="text-on-surface font-medium">{node.memoryMb} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Throughput:</span>
                <span className="text-secondary font-medium">
                  {node.throughputPerSec.toLocaleString()} ops/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Uptime:</span>
                <span className="text-outline font-medium">{node.uptime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerClusterStatus;

