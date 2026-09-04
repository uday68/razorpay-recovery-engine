import React from "react";

export type StatusType =
  | "RECOVERED"
  | "SUCCESS"
  | "OPTIMAL"
  | "ROUTING"
  | "PROCESSING"
  | "PENDING"
  | "BACKOFF"
  | "FAILED"
  | "PERM_FAIL"
  | "CIRCUIT_OPEN"
  | "CIRCUIT_CLOSED"
  | "POLICY_TRIGGER"
  | string;

export interface StatusPillProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  pulse = false,
}) => {
  const norm = status.toUpperCase();

  let bgClass = "bg-surface-container-high text-on-surface-variant border-surface-container-highest";
  let dotClass = "bg-outline";

  if (["RECOVERED", "SUCCESS", "OPTIMAL", "CIRCUIT_CLOSED"].includes(norm)) {
    bgClass = "bg-secondary/10 text-secondary border-secondary/20";
    dotClass = "bg-secondary";
  } else if (["FAILED", "PERM_FAIL", "CIRCUIT_OPEN", "ERROR"].includes(norm)) {
    bgClass = "bg-error/10 text-error border-error/20";
    dotClass = "bg-error";
  } else if (["ROUTING", "PROCESSING", "PENDING", "BACKOFF"].includes(norm)) {
    bgClass = "bg-tertiary/10 text-tertiary border-tertiary/20";
    dotClass = "bg-tertiary";
  } else if (["POLICY_TRIGGER", "POLICY"].includes(norm)) {
    bgClass = "bg-primary/10 text-primary border-primary/20";
    dotClass = "bg-primary";
  }

  const shouldPulse =
    pulse || ["ROUTING", "PROCESSING", "PENDING"].includes(norm);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full border font-badge-label text-badge-label ${bgClass}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {shouldPulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClass}`}
        />
      </span>
      <span>{label || status}</span>
    </span>
  );
};

export default StatusPill;

