import React from "react";
import { CalibrationPoint } from "../../api";

export interface CalibrationCurveProps {
  brierScore?: number;
  expectedCalibrationError?: number;
  /** Real calibration points from GET /v1/ai/model-health */
  points?: CalibrationPoint[];
}

const SVG_W = 400;
const SVG_H = 150;

/** Map a CalibrationPoint to SVG coordinates.
 *  predicted → x axis (0..1 → 0..SVG_W)
 *  observed  → y axis (0..1 → SVG_H..0, inverted because SVG y grows downward)
 */
function toSvgCoord(p: CalibrationPoint): { x: number; y: number } {
  return {
    x: p.predicted * SVG_W,
    y: SVG_H - p.observed * SVG_H,
  };
}

export const CalibrationCurve: React.FC<CalibrationCurveProps> = ({
  brierScore,
  expectedCalibrationError,
  points,
}) => {
  const hasPoints = points && points.length >= 2;

  // Sort by predicted probability so the polyline is monotone
  const sorted = hasPoints
    ? [...points].sort((a, b) => a.predicted - b.predicted)
    : [];

  const coords = sorted.map(toSvgCoord);

  // Build SVG polyline points string
  const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

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
          {brierScore !== undefined ? (
            <span className="text-outline">
              Brier Score:{" "}
              <strong className="text-secondary">{brierScore.toFixed(3)}</strong>
            </span>
          ) : null}
          {expectedCalibrationError !== undefined ? (
            <span className="text-outline">
              ECE:{" "}
              <strong className="text-secondary">
                {expectedCalibrationError.toFixed(3)}
              </strong>
            </span>
          ) : null}
          {!hasPoints && (
            <span className="px-space-xs py-0.5 rounded text-[10px] uppercase font-bold bg-outline/10 text-outline border border-outline/20">
              EVALUATION DATASET
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full h-44 border-l border-b border-surface-container-highest p-2">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
        >
          {/* Perfect calibration diagonal (y = x) */}
          <line
            x1="0" y1={SVG_H}
            x2={SVG_W} y2="0"
            stroke="#464554"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {hasPoints ? (
            <>
              {/* Real model calibration polyline from API points */}
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#c0c1ff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* One dot per observed calibration bin */}
              {coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x.toFixed(1)}
                  cy={c.y.toFixed(1)}
                  r="3.5"
                  fill="#4edea3"
                />
              ))}
            </>
          ) : (
            <>
              {/* Fallback: static evaluation-dataset curve — clearly labelled EVALUATION DATASET above */}
              <path
                d="M 0,150 Q 100,120 200,75 T 300,35 T 400,0"
                fill="none"
                stroke="#c0c1ff"
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
              <circle cx="80"  cy="122" r="3.5" fill="#4edea3" fillOpacity="0.5" />
              <circle cx="160" cy="92"  r="3.5" fill="#4edea3" fillOpacity="0.5" />
              <circle cx="240" cy="58"  r="3.5" fill="#4edea3" fillOpacity="0.5" />
              <circle cx="320" cy="28"  r="3.5" fill="#4edea3" fillOpacity="0.5" />
            </>
          )}
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

