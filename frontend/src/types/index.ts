export type RecoveryAction = 'RETRY_NOW' | 'RETRY_LATER' | 'SEND_REMINDER' | 'NO_ACTION';

export type PaymentStatus = 'FAILED' | 'RECOVERED' | 'PROCESSING' | 'PERMANENTLY_FAILED';

export interface PaymentFailedEvent {
  event_id: string;
  event_type: 'PAYMENT_FAILED';
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

export interface DecisionResponse {
  payment_id: string;
  action: RecoveryAction;
  probability: number;
  expected_value: number;
}

export interface ExecutionResult {
  payment_id: string;
  action: RecoveryAction;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  execution_time_ms: number;
  timestamp: string;
  error?: string;
}

export interface SystemHealthMetrics {
  executor_status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  kafka_connected: boolean;
  model_latency_p95_ms: number;
  total_recovered_amount: number;
  recovery_rate: number;
}


