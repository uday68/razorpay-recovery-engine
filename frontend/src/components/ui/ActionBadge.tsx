import React from "react";
import { RecoveryAction } from "../../types";

export interface ActionBadgeProps {
  action: RecoveryAction | string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action }) => {
  let styleClass = "bg-surface-container-high text-on-surface-variant border-surface-container-highest";
  let icon = "help_outline";

  switch (action) {
    case "RETRY_NOW":
      styleClass = "bg-primary/10 text-primary border-primary/30";
      icon = "bolt";
      break;
    case "RETRY_LATER":
      styleClass = "bg-tertiary/10 text-tertiary border-tertiary/30";
      icon = "schedule";
      break;
    case "SEND_REMINDER":
      styleClass = "bg-secondary/10 text-secondary border-secondary/30";
      icon = "notifications_active";
      break;
    case "NO_ACTION":
      styleClass = "bg-surface-container-highest text-outline border-outline-variant";
      icon = "block";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded border font-mono-code text-[11px] font-medium ${styleClass}`}
    >
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      <span>{action}</span>
    </span>
  );
};

export default ActionBadge;

