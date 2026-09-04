package main

import (
	"errors"
	"sync"
)

var ErrQueueFull = errors.New("execution queue is full")

type ExecutionQueue struct {
	mu       sync.Mutex
	cond     *sync.Cond
	items    []RecoveryCommand
	capacity int
}

func NewExecutionQueue(capacity int) *ExecutionQueue {
	if capacity <= 0 {
		panic("queue capacity must be greater than zero")
	}

	q := &ExecutionQueue{
		items:    make([]RecoveryCommand, 0, capacity),
		capacity: capacity,
	}

	q.cond = sync.NewCond(&q.mu)

	return q
}

func (q *ExecutionQueue) Enqueue(command RecoveryCommand) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.items) >= q.capacity {
		return ErrQueueFull
	}

	q.items = append(q.items, command)

	q.cond.Signal()

	return nil
}

func (q *ExecutionQueue) Dequeue() (RecoveryCommand, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.items) == 0 {
		return RecoveryCommand{}, false
	}

	command := q.items[0]

	copy(q.items, q.items[1:])
	q.items = q.items[:len(q.items)-1]

	return command, true
}

func (q *ExecutionQueue) WaitDequeue() (RecoveryCommand, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()

	for len(q.items) == 0 {
		q.cond.Wait()
	}

	command := q.items[0]

	copy(q.items, q.items[1:])
	q.items = q.items[:len(q.items)-1]

	return command, true
}

func (q *ExecutionQueue) IsFull() bool {
	q.mu.Lock()
	defer q.mu.Unlock()
	return len(q.items) >= q.capacity
}
