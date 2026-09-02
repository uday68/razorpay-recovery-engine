package main

type FailureClassification struct {
	FailureType string
	Retryable   bool
}

type FailureClassifier struct{}

func NewFailureClassifier() *FailureClassifier {
	return &FailureClassifier{}
}

func (c *FailureClassifier) Classify(errorCode string) FailureClassification {
	switch errorCode {
	case "GATEWAY_TIMEOUT", "NETWORK_ERROR", "RATE_LIMITED", "BANK_TIMEOUT":
		return FailureClassification{
			FailureType: "TRANSIENT_FAILURE",
			Retryable:   true,
		}

	case "CARD_EXPIRED", "INVALID_ACCOUNT", "AUTHENTICATION_FAILED":
		return FailureClassification{
			FailureType: "PERMANENT_FAILURE",
			Retryable:   false,
		}

	default:
		return FailureClassification{
			FailureType: "UNKNOWN",
			Retryable:   false,
		}
	}
}
