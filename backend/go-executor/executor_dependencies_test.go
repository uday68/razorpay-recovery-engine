package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHandlerUsesInjectedRetryExecutor(t *testing.T) {
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

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		func(_ time.Duration) {},
	)

	handler := executeRecoveryHandlerWithExecutor(store, executor)

	body := `{
		"command_id": "dependency-001",
		"payment_id": "payment-dependency",
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

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	if gateway.calls != 2 {
		t.Fatalf("expected injected executor to make 2 attempts, got %d", gateway.calls)
	}
}
