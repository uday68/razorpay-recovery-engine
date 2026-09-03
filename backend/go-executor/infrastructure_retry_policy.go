package main

import "strings"

type InfrastructureRetryPolicy struct{}

func NewInfrastructureRetryPolicy() *InfrastructureRetryPolicy {
	return &InfrastructureRetryPolicy{}
}

func (p *InfrastructureRetryPolicy) ShouldRetry(err error) bool {
	if err == nil {
		return false
	}

	message := strings.ToLower(err.Error())

	switch {
	case strings.Contains(message, "timeout"):
		return true

	case strings.Contains(message, "connection reset"):
		return true

	case strings.Contains(message, "temporarily unavailable"):
		return true

	default:
		return false
	}
}
