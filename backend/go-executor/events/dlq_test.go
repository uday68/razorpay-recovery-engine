package events

import "testing"

func TestDeadLetterQueueStoresFailedEvent(t *testing.T) {
	dlq := NewDeadLetterQueue()

	event := PaymentFailedEvent{
		EventID:       "evt-dlq-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-dlq-001",
		CustomerID:    "cust-dlq-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
	}

	err := dlq.Push(event, "processing failed")
	if err != nil {
		t.Fatalf("failed to push event to DLQ: %v", err)
	}

	if dlq.Count() != 1 {
		t.Fatalf("expected 1 DLQ event, got %d", dlq.Count())
	}

	item, ok := dlq.Pop()
	if !ok {
		t.Fatal("expected DLQ item")
	}

	if item.Event.EventID != event.EventID {
		t.Fatalf(
			"expected event_id %s, got %s",
			event.EventID,
			item.Event.EventID,
		)
	}

	if item.Reason != "processing failed" {
		t.Fatalf(
			"expected reason %q, got %q",
			"processing failed",
			item.Reason,
		)
	}
}
