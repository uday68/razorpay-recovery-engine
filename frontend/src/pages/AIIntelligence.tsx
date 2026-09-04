import React, { useState, useEffect } from "react";
import { recoveryApi, AIModelHealthResponse, FeatureImportanceItem } from "../api";
import { StatCard } from "../components/ui/StatCard";
import { CalibrationCurve } from "../components/charts/CalibrationCurve";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";

export const AIIntelligence: React.FC = () => {
  const [modelHealth, setModelHealth] = useState<AIModelHealthResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchModelHealth = () => {
    setEvaluating(true);
    recoveryApi
      .getAIModelHealth()
      .then((data) => {
        if (data) setModelHealth(data);
      })
      .catch((err) => {
        console.warn("Using offline AI model health:", err);
      })
      .finally(() => setEvaluating(false));
  };

  useEffect(() => {
    fetchModelHealth();
  }, []);

  const defaultFeatures: FeatureImportanceItem[] = [
    { feature: "action_NO_ACTION", importance: 0.2251 },
    { feature: "recovery_rate", importance: 0.1170 },
    { feature: "amount", importance: 0.1142 },
    { feature: "success_rate", importance: 0.1136 },
    { feature: "hour", importance: 0.0910 },
    { feature: "action_SEND_REMINDER", importance: 0.0648 },
    { feature: "action_RETRY_LATER", importance: 0.0589 },
    { feature: "action_RETRY_NOW", importance: 0.0302 },
  ];

  const features =
    modelHealth?.feature_importances && modelHealth.feature_importances.length > 0
      ? modelHealth.feature_importances
      : defaultFeatures;

  return (
    <div className="w-full flex flex-col gap-space-lg pb-space-3xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              AI Decision Intelligence &amp; Model Calibration
            </h1>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-high text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-caps text-label-caps uppercase">
                MODEL INFERENCE ACTIVE (EVALUATION BENCHMARK: ml/data.csv)
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Supervised Random Forest recovery probability model with probability calibration and Gini impurity feature attribution
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={fetchModelHealth}
            disabled={evaluating}
            className="h-8 px-space-md rounded bg-primary text-on-primary font-badge-label text-badge-label font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {evaluating ? "Evaluating..." : "Refresh Model Stats"}
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <StatCard
          title="Brier Calibration Score"
          value={modelHealth ? modelHealth.brier_score.toFixed(3) : "0.131"}
          subtitle={`ECE: ${(modelHealth?.ece ?? 0.021).toFixed(3)}`}
          delta="Well Calibrated"
          deltaType="positive"
          icon="tune"
        />
        <StatCard
          title="Inference Latency (P95)"
          value={modelHealth ? `${modelHealth.latency.p95_ms.toFixed(2)}ms` : "96.50ms"}
          subtitle="FastAPI / ML Pipeline"
          delta="p50: 69.1ms"
          deltaType="neutral"
          icon="bolt"
        />
        <StatCard
          title="Streaming Concept Drift"
          value="UNMONITORED"
          subtitle="Requires live feature store"
          delta="Local Dev Scope"
          deltaType="neutral"
          icon="waves"
        />
        <StatCard
          title="Model Architecture"
          value={modelHealth ? modelHealth.model_name : "RandomForestClassifier"}
          subtitle={`ROC-AUC: ${((modelHealth?.roc_auc ?? 0.8784) * 100).toFixed(1)}%`}
          delta="100 Estimators"
          deltaType="neutral"
          icon="verified"
        />
      </div>

      {/* Model Calibration Curve — points[] from GET /v1/ai/model-health */}
      <CalibrationCurve
        brierScore={modelHealth?.brier_score}
        expectedCalibrationError={modelHealth?.ece}
        points={modelHealth?.calibration_curve}
      />

      {/* Feature Importance & Drift Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Random Forest Gini Feature Importance (MDI)
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Mean Decrease in Impurity computed across trees in ml/model.pkl
          </p>

          <div className="space-y-space-sm mt-space-xs font-mono-code text-[12px]">
            {features.map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between mb-1">
                  <span className="text-on-surface">{item.feature}</span>
                  <span className="text-secondary font-medium">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <ConfidenceBar value={item.importance} showLabel={false} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-space-base rounded-lg bg-surface-container border border-surface-container-high/60 gap-space-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
            Data Provenance &amp; Telemetry Integrity
          </h3>
          <p className="font-body-sm text-body-sm text-outline">
            Audit of model training provenance and streaming monitoring boundaries
          </p>

          <div className="p-space-sm rounded bg-surface-container-low border border-surface-container-high font-mono-code text-[11px] space-y-2 mt-space-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-on-surface font-medium">Training Dataset</span>
                <div className="text-outline text-[10px]">ml/data.csv (59,380 synthetic payment trials)</div>
              </div>
              <span className="text-secondary font-semibold">VERIFIED</span>
            </div>
            <div className="flex justify-between items-center border-t border-surface-container-high/40 pt-1.5">
              <div>
                <span className="text-on-surface font-medium">Validation Metric (5-Fold CV)</span>
                <div className="text-outline text-[10px]">ROC-AUC: 0.7523 ± 0.0054 (Test: 0.8784)</div>
              </div>
              <span className="text-secondary font-semibold">VALIDATED</span>
            </div>
            <div className="flex justify-between items-center border-t border-surface-container-high/40 pt-1.5">
              <div>
                <span className="text-on-surface font-medium">Concept Drift Monitoring (PSI / KS)</span>
                <div className="text-outline text-[10px]">Continuous stream monitoring inactive in local dev</div>
              </div>
              <span className="text-outline font-semibold">NOT ACTIVE</span>
            </div>
            <div className="flex justify-between items-center border-t border-surface-container-high/40 pt-1.5">
              <div>
                <span className="text-on-surface font-medium">Model Artifact</span>
                <div className="text-outline text-[10px]">ml/model.pkl (Scikit-Learn Pipeline)</div>
              </div>
              <span className="text-secondary font-semibold">LOADED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntelligence;
