package events

import "sync"

type EventStore struct {
	mu      sync.Mutex
	claimed map[string]bool
}

func NewEventStore() *EventStore {
	return &EventStore{
		claimed: make(map[string]bool),
	}
}

func (s *EventStore) Claim(eventID string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.claimed[eventID] {
		return false, nil
	}

	s.claimed[eventID] = true
	return true, nil
}
