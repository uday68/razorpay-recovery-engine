package events

import (
	"testing"
)

type fakeCommandExecutor struct {
	called  bool
	command RecoveryCommand
}

func (e *fakeCommandExecutor) Execute(
	command RecoveryCommand,
) (ExecutionResult, error) {
	e.called = true
	e.command = command

	return ExecutionResult{
		PaymentID: command.PaymentID,
		Recovered: true,
		Attempts:  1,
		Outcome:   "EXECUTED",
		Amount:    command.Amount,
	}, nil
}

func TestRecoveryWorkerExecutesRecoveryCommand(t *testing.T) {
	executor := &fakeCommandExecutor{}

	worker := NewRecoveryExecutionWorker(executor)

	command := RecoveryCommand{
		CommandID: "evt-execution-001-command",
		PaymentID: "pay-execution-001",
		Action:    "RETRY_LATER",
		Amount:    5000,
	}

	result, err := worker.Execute(command)
	if err != nil {
		t.Fatalf("execution failed: %v", err)
	}

	if !executor.called {
		t.Fatal("expected executor to be called")
	}

	if executor.command.CommandID != command.CommandID {
		t.Fatalf(
			"expected command_id %s, got %s",
			command.CommandID,
			executor.command.CommandID,
		)
	}

	if result.PaymentID != command.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			command.PaymentID,
			result.PaymentID,
		)
	}

	if !result.Recovered {
		t.Fatal("expected recovery result to be successful")
	}
}
