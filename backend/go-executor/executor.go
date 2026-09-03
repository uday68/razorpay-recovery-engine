package main

type RecoveryExecutor interface {
	ExecuteWithMetadata(command RecoveryCommand) ExecutionResult
}
