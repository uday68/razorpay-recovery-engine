package main

import (
	"testing"
	"time"
)

func BenchmarkRecoveryExecution(b *testing.B) {
	gateway := NewSimulatedGateway()

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(0),
		func(time.Duration) {},
	)

	command := RecoveryCommand{
		CommandID: "benchmark-command",
		PaymentID: "benchmark-payment",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		command.CommandID = "benchmark-command"
		command.PaymentID = "benchmark-payment"

		executor.ExecuteWithMetadata(command)
	}
}
func BenchmarkConcurrentRecoveryExecution(b *testing.B) {
	gateway := NewSimulatedGateway()

	executor := NewRetryExecutorWithBackoff(
		gateway,
		3,
		NewBackoffPolicy(0),
		func(time.Duration) {},
	)

	command := RecoveryCommand{
		Action: "RETRY_NOW",
		Amount: 5000,
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			executor.ExecuteWithMetadata(command)
		}
	})
}
