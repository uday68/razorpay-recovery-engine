package events

import (
	"encoding/json"
	"testing"
	"time"
)

func TestPaymentFailedEventContract(t *testing.T) {
	payload := `{
		"event_id": "evt-001",
		"event_type": "PAYMENT_FAILED",
		"payment_id": "pay-001",
		"customer_id": "cust-001",
		"amount": 5000,
		"payment_method": "UPI",
		"bank": "HDFC",
		"failure_code": "BANK_TIMEOUT",
		"timestamp": "2026-09-03T16:30:00Z"
	}`

	var event PaymentFailedEvent

	err := json.Unmarshal([]byte(payload), &event)
	if err != nil {
		t.Fatalf("failed to decode event: %v", err)
	}

	if event.EventID != "evt-001" {
		t.Fatalf("unexpected event_id: %s", event.EventID)
	}

	if event.EventType != "PAYMENT_FAILED" {
		t.Fatalf("unexpected event_type: %s", event.EventType)
	}

	if event.PaymentID != "pay-001" {
		t.Fatalf("unexpected payment_id: %s", event.PaymentID)
	}

	if event.CustomerID != "cust-001" {
		t.Fatalf("unexpected customer_id: %s", event.CustomerID)
	}

	if event.Amount != 5000 {
		t.Fatalf("unexpected amount: %v", event.Amount)
	}

	if event.PaymentMethod != "UPI" {
		t.Fatalf("unexpected payment_method: %s", event.PaymentMethod)
	}

	if event.Bank != "HDFC" {
		t.Fatalf("unexpected bank: %s", event.Bank)
	}

	if event.FailureCode != "BANK_TIMEOUT" {
		t.Fatalf("unexpected failure_code: %s", event.FailureCode)
	}

	if event.Timestamp.IsZero() {
		t.Fatal("timestamp should not be zero")
	}
}
func TestPaymentFailedEventValidation(t *testing.T) {
	valid := PaymentFailedEvent{
		EventID:       "evt-valid-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-001",
		CustomerID:    "cust-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		Timestamp:     time.Now(),
	}

	tests := []struct {
		name  string
		event PaymentFailedEvent
	}{
		{
			name: "missing event id",
			event: func() PaymentFailedEvent {
				e := valid
				e.EventID = ""
				return e
			}(),
		},
		{
			name: "invalid event type",
			event: func() PaymentFailedEvent {
				e := valid
				e.EventType = "PAYMENT_SUCCESS"
				return e
			}(),
		},
		{
			name: "missing payment id",
			event: func() PaymentFailedEvent {
				e := valid
				e.PaymentID = ""
				return e
			}(),
		},
		{
			name: "missing customer id",
			event: func() PaymentFailedEvent {
				e := valid
				e.CustomerID = ""
				return e
			}(),
		},
		{
			name: "invalid amount",
			event: func() PaymentFailedEvent {
				e := valid
				e.Amount = 0
				return e
			}(),
		},
		{
			name: "missing failure code",
			event: func() PaymentFailedEvent {
				e := valid
				e.FailureCode = ""
				return e
			}(),
		},
		{
			name: "missing timestamp",
			event: func() PaymentFailedEvent {
				e := valid
				e.Timestamp = time.Time{}
				return e
			}(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := ValidatePaymentFailedEvent(tt.event); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}

	if err := ValidatePaymentFailedEvent(valid); err != nil {
		t.Fatalf("valid event should pass validation: %v", err)
	}
}
