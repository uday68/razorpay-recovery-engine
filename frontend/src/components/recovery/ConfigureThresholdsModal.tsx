import React, { useState } from "react";

export interface ThresholdsConfig {
  recoveryTarget: number;
  gatewayTripRate: number;
  evFloor: number;
  maxHops: number;
  autoRecoveryEnabled: boolean;
}

export interface ConfigureThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ThresholdsConfig;
  onSave: (config: ThresholdsConfig) => void;
}

export const ConfigureThresholdsModal: React.FC<ConfigureThresholdsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<ThresholdsConfig>(currentConfig);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-container border border-surface-container-high rounded-xl max-w-lg w-full p-space-lg flex flex-col gap-space-md shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">
              tune
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Configure Recovery Thresholds
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Define deterministic policy boundaries and safety trip rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Sliders & Inputs */}
        <div className="space-y-space-md">
          {/* Target Recovery Rate */}
          <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-label-caps text-outline uppercase">
                Recovery Rate Objective Target
              </label>
              <span className="font-mono-code text-[12px] text-secondary font-semibold">
                {config.recoveryTarget}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="80"
              step="1"
              value={config.recoveryTarget}
              onChange={(e) =>
                setConfig({ ...config, recoveryTarget: Number(e.target.value) })
              }
              className="w-full accent-secondary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-body-sm text-[11px] text-outline">
              Operational benchmark against which model recommendations are scored
            </span>
          </div>

          {/* Gateway Trip Rate */}
          <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-label-caps text-outline uppercase">
                Circuit Breaker Trip Rate Threshold
              </label>
              <span className="font-mono-code text-[12px] text-error font-semibold">
                {config.gatewayTripRate}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={config.gatewayTripRate}
              onChange={(e) =>
                setConfig({ ...config, gatewayTripRate: Number(e.target.value) })
              }
              className="w-full accent-error bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-body-sm text-[11px] text-outline">
              Error percentage threshold before automatically halting switch traffic
            </span>
          </div>

          {/* Hard EV Floor */}
          <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-label-caps text-outline uppercase">
                Hard Expected Value (EV) Floor
              </label>
              <span className="font-mono-code text-[12px] text-primary font-semibold">
                ?{config.evFloor}.00
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={config.evFloor}
              onChange={(e) =>
                setConfig({ ...config, evFloor: Number(e.target.value) })
              }
              className="w-full accent-primary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-body-sm text-[11px] text-outline">
              Minimum projected rupee yield required before triggering a secondary retry
            </span>
          </div>

          {/* Max Retry Hops & Auto-Recovery Toggle */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low border border-surface-container-high">
              <label className="font-label-caps text-label-caps text-outline uppercase">
                Max Retry Hops
              </label>
              <select
                value={config.maxHops}
                onChange={(e) =>
                  setConfig({ ...config, maxHops: Number(e.target.value) })
                }
                className="bg-surface-container text-on-surface border border-surface-container-highest rounded px-space-xs py-1.5 font-mono-code text-[12px] focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Attempt</option>
                <option value={2}>2 Attempts</option>
                <option value={3}>3 Attempts (Default)</option>
                <option value={5}>5 Attempts (High Value)</option>
              </select>
            </div>

            <div className="flex flex-col justify-between p-space-sm rounded bg-surface-container-low border border-surface-container-high">
              <label className="font-label-caps text-label-caps text-outline uppercase">
                Autonomous Dispatch
              </label>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono-code text-[12px] text-secondary font-medium">
                  {config.autoRecoveryEnabled ? "ACTIVE" : "PAUSED"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      autoRecoveryEnabled: !config.autoRecoveryEnabled,
                    })
                  }
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    config.autoRecoveryEnabled
                      ? "bg-secondary justify-end"
                      : "bg-surface-container-highest justify-start"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transform transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-space-xs pt-space-sm border-t border-surface-container-high font-badge-label text-badge-label">
          <button
            onClick={onClose}
            className="px-space-md py-1.5 rounded bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-space-md py-1.5 rounded bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            Save &amp; Apply Thresholds
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureThresholdsModal;

