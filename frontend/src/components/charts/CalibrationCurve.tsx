import React from "react";

export interface CalibrationCurveProps {
  brierScore?: number;
  expectedCalibrationError?: number;
}

export const CalibrationCurve: React.FC<CalibrationCurveProps> = ({
  brierScore = 0.084,
  expectedCalibrationError = 0.012,
}) => {
  return (
    <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60">
      <div className="flex items-center justify-between mb-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Empirical Probability Calibration Curve
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Predicted recovery confidence vs. observed ground truth settling
          </p>
        </div>
        <div className="flex items-center gap-space-sm font-mono-code text-[11px]">
          <span className="text-outline">
            Brier Score:{" "}
            <strong className="text-secondary">{brierScore}</strong>
          </span>
          <span className="text-outline">
            ECE:{" "}
            <strong className="text-secondary">
              {expectedCalibrationError}
            </strong>
          </span>
        </div>
      </div>

      <div className="relative w-full h-44 border-l border-b border-surface-container-highest p-2">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 400 150"
          preserveAspectRatio="none"
        >
          {/* Ideal Perfect Calibration Line (y = x diagonal) */}
          <line
            x1="0"
            y1="150"
            x2="400"
            y2="0"
            stroke="#464554"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Actual Calibrated Model Curve */}
          <path
            d="M 0,150 Q 100,120 200,75 T 300,35 T 400,0"
            fill="none"
            stroke="#c0c1ff"
            strokeWidth="2.5"
          />

          {/* Calibration observation points */}
          <circle cx="80" cy="122" r="3.5" fill="#4edea3" />
          <circle cx="160" cy="92" r="3.5" fill="#4edea3" />
          <circle cx="240" cy="58" r="3.5" fill="#4edea3" />
          <circle cx="320" cy="28" r="3.5" fill="#4edea3" />
        </svg>
      </div>

      <div className="flex items-center justify-between font-mono-code text-[11px] text-outline mt-space-xs">
        <span>0.0 (Zero Confidence)</span>
        <span>0.50 Threshold</span>
        <span>1.0 (Certain Recovery)</span>
      </div>
    </div>
  );
};

export default CalibrationCurve;

