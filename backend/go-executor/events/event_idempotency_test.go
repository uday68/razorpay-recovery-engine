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
