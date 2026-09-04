# Razorpay Autonomous Payment Recovery Control Tower
## System Architecture & Implemented Features Status

This document provides a comprehensive inventory of all features, services, and components currently implemented across the **Razorpay Recovery Engine** repository.

---

## 1. High-Level Architecture

The platform is designed as an autonomous, closed-loop financial recovery control plane for high-velocity payment failures across major Indian banking switches (HDFC, ICICI, SBI, Axis, and Razorpay UPI):

```text
[ Payment Failure Event ]
          ¦
          ?
   [ Apache Kafka ]  (recovery.payment.failed)
          ¦
          ?
 [ Go Recovery Worker ] --(HTTP RPC)--? [ Python FastAPI ML Engine ] (:8000)
   (Daemon Consumer)                     (Contextual Bandit + Policies)
          ¦                                            ¦
          ¦?----------------- Decision Result ---------+
          ¦
          ?
  [ Go Executor Engine ] (:8080)
   +-- Gateway Circuit Breakers (HDFC/ICICI/SBI/Axis)
   +-- Jittered Backoff & Exponential Scheduler
   +-- Prometheus Telemetry Counters
   +-- RFC 6962 Merkle Tree Audit Logger (PostgreSQL WAL)
          ¦
          ?
[ Frontend Control Tower ] (:5173)
  (React 18 + TypeScript + Vite + Tailwind Dark Theme)
```

---

## 2. Implemented Backend Components

### A. Go Executor Service (`backend/go-executor/`)
- **HTTP Server (`:8080`)**: High-throughput REST API serving health checks, metrics, and recovery execution endpoints.
- **Circuit Breakers (`circuit_breaker.go`)**: Per-gateway sliding-window trip logic (CLOSED, HALF-OPEN, OPEN) with automated cool-down timers to protect downstream banking partner switches.
- **Retry Executor (`retry_executor.go`)**: Deterministic re-dispatch orchestrator supporting:
  - `RETRY_NOW`: Immediate re-routing through secondary switches.
  - `RETRY_LATER`: Dynamic exponential backoff with randomized jitter.
  - `SEND_REMINDER`: Merchant/customer notification dispatch.
  - `NO_ACTION`: Permanent drop on hard floors or unrecoverable codes.
- **Independent Worker Process (`cmd/recovery-worker/main.go`)**: Dedicated Kafka consumer binary scaling independently from the HTTP API.
- **Test Suite**: Fully unit-tested with 100% pass rate (`go test ./...`).

### B. Python Decision & ML Intelligence (`backend/api/`, `backend/decision/`, `ml/`)
- **FastAPI Decision API (`backend/api/app.py:8000`)**: High-performance endpoint (`POST /v1/recovery/decide`) returning recommendations with probability and expected value.
- **Contextual Multi-Armed Bandit**: Bayesian Thompson Sampling dynamically balancing exploration vs. exploitation across failure cohorts.
- **Feature Attribution**: Models historical bank success rates, error code recovery propensities, ticket sizes, and peak-hour congestion factors.
- **Deterministic Policy Safety Gates (`backend/policy/engine.py`)**: Hard overrides (RBI cooling period compliance, gateway trip thresholds, P0 minimum EV floors).
- **Test Suite**: Fully verified across 66 unit & integration tests (`python -m pytest`).

---

## 3. Implemented Frontend Control Tower (`frontend/`)

### A. Design System & Theming
- **Infrastructure Precision Theme**: Strictly implementing Google Stitch tokens from `DESIGN.md`.
- **Canvas Base**: Rooted in `#0B0F17` with surface luminosity tiers (`#111827`, `#161F30`, `#1E293B`).
- **Typography**:
  - `Geist`: Architectural headlines and labels.
  - `Inter`: Narrative text, system logs, and operational descriptions.
  - `JetBrains Mono`: Financial quantities in Indian Rupees (`?`), latencies (`ms`), confidence probabilities (`0.00-1.00`), and cryptographic hashes.

### B. Modular Component Architecture
- **`src/components/ui/`**:
  - `StatCard.tsx`: Metric cards with trend badges, targets, and icons.
  - `StatusPill.tsx`: Lifecycle badges (`RECOVERED`, `ROUTING`, `FAILED`, `OPTIMAL`) with 6px dot and pulse animation.
  - `ActionBadge.tsx`: Semantic tags for `RETRY_NOW`, `RETRY_LATER`, `SEND_REMINDER`, `NO_ACTION`.
  - `ConfidenceBar.tsx`: Micro progress bar with gradient color transitions.
  - `SearchFilterBar.tsx`: Terminal query input with gateway and status selectors.
  - `CodeBlock.tsx`: Collapsible JSON/cryptographic viewer with copy button.
- **`src/components/charts/`**:
  - `TrendAreaChart.tsx`: Multi-series SVG recovery trajectory area chart with linear gradient shading.
  - `LatencyHistogram.tsx`: p50, p95, p99 decision latency distribution profile.
  - `CalibrationCurve.tsx`: Predicted probability vs. observed settlement calibration curve.
  - `BanditArmRewardChart.tsx`: Multi-Armed Bandit (MAB) win rate comparison across cohorts.
- **`src/components/recovery/`**:
  - `TransactionTable.tsx`: Tabular ledger with Indian Rupee formatting (`?`), failure codes, EV, and inspect triggers.
  - `DecisionLineageDrawer.tsx`: Inspector drawer showing ML feature attribution, compliance checks, and raw payloads.
  - `PolicyRuleCard.tsx`: Interactive policy gate card with toggle and trigger threshold meters.
  - `PolicySimulationSandbox.tsx`: Zero-risk parameter simulation sandbox with live sliders.
- **`src/components/system/`**:
  - `WorkerClusterStatus.tsx`: Go Executor worker thread, goroutine, and memory health.
  - `CircuitBreakerCard.tsx`: Bank partner gateway health gauges (HDFC, ICICI, SBI, Axis).
  - `KafkaLagMonitor.tsx`: Partition consumer lag bars for Kafka topics.

### C. Connected Pages (`src/pages/`)
1. **Overview (`Overview.tsx`)**: Executive dashboard with command banner, KPI density strip, recovery trajectory chart, circuit breakers, and recent transactions.
2. **Live Recovery (`LiveRecovery.tsx`)**: Real-time Kafka stream monitoring, live filter controls, and transaction inspection.
3. **Payment Investigation (`PaymentInvestigation.tsx`)**: Deep-dive forensics for individual transactions showing state transitions, feature weights, and Merkle proofs.
4. **Experiments (`Experiments.tsx`)**: Multi-Armed Bandit exploration cohorts, Thompson Sampling win rates, and strategy matrix.
5. **AI Intelligence (`AIIntelligence.tsx`)**: Calibration curves, Brier score, SHAP attribution, and Kolmogorov-Smirnov drift tests.
6. **Policies (`Policies.tsx`)**: Deterministic hard-gate policy cards and simulation sandbox.
7. **System Health (`SystemHealth.tsx`)**: Go daemon cluster metrics, latency histograms, Kafka lag, and gateway status.
8. **Audit Log (`AuditLog.tsx`)**: Immutable cryptographic ledger with RFC 6962 Merkle proof viewer.

---

## 4. Verification & Build Status
- **TypeScript**: `npx tsc --noEmit` clean with zero errors.
- **Vite Production Bundle**: `npm run build` bundles 57 modules in under 2 seconds (dist: 227 kB js / 6 kB html).
- **Backend Tests**: 100% green across both Python and Go test suites.

