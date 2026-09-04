package main

import (
	"context"
	"time"
)

type ExecutionWorker struct {
	queue    *ExecutionQueue
	executor interface {
		Execute(command RecoveryCommand) ExecutionResult
	}
}

func NewExecutionWorker(
	queue *ExecutionQueue,
	executor interface {
		Execute(command RecoveryCommand) ExecutionResult
	},
) *ExecutionWorker {
	return &ExecutionWorker{
		queue:    queue,
		executor: executor,
	}
}

func (w *ExecutionWorker) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		command, ok := w.queue.Dequeue()
		if !ok {
			select {
			case <-ctx.Done():
				return
			case <-time.After(10 * time.Millisecond):
			}
			continue
		}

		w.executor.Execute(command)
	}
}
