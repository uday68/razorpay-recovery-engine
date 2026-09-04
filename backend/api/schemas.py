from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RecoveryDecisionRequest(BaseModel):
    event_id: str
    event_type: str
    payment_id: str
    customer_id: str
    amount: float = Field(gt=0)
    payment_method: str
    bank: str
    failure_code: str
    timestamp: datetime
    success_rate: float = Field(default=0.80, ge=0, le=1)
    recovery_rate: float = Field(default=0.50, ge=0, le=1)


class RecoveryDecisionResponse(BaseModel):
    payment_id: str
    action: str
    probability: float
    expected_value: float


class TransactionItem(BaseModel):
    payment_id: str
    timestamp: str
    method: str
    bank: str
    amount: float
    failure_code: str
    expected_value: float
    action: str
    status: str
    customer_id: Optional[str] = None
    outcome: Optional[str] = None
    recovered: Optional[bool] = None
    attempts: Optional[int] = None
    retryable: Optional[bool] = None


class TrajectoryPoint(BaseModel):
    time: str
    recovered: float
    failed: float


class CircuitBreakerOverview(BaseModel):
    gateway: str
    state: str
    failure_count: int
    failure_threshold: int
    last_trip_time: Optional[str] = None


class OverviewSummaryResponse(BaseModel):
    at_risk_revenue: float
    recovered_revenue: float
    recovery_rate: float
    ai_lift: float
    active_in_flight: int
    trajectory_series: List[TrajectoryPoint]
    circuit_breakers: List[CircuitBreakerOverview]
    recent_transactions: List[TransactionItem]


class AuditDetailResponse(BaseModel):
    payment_id: str
    customer_id: str
    amount: float
    failure_code: str
    probabilities: Dict[str, float]
    recommended_action: str
    expected_value: float
    policy_allowed: bool
    policy_reason: str
    executed_action: str
    outcome: Optional[str] = None
    attempts: Optional[int] = None
    recovered: Optional[bool] = None
    retryable: Optional[bool] = None
    timestamp: str
    merkle_leaf_hash: Optional[str] = None
    merkle_proof: Optional[List[str]] = None


class MABArm(BaseModel):
    arm_id: str
    name: str
    strategy: str
    traffic_pct: float
    trials: int
    wins: int
    win_rate: float
    mean_ev: float


class MABExperimentResponse(BaseModel):
    experiment_id: str
    status: str
    total_trials: int
    arms: List[MABArm]
    statistical_p_value: float
    winning_arm: str


class CalibrationPoint(BaseModel):
    predicted: float
    observed: float


class LatencyQuantiles(BaseModel):
    p50_ms: float
    p95_ms: float
    p99_ms: float
    mean_ms: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class AIModelHealthResponse(BaseModel):
    model_name: str
    accuracy: float
    roc_auc: float
    cv_roc_auc_mean: float
    cv_roc_auc_std: float
    brier_score: float
    ece: float
    calibration_curve: List[CalibrationPoint]
    latency: LatencyQuantiles
    feature_importances: List[FeatureImportanceItem]


class PolicyItem(BaseModel):
    id: str
    name: str
    tier: str
    trigger_condition: str
    override_action: str
    triggers_today: int
    enabled: bool


class PolicySimulateRequest(BaseModel):
    recovery_target: float
    gateway_trip_rate: float
    ev_floor: float
    max_hops: int
    auto_recovery_enabled: bool = True


class PolicySimulateResponse(BaseModel):
    simulated_recovery_rate: float
    simulated_recovered_revenue: float
    simulated_blocked_count: int
    estimated_ev_gain: float
    gateway_protection_score: float


class AuditLedgerEntry(BaseModel):
    id: int
    payment_id: str
    timestamp: str
    action: str
    amount: float
    recovered: bool
    leaf_hash: str


class AuditLedgerResponse(BaseModel):
    total_records: int
    merkle_root: str
    tree_height: int
    entries: List[AuditLedgerEntry]


class MerkleProofResponse(BaseModel):
    payment_id: str
    leaf_hash: str
    merkle_root: str
    proof_hashes: List[str]
    verified: bool
