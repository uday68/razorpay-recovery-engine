import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  deltaType = "positive",
  icon,
}) => {
  const deltaColor =
    deltaType === "positive"
      ? "text-secondary"
      : deltaType === "negative"
      ? "text-error"
      : "text-outline";

  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 shadow-sm transition-all hover:border-surface-container-highest">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-outline text-[18px]">
            {icon}
          </span>
        )}
      </div>
      <div className="font-mono-metric-lg text-mono-metric-lg text-on-surface font-semibold tracking-tight mt-space-xs">
        {value}
      </div>
      {(subtitle || delta) && (
        <div className="flex items-center justify-between mt-space-2xs">
          {subtitle && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {subtitle}
            </span>
          )}
          {delta && (
            <span className={`font-badge-label text-badge-label ${deltaColor}`}>
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;

