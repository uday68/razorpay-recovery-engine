package main

import "testing"

func testingPolicyAllowedRetryForTransientFailure(t *testing.T) {
	classifer := NewFailureClassifier()
	policy := NewRetryPolicy()

	classification := classifer.Classify("GATEWAY_TIMEOUT")
	if !policy.ShouldRetry(classification) {
		t.Fatal("expected transient gateway timeout to be retryable")
	}

}
func TestExecutionBlockRetryForPermanentFailure(t *testing.T) {
	classifier := NewFailureClassifier()
	policy := NewRetryPolicy()

	classificatin := classifier.Classify("CARD_EXPIRED")

	if policy.ShouldRetry(classificatin) {
		t.Fatal("expected permanent failure to not be retryable")
	}
}
