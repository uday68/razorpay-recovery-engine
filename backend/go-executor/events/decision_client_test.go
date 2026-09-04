package events

import (
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
