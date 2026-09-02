package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestExecuteRecovery(t *testing.T) {
	body := `{
		"command_id": "cmd-123",
		"payment_id": "payment-123",
		"action": "RETRY_LATER",
		"amount": 5000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()

	handler := executeRecoveryHandler()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	response := rec.Body.String()

	if !strings.Contains(response, `"command_id":"cmd-123"`) {
		t.Fatalf("response missing command_id: %s", response)
	}

	if !strings.Contains(response, `"payment_id":"payment-123"`) {
		t.Fatalf("response missing payment_id: %s", response)
	}

	if !strings.Contains(response, `"status":"EXECUTED"`) {
		t.Fatalf("response missing EXECUTED status: %s", response)
	}
}
func TestExecuteRecoveryIsIdempotent(t *testing.T) {
	body := `{
		"command_id": "cmd-idempotent",
		"payment_id": "payment-idempotent",
		"action": "RETRY_LATER",
		"amount": 5000
	}`

	handler := executeRecoveryHandler()

	// First request
	req1 := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec1 := httptest.NewRecorder()

	handler.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Fatalf("first request: expected 200, got %d", rec1.Code)
	}

	if !strings.Contains(rec1.Body.String(), `"status":"EXECUTED"`) {
		t.Fatalf("first request should execute: %s", rec1.Body.String())
	}

	// Same command again
	req2 := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec2 := httptest.NewRecorder()

	handler.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("second request: expected 200, got %d", rec2.Code)
	}

	if !strings.Contains(rec2.Body.String(), `"status":"DUPLICATE"`) {
		t.Fatalf("second request should be duplicate: %s", rec2.Body.String())
	}
}
func TestExecuteRecoveryWithPostgresIdempotency(t *testing.T) {
	store, err := NewPostgresCommandStore(
		"postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable",
	)

	if err != nil {
		t.Fatalf("failed to create store: %v", err)
	}
	defer store.Close()

	commandID := "http-postgres-test-001"

	if err := store.Delete(commandID); err != nil {
		t.Fatalf("failed to clean test command: %v", err)
	}

	handler := executeRecoveryHandlerWithStore(store)

	body := `{
		"command_id": "http-postgres-test-001",
		"payment_id": "payment-postgres-test-001",
		"action": "RETRY_LATER",
		"amount": 5000
	}`

	req1 := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)

	if !strings.Contains(rec1.Body.String(), `"status":"EXECUTED"`) {
		t.Fatalf("first request should execute: %s", rec1.Body.String())
	}

	req2 := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)

	if !strings.Contains(rec2.Body.String(), `"status":"DUPLICATE"`) {
		t.Fatalf("second request should be duplicate: %s", rec2.Body.String())
	}

	if err := store.Delete(commandID); err != nil {
		t.Fatalf("failed to clean up: %v", err)
	}
}
func TestExecuteRecoveryReturnsGatewayOutcome(t *testing.T) {
	handler := executeRecoveryHandler()

	body := `{
		"command_id": "gateway-outcome-001",
		"payment_id": "payment-gateway-outcome-001",
		"action": "RETRY_LATER",
		"amount": 5000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	response := rec.Body.String()

	if !strings.Contains(response, `"status"`) {
		t.Fatalf("response missing status: %s", response)
	}

	if !strings.Contains(response, `"recovered"`) {
		t.Fatalf("response missing recovered field: %s", response)
	}
}
func TestExecuteRecoveryReturnsGatewayFailure(t *testing.T) {
	gateway := &FakeGateway{
		result: GatewayResult{
			PaymentID: "payment-gateway-failure-001",
			Action:    "RETRY_LATER",
			Status:    "FAILED",
			ErrorCode: "BANK_TIMEOUT",
			Retryable: true,
		},
	}

	handler := executeRecoveryHandlerWithDependencies(
		NewCommandStore(),
		gateway,
	)

	body := `{
		"command_id": "gateway-failure-001",
		"payment_id": "payment-gateway-failure-001",
		"action": "RETRY_LATER",
		"amount": 5000
	}`

	req := httptest.NewRequest(
		http.MethodPost,
		"/v1/recovery/execute",
		strings.NewReader(body),
	)

	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	response := rec.Body.String()

	if !strings.Contains(response, `"status":"FAILED"`) {
		t.Fatalf("expected FAILED status: %s", response)
	}

	if !strings.Contains(response, `"recovered":false`) {
		t.Fatalf("expected recovered=false: %s", response)
	}
}
