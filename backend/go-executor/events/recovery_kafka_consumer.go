package events

// Kafka Reader
//      ↓
// KafkaConsumer
//      ↓
// RecoveryFlowHandler
//      ↓
// RecoveryFlow
//      ├── Event Idempotency
//      ├── Decision
//      └── Execution
// The focused test is especially useful because Kafka is real, while the decision and execution dependencies remain controlled. That lets us isolate failures cleanly.

// Once this is green, we're at the point where we can stop testing pieces independently and run the real three-service path:
// Kafka
//   ↓
// Go Worker
//   ↓
// Python FastAPI
//   ↓
// ML + EV + Policy
//   ↓
// Go Executor
//   ↓
// PostgreSQL + Gateway

import "github.com/segmentio/kafka-go"

func NewRecoveryKafkaConsumer(
	reader *kafka.Reader,
	eventStore EventStoreClaimer,
	decisioner RecoveryDecisioner,
	executor CommandExecutor,
) *KafkaConsumer {
	flow := NewRecoveryFlow(
		eventStore,
		decisioner,
		executor,
	)

	handler := NewRecoveryFlowHandler(flow)

	return NewKafkaConsumer(
		reader,
		handler,
	)
}
