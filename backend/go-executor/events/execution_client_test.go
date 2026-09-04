package events

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExecutionClientExecutesRecoveryCommand(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}

		if r.URL.Path != "/v1/recovery/execute" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}

		var command RecoveryCommand

		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
			t.Fatalf("failed to decode command: %v", err)
		}

		if command.CommandID != "cmd-execution-client-001" {
			t.Fatalf("unexpected command_id: %s", command.CommandID)
		}

		if command.PaymentID != "pay-execution-client-001" {
			t.Fatalf("unexpected payment_id: %s", command.PaymentID)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		_, _ = w.Write([]byte(`{
			"command_id": "cmd-execution-client-001",
			"payment_id": "pay-execution-client-001",
			"status": "SUCCESS",
			"recovered": true,
			"retryable": false,
			"outcome": "EXECUTED",
			"attempts": 1
		}`))
	}))

	defer server.Close()

	client := NewExecutionClient(server.URL)

	command := RecoveryCommand{
		CommandID: "cmd-execution-client-001",
		PaymentID: "pay-execution-client-001",
		Action:    "RETRY_LATER",
		Amount:    5000,
	}

	result, err := client.Execute(command)
	if err != nil {
		t.Fatalf("execution request failed: %v", err)
	}

	if result.PaymentID != command.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			command.PaymentID,
			result.PaymentID,
		)
	}

	if !result.Recovered {
		t.Fatal("expected recovered=true")
	}

	if result.Attempts != 1 {
		t.Fatalf("expected 1 attempt, got %d", result.Attempts)
	}

	if result.Outcome != "EXECUTED" {
		t.Fatalf("expected EXECUTED, got %s", result.Outcome)
	}

	if result.Amount != command.Amount {
		t.Fatalf(
			"expected amount %v, got %v",
			command.Amount,
			result.Amount,
		)
	}
}
