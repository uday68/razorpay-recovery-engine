package main

import (
	"testing"
)

func TestQueuedRecoveryAcceptsCommandIntoExecutionQueue(t *testing.T) {
	queue := NewExecutionQueue(1)

	command := RecoveryCommand{
		CommandID: "cmd-queued-001",
		PaymentID: "pay-queued-001",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	err := EnqueueRecoveryCommand(queue, command)
	if err != nil {
		t.Fatalf("failed to enqueue recovery command: %v", err)
	}

	got, ok := queue.Dequeue()

	if !ok {
		t.Fatal("expected command to be queued")
	}

	if got.CommandID != command.CommandID {
		t.Fatalf(
			"expected command_id %s, got %s",
			command.CommandID,
			got.CommandID,
		)
	}
}
