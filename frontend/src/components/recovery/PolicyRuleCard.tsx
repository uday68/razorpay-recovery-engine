import React, { useState } from "react";
import { StatusPill } from "../ui/StatusPill";

export interface PolicyRuleCardProps {
  id: string;
  name: string;
  priority: string;
  description: string;
  triggerCondition: string;
  actionOverride: string;
  enabledByDefault?: boolean;
  triggersToday?: number;
  onToggle?: (id: string, enabled: boolean) => void;
}

export const PolicyRuleCard: React.FC<PolicyRuleCardProps> = ({
  id,
  name,
  priority,
  description,
  triggerCondition,
  actionOverride,
  enabledByDefault = true,
  triggersToday = 142,
  onToggle,
}) => {
  const [enabled, setEnabled] = useState(enabledByDefault);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    onToggle?.(id, nextState);
  };

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm hover:border-surface-container-highest transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="font-label-caps text-label-caps text-outline uppercase font-semibold">
            {priority}
          </span>
          <span className="font-mono-code text-[11px] text-outline">#{id}</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <StatusPill
            status={enabled ? "ACTIVE" : "INACTIVE"}
            label={enabled ? "ACTIVE" : "DISABLED"}
          />
          <button
            type="button"
            onClick={handleToggle}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              enabled ? "bg-secondary justify-end" : "bg-surface-container-highest justify-start"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transform transition-transform" />
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          {name}
        </h4>
        <p className="font-body-sm text-body-sm text-outline mt-1">
          {description}
        </p>
      </div>

      <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-1">
        <div className="flex justify-between">
          <span className="text-outline">TRIGGER:</span>
          <span className="text-primary font-medium">{triggerCondition}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">OVERRIDE ACTION:</span>
          <span className="text-secondary font-medium">{actionOverride}</span>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono-code text-[11px] text-outline pt-space-xs border-t border-surface-container-high/40">
        <span>Evaluated in sub-0.2ms</span>
        <span className="text-secondary font-medium">
          {triggersToday.toLocaleString()} overrides today
        </span>
      </div>
    </div>
  );
};

export default PolicyRuleCard;