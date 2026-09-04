package events

import (
	"testing"
	"time"
)

type flowDecisioner struct {
	calls int
}

func (d *flowDecisioner) Decide(event PaymentFailedEvent) (DecisionResult, error) {
	d.calls++

	return DecisionResult{
		PaymentID:     event.PaymentID,
		Action:        "RETRY_LATER",
		Probability:   0.65,
		ExpectedValue: 3248,
	}, nil
}

type flowExecutor struct {
	calls int
}

func (e *flowExecutor) Execute(command RecoveryCommand) (ExecutionResult, error) {
	e.calls++

	return ExecutionResult{
		PaymentID: command.PaymentID,
		Recovered: true,
		Attempts:  1,
		Outcome:   "EXECUTED",
		Amount:    command.Amount,
	}, nil
}

func TestRecoveryFlowProcessesEventEndToEnd(t *testing.T) {
	eventStore := NewEventStore()

	decisioner := &flowDecisioner{}
	executor := &flowExecutor{}

	flow := NewRecoveryFlow(
		eventStore,
		decisioner,
		executor,
	)

	event := PaymentFailedEvent{
		EventID:       "evt-flow-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-flow-001",
		CustomerID:    "cust-flow-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
		Timestamp:     time.Now().UTC(),
	}

	result, err := flow.Process(event)
	if err != nil {
		t.Fatalf("recovery flow failed: %v", err)
	}

	if result.Command.PaymentID != event.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			event.PaymentID,
			result.Command.PaymentID,
		)
	}

	if result.Command.Action != "RETRY_LATER" {
		t.Fatalf(
			"expected RETRY_LATER, got %s",
			result.Command.Action,
		)
	}

	if !result.Execution.Recovered {
		t.Fatal("expected recovery to succeed")
	}

	if decisioner.calls != 1 {
		t.Fatalf(
			"expected decision service to be called once, got %d",
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
func TestRecoveryFlowIgnoresDuplicateEvent(t *testing.T) {
	eventStore := NewEventStore()

	decisioner := &flowDecisioner{}
	executor := &flowExecutor{}

	flow := NewRecoveryFlow(
		eventStore,
		decisioner,
		executor,
	)

	event := PaymentFailedEvent{
		EventID:       "evt-flow-duplicate-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-flow-duplicate-001",
		CustomerID:    "cust-flow-duplicate-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
		Timestamp:     time.Now().UTC(),
	}

	_, err := flow.Process(event)
	if err != nil {
		t.Fatalf("first processing failed: %v", err)
	}

	_, err = flow.Process(event)
	if err != nil {
		t.Fatalf("duplicate processing failed: %v", err)
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
