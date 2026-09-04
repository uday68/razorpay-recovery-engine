package events

import "time"

type PaymentFailedEvent struct {
	EventID       string    `json:"event_id"`
	EventType     string    `json:"event_type"`
	PaymentID     string    `json:"payment_id"`
	CustomerID    string    `json:"customer_id"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"payment_method"`
	Bank          string    `json:"bank"`
	FailureCode   string    `json:"failure_code"`
	Timestamp     time.Time `json:"timestamp"`
	SuccessRate   float64   `json:"success_rate"`
	RecoveryRate  float64   `json:"recovery_rate"`
}
