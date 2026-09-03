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
func TestExecutionResultRepresentsSuccessfulRecovery(t *testing.T) {
	result := ExecutionResult{
		FinalResult: GatewayResult{
			Status: "SUCCESS",
		},
		Attempts:  2,
		Recovered: true,
		Retryable: false,
		Outcome:   "EXECUTED",
		Amount:    5000,
	}

	if !result.Recovered {
		t.Fatal("successful recovery must be marked recovered")
	}

	if result.Attempts != 2 {
		t.Fatalf("expected 2 attempts, got %d", result.Attempts)
	}

	if result.Retryable {
		t.Fatal("successful recovery must not be retryable")
	}

	if result.Outcome != "EXECUTED" {
		t.Fatalf("expected EXECUTED outcome, got %s", result.Outcome)
	}
}
func TestExecutionResultRepresentsPermanentFailure(t *testing.T) {
	result := ExecutionResult{
		FinalResult: GatewayResult{
			Status:      "FAILED",
			ErrorCode:   "CARD_EXPIRED",
			FailureType: "PERMANENT",
		},
		Attempts:  1,
		Recovered: false,
		Retryable: false,
		Outcome:   "FAILED",
		Amount:    5000,
	}

	if result.Recovered {
		t.Fatal("permanent failure must not be recovered")
	}

	if result.Retryable {
		t.Fatal("permanent failure must not be retryable")
	}

	if result.Outcome != "FAILED" {
		t.Fatalf("expected FAILED outcome, got %s", result.Outcome)
	}
}
