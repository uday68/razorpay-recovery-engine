package main

import "testing"

func TestRetryPolicyAllowsTransientFailure(t *testing.T) {
	policy := NewRetryPolicy()

	result := policy.ShouldRetry(FailureClassification{
		FailureType: "TRANSIENT_FAILURE",
		Retryable:   true,
	})

	if !result {
		t.Fatal("expected transient failure to be retryable")
	}
}

func TestRetryPolicyBlocksPermanentFailure(t *testing.T) {
	policy := NewRetryPolicy()

	result := policy.ShouldRetry(FailureClassification{
		FailureType: "PERMANENT_FAILURE",
		Retryable:   false,
	})

	if result {
		t.Fatal("expected permanent failure to not be retryable")
	}
}

func TestRetryPolicyBlocksUnknownFailure(t *testing.T) {
	policy := NewRetryPolicy()

	result := policy.ShouldRetry(FailureClassification{
		FailureType: "UNKNOWN",
		Retryable:   false,
	})

	if result {
		t.Fatal("expected unknown failure to not be retryable")
	}
}
