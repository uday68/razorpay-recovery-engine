package main

func DetermineExecutionOutcome(result GatewayResult) string {
	if result.Status == "SUCCESS" {
		return "EXECUTED"
	}

	classifier := NewFailureClassifier()
	classification := classifier.Classify(result.ErrorCode)

	policy := NewRetryPolicy()

	if policy.ShouldRetry(classification) {
		return "FAILED_RETRYABLE"
	}

	return "FAILED_PERMANENT"
}
