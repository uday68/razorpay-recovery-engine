package main

import (
	"errors"
	"testing"
	"time"
)

type InfrastructureGatewayResult struct {
	result GatewayResult
	err    error
}

type InfrastructureSequenceGateway struct {
	results []InfrastructureGatewayResult
	calls   int
}

func (g *InfrastructureSequenceGateway) Execute(
	command RecoveryCommand,
) (GatewayResult, error) {
	current := g.results[g.calls]
	g.calls++

	return current.result, current.err
}

type InfrastructureErrorGateway struct {
	err error
}

func (g *InfrastructureErrorGateway) Execute(
	command RecoveryCommand,
) (GatewayResult, error) {
	return GatewayResult{}, g.err
}

type SequenceGateway struct {
	results []GatewayResult
	calls   int
}

func (g *SequenceGateway) Execute(command RecoveryCommand) (GatewayResult, error) {
	result := g.results[g.calls]
	g.calls++

	return result, nil
}

func TestRetryExecutorRetriesTransientFailure(t *testing.T) {
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

	executor := NewRetryExecutor(gateway, 3)

	result := executor.Execute(RecoveryCommand{
		CommandID: "retry-001",
		PaymentID: "payment-001",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Status != "SUCCESS" {
		t.Fatalf("expected SUCCESS, got %s", result.Status)
	}

	if gateway.calls != 2 {
		t.Fatalf("expected 2 gateway calls, got %d", gateway.calls)
	}
}

func TestRetryExecutorStopsOnPermanentFailure(t *testing.T) {
	gateway := &SequenceGateway{
		results: []GatewayResult{
			{
				Status:    "FAILED",
				ErrorCode: "CARD_EXPIRED",
			},
		},
	}

	executor := NewRetryExecutor(gateway, 3)

	result := executor.Execute(RecoveryCommand{
		CommandID: "retry-002",
		PaymentID: "payment-002",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Status != "FAILED" {
		t.Fatalf("expected FAILED, got %s", result.Status)
	}

	if gateway.calls != 1 {
		t.Fatalf("expected 1 gateway call, got %d", gateway.calls)
	}
}

func TestRetryExecutorRespectsMaximumAttempts(t *testing.T) {
	gateway := &SequenceGateway{
		results: []GatewayResult{
			{
				Status:    "FAILED",
				ErrorCode: "GATEWAY_TIMEOUT",
			},
			{
				Status:    "FAILED",
				ErrorCode: "GATEWAY_TIMEOUT",
			},
			{
				Status:    "FAILED",
				ErrorCode: "GATEWAY_TIMEOUT",
			},
		},
	}

	executor := NewRetryExecutor(gateway, 3)

	result := executor.Execute(RecoveryCommand{
		CommandID: "retry-003",
		PaymentID: "payment-003",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Status != "FAILED" {
		t.Fatalf("expected FAILED, got %s", result.Status)
	}

	if gateway.calls != 3 {
		t.Fatalf("expected exactly 3 attempts, got %d", gateway.calls)
	}
}

func TestRetryExecutionUsesBackoffBeforeRetry(t *testing.T) {
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
	var delays []time.Duration
	sleep := func(delay time.Duration) {
		delays = append(delays, delay)
	}

	executor := NewRetryExecutorWithBackoff(
		gateway, 3, NewBackoffPolicy(100), sleep,
	)
	result := executor.Execute(RecoveryCommand{
		CommandID: "backoff-001",
		PaymentID: "payment-001",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Status != "SUCCESS" {
		t.Fatalf("expected SUCCESS, got %s", result.Status)
	}

	if len(delays) != 1 {
		t.Fatalf("expected 1 sleep, got %d", len(delays))
	}

	if delays[0] < 100*time.Millisecond {
		t.Fatalf("expected delay >= 100ms, got %v", delays[0])
	}
}

func TestRetryExecutorCapsMaximumAttempts(t *testing.T) {
	gateway := &SequenceGateway{
		results: []GatewayResult{
			{Status: "FAILED", ErrorCode: "GATEWAY_TIMEOUT"},
			{Status: "FAILED", ErrorCode: "GATEWAY_TIMEOUT"},
			{Status: "FAILED", ErrorCode: "GATEWAY_TIMEOUT"},
			{Status: "FAILED", ErrorCode: "GATEWAY_TIMEOUT"},
			{Status: "FAILED", ErrorCode: "GATEWAY_TIMEOUT"},
		},
	}

	executor := NewRetryExecutorWithBackoff(
		gateway,
		100,
		NewBackoffPolicy(100),
		func(_ time.Duration) {},
	)

	result := executor.Execute(RecoveryCommand{
		CommandID: "retry-cap-001",
		PaymentID: "payment-cap-001",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if gateway.calls > 3 {
		t.Fatalf(
			"expected maximum 3 attempts, got %d",
			gateway.calls,
		)
	}

	if result.Status != "FAILED" {
		t.Fatalf("expected FAILED, got %s", result.Status)
	}
}
func TestRetryExecutorStopsOnUnknownFailure(t *testing.T) {
	gateway := &SequenceGateway{
		results: []GatewayResult{
			{
				Status:    "FAILED",
				ErrorCode: "SOMETHING_UNEXPECTED",
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

	result := executor.Execute(RecoveryCommand{
		CommandID: "unknown-001",
		PaymentID: "payment-unknown",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Status != "FAILED" {
		t.Fatalf("expected FAILED, got %s", result.Status)
	}

	if gateway.calls != 1 {
		t.Fatalf(
			"expected exactly 1 attempt for unknown failure, got %d",
			gateway.calls,
		)
	}
}
func TestRetryExecutorReturnsExecutorError(t *testing.T) {
	gateway := &InfrastructureErrorGateway{
		err: errors.New("gateway unavailable"),
	}

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		func(_ time.Duration) {},
	)

	result := executor.ExecuteWithMetadata(RecoveryCommand{
		CommandID: "infra-error-001",
		PaymentID: "payment-infra",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Outcome != "EXECUTOR_ERROR" {
		t.Fatalf(
			"expected EXECUTOR_ERROR, got %s",
			result.Outcome,
		)
	}

	if result.Attempts != 1 {
		t.Fatalf(
			"expected 1 attempt, got %d",
			result.Attempts,
		)
	}

	if result.Recovered {
		t.Fatal("executor error must not be marked recovered")
	}
}

func TestRetryExecutorRetriesInfrastructureError(t *testing.T) {
	gateway := &InfrastructureSequenceGateway{
		results: []InfrastructureGatewayResult{
			{
				err: errors.New("gateway timeout"),
			},
			{
				result: GatewayResult{
					Status: "SUCCESS",
				},
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
		CommandID: "infra-retry-001",
		PaymentID: "payment-infra-retry",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Outcome != "EXECUTED" {
		t.Fatalf(
			"expected EXECUTED, got %s",
			result.Outcome,
		)
	}

	if result.Attempts != 2 {
		t.Fatalf(
			"expected 2 attempts, got %d",
			result.Attempts,
		)
	}

	if !result.Recovered {
		t.Fatal("expected recovery after infrastructure retry")
	}
}
func TestRetryExecutorMarksInfrastructureErrorNonRetryableAfterMaxAttempts(t *testing.T) {
	gateway := &InfrastructureSequenceGateway{
		results: []InfrastructureGatewayResult{
			{
				err: errors.New("gateway timeout"),
			},
			{
				err: errors.New("gateway timeout"),
			},
			{
				err: errors.New("gateway timeout"),
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
		CommandID: "infra-exhausted-001",
		PaymentID: "payment-infra-exhausted",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if result.Attempts != 3 {
		t.Fatalf("expected 3 attempts, got %d", result.Attempts)
	}

	if result.Recovered {
		t.Fatal("expected recovery to be false")
	}

	if result.Retryable {
		t.Fatal("expected retryable to be false after max attempts")
	}

	if result.Outcome != "EXECUTOR_ERROR" {
		t.Fatalf(
			"expected EXECUTOR_ERROR, got %s",
			result.Outcome,
		)
	}
}
