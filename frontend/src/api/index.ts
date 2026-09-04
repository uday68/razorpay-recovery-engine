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
  action: 'RETRY_NOW' | 'RETRY_LATER' | 'SEND_REMINDER' | 'NO_ACTION';
  probability: number;
  expected_value: number;
}

export interface RecoveryCommand {
  command_id: string;
  payment_id: string;
  action: string;
  amount: number;
  timestamp: string;
}

export interface ExecutionResult {
  command_id: string;
  outcome: string;
  recovered: boolean;
  attempts: number;
  timestamp: string;
}

const AI_API_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
const EXECUTOR_API_URL = import.meta.env.VITE_EXECUTOR_URL || 'http://localhost:8080';

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
};

export default recoveryApi;
