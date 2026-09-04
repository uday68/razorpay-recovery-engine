package events

import (
	"testing"
	"time"
)

type fakeDecisionClient struct {
	called bool
	event  PaymentFailedEvent
	result DecisionResult
}

func (c *fakeDecisionClient) Decide(event PaymentFailedEvent) (DecisionResult, error) {
	c.called = true
	c.event = event

	return c.result, nil
}

func TestRecoveryProcessorCallsDecisionService(t *testing.T) {
	client := &fakeDecisionClient{
		result: DecisionResult{
			PaymentID:     "pay-processor-001",
			Action:        "RETRY_LATER",
			Probability:   0.65,
			ExpectedValue: 3248,
		},
	}

	processor := NewDecisionRecoveryProcessor(client)

	event := PaymentFailedEvent{
		EventID:       "evt-processor-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-processor-001",
		CustomerID:    "cust-processor-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
		Timestamp:     time.Now().UTC(),
	}

	result, err := processor.Process(event)
	if err != nil {
		t.Fatalf("processor failed: %v", err)
	}

	if !client.called {
		t.Fatal("expected decision service to be called")
	}

	if client.event.EventID != event.EventID {
		t.Fatalf(
			"expected event_id %s, got %s",
			event.EventID,
			client.event.EventID,
		)
	}

	if result.Action != "RETRY_LATER" {
		t.Fatalf(
			"expected RETRY_LATER, got %s",
			result.Action,
		)
	}
}
