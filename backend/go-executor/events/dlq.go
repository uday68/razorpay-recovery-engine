package events

import "sync"

type DeadLetterItem struct {
	Event  PaymentFailedEvent
	Reason string
}

type DeadLetterQueue struct {
	mu    sync.Mutex
	items []DeadLetterItem
}

func NewDeadLetterQueue() *DeadLetterQueue {
	return &DeadLetterQueue{
		items: make([]DeadLetterItem, 0),
	}
}

func (q *DeadLetterQueue) Push(
	event PaymentFailedEvent,
	reason string,
) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	q.items = append(q.items, DeadLetterItem{
		Event:  event,
		Reason: reason,
	})

	return nil
}

func (q *DeadLetterQueue) Pop() (DeadLetterItem, bool) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.items) == 0 {
		return DeadLetterItem{}, false
	}

	item := q.items[0]

	copy(q.items, q.items[1:])
	q.items = q.items[:len(q.items)-1]

	return item, true
}

func (q *DeadLetterQueue) Count() int {
	q.mu.Lock()
	defer q.mu.Unlock()

	return len(q.items)
}
