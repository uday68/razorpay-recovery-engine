package main

import (
	"context"
	"sync"
	"testing"
	"time"
)

type recordingCommandExecutor struct {
	mu       sync.Mutex
	commands []RecoveryCommand
}

func (e *recordingCommandExecutor) Execute(
	command RecoveryCommand,
) ExecutionResult {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.commands = append(e.commands, command)

	return ExecutionResult{
		Recovered: true,
		Attempts:  1,
		Outcome:   "EXECUTED",
		Amount:    command.Amount,
	}
}

func (e *recordingCommandExecutor) Count() int {
	e.mu.Lock()
	defer e.mu.Unlock()

	return len(e.commands)
}

func TestExecutionWorkerProcessesQueuedCommand(t *testing.T) {
	queue := NewExecutionQueue(2)
	executor := &recordingCommandExecutor{}

	worker := NewExecutionWorker(queue, executor)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})

	go func() {
		worker.Run(ctx)
		close(done)
	}()

	command := RecoveryCommand{
		CommandID: "cmd-worker-001",
		PaymentID: "pay-worker-001",
		Action:    "RETRY_NOW",
		Amount:    5000,
	}

	if err := queue.Enqueue(command); err != nil {
		t.Fatalf("enqueue failed: %v", err)
	}

	deadline := time.After(2 * time.Second)

	for executor.Count() != 1 {
		select {
		case <-deadline:
			t.Fatalf(
				"worker did not execute command, count=%d",
				executor.Count(),
			)
		default:
			time.Sleep(10 * time.Millisecond)
		}
	}

	cancel()

	select {
	case <-done:
	case <-time.After(1 * time.Second):
		t.Fatal("worker did not stop after context cancellation")
	}
}
