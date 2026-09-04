package main

import (
	"testing"
	"time"
)

type alwaysFailingRetryableGateway struct {
	calls int
}

func (g *alwaysFailingRetryableGateway) Execute(
	command RecoveryCommand,
) (GatewayResult, error) {
	g.calls++

	return GatewayResult{
		PaymentID:   command.PaymentID,
		Action:      command.Action,
		Status:      "FAILED",
		ErrorCode:   "GATEWAY_TIMEOUT",
		FailureType: "TRANSIENT",
		Retryable:   true,
	}, nil
}

func TestRetryExecutorUsesCircuitBreakerGateway(t *testing.T) {
	rawGateway := &alwaysFailingRetryableGateway{}
	breaker := NewCircuitBreaker(2)

	gateway := NewCircuitBreakerGateway(
		breaker,
		rawGateway,
	)

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(1),
		func(time.Duration) {},
	)

	command := RecoveryCommand{
		CommandID: "cmd-breaker-retry-001",
		PaymentID: "pay-breaker-retry-001",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	result := executor.ExecuteWithMetadata(command)

	if rawGateway.calls > 2 {
		t.Fatalf(
			"expected circuit breaker to limit gateway calls to at most 2, got %d",
			rawGateway.calls,
		)
	}

	if result.Recovered {
		t.Fatal("expected recovery to fail")
	}
}
