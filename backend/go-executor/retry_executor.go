package main

import "time"

const MaxAllowedAttempts = 3

type Sleeper func(time.Duration)

type RetryExecutor struct {
	gateway     RecoveryGateway
	maxAttempts int
	backoff     *BackoffPolicy
	sleep       Sleeper
}

func NewRetryExecutor(gateway RecoveryGateway, maxAttempts int) *RetryExecutor {
	return NewRetryExecutorWithBackoff(
		gateway,
		maxAttempts,
		NewBackoffPolicy(100),
		time.Sleep,
	)
}

func NewRetryExecutorWithBackoff(
	gateway RecoveryGateway,
	maxAttempts int,
	backoff *BackoffPolicy,
	sleep Sleeper,
) *RetryExecutor {
	if maxAttempts < 1 {
		maxAttempts = 1
	}

	if maxAttempts > MaxAllowedAttempts {
		maxAttempts = MaxAllowedAttempts
	}

	return &RetryExecutor{
		gateway:     gateway,
		maxAttempts: maxAttempts,
		backoff:     backoff,
		sleep:       sleep,
	}
}

func (e *RetryExecutor) Execute(command RecoveryCommand) GatewayResult {
	var result GatewayResult

	for attempt := 1; attempt <= e.maxAttempts; attempt++ {
		res, err := e.gateway.Execute(command)
		if err != nil {
			return GatewayResult{
				PaymentID:   command.PaymentID,
				Action:      command.Action,
				Status:      "FAILED",
				ErrorCode:   "GATEWAY_ERROR",
				FailureType: "TRANSIENT_FAILURE",
				Retryable:   true,
			}
		}
		result = res

		if result.Status == "SUCCESS" {
			return result
		}

		classifier := NewFailureClassifier()
		classification := classifier.Classify(result.ErrorCode)

		policy := NewRetryPolicy()

		if !policy.ShouldRetry(classification) {
			return result
		}

		if attempt < e.maxAttempts {
			e.sleep(e.backoff.DelayWithJitter(attempt))
		}
	}

	return result
}
func (e *RetryExecutor) ExecuteWithMetadata(command RecoveryCommand) ExecutionResult {
	var result GatewayResult
	attempts := 0

	for attempt := 1; attempt <= e.maxAttempts; attempt++ {
		attempts++

		res, err := e.gateway.Execute(command)
		if err != nil {
			return ExecutionResult{
				FinalResult: GatewayResult{
					PaymentID:   command.PaymentID,
					Action:      command.Action,
					Status:      "FAILED",
					ErrorCode:   "GATEWAY_ERROR",
					FailureType: "INFRASTRUCTURE_ERROR",
					Retryable:   false,
				},
				Attempts:  attempts,
				Outcome:   "EXECUTOR_ERROR",
				Retryable: false,
				Recovered: false,
			}
		}
		result = res

		if result.Status == "SUCCESS" {
			return ExecutionResult{
				FinalResult: result,
				Attempts:    attempts,
				Outcome:     "EXECUTED",
				Retryable:   false,
				Recovered:   true,
			}
		}

		classifier := NewFailureClassifier()
		classification := classifier.Classify(result.ErrorCode)

		policy := NewRetryPolicy()

		if !policy.ShouldRetry(classification) {
			return ExecutionResult{
				FinalResult: result,
				Attempts:    attempts,
				Outcome:     "FAILED_PERMANENT",
				Retryable:   false,
				Recovered:   false,
			}
		}

		if attempt < e.maxAttempts {
			e.sleep(e.backoff.DelayWithJitter(attempt))
		}
	}

	return ExecutionResult{
		FinalResult: result,
		Attempts:    attempts,
		Outcome:     "FAILED_RETRYABLE",
		Retryable:   true,
		Recovered:   false,
	}
}
