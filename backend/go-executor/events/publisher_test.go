package events

import "testing"

func TestEventPublisherPublishesPaymentFailedEvent(t *testing.T) {
	publisher := NewMemoryPublisher()

	event := PaymentFailedEvent{
		EventID:       "evt-publish-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-publish-001",
		CustomerID:    "cust-publish-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
	}

	err := publisher.Publish(event)
	if err != nil {
		t.Fatalf("publish failed: %v", err)
	}

	if publisher.Count() != 1 {
		t.Fatalf(
			"expected 1 published event, got %d",
			publisher.Count(),
		)
	}

	published := publisher.Events()[0]

	if published.EventID != event.EventID {
		t.Fatalf(
			"expected event_id %s, got %s",
			event.EventID,
			published.EventID,
		)
	}

	if published.PaymentID != event.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			event.PaymentID,
			published.PaymentID,
		)
	}
}
