package main

import (
	"testing"
	"time"
)

func TestCircuitBreakerOpensAfterFailureThreshold(t *testing.T) {
	breaker := NewCircuitBreaker(3)

	if !breaker.Allow() {
		t.Fatal("circuit should initially allow requests")
	}

	breaker.RecordFailure()

	if !breaker.Allow() {
		t.Fatal("circuit should remain open for requests after 1 failure")
	}

	breaker.RecordFailure()

	if !breaker.Allow() {
		t.Fatal("circuit should remain open for requests after 2 failures")
	}

	breaker.RecordFailure()

	if breaker.Allow() {
		t.Fatal("circuit should reject requests after failure threshold")
	}
}
func TestCircuitBreakerTransitionsToHalfOpenAfterCooldown(t *testing.T) {
	breaker := NewCircuitBreakerWithCooldown(1, 50*time.Millisecond)

	breaker.RecordFailure()

	if breaker.Allow() {
		t.Fatal("circuit should be OPEN after failure")
	}

	time.Sleep(75 * time.Millisecond)

	if !breaker.Allow() {
		t.Fatal("circuit should allow a probe after cooldown")
	}

	if breaker.State() != CircuitHalfOpen {
		t.Fatalf(
			"expected HALF_OPEN state, got %s",
			breaker.State(),
		)
	}
}
func TestCircuitBreakerHalfOpenSuccessClosesCircuit(t *testing.T) {
	breaker := NewCircuitBreakerWithCooldown(
		1,
		20*time.Millisecond,
	)

	breaker.RecordFailure()

	time.Sleep(30 * time.Millisecond)

	if !breaker.Allow() {
		t.Fatal("expected half-open probe to be allowed")
	}

	if breaker.State() != CircuitHalfOpen {
		t.Fatalf("expected HALF_OPEN, got %s", breaker.State())
	}

	breaker.RecordSuccess()

	if breaker.State() != CircuitClosed {
		t.Fatalf("expected CLOSED after success, got %s", breaker.State())
	}

	if !breaker.Allow() {
		t.Fatal("closed circuit should allow requests")
	}
}

func TestCircuitBreakerHalfOpenFailureReopensCircuit(t *testing.T) {
	breaker := NewCircuitBreakerWithCooldown(
		1,
		20*time.Millisecond,
	)

	breaker.RecordFailure()

	time.Sleep(30 * time.Millisecond)

	if !breaker.Allow() {
		t.Fatal("expected half-open probe to be allowed")
	}

	if breaker.State() != CircuitHalfOpen {
		t.Fatalf("expected HALF_OPEN, got %s", breaker.State())
	}

	breaker.RecordFailure()

	if breaker.State() != CircuitOpen {
		t.Fatalf("expected OPEN after failed probe, got %s", breaker.State())
	}

	if breaker.Allow() {
		t.Fatal("open circuit should reject requests")
	}
}
