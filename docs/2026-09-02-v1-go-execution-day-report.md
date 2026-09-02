# Razorpay Recovery Engine

## Engineering Day Report

**Date:** 02-09-2026  
**Focus:** V1 Go Execution Service and Reliability Controls  
**Status:** Complete for the current V1 scope

## Executive Summary

The project moved from a Python-only recovery pipeline to a split decision-and-execution architecture. Python remains responsible for feature preparation, ML recommendations, policy authorization, and audit creation. A Go service now owns the HTTP execution boundary, command idempotency, gateway interaction, and structured gateway outcomes.

The governing principle is:

> **ML recommends. Policy authorizes. Execution executes.**

The ML model cannot independently move money or bypass the policy engine.

## Architecture Reached

```text
                    Python Decision Engine
                            |
                            | RecoveryCommand
                            v
                 +------------------------+
                 |    Go Executor API     |
                 |        :8080           |
                 +-----------+------------+
                             |
                        Idempotency
                             |
                             v
                    Recovery Gateway
                             |
                        Error Code
                             |
                             v
                   Failure Classifier
                         |       |
             TRANSIENT_FAILURE  PERMANENT_FAILURE
                         |       |
                         v       v
                    Retry Policy STOP
```

## Current Repository Structure

```text
razorpay-recovery-engine/
├── README.md
├── data.csv
├── ml/
│   ├── dataset.py              # Training dataset generation
│   ├── train.py                # Model training pipeline
│   ├── predict.py              # Model prediction helpers
│   ├── model_store.py          # Persisted model loading and saving
│   ├── data.csv
│   └── model.pkl
├── simulator/
│   ├── config.py               # Simulation constants
│   ├── generator.py            # Customers and payment generation
│   ├── models.py               # Customer and Payment models
│   ├── recovery.py             # Recovery ground-truth behavior
│   └── main.py
├── backend/
│   ├── recovery_pipeline.py    # Main orchestration boundary
│   ├── recovery_command.py     # Command creation and contract
│   ├── recovery_executor.py    # Python execution fallback
│   ├── go_executor_client.py   # Python-to-Go HTTP client
│   ├── audit.py                # Audit event creation
│   ├── audit_repository.py     # PostgreSQL audit and idempotency store
│   ├── decision/engine.py      # Expected-value action selection
│   ├── policy/engine.py        # Business authorization rules
│   ├── experiment.py           # Experiment orchestration
│   ├── controlled_experiment.py
│   ├── comparison.py
│   ├── baseline.py
│   ├── stability.py
│   └── go-executor/
│       ├── main.go             # HTTP API and dependency wiring
│       ├── gateway.go          # RecoveryGateway and simulated gateway
│       ├── idempotency.go      # In-memory command store
│       ├── postgres_store.go   # PostgreSQL command store
│       ├── failure_classifier.go
│       ├── retry_policy.go
│       ├── go.mod
│       └── *_test.go            # Go unit and handler tests
├── tests/                       # Python unit and integration tests
└── docs/                        # Engineering reports and project documentation
```

## Implemented Capabilities

### Python decision and policy path

- Generates synthetic failed-payment data and recovery outcomes.
- Trains and persists an ML model for action probabilities.
- Computes expected value across recovery actions.
- Applies business policy after the ML recommendation.
- Creates a `RecoveryCommand` containing command ID, payment ID, action, amount, and creation time.
- Sends commands to the Go executor through `GoExecutorClient` when configured.
- Retains the Python executor as a local fallback when no Go URL is configured.

### Go execution service

- Exposes `POST /v1/recovery/execute`.
- Decodes the recovery command contract and returns JSON responses.
- Supports dependency injection through `executeRecoveryHandlerWithDependencies` for deterministic tests.
- Provides an in-memory `CommandStore` for process-local idempotency.
- Provides `PostgresCommandStore` for restart-persistent idempotency.
- Uses an abstract `RecoveryGateway` so the real gateway can replace the simulator without changing handler flow.
- Returns structured gateway results with status, error code, failure type, and retryability.
- Includes a deterministic simulated gateway for repeatable tests.

### Reliability controls

- The same command ID is claimed at most once.
- PostgreSQL-backed claims survive executor restarts.
- Duplicate commands return `DUPLICATE` and do not execute again.
- Gateway timeouts classify as `TRANSIENT_FAILURE` and remain retryable.
- Permanent failures such as card expiry are not retryable.
- Unknown failures are conservatively treated as non-retryable.
- Failed gateway responses explicitly serialize `"recovered": false`.

## Contracts

### Recovery command

```json
{
  "command_id": "cmd-123",
  "payment_id": "payment-123",
  "action": "RETRY_LATER",
  "amount": 5000
}
```

### Successful execution response

```json
{
  "command_id": "cmd-123",
  "payment_id": "payment-123",
  "status": "EXECUTED",
  "action": "RETRY_LATER",
  "recovered": true
}
```

### Gateway failure response

```json
{
  "command_id": "cmd-123",
  "payment_id": "payment-123",
  "status": "FAILED",
  "action": "RETRY_LATER",
  "recovered": false
}
```

## What Was Proven

### Idempotency

```text
First command       -> EXECUTED
Same command again  -> DUPLICATE
Executor restart    -> command remains claimed in PostgreSQL
```

The uniqueness constraint and `INSERT ... ON CONFLICT DO NOTHING RETURNING` make the claim atomic across concurrent callers.

### Failure classification

```text
GATEWAY_TIMEOUT -> TRANSIENT_FAILURE -> retryable = true
CARD_EXPIRED    -> PERMANENT_FAILURE -> retryable = false
Unknown error   -> UNKNOWN           -> retryable = false
```

### Test coverage

- Python suite: 34 tests passing after isolating database-backed test identifiers.
- Go executor suite: passing with gateway, handler, idempotency, PostgreSQL store, classifier, and retry-policy coverage.
- Handler tests cover malformed requests, execution, duplicate commands, PostgreSQL idempotency, gateway outcomes, and explicit failed recovery responses.

## Git History for This Milestone

Recent repository history shows the project progression:

| Commit | Date | Milestone |
| --- | --- | --- |
| `7a07236` | 01-09-2026 | Initial repository commit |
| `5e561b0` | 02-09-2026 | Phase 1 V1 generator and dataset work |
| `2f6deaf` | 02-09-2026 | PostgreSQL audit record persistence |
| `6b139d1` | 02-09-2026 | Transition from V0.2 to the main Phase 1 line with idempotency work |
| `2e4da77` | 02-09-2026 | Initial project documentation and recovery command test |
| `602fb6a` | 02-09-2026 | V1.4 milestone: failed-payment flow, ML, decision engine, policy engine, recovery command, Python-to-Go HTTP integration, PostgreSQL, and Go executor |

The report records the Go gateway, failure classifier, retry policy, and their tests as the current working implementation associated with the V1.4 milestone.

## Engineering Lesson

A deterministic simulator still needs behavior-based tests. A test that assumes a particular command ID will fail or succeed can become invalid when the deterministic hash changes or when the command path is refactored. Tests should assert the contract they own, while implementation-specific outcome selection should be tested through controlled gateway fakes.

The same principle applies to persistence tests: fixed IDs in a shared PostgreSQL database make a second test run look like a production duplicate. Test identifiers must be unique or cleaned up explicitly.

## Current Boundary and Next Step

The current V1 foundation is complete. The next implementation step is **V1.4.6: integrate Gateway -> Classifier -> Retry Policy into the executor**.

That work should then extend the execution outcome through:

```text
Execution Outcome
        |
Retry Semantics
        |
Audit Actual Outcome
        |
Metrics
        |
Load and Reliability Testing
```

Kafka, Redis, observability infrastructure, and scale testing should be introduced only when a measured requirement justifies them.
