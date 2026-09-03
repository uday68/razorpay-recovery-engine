package main

import (
	"hash/fnv"
)

type GatewayResult struct {
	PaymentID   string
	Action      string
	Status      string
	ErrorCode   string
	FailureType string
	Retryable   bool
}
type RecoveryGateway interface {
	Execute(command RecoveryCommand) (GatewayResult, error)
}

type SimulatedGateway struct{}

func NewSimulatedGateway() *SimulatedGateway {
	return &SimulatedGateway{}
}

func (g *SimulatedGateway) Execute(command RecoveryCommand) (GatewayResult, error) {
	// Deterministic outcome based on command ID.
	hash := fnv.New32a()
	_, _ = hash.Write([]byte(command.CommandID))

	value := hash.Sum32() % 100

	if value < 70 {
		return GatewayResult{
			PaymentID:   command.PaymentID,
			Action:      command.Action,
			Status:      "SUCCESS",
			FailureType: "",
			Retryable:   false,
		}, nil
	}

	return GatewayResult{
		PaymentID:   command.PaymentID,
		Action:      command.Action,
		Status:      "FAILED",
		ErrorCode:   "GATEWAY_TIMEOUT",
		FailureType: "TRANSIENT_FAILURE",
		Retryable:   true,
	}, nil
}
