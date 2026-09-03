package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestExecuteRecoveryReturnsExecutionOutcome(t *testing.T) {
	store := NewCommandStore()

	gateway := &FakeGateway{
		result: GatewayResult{
			PaymentID: "payment-outcome",
			Action:    "RETRY_NOW",
			Status:    "FAILED",
			ErrorCode: "GATEWAY_TIMEOUT",
		},
	}

	handler := executeRecoveryHandlerWithDependencies(store, gateway)

	body := `{
		"command_id": "cmd-outcome-001",
		"payment_id": "payment-outcome",
		"action": "RETRY_NOW",
		"amount": 1000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	var response RecoveryResponse

	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}

	if response.Outcome != "FAILED_RETRYABLE" {
		t.Fatalf(
			"expected FAILED_RETRYABLE, got %s",
			response.Outcome,
		)
	}
}
func TestExecuteRecoveryReturnsAttemptCount(t *testing.T) {
	store := NewCommandStore()

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

	handler := executeRecoveryHandlerWithDependencies(store, gateway)

	body := `{
		"command_id": "cmd-attempts-001",
		"payment_id": "payment-attempts",
		"action": "RETRY_NOW",
		"amount": 1000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	var response RecoveryResponse

	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}

	if response.Attempts != 2 {
		t.Fatalf("expected 2 attempts, got %d", response.Attempts)
	}
}
func TestExecuteRecoveryReturnsExecutorErrorOutcome(t *testing.T) {
	store := NewCommandStore()

	gateway := &InfrastructureErrorGateway{
		err: errors.New("gateway unavailable"),
	}

	handler := executeRecoveryHandlerWithExecutor(
		store,
		NewRetryExecutorWithBackoff(
			gateway,
			3,
			NewBackoffPolicy(100),
			func(_ time.Duration) {},
		),
	)

	body := `{
		"command_id": "cmd-executor-error-001",
		"payment_id": "payment-executor-error",
		"action": "RETRY_NOW",
		"amount": 1000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	var response RecoveryResponse

	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}

	if response.Outcome != "EXECUTOR_ERROR" {
		t.Fatalf(
			"expected EXECUTOR_ERROR, got %s",
			response.Outcome,
		)
	}

	if response.Recovered {
		t.Fatal("executor error must not be recovered")
	}
}
func TestExecuteRecoveryRecordsMetrics(t *testing.T) {
	store := NewCommandStore()

	gateway := &FakeGateway{
		result: GatewayResult{
			PaymentID: "payment-metrics",
			Action:    "RETRY_NOW",
			Status:    "SUCCESS",
		},
	}

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		func(_ time.Duration) {},
	)

	metrics := NewRecoveryMetrics()

	handler := executeRecoveryHandlerWithExecutorAndMetrics(
		store,
		executor,
		metrics,
	)

	body := `{
		"command_id": "cmd-metrics-001",
		"payment_id": "payment-metrics",
		"action": "RETRY_NOW",
		"amount": 2500
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	snapshot := metrics.Snapshot()

	if snapshot.TotalExecutions != 1 {
		t.Fatalf(
			"expected 1 execution, got %d",
			snapshot.TotalExecutions,
		)
	}

	if snapshot.RecoveredRevenue != 2500 {
		t.Fatalf(
			"expected recovered revenue 2500, got %f",
			snapshot.RecoveredRevenue,
		)
	}
}
