package main

import (
	"errors"
)

var ErrCircuitOpen = errors.New("recovery circuit breaker is open")

type CircuitBreakerGateway struct {
	breaker *CircuitBreaker
	gateway RecoveryGateway
}

func NewCircuitBreakerGateway(
	breaker *CircuitBreaker,
	gateway RecoveryGateway,
) *CircuitBreakerGateway {
	return &CircuitBreakerGateway{
		breaker: breaker,
		gateway: gateway,
	}
}

func (g *CircuitBreakerGateway) Execute(
	command RecoveryCommand,
) (GatewayResult, error) {
	if !g.breaker.Allow() {
		return GatewayResult{}, ErrCircuitOpen
	}

	result, err := g.gateway.Execute(command)
	if err != nil {
		g.breaker.RecordFailure()
		return GatewayResult{}, err
	}

	if result.Status == "SUCCESS" {
		g.breaker.RecordSuccess()
	} else if result.Retryable {
		g.breaker.RecordFailure()
	}

	return result, nil
}
