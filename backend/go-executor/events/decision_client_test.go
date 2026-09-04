package events

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestDecisionClientProcessesPaymentFailedEvent(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}

		if r.URL.Path != "/v1/recovery/decide" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("failed to read request body: %v", err)
		}

		var received PaymentFailedEvent
		if err := json.Unmarshal(body, &received); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}

		if received.SuccessRate != 0.80 {
			t.Fatalf(
				"expected success_rate 0.80, got %v",
				received.SuccessRate,
			)
		}

		if received.RecoveryRate != 0.50 {
			t.Fatalf(
				"expected recovery_rate 0.50, got %v",
				received.RecoveryRate,
			)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		_, _ = w.Write([]byte(`{
			"payment_id": "pay-decision-001",
			"action": "RETRY_LATER",
			"expected_value": 3248,
			"probability": 0.65
		}`))
	}))

	defer server.Close()

	client := NewDecisionClient(server.URL)

	event := PaymentFailedEvent{
		EventID:       "evt-decision-001",
		EventType:     "PAYMENT_FAILED",
		PaymentID:     "pay-decision-001",
		CustomerID:    "cust-decision-001",
		Amount:        5000,
		PaymentMethod: "UPI",
		Bank:          "HDFC",
		FailureCode:   "BANK_TIMEOUT",
		Timestamp:     time.Now().UTC(),
		SuccessRate:   0.80,
		RecoveryRate:  0.50,
	}

	result, err := client.Decide(event)
	if err != nil {
		t.Fatalf("decision request failed: %v", err)
	}

	if result.PaymentID != event.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			event.PaymentID,
			result.PaymentID,
		)
	}

	if result.Action != "RETRY_LATER" {
		t.Fatalf(
			"expected RETRY_LATER, got %s",
			result.Action,
		)
	}

	if result.ExpectedValue != 3248 {
		t.Fatalf(
			"expected expected_value 3248, got %v",
			result.ExpectedValue,
		)
	}

	if result.Probability != 0.65 {
		t.Fatalf(
			"expected probability 0.65, got %v",
			result.Probability,
		)
	}
}
