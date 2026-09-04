import React from "react";

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGateway?: string;
  onGatewayChange?: (gw: string) => void;
  selectedStatus?: string;
  onStatusChange?: (st: string) => void;
  placeholder?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedGateway = "ALL",
  onGatewayChange,
  selectedStatus = "ALL",
  onStatusChange,
  placeholder = "filter: payment_id=\"pay_...\" bank=\"HDFC\" failure_code=\"BANK_TIMEOUT\"",
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-sm rounded-lg bg-surface-container border border-surface-container-high/60">
      <div className="flex items-center gap-space-xs flex-1 min-w-[280px]">
        <span className="material-symbols-outlined text-outline text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-on-surface font-mono-code text-body-sm placeholder-outline focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-space-xs font-label-caps text-label-caps">
        {onGatewayChange && (
          <select
            value={selectedGateway}
            onChange={(e) => onGatewayChange(e.target.value)}
            className="bg-surface-container-high text-on-surface border border-surface-container-highest rounded px-space-xs py-1 text-badge-label focus:outline-none cursor-pointer"
          >
            <option value="ALL">GATEWAY: ALL</option>
            <option value="HDFC">HDFC</option>
            <option value="ICICI">ICICI</option>
            <option value="SBI">SBI</option>
            <option value="AXIS">AXIS</option>
          </select>
        )}

        {onStatusChange && (
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-surface-container-high text-on-surface border border-surface-container-highest rounded px-space-xs py-1 text-badge-label focus:outline-none cursor-pointer"
          >
            <option value="ALL">STATUS: ALL</option>
            <option value="RECOVERED">RECOVERED</option>
            <option value="ROUTING">ROUTING</option>
            <option value="FAILED">FAILED</option>
          </select>
        )}

        <button
          onClick={() => onSearchChange("")}
          className="px-space-xs py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface text-badge-label transition-colors"
        >
          CLEAR
        </button>
      </div>
    </div>
  );
};

export default SearchFilterBar;

