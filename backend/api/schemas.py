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


class StateStepItem(BaseModel):
    step: str
    time: str
    status: str
    description: str
    color: str


class AuditDetailResponse(BaseModel):
    event_id: Optional[str] = None
    payment_id: str
    customer_id: str
    amount: float
    payment_method: str
    bank: str
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
    state_steps: Optional[List[StateStepItem]] = None
    raw_payload: Optional[Dict[str, Any]] = None


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
    active_arms_count: int
    exploration_allocation: float
    ai_lift_vs_rule: float
    statistical_p_value: float
    winning_arm: str
    arms: List[MABArm]


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
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    cv_roc_auc_mean: float
    cv_roc_auc_std: float
    brier_score: float
    ece: float
    concept_drift_psi: float
    calibration_curve: List[CalibrationPoint]
    latency: LatencyQuantiles
    feature_importances: List[FeatureImportanceItem]


class PolicyItem(BaseModel):
    id: str
    tier: str = "P0"
    priority: str = "P0 CRITICAL"
    name: str
    description: str
    trigger_condition: str
    action_override: str
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
    tamper_proof: bool
    active_wal_replicas: int
    entries: List[AuditLedgerEntry]


class MerkleProofResponse(BaseModel):
    payment_id: str
    leaf_hash: str
    merkle_root: str
    proof_hashes: List[str]
    verified: bool


class KafkaPartitionLag(BaseModel):
    partition: int
    topic: str
    current_offset: int
    log_end_offset: int
    lag: int
    status: str


class LiveRecoveryStreamResponse(BaseModel):
    streaming_rate: str
    instant_recovery_p95: str
    decision_p99_latency_ms: str
    kafka_lag_msgs: str
    partitions: List[KafkaPartitionLag]
    trend_data: List[TrajectoryPoint]


class NodeStatus(BaseModel):
    node_id: str
    uptime_seconds: float
    goroutines: int
    memory_alloc_mb: float
    memory_sys_mb: float
    num_gc: int
    status: str
    active_workers: int
    queue_depth: int
    throughput_ops_sec: float


class LatencyBucket(BaseModel):
    bucket: str
    count: int
    percentage: float


class SystemHealthResponse(BaseModel):
    executor_throughput: str
    kafka_ingestion_lag: str
    p99_execution_time: str
    postgres_wal_sync: str
    node_status: NodeStatus
    circuit_breakers: List[CircuitBreakerOverview]
    kafka_partitions: List[KafkaPartitionLag]
    latency_histogram: List[LatencyBucket]
