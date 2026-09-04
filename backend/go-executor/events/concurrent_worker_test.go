package events

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

func TestConcurrentRecoveryFlowProcessesEventsSafely(t *testing.T) {
	eventStore := NewEventStore()
	decisioner := &flowDecisioner{}
	executor := &flowExecutor{}

	flow := NewRecoveryFlow(
		eventStore,
		decisioner,
		executor,
	)

	const workers = 10

	var wg sync.WaitGroup
	errors := make(chan error, workers)

	for i := 0; i < workers; i++ {
		wg.Add(1)

		go func(i int) {
			defer wg.Done()

			event := PaymentFailedEvent{
				EventID:       fmt.Sprintf("evt-concurrent-%d", i),
				EventType:     "PAYMENT_FAILED",
				PaymentID:     fmt.Sprintf("pay-concurrent-%d", i),
				CustomerID:    fmt.Sprintf("cust-concurrent-%d", i),
				Amount:        5000,
				PaymentMethod: "UPI",
				Bank:          "HDFC",
				FailureCode:   "BANK_TIMEOUT",
				SuccessRate:   0.80,
				RecoveryRate:  0.50,
				Timestamp:     time.Now().UTC(),
			}

			_, err := flow.Process(event)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	for err := range errors {
		t.Fatalf("concurrent processing failed: %v", err)
	}

	if decisioner.calls != workers {
		t.Fatalf(
			"expected %d decision calls, got %d",
			workers,
			decisioner.calls,
		)
	}

	if executor.calls != workers {
		t.Fatalf(
			"expected %d execution calls, got %d",
			workers,
			executor.calls,
		)
	}
}
