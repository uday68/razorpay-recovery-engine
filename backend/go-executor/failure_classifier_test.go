package main

import "testing"

func TestFailureClassifierClassifiesTimeoutAsTransient(t *testing.T) {
	classifier := NewFailureClassifier()

	result := classifier.Classify("GATEWAY_TIMEOUT")

	if result.FailureType != "TRANSIENT_FAILURE" {
		t.Fatalf(
			"expected TRANSIENT_FAILURE, got %s",
			result.FailureType,
		)
	}

	if !result.Retryable {
		t.Fatal("timeout should be retryable")
	}
}

func TestFailureClassifierClassifiesCardExpiredAsPermanent(t *testing.T) {
	classifier := NewFailureClassifier()

	result := classifier.Classify("CARD_EXPIRED")

	if result.FailureType != "PERMANENT_FAILURE" {
		t.Fatalf(
			"expected PERMANENT_FAILURE, got %s",
			result.FailureType,
		)
	}

	if result.Retryable {
		t.Fatal("card expired should not be retryable")
	}
}
