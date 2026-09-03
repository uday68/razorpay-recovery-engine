# V2 Architecture Roadmap: Event-Driven Recovery Platform

## 1. V1 Achievement & Proven Baseline

In **V1**, the Razorpay Recovery Engine established a verified, production-grade synchronous pipeline. It proved that a machine learning engine can safely drive real-world payments without direct access to execution infrastructure.

### V1 Final Architecture

```text
                    ┌──────────────────┐
                    │   Python AI/ML   │
                    │ Probability Model│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Decision Engine  │
                    │ Expected Value   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Policy Engine   │
                    │ Guardrails       │
                    └────────┬─────────┘
                             │
                      RecoveryCommand
                             │
                           HTTP
                             ▼
              ┌──────────────────────────┐
              │       Go Executor        │
              │                          │
              │ Validation               │
              │ Idempotency              │
              │ Retry Policy             │
              │ Failure Classification   │
              │ Execution Outcome        │
              │ Metrics                  │
              └───────────┬──────────────┘
                          │
             ┌────────────┴─────────────┐
             ▼                          ▼
      ┌──────────────┐          ┌──────────────┐
      │ PostgreSQL   │          │    Gateway   │
      │ Idempotency  │          │  Simulator   │
      │ Audit        │          │              │
      └──────────────┘          └──────────────┘
```

### What V1 Has Proven

| Requirement | Implementation & Proof | Status |
| :--- | :--- | :---: |
| **Structured Recovery Command** | Decoupled JSON contract (`command_id`, `payment_id`, `action`, `amount`) | ✅ |
| **Malformed Command Rejection** | Rejects invalid JSON schemas prior to execution | ✅ |
| **Invalid Action Rejection** | Rejects unapproved action verbs (`STEAL_MONEY`, etc.) | ✅ |
| **Amount Validation** | Enforces positive transaction amount boundaries | ✅ |
| **Idempotency** | Prevents duplicate processing via in-memory & distributed store | ✅ |
| **Duplicate Execution Prevention** | 2nd request yields `DUPLICATE` without a 2nd gateway call | ✅ |
| **PostgreSQL-Backed Idempotency** | Atomic `INSERT ON CONFLICT DO NOTHING` locks | ✅ |
| **Retryable Failure Handling** | Automatic classification of transient gateway errors (`GATEWAY_TIMEOUT`) | ✅ |
| **Bounded Retries** | Caps attempts strictly at 3 with exponential backoff & jitter | ✅ |
| **Permanent Failure Stops Immediately** | Terminal errors (`CARD_EXPIRED`) halt without retries | ✅ |
| **Execution Outcome** | Returns structured outcome strings (`EXECUTED`, `FAILED_PERMANENT`, etc.) | ✅ |
| **Attempts Tracking** | Accurately counts physical gateway interaction attempts | ✅ |
| **Recovery Tracking** | Distinguishes recovered transactions from total failures | ✅ |
| **Recovered Revenue Metrics** | Quantifies total revenue saved and recovery percentage | ✅ |
| **Python → Go Integration** | Python pipeline dispatches commands over HTTP to Go executor | ✅ |
| **Go → PostgreSQL** | Go engine maintains database transactions and audits | ✅ |
| **Go → Gateway** | Interacts with simulated bank gateway with realistic failure modes | ✅ |
| **Full E2E** | Python client to Go daemon to database and gateway verified | ✅ |
| **Full Go Test Suite** | 48 unit and integration tests passing in ~4s | ✅ |

### Non-Negotiable Architectural Boundary
```text
AI recommends ──► Policy authorizes ──► Go executes
```
**The machine learning model never gets direct access to money-moving execution.**

---

## 2. Why V1 is Not Enough: The Scale Challenge

In V1, every recovery event follows a synchronous HTTP request path:
```text
Payment Failure ──► HTTP Request ──► Go Executor ──► Database ──► Gateway
```

While correct and safe, this model cannot survive real Razorpay scale:
* Razorpay processes **thousands of transactions per second**.
* During bank downtime or flash sales, peak failure rates can hit **10,000 to 100,000 failed payments/second**.
* Synchronous HTTP cascades connection pool exhaustion, timeouts, and latency spikes back to the checkout frontend.

To support hyper-scale, we must transition from a synchronous executor to an **Event-Driven Recovery Platform**.

---

## 3. V2 Target Architecture

```text
                    PAYMENT FAILURE
                           │
                           ▼
                    ┌─────────────┐
                    │    Kafka    │
                    │ recovery.   │
                    │   events    │
                    └──────┬──────┘
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
          AI Decision Worker    Risk/Policy
                 │                   │
                 └─────────┬─────────┘
                           ▼
                    Recovery Queue
                           │
                           ▼
                  ┌────────────────┐
                  │  Go Executors  │
                  │    Workers     │
                  └───────┬────────┘
                          │
                    ┌─────┴─────┐
                    ▼           ▼
                Gateway       Redis
                    │           │
                    └─────┬─────┘
                          ▼
                      PostgreSQL
                          │
                          ▼
                    Observability
```

---

## 4. Key Distributed Systems Challenges in V2

1. **Kafka Partitioning Strategy**:
   - Partitioning by `customer_id` or `merchant_id` to guarantee per-customer ordering while distributing load across partition consumers.
2. **Consumer Groups & At-Least-Once Delivery**:
   - Resilient worker pools consuming from `recovery.events` with manual offset commits following successful state persistence.
3. **Idempotent Consumers**:
   - In distributed systems with retries, messages will be delivered more than once. The engine guarantees deduplication using Redis distributed locks and PostgreSQL unique constraints.
4. **Concurrent Go Worker Pools**:
   - Worker goroutine pools with tunable concurrency limits to maximize CPU and network utilization without overwhelming downstream gateways.
5. **Backpressure & Rate Limiting**:
   - Leaky bucket / token bucket rate limiters to respect issuing bank TPS (transactions per second) limits and prevent gateway throttling.
6. **Circuit Breakers**:
   - Automatic tripping when an issuing bank's error rate spikes, buffering requests in Kafka or Redis rather than burning retries.
7. **Dead-Letter Queues (DLQ)**:
   - Poison messages or unresolvable failures route to an inspection DLQ (`recovery.dlq`) without blocking the primary pipeline.
8. **Multi-Tier Caching (Redis + Local)**:
   - Fast sub-millisecond idempotency deduplication and customer profile lookups.
9. **Connection Pooling & Horizontal Scalability**:
   - Dynamic pgx connection pooling and stateless Go worker nodes scaling horizontally behind Kubernetes.
10. **Observability & SLIs/SLOs**:
    - Prometheus metrics tracking recovery rate, P95/P99 latency, queue depth, consumer lag, and recovered revenue.

---

## 5. Scale Progression Roadmap

```text
10 payments/sec ──► 100 payments/sec ──► 1,000 payments/sec ──► 10,000 payments/sec ──► 100,000 payments/sec
```

Every tier in this progression must maintain our core financial invariants:
$$\text{No Duplicate Execution} + \text{Bounded Retries} + \text{Deterministic Policy Safety}$$

---

## 6. Execution Milestones

* **V2.1**: Event-Driven Ingestion with Apache Kafka (event schema, producer, partition keying).
* **V2.2**: Asynchronous AI Decision Worker & Recovery Queue.
* **V2.3**: Concurrent Go Executor Worker Pool & Redis Deduplication.
* **V2.4**: Bank-Aware Rate Limiting & Circuit Breakers.
* **V2.5**: Load Testing & Throughput Benchmarking (10k TPS verification).

