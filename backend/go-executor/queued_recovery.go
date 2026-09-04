package main

func EnqueueRecoveryCommand(
	queue *ExecutionQueue,
	command RecoveryCommand,
) error {
	return queue.Enqueue(command)
}
