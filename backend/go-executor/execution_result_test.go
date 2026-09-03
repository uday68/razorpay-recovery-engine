package main

import (
	"testing"
	"time"
)

func TestExecutionResultTracksAttempts(t *testing.T) {
	gateway := &SequenceGateway{
		results: []GatewayResult{
			{
				Status:    "FAILED",
				ErrorCode: "GATEWAY_TIMEOUT",
			},
			{
				Status: "SUCCESS",
			},
		},
	}

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		func(_ time.Duration) {},
	)

	result := executor.ExecuteWithMetadata(RecoveryCommand{
		CommandID: "metadata-001",
		PaymentID: "payment-001",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Attempts != 2 {
		t.Fatalf("expected 2 attempts, got %d", result.Attempts)
	}

	if result.Outcome != "EXECUTED" {
		t.Fatalf("expected EXECUTED, got %s", result.Outcome)
	}

	if result.Amount != 1000 {
		t.Fatalf("expected amount 1000, got %f", result.Amount)
	}
}
