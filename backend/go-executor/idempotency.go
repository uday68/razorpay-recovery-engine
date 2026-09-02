package main

import "sync"

type CommandStore struct {
	mu      sync.Mutex
	claimed map[string]bool
}
type CommandClaimer interface {
	Claim(CommandID string) (bool, error)
}

func NewCommandStore() *CommandStore {
	return &CommandStore{
		claimed: make(map[string]bool),
	}
}

func (s *CommandStore) Claim(commandID string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.claimed[commandID] {
		return false, nil
	}

	s.claimed[commandID] = true
	return true, nil
}
