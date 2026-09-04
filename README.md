# Razorpay Recovery Engine

The Razorpay Recovery Engine is a simulated framework and pipeline designed to optimize the recovery of failed payment transactions. It utilizes Machine Learning to predict the best recovery action, a Policy Engine to enforce business rules, and a robust Backend Pipeline for audit trailing and idempotency.

## Project Architecture

The repository is divided into several core modules:

### 1. `simulator/` (Data Generation & Simulation)
Simulates Razorpay customers and payment failures. 
- **`generator.py`**: Generates synthetic, deterministic data for customers and failed payments.
- **`recovery.py`**: Defines the ground-truth probabilities for different recovery actions across various payment failure codes (`BANK_TIMEOUT`, `INSUFFICIENT_FUNDS`, etc.).
- **`models.py`**: Pydantic/dataclass models for `Customer` and `Payment`.

### 2. `ml/` (Machine Learning)
Trains and serves the predictive model.
- **`dataset.py`**: Uses the simulator to build a training dataset (`data.csv`) of payment failures and action success rates.
- **`train.py`**: Trains a `RandomForestClassifier` on the generated dataset to learn non-linear interactions between failure codes and optimal actions.
- **`model_store.py`**: Handles persistence of the trained model (`model.pkl`).

### 3. `backend/` (Core Logic & Production Pipeline)
The primary application backend where the ML model is operationalized.
- **`decision/engine.py`**: Evaluates the probability predictions from the ML model and computes the *Expected Value* of each action (factoring in potential penalties for annoying the customer).
- **`policy/engine.py`**: A rule-based engine that overrides ML decisions when strict business constraints are met (e.g., blocking `RETRY_NOW` for `BANK_TIMEOUT`, or skipping actions for massive transactions to minimize risk).
- **`recovery_pipeline.py`**: The main entry point for processing failed payments. It orchestrates:
  1. Idempotency checks to prevent duplicate processing.
  2. Model prediction and policy evaluation.
  3. Saving the complete audit trail.
  4. Executing the final recovery action.
- **`audit_repository.py`**: Connects to PostgreSQL to store the `recovery_audit` and `recovery_idempotency` records.
- **`controlled_experiment.py` & `comparison.py`**: Tools to run simulated A/B tests comparing the AI Strategy against a Baseline Strategy (e.g., "always retry now") to measure revenue and recovery improvements.

### 4. `tests/` (Test Suite)
Contains comprehensive `pytest` test coverage for:
- Idempotency (`test_pipeline_idempotency.py`)
- Policy Integration (`test_policy_integration.py`, `test_policy.py`)
- Action Dynamics (`test_action_dynamics.py` ensuring the ML model differentiates actions)
- Audit Logs (`test_audit.py`, `test_audit_repository.py`)
- Stability Metrics (`test_stability_metrics.py`)

## Setup & Installation

1. **Install Dependencies:**
   Ensure you have Python 3.12+ installed.
   ```bash
   pip install pandas scikit-learn psycopg pytest
   ```

2. **Database Setup:**
   The `RecoveryPipeline` requires a running PostgreSQL instance.
   ```bash
   # Default connection string used in tests:
   postgresql://recovery:recovery@localhost:5432/recovery_engine
   ```

3. **Train the Model:**
   Generate the dataset and train the ML model.
   ```bash
   python -m ml.dataset
   python -m ml.train
   ```

## Running Tests

Run the full pytest suite from the root directory:
```bash
python -m pytest
```

## Running an Experiment

To compare the AI Recovery Engine's performance in a **3-Way Controlled Experiment** against both the Naive Baseline ("Always Retry") and the Heuristic Baseline ("Rule-Based"):
```bash
python backend/run_experiment.py
```
This outputs detailed metrics including total recoveries, revenue recovered, policy compliance rates, action distribution, and the net financial improvement the AI engine drives over both baselines.

## Key Features
- **Idempotency**: Prevents the same payment ID or recovery command from being executed multiple times across both Python and Go boundaries.
- **Audit Logging**: Every decision and physical execution outcome is logged to PostgreSQL (`recovery_audit`), capturing probabilities, expected values, policy checks, attempts, and gateway statuses.
- **Business Rule Enforcement**: The ML model recommends actions based on probability and expected value, but the Policy Engine enforces safety boundaries and fallbacks.
- **Multi-Trial Trained ML**: Trained on 59,000+ repeated trials capturing ground-truth probability distributions across failure modes.

## V1 Architecture & Proven Capabilities

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

### Verified V1 Capabilities

| Requirement | Implementation & Proof | Status |
| :--- | :--- | :---: |
| **Structured recovery command** | JSON contract (`command_id`, `payment_id`, `action`, `amount`) | ✅ |
| **Malformed command rejection** | Rejects invalid JSON schemas before entering execution | ✅ |
| **Invalid action rejection** | Rejects unapproved action verbs (`STEAL_MONEY`, etc.) | ✅ |
| **Amount validation** | Enforces positive amount values (`amount > 0`) | ✅ |
| **Idempotency** | Prevents duplicate processing via in-memory & PostgreSQL store | ✅ |
| **Duplicate execution prevention** | 2nd request yields `DUPLICATE` without a 2nd gateway call | ✅ |
| **PostgreSQL-backed idempotency** | Atomic `INSERT ON CONFLICT DO NOTHING` locks | ✅ |
| **Retryable failure handling** | Automatic classification of transient gateway errors (`GATEWAY_TIMEOUT`) | ✅ |
| **Bounded retries** | Caps attempts strictly at 3 with exponential backoff & jitter | ✅ |
| **Permanent failure stops immediately** | Terminal errors (`CARD_EXPIRED`) halt without retry | ✅ |
| **Execution outcome** | Returns structured outcome strings (`EXECUTED`, `FAILED_PERMANENT`, etc.) | ✅ |
| **Attempts tracking** | Accurately counts physical gateway interaction attempts | ✅ |
| **Recovery tracking** | Distinguishes recovered transactions from total failures | ✅ |
| **Recovered revenue metrics** | Quantifies total revenue saved and recovery percentage | ✅ |
| **Python → Go integration** | Python pipeline dispatches commands over HTTP to Go executor | ✅ |
| **Go → PostgreSQL** | Go engine maintains database transactions and audits | ✅ |
| **Go → Gateway** | Interacts with simulated bank gateway with realistic failure modes | ✅ |
| **Full E2E** | Python client to Go daemon to database and gateway verified | ✅ |
| **Full Go test suite** | 48 unit and integration tests passing in ~4s | ✅ |

> **Key Architectural Boundary:**  
> `AI recommends ──► Policy authorizes ──► Go executes`  
> *The machine learning model never gets direct access to money-moving execution.*

---

## V2 Target Architecture: Event-Driven Recovery Platform

To scale beyond synchronous HTTP to handle **10,000 to 100,000 failed payments/second** during flash sales and banking outages:

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

### V2 Core Distributed Concepts
- **Kafka Partitioning**: Partition by `customer_id` / `merchant_id` for in-order processing.
- **Consumer Groups & At-Least-Once Delivery**: Resilient async worker pools.
- **Idempotent Consumers**: Deduplication via Redis distributed locks & PostgreSQL constraints.
- **Concurrent Go Worker Pools**: Tunable worker pools with backpressure and rate limiting.
- **Circuit Breakers & DLQs**: Protect downstream bank gateways during cascading outages.
- **Scale Progression**: 10 → 100 → 1,000 → 10,000 → 100,000 payments/sec preserving zero duplicate executions.

---

## Engineering Reports & Benchmarks
- [V2.5 Event Idempotency Specification (Dual-Layer Ingestion & Execution)](docs/V2_5_EVENT_IDEMPOTENCY.md)
- [V2 Architecture Roadmap (Event-Driven Recovery Platform)](docs/V2_ARCHITECTURE_ROADMAP.md)
- [Benchmark & Performance Tracking (3-Way Multi-Seed Analysis)](docs/BENCHMARKS.md)
- [2026-09-02 Engineering Day Report (V1 Go Execution Service)](docs/2026-09-02-v1-go-execution-day-report.md)
- [2026-09-03 Session Report (Post-Execution Audit, Vectorization, 3-Way Experiments, Model Retraining)](docs/2026-09-03-session-report.md)


