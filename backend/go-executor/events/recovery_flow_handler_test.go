package events

import (
	"testing"
	"time"
)

func TestRecoveryFlowHandlerProcessesEvent(t *testing.T) {
	eventStore := NewEventStore()
	decisioner := &flowDecisioner{}
	executor := &flowExecutor{}

	flow := NewRecoveryFlow(
		eventStore,
		decisioner,
		executor,
	)

	handler := NewRecoveryFlowHandler(flow)

	event := PaymentFailedEvent{
		EventID:       "evt-handler-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-handler-001",
		CustomerID:    "cust-handler-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
		Timestamp:     time.Now().UTC(),
	}

	err := handler.Handle(event)
	if err != nil {
		t.Fatalf("handler failed: %v", err)
	}

	if decisioner.calls != 1 {
		t.Fatalf(
			"expected decisioner to be called once, got %d",
			decisioner.calls,
		)
	}

	if executor.calls != 1 {
		t.Fatalf(
			"expected executor to be called once, got %d",
			executor.calls,
		)
	}
}
