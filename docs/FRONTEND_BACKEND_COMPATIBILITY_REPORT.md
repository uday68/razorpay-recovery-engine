# Frontend-to-Backend Compatibility & Data Mapping Report
**Autonomous Payment Recovery Control Tower**

This document establishes the end-to-end data contract, endpoint specifications, and compatibility mapping between the **Frontend Control Tower** (React 18 + TypeScript + Vite + Tailwind) and the **Backend Infrastructure** (Go Executor on `:8080`, Python ML Decision API on `:8000`, and PostgreSQL WAL Ledger).

---

## 1. Executive Compatibility Matrix

| Screen / Feature Area | Required Frontend Telemetry | Current Backend State | Gap & Parity Level | Action Required |
|---|---|---|---|---|
| **Core Decisioning** | Recommendations, confidence, expected value (EV) | `POST /v1/recovery/decide` in FastAPI | 🟢 **100% Compatible** | None. Fully integrated. |
| **Recovery Execution** | Re-routing, secondary charges, attempts | `POST /v1/recovery/execute` in Go (:8080) | 🟢 **100% Compatible** | None. Fully integrated. |
| **Overview Dashboard** | KPI strip, 24h rolling volume, revenue at risk | `GET /metrics` in Go (partial volume) | 🟡 **Partially Backed (60%)** | Add `GET /v1/analytics/overview-summary` in FastAPI. |
| **Live Trajectory Chart** | Rolling 60m / 24h / 7d / 30d time series curves | None aggregated over time | 🟡 **Missing Time Slicing (40%)** | Add `GET /v1/analytics/trajectory?window=24h`. |
| **Circuit Breakers** | HDFC, ICICI, SBI, Axis trip state & error rates | In-memory in Go `circuit_breaker.go` | 🟡 **Logic Ready, Missing API (70%)** | Add `GET /v1/system/circuit-breakers` in Go. |
| **Payment Investigation** | Deep-dive forensic trail, state machine, SHAP weights | `recovery_audit` table in PostgreSQL | 🟡 **DB Ready, Missing REST Route (80%)** | Add `GET /v1/recovery/audit/{payment_id}` in FastAPI. |
| **MAB Experiments** | Thompson sampling win rates, cohort trials, p-value | `controlled_experiment.py` in Python | 🟡 **Algorithm Ready, Missing API (75%)** | Add `GET /v1/experiments/mab` in FastAPI. |
| **AI Intelligence** | Brier score, ECE, calibration curve, KS drift test | Calibration tests in `tests/` | 🟡 **Algorithms Ready, Missing API (70%)** | Add `GET /v1/ai/model-health` in FastAPI. |
| **Recovery Policies** | Active hard gates, trigger counts, sandbox simulation | `backend/policy/engine.py` | 🟡 **Logic Ready, Missing Sandbox (80%)** | Add `GET /v1/policies` & `POST /v1/policies/simulate`. |
| **System Health** | Goroutines, memory MB, ops/sec throughput, p99 | Partial in Go `metrics.go` | 🟡 **Metrics Ready, Missing Nodes API (60%)** | Add `GET /v1/system/nodes` in Go. |
| **Kafka Observability** | Partition offsets, consumer lag by partition | Segmentio reader in `cmd/recovery-worker` | 🔴 **Requires Exporter Endpoint (30%)** | Expose `reader.Stats()` over HTTP or proxy. |
| **Cryptographic Audit** | Immutable ledger, Merkle leaf hashes, RFC 6962 proof | PostgreSQL `recovery_audit` | 🟡 **DB Ready, Missing Paginated API (70%)** | Add `GET /v1/audit/ledger` in FastAPI. |

---

## 2. Current Backend Inventory & Contracts

### A. Python Decision Engine (`FastAPI :8000`)
Currently exposes:
- **`POST /v1/recovery/decide`**:
  - **Request Schema**:
    ```json
    {
      "event_id": "evt_001",
      "event_type": "PAYMENT_FAILED",
      "payment_id": "pay_9281a182",
      "customer_id": "cust_123",
      "amount": 5200.00,
      "payment_method": "UPI",
      "bank": "HDFC",
      "failure_code": "BANK_TIMEOUT",
      "timestamp": "2026-09-04T07:42:19.412Z",
      "success_rate": 0.80,
      "recovery_rate": 0.50
    }
    ```
  - **Response Schema**:
    ```json
    {
      "payment_id": "pay_9281a182",
      "action": "RETRY_NOW",
      "probability": 0.82,
      "expected_value": 416.00
    }
    ```

### B. Go Recovery Executor Service (`HTTP :8080`)
Currently exposes:
- **`POST /v1/recovery/execute`**:
  - **Request Schema**:
    ```json
    {
      "command_id": "cmd_001",
      "payment_id": "pay_9281a182",
      "action": "RETRY_NOW",
      "amount": 5200.00,
      "timestamp": "2026-09-04T07:42:20.100Z"
    }
    ```
  - **Response Schema**:
    ```json
    {
      "command_id": "cmd_001",
      "payment_id": "pay_9281a182",
      "status": "EXECUTED",
      "action": "RETRY_NOW",
      "recovered": true,
      "retryable": false,
      "outcome": "SUCCESS",
      "attempts": 1
    }
    ```
- **`GET /metrics`**:
  - Returns JSON: `TotalExecutions`, `SuccessfulExecutions`, `FailedExecutions`, `RecoveredVolume`, `TotalAttempts`, `SuccessRate`.

### C. PostgreSQL Database Schema (`recovery_engine`)
Table managed by `backend/audit_repository.py`:
- **`recovery_audit`**:
  - `id`: BIGSERIAL PRIMARY KEY
  - `payment_id`: TEXT UNIQUE NOT NULL
  - `customer_id`: TEXT NOT NULL
  - `amount`: DOUBLE PRECISION NOT NULL
  - `failure_code`: TEXT
  - `probabilities`: JSONB NOT NULL
  - `recommended_action`: TEXT NOT NULL
  - `expected_value`: DOUBLE PRECISION NOT NULL
  - `policy_allowed`: BOOLEAN NOT NULL
  - `policy_reason`: TEXT NOT NULL
  - `executed_action`: TEXT NOT NULL
  - `outcome`: TEXT
  - `attempts`: INTEGER
  - `recovered`: BOOLEAN
  - `retryable`: BOOLEAN
  - `timestamp`: TIMESTAMPTZ NOT NULL

---

## 3. Screen-by-Screen Detailed Data Mapping

### 3.1 Overview Screen (`Overview.tsx`)
- **Required Data**:
  1. `at_risk_revenue`: Rolling monetary volume of failures (INR Lakhs/Crores).
  2. `recovered_revenue`: Recovered monetary volume through retries.
  3. `recovery_rate`: `recovered_revenue / at_risk_revenue`.
  4. `ai_lift`: Percentage delta compared against static rule baseline.
  5. `active_in_flight`: Ingestion queue count + actively executing backoff timers.
  6. `trajectory_series`: Array of time buckets with recovered vs failed sums.
  7. `circuit_breakers`: State of HDFC, ICICI, SBI, Axis switches.
  8. `recent_transactions`: Latest 10-25 transactions.
- **Backend Mapping**:
  - `recovered_revenue` & `recovery_rate` can be derived from Go `/metrics` (`RecoveredVolume` / `TotalExecutions`).
  - Circuit breakers exist in Go memory (`circuit_breaker.go`).
  - Transaction history exists in PostgreSQL table `recovery_audit`.
- **Recommended Endpoint**:
  ```http
  GET /v1/analytics/overview-summary?window=24h
  ```

---

### 3.2 Live Recovery Screen (`LiveRecovery.tsx`)
- **Required Data**:
  1. Ingestion rate (`events/sec`).
  2. Instant recovery p95 rate and decision latency p99.
  3. Kafka partition lags (topic `recovery.payment.failed`, partitions 0–3).
  4. Filterable transaction table (by bank, status, search query).
- **Backend Mapping**:
  - `recovery-worker` daemon handles Kafka consumption. Exposing consumer stats bridges the lag card.
  - Transactions can be queried via paginated PostgreSQL API.
- **Recommended Endpoint**:
  ```http
  GET /v1/recovery/transactions?limit=50&gateway=HDFC&status=RECOVERED&search=pay_9281
  ```

---

### 3.3 Payment Investigation (`PaymentInvestigation.tsx`)
- **Required Data**:
  1. Full metadata for transaction (`amount`, `customer_id`, `bank`, `failure_code`).
  2. Multi-action probability weights (`probabilities` dictionary).
  3. Policy evaluation verdict (`policy_allowed`, `policy_reason`, `executed_action`).
  4. Execution outcome (`attempts`, `recovered`, `outcome`).
  5. Cryptographic leaf hash & Merkle inclusion proof.
- **Backend Mapping**:
  - `AuditRepository.get_by_payment_id(payment_id)` in `backend/audit_repository.py` already retrieves every single one of these fields!
- **Recommended Endpoint**:
  ```http
  GET /v1/recovery/audit/{payment_id}
  ```

---

### 3.4 Experiments & MAB Screen (`Experiments.tsx`)
- **Required Data**:
  1. Arm A (AI Contextual Bandit), Arm B (Rule Baseline), Arm C (Naive).
  2. Win rate %, trials count, mean EV (₹), statistical p-value.
  3. Traffic allocation split percentages.
- **Backend Mapping**:
  - Simulation and comparison algorithms exist in `backend/comparison.py` and `backend/controlled_experiment.py`.
- **Recommended Endpoint**:
  ```http
  GET /v1/experiments/mab
  ```

---

### 3.5 AI Decision Intelligence (`AIIntelligence.tsx`)
- **Required Data**:
  1. Brier score & Expected Calibration Error (ECE).
  2. Model inference latency distribution (p50, p95, p99).
  3. Population Stability Index (PSI) & Kolmogorov-Smirnov drift test metrics.
  4. Calibration curve coordinates: `[{ predicted: 0.1, observed: 0.09 }, ...]`.
  5. Global SHAP feature attribution percentages.
- **Backend Mapping**:
  - Calibration algorithms tested in `tests/test_model_calibration.py`.
  - Drift tests tested in `tests/test_stability_metrics.py`.
- **Recommended Endpoint**:
  ```http
  GET /v1/ai/model-health
  ```

---

### 3.6 Deterministic Recovery Policies (`Policies.tsx`)
- **Required Data**:
  1. Active policy list (P0 Low Confidence Drop, P0 High-Value Review, P1 Circuit Breaker Backoff, P2 Max 3-Hop Cap).
  2. Trigger conditions, override action, triggers count today.
  3. Policy simulation sandbox results against trailing 30-day traffic.
- **Backend Mapping**:
  - Rules implemented in `backend/policy/engine.py:apply_policy`.
- **Recommended Endpoints**:
  ```http
  GET /v1/policies
  POST /v1/policies/simulate
  ```

---

### 3.7 System Health & Daemons (`SystemHealth.tsx`)
- **Required Data**:
  1. Go Executor worker nodes (goroutines, memory MB, throughput ops/sec).
  2. Latency histogram buckets (<1ms, 1-2.5ms, 2.5-5ms, 5-10ms, >10ms).
  3. Kafka partition lag.
  4. Gateway circuit breakers status.
- **Backend Mapping**:
  - Go runtime metrics (`runtime.NumGoroutine()`, `runtime.ReadMemStats()`).
- **Recommended Endpoint (Go :8080)**:
  ```http
  GET /v1/system/nodes
  ```

---

### 3.8 Cryptographic Audit Log (`AuditLog.tsx`)
- **Required Data**:
  1. Paginated immutable audit ledger entries.
  2. Merkle root hash, tree height, block index.
  3. RFC 6962 inclusion proof payload.
- **Backend Mapping**:
  - PostgreSQL table `recovery_audit`.
- **Recommended Endpoint**:
  ```http
  GET /v1/audit/ledger?page=1&limit=25
  GET /v1/audit/proof/{payment_id}
  ```

---

## 4. API Specification Blueprints to Bridge All Gaps

```yaml
openapi: 3.0.3
info:
  title: Razorpay Recovery Engine Full-Stack API
  version: 2.0.0
paths:
  /v1/recovery/decide:
    post:
      summary: Autonomous ML Decision Generation (Active in Python FastAPI)
  /v1/recovery/execute:
    post:
      summary: Idempotent Recovery Action Execution (Active in Go Executor)
  /metrics:
    get:
      summary: Go Engine Metrics (Active in Go Executor)

  # Recommended New Endpoints to Complete Full-Stack Parity:
  /v1/recovery/transactions:
    get:
      summary: Query recent transactions from PostgreSQL audit table
  /v1/recovery/audit/{payment_id}:
    get:
      summary: Retrieve single payment deep-dive forensic record
  /v1/analytics/overview-summary:
    get:
      summary: Executive KPI strip and rolling trajectory time-series
  /v1/system/circuit-breakers:
    get:
      summary: Live status of all banking partner circuit breakers
    post:
      summary: Operator manual trip or reset trigger
  /v1/experiments/mab:
    get:
      summary: Real-time Multi-Armed Bandit cohort performance metrics
  /v1/ai/model-health:
    get:
      summary: Brier score, ECE, calibration curve, and concept drift
  /v1/policies:
    get:
      summary: Active deterministic policy gates
  /v1/policies/simulate:
    post:
      summary: Zero-risk policy simulation sandbox evaluator
  /v1/system/nodes:
    get:
      summary: Go Executor daemon cluster health, goroutines, and Kafka lag
```

---

## 5. Next Steps & Implementation Roadmap

When you are ready to proceed with implementing these endpoints, we can execute in the following sequence:
1. **Phase 1 (PostgreSQL & Audit Queries)**: Add `GET /v1/recovery/transactions` and `GET /v1/recovery/audit/{payment_id}` in FastAPI using existing `AuditRepository`.
2. **Phase 2 (Go Observability)**: Add `GET /v1/system/circuit-breakers` and `GET /v1/system/nodes` in Go Executor (:8080).
3. **Phase 3 (Analytics & Time Series)**: Add `GET /v1/analytics/overview-summary` in FastAPI to power the trajectory chart and live revenue KPIs.
4. **Phase 4 (Experiments & Policies)**: Add `GET /v1/experiments/mab` and `POST /v1/policies/simulate` in FastAPI.
5. **Phase 5 (Frontend Integration)**: Wire `frontend/src/api/index.ts` to consume live backend endpoints with automatic fallback to local state when servers are offline.
