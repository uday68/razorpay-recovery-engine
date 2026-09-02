package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type RecoveryCommand struct {
	CommandID string  `json:"command_id"`
	PaymentID string  `json:"payment_id"`
	Action    string  `json:"action"`
	Amount    float64 `json:"amount"`
}

type RecoveryResponse struct {
	CommandID string `json:"command_id"`
	PaymentID string `json:"payment_id"`
	Status    string `json:"status"`
	Action    string `json:"action,omitempty"`
	Recovered bool   `json:"recovered,omitempty"`
}

func executeRecoveryHandler() http.Handler {
	return executeRecoveryHandlerWithStore(NewCommandStore())
}
func executeRecoveryHandlerWithStore(
	store CommandClaimer,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var command RecoveryCommand

		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		claimed, err := store.Claim(command.CommandID)

		if err != nil {
			http.Error(w, "idempotency store error", http.StatusInternalServerError)
			return
		}

		if !claimed {
			response := RecoveryResponse{
				CommandID: command.CommandID,
				PaymentID: command.PaymentID,
				Status:    "DUPLICATE",
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}

		log.Printf(
			"Executing recovery: payment_id=%s action=%s amount=%.2f",
			command.PaymentID,
			command.Action,
			command.Amount,
		)

		response := RecoveryResponse{
			CommandID: command.CommandID,
			PaymentID: command.PaymentID,
			Status:    "EXECUTED",
			Action:    command.Action,
			Recovered: true,
		}

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(response)
	})
}

func main() {
	databaseURL := "postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable"

	store, err := NewPostgresCommandStore(databaseURL)
	if err != nil {
		log.Fatalf("failed to initialize command store: %v", err)
	}
	defer store.Close()

	http.Handle(
		"/v1/recovery/execute",
		executeRecoveryHandlerWithStore(store),
	)

	log.Println("Go executor listening on :8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
