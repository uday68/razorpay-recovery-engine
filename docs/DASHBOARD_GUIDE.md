# Recovery Control Tower Dashboard Guide

This guide documents the eight dashboards currently routed by
`frontend/src/app/App.tsx`. It explains what each dashboard does, which APIs it
calls, and what must be running for the page to show live data.

## Shared Requirements

Start the complete local stack with:

```powershell
python setup_and_run.py --launch
```

Or start the services manually:

```text
Docker infrastructure: PostgreSQL :5432, Redis :6379, Kafka :9092
FastAPI decision engine: http://localhost:8000
Go recovery executor: http://localhost:8080
React/Vite control tower: http://localhost:5173
```

The frontend uses these environment variables when provided:

- `VITE_AI_URL`: FastAPI base URL; defaults to `http://localhost:8000`.
- `VITE_EXECUTOR_URL`: Go executor base URL; defaults to `http://localhost:8080`.

### Dependency Summary

| Dependency | Required for | Purpose |
|---|---|---|
| React/Vite | Every dashboard | Renders the control tower UI. |
| FastAPI | Every live dashboard | Provides analytics, decisions, policies, audit, and health APIs. |
| PostgreSQL | Overview, Live Recovery, Forensics, Experiments, Policies, Audit | Stores recovery audit records, policy state, and bandit posteriors. |
| Redis | System Health and recovery execution | Distributed rate limiter and shared runtime state. |
| Kafka | Live Recovery and System Health | Event stream, partition lag, and DLQ metrics. |
| Go executor | Live Recovery and System Health | Executes recovery commands and exposes executor health/metrics. |
| `ml/model.pkl` | Overview actions, AI Decisions, injection | Random Forest inference artifact loaded by FastAPI. |
| `frontend/node_modules` | Every dashboard | Frontend dependencies. `npm install` creates them. |

If an API is unavailable, several pages display fallback benchmark or
`UNAVAILABLE` values. Those values are not live production telemetry.

## 1. Overview

**Route:** `overview`  
**Source:** `frontend/src/pages/Overview.tsx`

### What it does

The Overview dashboard is the executive recovery view. It shows:

- Revenue at risk and recovered revenue.
- Recovery rate, AI lift, and active in-flight work.
- Recovery trajectory and recent transactions.
- Gateway circuit-breaker status.
- Current policy thresholds.
- A decision-lineage view for a selected transaction.

### API calls

- `GET /v1/analytics/overview-summary`
- `GET /v1/policies/config`
- `POST /v1/recovery/inject` for batch failure simulation.
- `POST /v1/system/circuit-breakers/trip?gateway={gateway}`
- `POST /v1/system/circuit-breakers/reset?gateway={gateway}`
- `PUT /v1/policies/config` when thresholds are saved.

### Requirements

- FastAPI running on port `8000`.
- PostgreSQL with recovery audit data for live KPIs and transactions.
- Go executor for real circuit-breaker and recovery behavior.
- Redis and Kafka for full pipeline injection.
- `ml/model.pkl` for injected AI decisions.

Without the API, the page can render but live metrics and actions will not
work. The page keeps local threshold defaults when policy configuration cannot
be fetched.

## 2. Live Recovery

**Route:** `live-recovery`  
**Source:** `frontend/src/pages/LiveRecovery.tsx`

### What it does

Live Recovery is the operational stream view. It displays recent recovery
transactions, stream throughput, Kafka lag, recovery trend data, and transient
recovery notifications. Operators can filter the stream, inspect a payment,
inject a single event, or start an automated event burst.

### API calls

- `GET /v1/recovery/stream-status`
- `GET /v1/recovery/transactions`
- `POST /v1/recovery/inject`
- `GET /v1/recovery/audit/{payment_id}` through the lineage drawer.
- Executor recovery APIs through the recovery pipeline when events are injected.

### Requirements

- FastAPI on `8000`.
- PostgreSQL `recovery_audit` records.
- Kafka on `9092` for stream and lag information.
- Redis on `6379` for rate limiting.
- Go executor on `8080` for command execution.
- Trained model artifact for decision generation.

If Kafka or the executor is unavailable, stream status may show unavailable
values and injected events can fail. Transaction filtering still depends on the
FastAPI/PostgreSQL path.

## 3. Payments Forensics

**Route:** `payments`  
**Source:** `frontend/src/pages/PaymentInvestigation.tsx`

### What it does

Payments Forensics investigates one payment end to end. It provides:

- Payment audit record and raw payload.
- Recovery state-machine timeline.
- Action probabilities and SHAP feature attributions.
- RFC 6962 Merkle proof data.
- A proof verification action.
- Quick switching between recent payment IDs.

### API calls

- `GET /v1/recovery/transactions?limit=6`
- `GET /v1/recovery/audit/{payment_id}`
- `GET /v1/ai/explain/{payment_id}`
- `GET /v1/audit/rfc6962-proof/{payment_id}`
- `POST /v1/audit/verify-proof`

### Requirements

- FastAPI on `8000`.
- PostgreSQL audit records for the selected payment.
- The model and SHAP dependencies for explanations.
- Merkle/audit data generated by the recovery pipeline.

A payment ID must exist in `recovery_audit` for a complete investigation. If
only the payment ID is unknown, the page shows a not-found state rather than
inventing details.

## 4. Experiments

**Route:** `experiments`  
**Source:** `frontend/src/pages/Experiments.tsx`

### What it does

Experiments compares recovery strategies and exposes live Thompson Sampling
state. It shows AI, rule-based, and naive baseline performance, action arms,
posterior values, reward charts, and benchmark results.

### API calls

- `GET /v1/experiments/mab`
- `GET /v1/ai/bandit`

### Requirements

- FastAPI on `8000`.
- PostgreSQL `bandit_posterior` state for live Beta-Bernoulli values.
- Historical experiment data for benchmark comparisons.

The page includes deterministic benchmark defaults when live experiment data is
not returned. Those defaults are local evaluation values, not live traffic
measurements.

## 5. AI Decisions

**Route:** `ai-decisions`  
**Source:** `frontend/src/pages/AIIntelligence.tsx`

### What it does

AI Decisions describes the Random Forest decision model and its calibration. It
shows model health, Brier score, expected calibration error, inference latency,
feature importance, calibration curves, and confidence information.

### API calls

- `GET /v1/ai/model-health`

### Requirements

- FastAPI on `8000`.
- `ml/model.pkl` present and loadable.
- `ml/data.csv` available for the evaluation context.
- scikit-learn and SHAP installed in the Python environment.

The page can render local benchmark defaults if model-health data is not
available. Concept drift is intentionally shown as unmonitored unless a live
feature store is added.

## 6. Policies

**Route:** `policies`  
**Source:** `frontend/src/pages/Policies.tsx`

### What it does

Policies is the deterministic safety-control dashboard. It displays active
policy rules, priority, trigger conditions, override actions, enabled state,
and trigger counts. It also provides policy simulation and rule-management
controls.

### API calls

- `GET /v1/policies`
- `POST /v1/policies/simulate`
- `GET /v1/policies/config`
- `PUT /v1/policies/config`

### Requirements

- FastAPI on `8000`.
- `backend/policy/engine.py` available to the API.
- PostgreSQL if policy state or trigger history is persisted.

The policy gate is authoritative for recovery execution. Model output and
Thompson Sampling recommendations must pass through these rules before a
recovery command is dispatched.

## 7. System Health

**Route:** `system-health`  
**Source:** `frontend/src/pages/SystemHealth.tsx`

### What it does

System Health is the infrastructure operations page. It probes:

- FastAPI and Go executor health.
- Go worker node runtime information.
- Kafka partition lag and DLQ counts.
- Redis rate-limiter state.
- Gateway circuit breakers.
- Execution latency histogram.

The page refreshes automatically every six seconds and supports manual probes
and circuit-breaker trip/reset actions.

### API calls

- `GET /v1/system/health`
- `GET /v1/system/nodes`
- `GET /v1/system/circuit-breakers`
- `GET /v1/system/rate-limiter`
- `GET /v1/system/dlq`
- `POST /v1/system/circuit-breakers/trip?gateway={gateway}`
- `POST /v1/system/circuit-breakers/reset?gateway={gateway}`

Some calls fall back from FastAPI to the Go executor URL when appropriate.

### Requirements

- FastAPI on `8000`.
- Go executor on `8080`.
- Kafka on `9092` for lag and DLQ metrics.
- Redis on `6379` for limiter status.
- PostgreSQL for audit/WAL-related health information.

If a dependency is offline, the dashboard reports an unavailable or zero-value
status for that subsystem. It does not treat that status as healthy.

## 8. Audit Log

**Route:** `audit-log`  
**Source:** `frontend/src/pages/AuditLog.tsx`

### What it does

Audit Log provides the operator and developer audit trail. It shows:

- Total audit event count.
- SHA-256 digest metadata.
- PostgreSQL ACID/WAL storage information.
- Merkle root and verification metadata.
- Recent audit entries and decision lineage.

### API calls

- `GET /v1/audit/ledger?limit=50`
- `GET /v1/recovery/audit/{payment_id}` through the lineage drawer.
- `GET /v1/audit/proof/{payment_id}` where proof details are requested.

### Requirements

- FastAPI on `8000`.
- PostgreSQL with the `recovery_audit` table.
- Recovery events written by the pipeline.
- SHA-256/Merkle audit implementation available to the backend.

An empty ledger is a valid state for a newly started installation. The page
will show zero records until events are injected or processed.

## Recommended Startup Order

For a complete local dashboard session:

1. Start Docker Desktop or Docker Engine using Linux containers where required.
2. Run `python setup_and_run.py --launch`.
3. Open `http://localhost:5173`.
4. Check **System Health** first to confirm FastAPI, Go, Kafka, Redis, and PostgreSQL.
5. Use **Overview** or **Live Recovery** to inject test events.
6. Open **Payments Forensics** with a generated payment ID.
7. Review **AI Decisions**, **Experiments**, **Policies**, and **Audit Log**.

To stop the application stack, press `Ctrl+C` in the launcher terminal. To
stop Docker infrastructure separately, run:

```powershell
python setup_and_run.py --stop-docker
```
