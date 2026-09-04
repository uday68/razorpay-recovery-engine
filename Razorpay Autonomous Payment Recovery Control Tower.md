# Razorpay Autonomous Payment Recovery Control Tower

> An event-driven AI payment recovery platform that predicts the best recovery action for failed payments, applies deterministic financial guardrails, executes recovery through a bounded Go execution layer, and measures recovered revenue.

---

## Overview

Payment failures are not all the same.

A `BANK_TIMEOUT`, `NETWORK_ERROR`, `INSUFFICIENT_FUNDS`, and `CARD_EXPIRED` failure can require completely different recovery strategies.

This project builds a recovery decision and execution platform around that idea:

```text
Payment Failed
      ↓
Kafka Event
      ↓
Event Deduplication
      ↓
AI Recovery Decision
      ↓
Expected Economic Value
      ↓
Deterministic Policy
      ↓
Recovery Command
      ↓
Go Execution Engine
      ↓
Retry / Circuit Breaker / Rate Limit
      ↓
Gateway
      ↓
Execution Outcome
      ↓
Metrics + PostgreSQL
      ↓
Recovery Control Tower
```

The core safety principle is:

> **AI recommends. Deterministic policy authorizes. Go executes.**

The ML layer never directly performs money-moving execution.

---

# Why This Exists

A naive recovery system might do:

```text
payment failed
      ↓
retry immediately
```

That can create unnecessary retries, poor customer experience, and unnecessary gateway load.

This system instead evaluates multiple recovery strategies:

```text
RETRY_NOW
RETRY_LATER
SEND_REMINDER
NO_ACTION
```

For each action, the model estimates:

```text
P(recovery | payment context, action)
```

The decision engine then calculates:

```text
Expected Value =
    Recovery Probability × Payment Amount
    − Action Cost
```

The highest-value action becomes the AI recommendation.

A deterministic policy layer then decides whether that recommendation is actually allowed.

---

# Architecture

## High-Level

```text
                      PAYMENT FAILURE
                            │
                            ▼
                    ┌───────────────┐
                    │ Apache Kafka  │
                    │               │
                    │ recovery.     │
                    │ payment.failed│
                    └───────┬───────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Go Recovery Worker │
                  └─────────┬──────────┘
                            │
                     Event Idempotency
                            │
                            ▼
                  ┌────────────────────┐
                  │ Python Decision API│
                  │                    │
                  │ ML probability    │
                  │ Expected Value     │
                  │ Policy             │
                  └─────────┬──────────┘
                            │
                      RecoveryCommand
                            │
                            ▼
                  ┌────────────────────┐
                  │ Go Executor :8080 │
                  │                    │
                  │ Validation         │
                  │ Idempotency       │
                  │ Retry Policy      │
                  │ Circuit Breaker   │
                  │ Rate Limiting     │
                  │ Metrics           │
                  └─────────┬──────────┘
                            │
                            ▼
                       Gateway
                            │
                            ▼
                     ExecutionResult
                            │
                    ┌───────┴────────┐
                    ▼                ▼
               PostgreSQL         Metrics
```

---

# Core Design Principles

## 1. AI does not execute payments

The AI service produces a decision.

Execution remains behind a deterministic Go service.

```text
AI
 ↓
Recommendation

Policy
 ↓
Authorization

Go Executor
 ↓
Execution
```

This creates a hard separation between intelligence and money movement.

---

## 2. At-least-once event processing

Kafka consumers use:

```text
Fetch
  ↓
Process
  ↓
Commit
```

The offset is committed only after successful processing.

If processing fails before commit, Kafka can redeliver the event.

---

## 3. Event-level idempotency

Every event has:

```text
event_id
```

The PostgreSQL event store ensures that concurrent consumers cannot successfully claim the same event more than once.

```text
event_id = X

worker 1 ─┐
worker 2 ─┤
worker 3 ─┼──→ PostgreSQL
worker N ─┘

exactly one → claimed
others      → duplicate
```

---

## 4. Command-level idempotency

Recovery commands use:

```text
command_id
```

The Go execution layer prevents the same command from being executed twice.

This provides two safety boundaries:

```text
event_id
   ↓
protect event processing

command_id
   ↓
protect money-moving execution
```

---

# Machine Learning

The current decision model is a supervised recovery-probability model.

For every candidate action:

```text
P(Y = 1 | X, A)
```

where:

- `X` = payment/customer context
- `A` = candidate recovery action
- `Y` = recovery success

### Input features

The current model uses:

```text
success_rate
recovery_rate
amount
payment_method
bank
failure_code
hour
action
```

The pipeline uses:

- numerical feature scaling
- categorical feature encoding
- a persisted Random Forest classifier

---

# Decision Engine

For each action:

```text
EV(a) =
P(success | X, a) × amount
− action_cost(a)
```

Current actions:

```text
RETRY_NOW
RETRY_LATER
SEND_REMINDER
NO_ACTION
```

The action with the highest expected value becomes the model recommendation.

---

# Policy Engine

AI recommendations are passed through deterministic policy gates.

Example:

```text
AI recommends RETRY_LATER
              │
              ▼
Recovery probability = 0.65
              │
              ▼
Retry threshold = 0.50
              │
              ▼
APPROVED
```

If the recovery probability does not satisfy the retry threshold:

```text
AI recommendation
       ↓
Policy rejects
       ↓
NO_ACTION
```

The important distinction is:

```text
NO_ACTION selected by model
```

versus

```text
NO_ACTION produced because policy blocked
```

These are tracked separately in the experiment layer.

---

# Go Execution Engine

The Go service is responsible for the execution boundary.

## Validation

Commands are rejected when:

- `command_id` is missing
- `payment_id` is missing
- action is invalid
- amount is zero or negative

## Retry semantics

Failures are classified as retryable or permanent.

Retryable failures can be retried, but retries are bounded.

Permanent failures stop immediately.

---

# Circuit Breaker

Gateway protection uses:

```text
CLOSED
   ↓
failure threshold
   ↓
OPEN
   ↓
cooldown
   ↓
HALF_OPEN
   ├── success → CLOSED
   └── failure → OPEN
```

When the circuit is open, requests are rejected before reaching the gateway.

This prevents a downstream outage from being amplified by recovery retries.

---

# Rate Limiting

A local execution rate limiter protects downstream capacity.

Conceptually:

```text
Workers
   ↓
Rate Limiter
   ↓
Gateway
```

This prevents an execution burst from overwhelming the downstream simulator/gateway.

The current limiter is process-local rather than a globally distributed rate limiter.

---

# Backpressure

Execution capacity is bounded using a FIFO queue.

```text
Recovery Command
       ↓
Bounded Queue
       ↓
Execution Worker
       ↓
Rate Limiter
       ↓
Gateway
```

When the queue is full:

```text
ErrQueueFull
```

The intended distributed architecture allows Kafka to act as the durable upstream buffer instead of silently dropping recovery work.

---

# Dead Letter Queue

Events that cannot be processed successfully can be placed into a dedicated dead-letter structure with:

```text
event
reason
```

This creates an explicit failure path instead of silently discarding events.

---

# Persistence

PostgreSQL is used for durable state including:

```text
command idempotency
event idempotency
recovery audit
execution outcomes
```

The repository also contains PostgreSQL-backed integration tests for idempotency behavior.

---

# Observability

The Go executor exposes recovery metrics including:

```text
TotalExecutions
RecoveredExecutions
FailedExecutions
RetryableFailures
PermanentFailures
ExecutorErrors
TotalAttempts
RecoveryRate
RecoveredRevenue
```

Endpoint:

```text
GET /metrics
```

---

# Experimental Results

The simulator contains three recovery strategies:

```text
Always Retry
Rule-Based
AI
```

The AI strategy is evaluated against deterministic counterfactual outcomes using identical payment contexts.

### Five-seed stability result

Across five independent simulator seeds:

```text
AI vs Rule-Based

Average recovered-revenue lift: +6.85%
Standard deviation:             1.05%
Positive runs:                   5 / 5
```

Against the Always-Retry strategy:

```text
Average recovered-revenue improvement: +38.67%
```

These are:

> **Controlled simulator results, not production performance claims.**

---

# Performance Benchmark

The Go execution layer was benchmarked locally using the simulated gateway.

Environment:

```text
CPU: 12th Gen Intel(R) Core(TM) i5-12450H
OS: Linux amd64
```

Observed results:

```text
Sequential execution: 344 ns/op
Concurrent execution: 17.72 ns/op
Allocations:          0 B/op
Allocations/op:       0
Race detector:        PASS
```

The concurrent benchmark corresponds to approximately:

```text
56.4M in-process operations/sec
```

This is an **in-process Go benchmark**, not an end-to-end Kafka → Python → PostgreSQL throughput claim.

---

# Testing

The project follows a test-driven development workflow:

```text
RED
 ↓
Failing test
 ↓
GREEN
 ↓
Minimal implementation
 ↓
Regression verification
```

The Go service has coverage across:

```text
command contract
validation
idempotency
PostgreSQL persistence
failure classification
retry policy
execution outcomes
metrics
Kafka publishing
Kafka consumption
event validation
event idempotency
worker execution
concurrency
rate limiting
backpressure
dead-letter handling
circuit breaker
end-to-end flow
```

Run the Go tests:

```bash
cd backend/go-executor
go test ./...
```

Run the Go race detector:

```bash
go test -race ./...
```

Run the Python tests:

```bash
pytest backend -v
```

---

# Repository Structure

```text
razorpay-recovery-engine/
│
├── backend/
│   │
│   ├── api/
│   │   ├── app.py
│   │   ├── schemas.py
│   │   └── test_app.py
│   │
│   ├── decision/
│   │   └── engine.py
│   │
│   ├── policy/
│   │   └── engine.py
│   │
│   ├── recovery_pipeline.py
│   ├── go_executor_client.py
│   ├── audit.py
│   ├── audit_repository.py
│   │
│   └── go-executor/
│       │
│       ├── main.go
│       ├── executor.go
│       ├── retry_executor.go
│       ├── retry_policy.go
│       ├── failure_classifier.go
│       ├── circuit_breaker.go
│       ├── circuit_breaker_executor.go
│       ├── rate_limiter.go
│       ├── backpressure.go
│       ├── execution_worker.go
│       ├── metrics.go
│       ├── postgres_store.go
│       │
│       ├── cmd/
│       │   └── recovery-worker/
│       │       └── main.go
│       │
│       └── events/
│           ├── event.go
│           ├── validation.go
│           ├── kafka_publisher.go
│           ├── kafka_consumer.go
│           ├── postgres_event_store.go
│           ├── recovery_flow.go
│           ├── recovery_worker.go
│           ├── decision_client.go
│           ├── execution_client.go
│           └── ...
│
├── ml/
│   ├── dataset.py
│   ├── train.py
│   └── model_store.py
│
├── simulator/
│   ├── generator.py
│   ├── models.py
│   ├── recovery.py
│   └── config.py
│
├── frontend/
│   └── ...
│
└── README.md
```

---

# Local Services

The current architecture uses:

```text
PostgreSQL
Kafka
Python Decision API
Go Recovery Worker
Go Executor
Frontend
```

Default service endpoints:

```text
Python Decision API
http://localhost:8000

Go Executor
http://localhost:8080

Kafka
localhost:9092

PostgreSQL
localhost:5432
```

Kafka topic:

```text
recovery.payment.failed
```

---

# Decision API

The Python decision service exposes:

```http
POST /v1/recovery/decide
```

Example request:

```json
{
  "event_id": "evt-001",
  "event_type": "PAYMENT_FAILED",
  "payment_id": "pay-001",
  "customer_id": "cust-001",
  "amount": 5000,
  "payment_method": "UPI",
  "bank": "HDFC",
  "failure_code": "BANK_TIMEOUT",
  "success_rate": 0.80,
  "recovery_rate": 0.50,
  "timestamp": "2026-09-04T08:00:00Z"
}
```

Example response:

```json
{
  "payment_id": "pay-001",
  "action": "RETRY_LATER",
  "probability": 0.65,
  "expected_value": 3248
}
```

The API only produces the decision.

It does not execute the recovery.

---

# Execution API

The Go executor exposes:

```http
POST /v1/recovery/execute
```

The execution service performs:

```text
validation
→ idempotency
→ retry policy
→ gateway execution
→ execution outcome
→ metrics
```

---

# Frontend

The frontend is a recovery control tower designed to expose:

```text
recovered revenue
recovery rate
AI decisions
failure analysis
live recovery activity
policy decisions
execution state
system health
audit information
```

The intended user journey is:

```text
Overview
   ↓
Live Recovery
   ↓
Payment Investigation
   ↓
AI Decision
   ↓
Policy
   ↓
Execution
   ↓
Outcome
```

---

# Safety Model

The platform deliberately separates:

### Intelligence

```text
What is likely to work?
```

### Economics

```text
What action has the highest expected value?
```

### Policy

```text
Is the action allowed?
```

### Execution

```text
How do we safely execute it?
```

### Measurement

```text
Did the action actually recover revenue?
```

This creates a closed loop:

```text
Decision
   ↓
Execution
   ↓
Outcome
   ↓
Measurement
   ↓
Future decisions
```

---

# Current Status

## Implemented and verified

```text
✅ AI recovery probability model
✅ Expected-value decision engine
✅ Rule-based baseline
✅ Controlled multi-seed experiment
✅ RecoveryCommand contract
✅ Command validation
✅ Command idempotency
✅ PostgreSQL command persistence
✅ Retryable/permanent failure handling
✅ Bounded retries
✅ Execution outcomes
✅ Recovery metrics
✅ PaymentFailedEvent
✅ Event validation
✅ Kafka publisher
✅ Kafka consumer
✅ Fetch → Process → Commit semantics
✅ Event idempotency
✅ PostgreSQL event idempotency
✅ Recovery worker
✅ Python Decision API
✅ Go → Python decision client
✅ Decision → RecoveryCommand
✅ Go execution client
✅ Kafka → RecoveryFlow
✅ Concurrent worker testing
✅ Rate limiter
✅ Bounded execution queue
✅ Execution worker
✅ Dead-letter handling
✅ Circuit breaker
✅ Real event-driven E2E
✅ Performance benchmark
✅ Go race-detector verification
```

---

# Future Production Extensions

The current repository is intentionally focused on the core recovery control plane.

Potential production extensions include:

```text
Redis-based distributed caching
Distributed/global rate limiting
Production Kafka cluster configuration
Kubernetes deployment
Distributed tracing
Dedicated DLQ Kafka topic
Real payment-gateway integrations
Advanced model monitoring
Model retraining pipelines
Automated policy rollout
```

These are extension points rather than claims about the current implementation.

---

# Demo Flow

A concise demonstration can follow this sequence:

```text
1. Show failed payment
        ↓
2. Publish PAYMENT_FAILED event
        ↓
3. Kafka receives event
        ↓
4. Worker consumes event
        ↓
5. AI evaluates recovery actions
        ↓
6. Expected Value selects the best action
        ↓
7. Policy authorizes or blocks
        ↓
8. Go executor executes safely
        ↓
9. Retry/circuit-breaker behavior protects gateway
        ↓
10. PostgreSQL records the result
        ↓
11. Metrics show recovered revenue
        ↓
12. Dashboard displays the full decision lineage
```

---

# Key Takeaway

This project is not simply a payment-retry script.

It is a prototype of an **autonomous recovery control plane** that combines:

```text
AI decisioning
+
economic optimization
+
deterministic safety policies
+
event-driven architecture
+
idempotent execution
+
failure handling
+
observability
```

The fundamental design principle is:

> **Let AI decide what is economically promising. Let deterministic systems decide what is allowed. Let bounded infrastructure decide how it executes.**