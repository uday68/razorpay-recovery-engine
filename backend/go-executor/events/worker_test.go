package events

import (
	"testing"
	"time"
)

type recordingRecoveryProcessor struct {
	events []PaymentFailedEvent
}

func (p *recordingRecoveryProcessor) Process(event PaymentFailedEvent) error {
	p.events = append(p.events, event)
	return nil
}

func TestRecoveryWorkerProcessesPaymentFailedEvent(t *testing.T) {
	processor := &recordingRecoveryProcessor{}

	worker := NewRecoveryWorker(processor)

	event := PaymentFailedEvent{
		EventID:       "evt-worker-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-worker-001",
		CustomerID:    "cust-worker-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		Timestamp:     time.Now().UTC(),
	}

	err := worker.Process(event)
	if err != nil {
		t.Fatalf("worker processing failed: %v", err)
	}

	if len(processor.events) != 1 {
		t.Fatalf(
			"expected processor to receive 1 event, got %d",
			len(processor.events),
		)
	}

	if processor.events[0].EventID != event.EventID {
		t.Fatalf(
			"expected event_id %s, got %s",
			event.EventID,
			processor.events[0].EventID,
		)
	}
}
