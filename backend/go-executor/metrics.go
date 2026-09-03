package main

import "sync"

type RecoveryMetricsSnapshot struct {
	TotalExecutions     int
	RecoveredExecutions int
	FailedExecutions    int
	RetryableFailures   int
	PermanentFailures   int
	ExecutorErrors      int
	TotalAttempts       int
	RecoveryRate        float64
	RecoveredRevenue    float64
}

type RecoveryMetrics struct {
	mu                  sync.Mutex
	totalExecutions     int
	recoveredExecutions int
	failedExecutions    int
	retryableFailures   int
	permanentFailures   int
	executorErrors      int
	totalAttempts       int
	recoveredRevenue    float64
}

func NewRecoveryMetrics() *RecoveryMetrics {
	return &RecoveryMetrics{}
}

func (m *RecoveryMetrics) Record(result ExecutionResult) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.totalExecutions++
	m.totalAttempts += result.Attempts

	switch result.Outcome {
	case "EXECUTED":
		m.recoveredExecutions++
		m.recoveredRevenue += result.Amount

	case "FAILED_RETRYABLE":
		m.failedExecutions++
		m.retryableFailures++

	case "FAILED_PERMANENT":
		m.failedExecutions++
		m.permanentFailures++

	case "EXECUTOR_ERROR":
		m.failedExecutions++
		m.executorErrors++

	default:
		m.failedExecutions++
	}
}

func (m *RecoveryMetrics) Snapshot() RecoveryMetricsSnapshot {
	m.mu.Lock()
	defer m.mu.Unlock()

	var recoveryRate float64

	if m.totalExecutions > 0 {
		recoveryRate = float64(m.recoveredExecutions) /
			float64(m.totalExecutions)
	}

	return RecoveryMetricsSnapshot{
		TotalExecutions:     m.totalExecutions,
		RecoveredExecutions: m.recoveredExecutions,
		FailedExecutions:    m.failedExecutions,
		RetryableFailures:   m.retryableFailures,
		PermanentFailures:   m.permanentFailures,
		ExecutorErrors:      m.executorErrors,
		TotalAttempts:       m.totalAttempts,
		RecoveryRate:        recoveryRate,
		RecoveredRevenue:    m.recoveredRevenue,
	}
}
