package main

import (
	"testing"
	"time"
)

func TestBackpressureRejectsWhenQueueIsFull(t *testing.T) {
	queue := NewExecutionQueue(2)

	command1 := RecoveryCommand{
		CommandID: "cmd-backpressure-001",
		PaymentID: "pay-001",
		Action:    "RETRY_NOW",
		Amount:    1000,
	}

	command2 := RecoveryCommand{
		CommandID: "cmd-backpressure-002",
		PaymentID: "pay-002",
		Action:    "RETRY_NOW",
		Amount:    2000,
	}

	command3 := RecoveryCommand{
		CommandID: "cmd-backpressure-003",
		PaymentID: "pay-003",
		Action:    "RETRY_NOW",
		Amount:    3000,
	}

	if err := queue.Enqueue(command1); err != nil {
		t.Fatalf("failed to enqueue command1: %v", err)
	}

	if err := queue.Enqueue(command2); err != nil {
		t.Fatalf("failed to enqueue command2: %v", err)
	}

	start := time.Now()

	err := queue.Enqueue(command3)

	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("expected queue-full error")
	}

	if elapsed > 100*time.Millisecond {
		t.Fatalf(
			"enqueue should fail immediately when queue is full, took %v",
			elapsed,
		)
	}
}
func TestExecutionQueueDequeuesCommands(t *testing.T) {
	queue := NewExecutionQueue(2)

	command := RecoveryCommand{
		CommandID: "cmd-dequeue-001",
		PaymentID: "pay-dequeue-001",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	if err := queue.Enqueue(command); err != nil {
		t.Fatalf("enqueue failed: %v", err)
	}

	got, ok := queue.Dequeue()

	if !ok {
		t.Fatal("expected command to be available")
	}

	if got.CommandID != command.CommandID {
		t.Fatalf(
			"expected command_id %s, got %s",
			command.CommandID,
			got.CommandID,
		)
	}

	_, ok = queue.Dequeue()

	if ok {
		t.Fatal("expected queue to be empty")
	}
}
