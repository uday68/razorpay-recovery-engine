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

export const WorkerClusterStatus: React.FC<WorkerClusterStatusProps> = ({
  nodes = [],
}) => {
  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Go Execution Process &amp; Daemon Status
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            High-concurrency Go worker process running on port :8080
          </p>
        </div>
        <span className="font-mono-code text-[11px] text-secondary font-medium">
          {nodes.length > 0 && nodes[0].status !== "UNAVAILABLE" ? "1 Process Live (:8080)" : "Daemon Offline"}
        </span>
      </div>

      {nodes.length > 0 && nodes[0].status !== "UNAVAILABLE" ? (
        <div className="grid grid-cols-1 gap-space-sm mt-space-xs">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-space-2xs border-t border-surface-container-high/40 mt-1">
                <div>
                  <span className="text-outline">Goroutines: </span>
                  <span className="text-on-surface font-medium">{node.goroutines}</span>
                </div>
                <div>
                  <span className="text-outline">Memory: </span>
                  <span className="text-on-surface font-medium">{node.memoryMb.toFixed(1)} MB</span>
                </div>
                <div>
                  <span className="text-outline">Throughput: </span>
                  <span className="text-secondary font-medium">
                    {node.throughputPerSec.toLocaleString()} ops/s
                  </span>
                </div>
                <div>
                  <span className="text-outline">Uptime: </span>
                  <span className="text-outline font-medium">{node.uptime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-outline text-body-sm font-mono-code bg-surface-container-low rounded border border-surface-container-high">
          Go Executor (:8080) is currently offline or telemetry is unavailable. Start go-executor on port 8080 to observe live stats.
        </div>
      )}
    </div>
  );
};

export default WorkerClusterStatus;
