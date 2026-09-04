package main

import "testing"

type countingGateway struct {
	calls int
}

func (g *countingGateway) Execute(command RecoveryCommand) (GatewayResult, error) {
	g.calls++

	return GatewayResult{
		PaymentID: command.PaymentID,
		Action:    command.Action,
		Status:    "SUCCESS",
		Retryable: false,
	}, nil
}

func TestCircuitBreakerStopsGatewayExecutionWhenOpen(t *testing.T) {
	gateway := &countingGateway{}
	breaker := NewCircuitBreaker(1)

	breaker.RecordFailure()

	command := RecoveryCommand{
		CommandID: "cmd-circuit-001",
		PaymentID: "pay-circuit-001",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	executor := NewCircuitBreakerGateway(
		breaker,
		gateway,
	)

	_, err := executor.Execute(command)

	if err == nil {
		t.Fatal("expected circuit-open execution error")
	}

	if gateway.calls != 0 {
		t.Fatalf(
			"expected gateway not to be called, got %d calls",
			gateway.calls,
		)
	}
}
