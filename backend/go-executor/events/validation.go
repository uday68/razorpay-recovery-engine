package events

import (
	"fmt"
)

func ValidatePaymentFailedEvent(event PaymentFailedEvent) error {
	if event.EventID == "" {
		return fmt.Errorf("event_id is required")
	}

	if event.EventType != "PAYMENT_FAILED" {
		return fmt.Errorf("event_type must be PAYMENT_FAILED")
	}

	if event.PaymentID == "" {
		return fmt.Errorf("payment_id is required")
	}

	if event.CustomerID == "" {
		return fmt.Errorf("customer_id is required")
	}

	if event.Amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}

	if event.FailureCode == "" {
		return fmt.Errorf("failure_code is required")
	}

	if event.Timestamp.IsZero() {
		return fmt.Errorf("timestamp is required")
	}

	return nil
}
