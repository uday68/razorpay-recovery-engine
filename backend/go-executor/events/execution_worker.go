package events

type CommandExecutor interface {
	Execute(command RecoveryCommand) (ExecutionResult, error)
}

type RecoveryExecutionWorker struct {
	executor CommandExecutor
}

func NewRecoveryExecutionWorker(
	executor CommandExecutor,
) *RecoveryExecutionWorker {
	return &RecoveryExecutionWorker{
		executor: executor,
	}
}

func (w *RecoveryExecutionWorker) Execute(
	command RecoveryCommand,
) (ExecutionResult, error) {
	return w.executor.Execute(command)
}
