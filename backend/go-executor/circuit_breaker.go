package main

import (
	"sync"
	"time"
)

type CircuitState string

const (
	CircuitClosed   CircuitState = "CLOSED"
	CircuitOpen     CircuitState = "OPEN"
	CircuitHalfOpen CircuitState = "HALF_OPEN"
)

type CircuitBreaker struct {
	mu               sync.Mutex
	state            CircuitState
	failureCount     int
	failureThreshold int
	cooldown         time.Duration
	openedAt         time.Time
	probeInProgress  bool
}

func NewCircuitBreaker(failureThreshold int) *CircuitBreaker {
	return NewCircuitBreakerWithCooldown(
		failureThreshold,
		time.Second,
	)
}

func NewCircuitBreakerWithCooldown(
	failureThreshold int,
	cooldown time.Duration,
) *CircuitBreaker {
	if failureThreshold <= 0 {
		panic("failure threshold must be greater than zero")
	}

	if cooldown <= 0 {
		panic("cooldown must be greater than zero")
	}

	return &CircuitBreaker{
		state:            CircuitClosed,
		failureThreshold: failureThreshold,
		cooldown:         cooldown,
	}
}

func (b *CircuitBreaker) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	switch b.state {
	case CircuitClosed:
		return true

	case CircuitOpen:
		if time.Since(b.openedAt) < b.cooldown {
			return false
		}

		b.state = CircuitHalfOpen

		if b.probeInProgress {
			return false
		}

		b.probeInProgress = true
		return true

	case CircuitHalfOpen:
		if b.probeInProgress {
			return false
		}

		b.probeInProgress = true
		return true

	default:
		return false
	}
}

func (b *CircuitBreaker) RecordFailure() {
	b.mu.Lock()
	defer b.mu.Unlock()

	switch b.state {
	case CircuitClosed:
		b.failureCount++

		if b.failureCount >= b.failureThreshold {
			b.state = CircuitOpen
			b.openedAt = time.Now()
			b.probeInProgress = false
		}

	case CircuitHalfOpen:
		b.state = CircuitOpen
		b.openedAt = time.Now()
		b.probeInProgress = false
	}
}

func (b *CircuitBreaker) RecordSuccess() {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.failureCount = 0
	b.state = CircuitClosed
	b.probeInProgress = false
}

func (b *CircuitBreaker) State() CircuitState {
	b.mu.Lock()
	defer b.mu.Unlock()

	return b.state
}
