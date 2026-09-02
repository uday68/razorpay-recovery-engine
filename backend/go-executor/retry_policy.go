package main

type RetryPolicy struct{}

func NewRetryPolicy() *RetryPolicy {
	return &RetryPolicy{}
}

func (p *RetryPolicy) ShouldRetry(classification FailureClassification) bool {
	return classification.Retryable &&
		classification.FailureType == "TRANSIENT_FAILURE"
}
