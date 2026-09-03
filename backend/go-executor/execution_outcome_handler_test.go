package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
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
