# Engineering Session Report: Razorpay Recovery Engine

**Date:** 04-09-2026  
**Session Scope:** Kafka Event Streaming, Distributed Idempotency, Standalone Recovery Worker Daemon, FastAPI Decision Service, Executor Backpressure & Rate Limiting, Race Condition Elimination, and Google Stitch Control Tower Frontend.  
**Status:** All 63 Python Tests & All Go Tests Passing (100% Green, `-race` Clean).

---

## Executive Summary

During this engineering session, the Razorpay Recovery Engine achieved complete end-to-end integration across the event-driven architecture, scaling from standalone simulator scripts into a distributed, production-grade autonomous recovery control plane:

1. **Kafka Event Streaming Architecture**:
   - Integrated Apache Kafka (`recovery.payment.failed`) with partitioned hashing on `event_id`.
   - Built an explicit manual commit loop (`FetchMessage` -> `Validate` -> `Handle` -> `CommitMessages`) preventing message loss during processing failures.
   - Engineered isolated dynamic topic creation for concurrent integration tests to eliminate cross-test message pollution.

2. **Distributed Idempotency Layer**:
   - Designed dual-layer idempotency protection: in-memory `EventStore` for low-latency deduplication and transactional PostgreSQL `PostgresEventStore` (`ON CONFLICT (event_id) DO NOTHING`).
   - Verified concurrency safety under load: 20 concurrent goroutines racing on the same `event_id` result in exactly 1 claim.

3. **Cross-Service FastAPI Decision Engine**:
   - Implemented `/v1/recovery/decide` in FastAPI connecting the Scikit-learn Random Forest model, Expected Value optimization, and business policy guardrails.
   - Implemented resilient root directory path resolution (`sys.path`) and schema import fallbacks, enabling seamless startup from both repository root and subdirectories.

4. **Standalone Go Recovery Worker Daemon**:
   - Built a production-grade daemon binary (`recovery-worker`) with configurable CLI flags (`-brokers`, `-topic`, `-group-id`, `-decision-url`, `-executor-url`, `-db-url`).
   - Added robust OS signal trapping (`SIGINT`, `SIGTERM`) ensuring graceful shutdown and Kafka commit completion.

5. **Executor Backpressure & Rate Limiting**:
   - Developed `ExecutionQueue` with bounded capacity, instant non-blocking rejection (`ErrQueueFull`), thread-safe locking, and FIFO `Dequeue()`.
   - Built `RateLimiter` to meter downstream bank gateway traffic, preventing switch overload and throttling penalties.

6. **Thread Safety & Race Condition Elimination**:
   - Mutex-synchronized mock structures (`flowDecisioner`, `flowExecutor`) with thread-safe `callCount()` inspection.
   - Resolved Go syntax composite literal bug (`&flowExecutor{}`).
   - Validated complete Go suite with `go test -race ./...`.

7. **Google Stitch Control Tower Frontend**:
   - Built and integrated an enterprise-grade React 19 + TypeScript + Vite + Tailwind CSS control dashboard based on Google Stitch design system.
   - Implemented interactive operational controls: policy toggles, strategy selectors, trigger manual recovery modals, export audit logs, and simulated telemetry feeds.

---

## Chronological Progress & Technical Details

### 1. Kafka Event Consumer & Manual Commit Semantics
* **Files:** `backend/go-executor/events/kafka_consumer.go`, `consumer_test.go`
* **Architecture:** In high-throughput payment recovery, auto-committing offsets risks silent message loss if downstream execution fails.
* **Implementation:**
  - `KafkaConsumer.Consume(ctx)` calls `reader.FetchMessage(ctx)`.
  - JSON payload is deserialized into `PaymentFailedEvent` and strictly validated.
  - Handler processing occurs; if an error is returned, the offset is **not committed**, leaving the message available for redelivery.
  - Upon successful processing, `reader.CommitMessages(ctx, message)` is executed.

---

### 2. Dual-Layer Event Idempotency
* **Files:** `backend/go-executor/events/event_store.go`, `postgres_event_store.go`, `postgres_concurrent_idempotency_test.go`
* **In-Memory Store:** Uses `sync.Mutex` and `map[string]time.Time` for ultra-fast in-process deduplication.
* **PostgreSQL Store:** 
  ```sql
  INSERT INTO event_claims (event_id, claimed_at)
  VALUES ($1, NOW())
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id;
  ```
* **Concurrent Verification:** Verified with 20 parallel goroutines competing for the same event identifier. Only one goroutine receives `claimed = true`; all others receive `false`.

---

### 3. FastAPI Decision Endpoint & Resilient Module Loading
* **Files:** `backend/api/app.py`, `backend/api/schemas.py`, `backend/api/test_app.py`
* **Problem:** Running `python -m uvicorn app:app` from `backend/api` caused relative import failures and missing module paths.
* **Solution:** Added dynamic project root resolution into `sys.path` and fallback schema importing:
  ```python
  REPO_ROOT = Path(__file__).resolve().parent.parent.parent
  if str(REPO_ROOT) not in sys.path:
      sys.path.insert(0, str(REPO_ROOT))

  try:
      from backend.api.schemas import RecoveryDecisionRequest, RecoveryDecisionResponse
  except ImportError:
      from schemas import RecoveryDecisionRequest, RecoveryDecisionResponse
  ```
* **Endpoint (`POST /v1/recovery/decide`):**
  - Accepts event context: `amount`, `payment_method`, `bank`, `failure_code`, `hour`, `success_rate`, `recovery_rate`.
  - Generates multi-action probabilities using trained `RandomForestClassifier`.
  - Calculates Expected Value: EV(a) = P(a) * Amount - Cost(a).
  - Applies deterministic policy overrides (`apply_policy`).
  - Returns recommended action, calibrated probability, and expected value.

---

### 4. Standalone Recovery Worker Daemon
* **Files:** `backend/go-executor/cmd/recovery-worker/main.go`, `main_test.go`
* **Daemon Pipeline:**
  ```text
  Kafka Reader
       |
  Kafka Consumer
       |
  Recovery Flow Handler
       |
  Recovery Flow
       |-- Claim Event Idempotency (PostgreSQL / In-Memory)
       |-- RPC Call -> FastAPI Decision Engine (/v1/recovery/decide)
       +-- RPC Call -> Go Executor Engine (/execute)
  ```
* **Production Readiness:** Configured with CLI flags and graceful context cancellation on `os.Interrupt` / `syscall.SIGTERM`.

---

### 5. Executor Backpressure Queue & Rate Limiter
* **Files:** `backend/go-executor/backpressure.go`, `backpressure_test.go`, `rate_limiter.go`, `rate_limiter_test.go`
* **Backpressure Queue:**
  - `NewExecutionQueue(capacity)` initializes a bounded buffer.
  - `Enqueue(command)` returns `ErrQueueFull` instantly without blocking when capacity is reached, protecting upstream workers from cascading thread exhaustion.
  - `Dequeue()` provides thread-safe FIFO retrieval with slice memory compaction.
* **Rate Limiter:**
  - Enforces max executions per second against downstream bank gateways.
  - Prevents banking switch 429 rate limit triggers and circuit trips.

---

### 6. Kafka Multi-Worker Concurrency & Topic Isolation
* **Files:** `backend/go-executor/events/kafka_concurrent_integration_test.go`, `recovery_flow_test.go`
* **Root Cause of Contamination:** Shared topic `recovery.payment.failed` had retained messages from previous tests. Ephemeral consumer groups default to `kafka.FirstOffset`, consuming leftover messages and inflating expected decision counts (e.g. 23 instead of 20).
* **Fix Applied:**
  - Generated dynamic per-test topics: `fmt.Sprintf("recovery.payment.failed.concurrent-%d", time.Now().UnixNano())`.
  - Explicitly pre-created topics with 3 partitions using `kafka.Dial` and `conn.CreateTopics(...)`.
  - Added thread-safe mutex synchronization and `callCount()` helpers on mock test decisioners and executors.
* **Outcome:** Clean pass under `go test -race ./...`.

---

### 7. Google Stitch Control Tower Frontend
* **Directory:** `frontend/`
* **Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
* **Key Views & Controls:**
  - **Overview Dashboard:** Live recovery rate KPI, revenue recovered metrics, bank health breakdown, and real-time activity charts.
  - **Live Recovery Stream:** Real-time event log with manual trigger modals, filtering by bank and failure code.
  - **Policies Configuration:** Active policy cards with interactive enable/disable switches and threshold adjustments.
  - **AI Intelligence & Experiments:** Multi-arm bandit telemetry, 3-way strategy comparison (AI vs. Rule vs. Naive Always-Retry).
  - **System Health:** Health status for Kafka, PostgreSQL, FastAPI Engine, and Go Executor with latency metrics.
  - **Audit Log Explorer:** Merkle tree verification badges and CSV/JSON export handlers.

---

## Verification & Test Results

### 1. Python Test Suite (63/63 Passed)
```bash
python -m pytest tests/ backend/api/test_app.py
============================== 63 passed in 43.28s ==============================
```

### 2. Go Test Suite & Race Detector (100% Passed)
```bash
go test -race ./...
ok      recovery-executor                       5.987s
ok      recovery-executor/cmd/recovery-worker   (cached)
ok      recovery-executor/events                60.157s
```

---

## Summary of Modified & Created Files

| File Path | Type | Description |
|---|---|---|
| `backend/api/app.py` | Modified | Added resilient `sys.path` resolution and fallback schema imports |
| `backend/go-executor/backpressure.go` | New | Bounded execution queue with instant rejection on capacity |
| `backend/go-executor/backpressure_test.go` | New | Unit tests for queue capacity rejection and FIFO dequeuing |
| `backend/go-executor/rate_limiter.go` | New | Rate limiter for smoothing downstream gateway load |
| `backend/go-executor/rate_limiter_test.go` | New | Timing verification for rate limiter intervals |
| `backend/go-executor/events/concurrent_worker_test.go` | New | Concurrent worker in-memory flow stress test |
| `backend/go-executor/events/postgres_concurrent_idempotency_test.go` | New | Concurrency test proving single claim win among 20 goroutines |
| `backend/go-executor/events/kafka_concurrent_integration_test.go` | New | End-to-end Kafka consumer group concurrency test with isolated topic |
| `backend/go-executor/events/recovery_flow_test.go` | Modified | Mutex-synchronized call counters for race-free test assertions |
| `docs/2026-09-04-session-report.md` | New | Full engineering session report for September 4, 2026 |
