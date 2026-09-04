
export interface BanditArmState {
  action: string;
  alpha: number;
  beta: number;
  mean_reward: number;
  variance: number;
  credible_interval_95: [number, number];
  successes: number;
  failures: number;
  total_pulls: number;
  updated_at?: string;
}

export interface BanditStateResponse {
  status: string;
  algorithm: string;
  priors: string;
  total_decisions: number;
  arms: BanditArmState[];
}

export interface SHAPFeatureAttribution {
  feature: string;
  raw_value: string | number;
  shap_value: number;
  direction: 'POSITIVE' | 'NEGATIVE';
  importance_rank: number;
}

export interface SHAPExplanationResponse {
  payment_id?: string;
  model_name: string;
  base_value: number;
  output_probability: number;
  prediction_label: string;
  attributions: SHAPFeatureAttribution[];
}

export interface RFC6962MerkleRootResponse {
  root_hash: string;
  tree_size: number;
  latest_leaf_id?: number;
  algorithm: string;
  leaf_prefix: string;
  node_prefix: string;
  timestamp: string;
}

export interface RFC6962ProofStep {
  direction: 'left' | 'right';
  hash: string;
}

export interface RFC6962MerkleProofResponse {
  payment_id: string;
  leaf_index: number;
  tree_size: number;
  leaf_hash: string;
  audit_path: RFC6962ProofStep[];
  root_hash: string;
  verified: boolean;
}

export interface VerifyProofRequest {
  leaf_hash: string;
  leaf_index: number;
  tree_size: number;
  audit_path: RFC6962ProofStep[];
  expected_root: string;
}

export interface VerifyProofResponse {
  valid: boolean;
  computed_root: string;
  expected_root: string;
  message: string;
}

export interface RateLimiterStatusResponse {
  status: string;
  source: string;
  key: string;
  limit: number;
  window_seconds: number;
  current_tokens: number;
  remaining_tokens: number;
  ttl_seconds: number;
  allowed: boolean;
}

export interface KafkaDLQStatsResponse {
  status: string;
  topic: string;
  total_dead_letters: number;
  sample_dead_letters: Record<string, unknown>[];
}

import { RecoveryAction } from '../types';
import { TransactionRowData } from '../components/recovery/TransactionTable';

export interface RecoveryDecisionRequest {
  event_id: string;
  event_type: string;
  payment_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  bank: string;
  failure_code: string;
  timestamp: string;
  success_rate?: number;
  recovery_rate?: number;
}

export interface RecoveryDecisionResponse {
  payment_id: string;
  action: RecoveryAction;
  probability: number;
  expected_value: number;
}

export interface RecoveryCommand {
  command_id: string;
  payment_id: string;
  action: string;
  amount: number;
}

export interface ExecutionResult {
  command_id: string;
  payment_id: string;
  status: string;
  action?: string;
  recovered: boolean;
  retryable: boolean;
  outcome?: string;
  attempts?: number;
}

export interface TransactionItem {
  payment_id: string;
  timestamp: string;
  method: string;
  bank: string;
  amount: number;
  failure_code: string;
  expected_value: number;
  action: string;
  status: string;
  customer_id?: string;
  outcome?: string;
  recovered?: boolean;
  attempts?: number;
  retryable?: boolean;
}

export interface TrajectoryPoint {
  time: string;
  recovered: number;
  failed: number;
}

export interface CircuitBreakerStatus {
  gateway: string;
  state: 'CLOSED' | 'HALF_OPEN' | 'OPEN' | 'UNKNOWN';
  failure_count: number;
  failure_threshold: number;
  last_trip_time?: string;
  status?: string;
  source?: string;
}

export interface OverviewSummaryResponse {
  status?: string;
  source?: string;
  at_risk_revenue: number;
  recovered_revenue: number;
  recovery_rate: number;
  ai_lift: number;
  ai_lift_status?: string;
  ai_lift_source?: string;
  active_in_flight: number;
  trajectory_series: TrajectoryPoint[];
  circuit_breakers: CircuitBreakerStatus[];
  recent_transactions: TransactionItem[];
}

export interface StateStepItem {
  step: string;
  time: string;
  status: string;
  description: string;
  color: string;
}

export interface AuditDetailResponse {
  event_id?: string;
  payment_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  bank: string;
  failure_code: string;
  probabilities: Record<string, number>;
  recommended_action: string;
  expected_value: number;
  policy_allowed: boolean;
  policy_reason: string;
  executed_action: string;
  outcome?: string;
  attempts?: number;
  recovered?: boolean;
  retryable?: boolean;
  timestamp: string;
  merkle_leaf_hash?: string;
  merkle_proof?: string[];
  state_steps?: StateStepItem[];
  raw_payload?: Record<string, unknown>;
  status?: string;
  source?: string;
}

export interface MABArm {
  arm_id: string;
  name: string;
  strategy: string;
  traffic_pct: number;
  trials: number;
  wins: number;
  win_rate: number;
  mean_ev: number;
}

export interface MABExperimentResponse {
  experiment_id: string;
  experiment_type?: string;
  status: string;
  source?: string;
  total_trials: number;
  active_arms_count: number;
  exploration_allocation: number;
  ai_lift_vs_rule: number;
  statistical_p_value?: number | null;
  winning_arm: string;
  arms: MABArm[];
}

export interface CalibrationPoint {
  predicted: number;
  observed: number;
}

export interface LatencyQuantiles {
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  mean_ms: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface AIModelHealthResponse {
  status?: string;
  source?: string;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  cv_roc_auc_mean: number;
  cv_roc_auc_std: number;
  brier_score: number;
  ece: number;
  concept_drift_psi?: number | null;
  drift_status?: string;
  calibration_curve: CalibrationPoint[];
  latency: LatencyQuantiles;
  feature_importances: FeatureImportanceItem[];
}

export interface PolicyItem {
  id: string;
  tier?: string;
  priority?: string;
  name: string;
  description: string;
  trigger_condition: string;
  action_override: string;
  triggers_today: number;
  enabled: boolean;
}

export interface PolicySimulateRequest {
  recovery_target: number;
  gateway_trip_rate: number;
  ev_floor: number;
  max_hops: number;
  auto_recovery_enabled?: boolean;
}

export interface PolicyConfig {
  recovery_target: number;
  gateway_trip_rate: number;
  ev_floor: number;
  max_hops: number;
  auto_recovery_enabled: boolean;
}

export interface PolicySimulateResponse {
  status?: string;
  source?: string;
  simulated_recovery_rate: number;
  simulated_recovered_revenue: number;
  simulated_blocked_count: number;
  estimated_ev_gain: number;
  gateway_protection_score: number;
}

export interface AuditLedgerEntry {
  id: number;
  payment_id: string;
  timestamp: string;
  action: string;
  amount: number;
  recovered: boolean;
  leaf_hash: string;
}

export interface AuditLedgerResponse {
  status?: string;
  source?: string;
  ledger_type?: string;
  total_records: number;
  merkle_root: string;
  tree_height: number;
  tamper_proof: boolean;
  active_wal_replicas: number;
  entries: AuditLedgerEntry[];
}

export interface MerkleProofResponse {
  status?: string;
  source?: string;
  proof_type?: string;
  payment_id: string;
  leaf_hash: string;
  merkle_root: string;
  proof_hashes: string[];
  verified: boolean;
}

export interface KafkaPartitionLag {
  partition: number;
  topic: string;
  current_offset?: number | null;
  log_end_offset?: number | null;
  lag?: number | null;
  status: string;
  source?: string;
}

export interface LiveRecoveryStreamResponse {
  status?: string;
  source?: string;
  message?: string;
  streaming_rate?: string;
  instant_recovery_p95?: string;
  decision_p99_latency_ms?: string;
  kafka_lag_msgs?: string;
  partitions: KafkaPartitionLag[];
  trend_data: TrajectoryPoint[];
}

export interface NodeStatus {
  node_id: string;
  uptime_seconds: number;
  goroutines: number;
  memory_alloc_mb: number;
  memory_sys_mb: number;
  num_gc: number;
  status: string;
  active_workers: number;
  queue_depth: number;
  throughput_ops_sec: number;
  source?: string;
}

export interface LatencyBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export interface SystemHealthResponse {
  status?: string;
  executor_throughput?: string;
  kafka_ingestion_lag?: string;
  p99_execution_time?: string;
  postgres_wal_sync?: string;
  node_status?: NodeStatus | null;
  circuit_breakers: CircuitBreakerStatus[];
  kafka_partitions: KafkaPartitionLag[];
  latency_histogram: LatencyBucket[];
}

const AI_API_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const EXECUTOR_API_URL = import.meta.env.VITE_EXECUTOR_URL || 'http://localhost:8080';

export function mapTransactionItemToRow(t: TransactionItem): TransactionRowData {
  return {
    paymentId: t.payment_id,
    timestamp: t.timestamp,
    method: t.method || 'UNAVAILABLE',
    bank: t.bank || 'UNAVAILABLE',
    amount: t.amount,
    failureCode: t.failure_code,
    expectedValue: t.expected_value,
    action: t.action as RecoveryAction,
    status: t.status,
  };
}

export const recoveryApi = {
  async getDecision(request: RecoveryDecisionRequest): Promise<RecoveryDecisionResponse> {
    const res = await fetch(`${AI_API_URL}/v1/recovery/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Decision API error: ${res.status}`);
    return res.json();
  },

  /** Full-pipeline injection: RF → EV → Thompson Sampling → Policy → Executor → PostgreSQL */
  async injectEvent(payload?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch(`${AI_API_URL}/v1/recovery/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : '{}',
    });
    if (!res.ok) throw new Error(`Inject API error: ${res.status}`);
    return res.json();
  },

  async getTransactions(params?: {
    limit?: number;
    gateway?: string;
    status?: string;
    search?: string;
  }): Promise<TransactionRowData[]> {
    try {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.gateway) q.set('gateway', params.gateway);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);

      const res = await fetch(`${AI_API_URL}/v1/recovery/transactions?${q.toString()}`);
      if (!res.ok) throw new Error(`Transactions API error: ${res.status}`);
      const items: TransactionItem[] = await res.json();
      return items.map(mapTransactionItemToRow);
    } catch (err) {
      console.warn('Transactions API unavailable:', err);
      return [];
    }
  },

  async getAuditDetail(paymentId: string): Promise<AuditDetailResponse> {
    const res = await fetch(`${AI_API_URL}/v1/recovery/audit/${paymentId}`);
    if (!res.ok) throw new Error(`Audit API error: ${res.status}`);
    return res.json();
  },

  async getOverviewSummary(): Promise<OverviewSummaryResponse> {
    const res = await fetch(`${AI_API_URL}/v1/analytics/overview-summary`);
    if (!res.ok) throw new Error(`Overview summary API error: ${res.status}`);
    return res.json();
  },

  async getLiveStreamStatus(): Promise<LiveRecoveryStreamResponse> {
    const res = await fetch(`${AI_API_URL}/v1/recovery/stream-status`);
    if (!res.ok) throw new Error(`Stream status API error: ${res.status}`);
    return res.json();
  },

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const res = await fetch(`${AI_API_URL}/v1/system/health`);
    if (!res.ok) throw new Error(`System health API error: ${res.status}`);
    return res.json();
  },

  async getMABExperiment(): Promise<MABExperimentResponse> {
    const res = await fetch(`${AI_API_URL}/v1/experiments/mab`);
    if (!res.ok) throw new Error(`MAB API error: ${res.status}`);
    return res.json();
  },

  async getAIModelHealth(): Promise<AIModelHealthResponse> {
    const res = await fetch(`${AI_API_URL}/v1/ai/model-health`);
    if (!res.ok) throw new Error(`Model health API error: ${res.status}`);
    return res.json();
  },

  async getPolicies(): Promise<PolicyItem[]> {
    const res = await fetch(`${AI_API_URL}/v1/policies`);
    if (!res.ok) throw new Error(`Policies API error: ${res.status}`);
    return res.json();
  },

  async simulatePolicy(req: PolicySimulateRequest): Promise<PolicySimulateResponse> {
    const res = await fetch(`${AI_API_URL}/v1/policies/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Policy simulation error: ${res.status}`);
    return res.json();
  },

  async getPolicyConfig(): Promise<PolicyConfig> {
    const res = await fetch(`${AI_API_URL}/v1/policies/config`);
    if (!res.ok) throw new Error(`Policy config API error: ${res.status}`);
    return res.json();
  },

  async updatePolicyConfig(config: PolicyConfig): Promise<PolicyConfig> {
    const res = await fetch(`${AI_API_URL}/v1/policies/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`Policy config API error: ${res.status}`);
    return res.json();
  },

  async getAuditLedger(limit = 25): Promise<AuditLedgerResponse> {
    const res = await fetch(`${AI_API_URL}/v1/audit/ledger?limit=${limit}`);
    if (!res.ok) throw new Error(`Audit ledger API error: ${res.status}`);
    return res.json();
  },

  async getMerkleProof(paymentId: string): Promise<MerkleProofResponse> {
    const res = await fetch(`${AI_API_URL}/v1/audit/proof/${paymentId}`);
    if (!res.ok) throw new Error(`Merkle proof API error: ${res.status}`);
    return res.json();
  },

  async executeRecovery(command: RecoveryCommand): Promise<ExecutionResult> {
    const res = await fetch(`${EXECUTOR_API_URL}/v1/recovery/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`Executor API error: ${res.status}`);
    return res.json();
  },

  async getMetrics(): Promise<Record<string, unknown>> {
    const res = await fetch(`${EXECUTOR_API_URL}/metrics`);
    if (!res.ok) throw new Error(`Metrics error: ${res.status}`);
    return res.json();
  },

  async getCircuitBreakers(): Promise<CircuitBreakerStatus[]> {
    try {
      const res = await fetch(`${AI_API_URL}/v1/system/circuit-breakers`).catch(() =>
        fetch(`${EXECUTOR_API_URL}/v1/system/circuit-breakers`)
      );
      if (!res.ok) throw new Error(`Circuit breakers API error: ${res.status}`);
      return res.json();
    } catch {
      return [];
    }
  },

  async tripCircuitBreaker(gateway: string): Promise<void> {
    try {
      await fetch(`${AI_API_URL}/v1/system/circuit-breakers/trip?gateway=${gateway}`, { method: 'POST' });
    } catch {
      await fetch(`${EXECUTOR_API_URL}/v1/system/circuit-breakers/trip?gateway=${gateway}`, { method: 'POST' });
    }
  },

  async resetCircuitBreaker(gateway: string): Promise<void> {
    try {
      await fetch(`${AI_API_URL}/v1/system/circuit-breakers/reset?gateway=${gateway}`, { method: 'POST' });
    } catch {
      await fetch(`${EXECUTOR_API_URL}/v1/system/circuit-breakers/reset?gateway=${gateway}`, { method: 'POST' });
    }
  },

  async getSystemNodes(): Promise<NodeStatus> {
    try {
      const res = await fetch(`${AI_API_URL}/v1/system/nodes`).catch(() =>
        fetch(`${EXECUTOR_API_URL}/v1/system/nodes`)
      );
      if (!res.ok) throw new Error(`Nodes API error: ${res.status}`);
      return res.json();
    } catch {
      return {
        node_id: 'go-executor-primary-01',
        uptime_seconds: 0,
        goroutines: 0,
        memory_alloc_mb: 0,
        memory_sys_mb: 0,
        num_gc: 0,
        status: 'UNAVAILABLE',
        active_workers: 0,
        queue_depth: 0,
        throughput_ops_sec: 0,
        source: 'unavailable',
      };
    }
  },

  async getBanditState(): Promise<BanditStateResponse> {
    const res = await fetch(`${AI_API_URL}/v1/ai/bandit`);
    if (!res.ok) throw new Error(`Bandit state error: ${res.status}`);
    return res.json();
  },

  async getSHAPExplanation(paymentId: string): Promise<SHAPExplanationResponse> {
    const res = await fetch(`${AI_API_URL}/v1/ai/explain/${paymentId}`);
    if (!res.ok) throw new Error(`SHAP explanation error: ${res.status}`);
    return res.json();
  },

  async getRFC6962MerkleRoot(): Promise<RFC6962MerkleRootResponse> {
    const res = await fetch(`${AI_API_URL}/v1/audit/merkle-root`);
    if (!res.ok) throw new Error(`RFC 6962 root error: ${res.status}`);
    return res.json();
  },

  async getRFC6962Proof(paymentId: string): Promise<RFC6962MerkleProofResponse> {
    const res = await fetch(`${AI_API_URL}/v1/audit/rfc6962-proof/${paymentId}`);
    if (!res.ok) throw new Error(`RFC 6962 proof error: ${res.status}`);
    return res.json();
  },

  async verifyMerkleProof(req: VerifyProofRequest): Promise<VerifyProofResponse> {
    const res = await fetch(`${AI_API_URL}/v1/audit/verify-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Proof verification error: ${res.status}`);
    return res.json();
  },

  async getRateLimiterStatus(): Promise<RateLimiterStatusResponse> {
    const res = await fetch(`${AI_API_URL}/v1/system/rate-limiter`);
    if (!res.ok) throw new Error(`Rate limiter error: ${res.status}`);
    return res.json();
  },

  async getDLQStats(): Promise<KafkaDLQStatsResponse> {
    const res = await fetch(`${AI_API_URL}/v1/system/dlq`);
    if (!res.ok) throw new Error(`DLQ stats error: ${res.status}`);
    return res.json();
  },

};

export default recoveryApi;
