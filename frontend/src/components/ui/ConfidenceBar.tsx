import React from "react";

export interface ConfidenceBarProps {
  value: number; // 0.0 - 1.0 or 0 - 100
  showLabel?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  value,
  showLabel = true,
}) => {
  const percentage = value <= 1 ? Math.round(value * 100) : Math.min(100, Math.round(value));
  const isHighConfidence = percentage >= 85;

  const barColor = isHighConfidence
    ? "bg-secondary"
    : percentage >= 50
    ? "bg-primary"
    : "bg-tertiary";

  return (
    <div className="flex items-center gap-space-xs w-full min-w-[90px]">
      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono-code text-[11px] text-on-surface-variant min-w-[34px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ConfidenceBar;

