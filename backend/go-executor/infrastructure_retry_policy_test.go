package main

import (
	"errors"
	"testing"
)

func TestInfrastructureRetryPolicyAllowsTimeout(t *testing.T) {
	policy := NewInfrastructureRetryPolicy()

	if !policy.ShouldRetry(errors.New("gateway timeout")) {
		t.Fatal("expected gateway timeout to be retryable")
	}
}

func TestInfrastructureRetryPolicyAllowsConnectionReset(t *testing.T) {
	policy := NewInfrastructureRetryPolicy()

	if !policy.ShouldRetry(errors.New("connection reset")) {
		t.Fatal("expected connection reset to be retryable")
	}
}

func TestInfrastructureRetryPolicyBlocksUnknownError(t *testing.T) {
	policy := NewInfrastructureRetryPolicy()

	if policy.ShouldRetry(errors.New("something completely unexpected")) {
		t.Fatal("unknown infrastructure errors must not be retried")
	}
}
