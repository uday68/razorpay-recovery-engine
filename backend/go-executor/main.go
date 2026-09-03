package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
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
	Recovered bool   `json:"recovered"`
	Retryable bool   `json:"retryable"`
	Outcome   string `json:"outcome,omitempty"`
	Attempts  int    `json:"attempts,omitempty"`
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
func executeRecoveryHandlerWithStoreAndMetrics(
	store CommandClaimer,
	metrics *RecoveryMetrics,
) http.Handler {
	gateway := NewSimulatedGateway()

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		time.Sleep,
	)

	return executeRecoveryHandlerWithExecutorAndMetrics(
		store,
		executor,
		metrics,
	)
}

func main() {
	databaseURL := "postgres://recovery:recovery@localhost:5432/recovery_engine?sslmode=disable"

	store, err := NewPostgresCommandStore(databaseURL)
	if err != nil {
		log.Fatalf("failed to initialize command store: %v", err)
	}
	defer store.Close()

	metrics := NewRecoveryMetrics()

	http.Handle(
		"/v1/recovery/execute",
		executeRecoveryHandlerWithStoreAndMetrics(store, metrics),
	)
	http.Handle(
		"/metrics",
		metricsHandler(metrics),
	)

	log.Println("Go executor listening on :8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
func executeRecoveryHandlerWithExecutor(
	store CommandClaimer,
	executor RecoveryExecutor,
) http.Handler {
	return executeRecoveryHandlerWithExecutorAndMetrics(
		store,
		executor,
		NewRecoveryMetrics(),
	)
}

// func executeRecoveryHandlerWithDependencies(
// 	store CommandClaimer,
// 	gateway RecoveryGateway,
// ) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		var command RecoveryCommand

// 		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
// 			http.Error(w, "invalid request", http.StatusBadRequest)
// 			return
// 		}

// 		claimed, err := store.Claim(command.CommandID)

// 		if err != nil {
// 			http.Error(
// 				w,
// 				"idempotency store error",
// 				http.StatusInternalServerError,
// 			)
// 			return
// 		}

// 		if !claimed {
// 			response := RecoveryResponse{
// 				CommandID: command.CommandID,
// 				PaymentID: command.PaymentID,
// 				Status:    "DUPLICATE",
// 			}

// 			w.Header().Set("Content-Type", "application/json")
// 			_ = json.NewEncoder(w).Encode(response)
// 			return
// 		}

// 		log.Printf(
// 			"Executing recovery: payment_id=%s action=%s amount=%.2f",
// 			command.PaymentID,
// 			command.Action,
// 			command.Amount,
// 		)
// 		retryExecutor := NewRetryExecutorWithBackoff(
// 			gateway,
// 			3,
// 			NewBackoffPolicy(100),
// 			func(_ time.Duration) {},
// 		)

// 		executionResult := retryExecutor.ExecuteWithMetadata(command)

// 		gatewayResult := executionResult.FinalResult

// 		response := RecoveryResponse{
// 			CommandID: command.CommandID,
// 			PaymentID: command.PaymentID,
// 			Status:    gatewayResult.Status,
// 			Action:    gatewayResult.Action,
// 			Recovered: executionResult.Recovered,
// 			Retryable: executionResult.Retryable,
// 			Outcome:   executionResult.Outcome,
// 			Attempts:  executionResult.Attempts,
// 		}

// 		w.Header().Set("Content-Type", "application/json")

// 		_ = json.NewEncoder(w).Encode(response)
// 	})
// }

// func executeRecoveryHandlerWithExecutor(
// 	store CommandClaimer,
// 	executor RecoveryExecutor,
// ) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		var command RecoveryCommand

// 		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
// 			http.Error(w, "invalid request", http.StatusBadRequest)
// 			return
// 		}

// 		claimed, err := store.Claim(command.CommandID)
// 		if err != nil {
// 			http.Error(w, "idempotency error", http.StatusInternalServerError)
// 			return
// 		}

// 		if !claimed {
// 			response := RecoveryResponse{
// 				CommandID: command.CommandID,
// 				PaymentID: command.PaymentID,
// 				Status:    "DUPLICATE",
// 			}

// 			w.Header().Set("Content-Type", "application/json")
// 			_ = json.NewEncoder(w).Encode(response)
// 			return
// 		}

// 		executionResult := executor.ExecuteWithMetadata(command)
// 		gatewayResult := executionResult.FinalResult

// 		response := RecoveryResponse{
// 			CommandID: command.CommandID,
// 			PaymentID: command.PaymentID,
// 			Status:    gatewayResult.Status,
// 			Action:    gatewayResult.Action,
// 			Recovered: executionResult.Recovered,
// 			Retryable: executionResult.Retryable,
// 			Outcome:   executionResult.Outcome,
// 			Attempts:  executionResult.Attempts,
// 		}

// 		w.Header().Set("Content-Type", "application/json")
// 		_ = json.NewEncoder(w).Encode(response)
// 	})
// }

func executeRecoveryHandlerWithDependencies(
	store CommandClaimer,
	gateway RecoveryGateway,
) http.Handler {
	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(100),
		time.Sleep,
	)

	return executeRecoveryHandlerWithExecutor(store, executor)
}
func executeRecoveryHandlerWithExecutorAndMetrics(
	store CommandClaimer,
	executor RecoveryExecutor,
	metrics *RecoveryMetrics,
) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var command RecoveryCommand

		if err := json.NewDecoder(r.Body).Decode(&command); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		if err := validateRecoveryCommand(command); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		claimed, err := store.Claim(command.CommandID)
		if err != nil {
			http.Error(w, "idempotency error", http.StatusInternalServerError)
			return
		}

		if !claimed {
			response := RecoveryResponse{
				CommandID: command.CommandID,
				PaymentID: command.PaymentID,
				Status:    "DUPLICATE",
			}

			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(response)
			return
		}

		executionResult := executor.ExecuteWithMetadata(command)
		metrics.Record(executionResult)

		gatewayResult := executionResult.FinalResult

		status := gatewayResult.Status
		if status == "SUCCESS" {
			status = "EXECUTED"
		}

		response := RecoveryResponse{
			CommandID: command.CommandID,
			PaymentID: command.PaymentID,
			Status:    status,
			Action:    gatewayResult.Action,
			Recovered: executionResult.Recovered,
			Retryable: executionResult.Retryable,
			Outcome:   executionResult.Outcome,
			Attempts:  executionResult.Attempts,
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
	})
}

func metricsHandler(metrics *RecoveryMetrics) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		snapshot := metrics.Snapshot()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(snapshot)
	})
}
