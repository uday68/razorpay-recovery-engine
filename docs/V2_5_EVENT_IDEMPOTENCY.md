# V2.5 — Idempotent Event Consumption

## 1. The Distributed Failure Scenario: At-Least-Once Redelivery

In an event-driven architecture using Kafka, message delivery is strictly **at-least-once**. Consider what happens during an unexpected worker crash or network partition:

```text
               Kafka Topic: recovery.payment.failed
                                │
                                ▼
                       Consumer: FetchMessage
                                │
                                ▼
                           event_id: evt-001
                                │
                                ▼
                         Decision Engine
                                │
                                ▼
                        RecoveryCommand
                                │
                                ▼
                       Go Executor executes
                       (Money has been moved!)
                                │
                                ▼
                    💥 Crash before Kafka Commit!
                                │
                                ▼
                  Consumer Restarts / Rebalances
                                │
                                ▼
                 Kafka Redelivers evt-001 🚨
```

### The Catastrophic Failure Without Event Idempotency
Without protection at the event boundary:
1. `evt-001` is fetched again by another worker.
2. Decision engine runs again.
3. Another recovery command is constructed.
4. If command deduplication is bypassed or tied to new command IDs, money is moved twice.

---

## 2. The Desired Architecture: Two IDs, Two Responsibilities

To achieve bulletproof financial correctness, we decouple event ingestion from money movement by establishing **two distinct idempotency layers**:

```text
Kafka Event
     │
     ▼
Event ID (evt-xxx)
     │
     ▼
Event Idempotency Store
     │
     ├── ALREADY PROCESSED ──► ACK/COMMIT ──► STOP (Safe No-Op)
     │
     └── NEW EVENT
            ↓
       AI / Decision
            ↓
       RecoveryCommand (cmd-xxx)
            ↓
       Command Idempotency Store
            ↓
       Gateway Execution
            ↓
       Commit Kafka Offset
```

### Dual-Layer Responsibility Matrix

| Identifier | Level | Invariant Enforced | Responsibility |
| :--- | :--- | :--- | :--- |
| **`event_id`** | Ingestion Boundary | Exactly-once event handling | Prevents duplicate event processing & redundant AI model computation |
| **`command_id`** | Execution Boundary | Exactly-once financial execution | Prevents duplicate physical money-moving gateway requests |

---

## 3. Storage Strategy: PostgreSQL First, Redis Fast-Path Next

1. **Phase 1 (PostgreSQL Deduplication)**:
   - Uses atomic `INSERT INTO event_idempotency (event_id) ON CONFLICT DO NOTHING` locks.
   - Survives complete container and worker node restarts.
   - Leverages existing ACID transactions and connection pools.

2. **Phase 2 (Redis Fast-Path Distributed Caching)**:
   - Sub-millisecond distributed lock / key-value deduplication (`SET NX EX 86400`).
   - Relieves PostgreSQL lock contention at hyper-scale (10,000+ events/sec).
   - PostgreSQL remains the permanent historical ledger.

---

## 4. RED Test Contract (`TestEventIdempotency`)

Located at: [`backend/go-executor/events/event_idempotency_test.go`](file:///d:/razorpay-recovery-engine/backend/go-executor/events/event_idempotency_test.go)

```go
package events

import "testing"

func TestEventIdempotency(t *testing.T) {
	store := NewEventStore()

	eventID := "evt-idempotency-001"

	first, err := store.Claim(eventID)
	if err != nil {
		t.Fatalf("first claim failed: %v", err)
	}

	if !first {
		t.Fatal("first event claim should succeed")
	}

	second, err := store.Claim(eventID)
	if err != nil {
		t.Fatalf("second claim failed: %v", err)
	}

	if second {
		t.Fatal("duplicate event should not be claimed")
	}
}
```

### Test Output (🔴 RED Confirmed)
```powershell
PS D:\razorpay-recovery-engine\backend\go-executor> go test ./events -run TestEventIdempotency -v
# recovery-executor/events [recovery-executor/events.test]
events\event_idempotency_test.go:6:11: undefined: NewEventStore
FAIL	recovery-executor/events [build failed]
FAIL
```

