package main

import (
	"errors"
	"testing"
)

type ErrorGateway struct {
	err error
}

func (g *ErrorGateway) ExecuteWithError(
	command RecoveryCommand,
) (GatewayResult, error) {
	return GatewayResult{}, g.err
}

type FakeGateway struct {
	result GatewayResult
}

func (f *FakeGateway) Execute(command RecoveryCommand) (GatewayResult, error) {
	return f.result, nil
}

func TestGatewayExecutesRecovery(t *testing.T) {
	gateway := NewSimulatedGateway()

	command := RecoveryCommand{
		CommandID: "gateway-test-001",
		PaymentID: "payment-gateway-001",
		Action:    "RETRY_LATER",
		Amount:    5000,
	}

	result, err := gateway.Execute(command)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.PaymentID != command.PaymentID {
		t.Fatalf(
			"expected payment_id %s, got %s",
			command.PaymentID,
			result.PaymentID,
		)
	}

	if result.Action != command.Action {
		t.Fatalf(
			"expected action %s, got %s",
			command.Action,
			result.Action,
		)
	}

	if result.Status == "" {
		t.Fatal("gateway status should not be empty")
	}
}
func TestGatewayClassifiesTransientFailure(t *testing.T) {
	gateway := &FakeGateway{
		result: GatewayResult{
			PaymentID: "payment-transient-001",
			Action:    "RETRY_LATER",
			Status:    "FAILED",
			ErrorCode: "GATEWAY_TIMEOUT",
			Retryable: true,
		},
	}

	command := RecoveryCommand{
		CommandID: "cmd-transient-001",
		PaymentID: "payment-transient-001",
		Action:    "RETRY_LATER",
		Amount:    5000,
	}

	result, err := gateway.Execute(command)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !result.Retryable {
		t.Fatal("gateway timeout should be retryable")
	}

	if result.ErrorCode != "GATEWAY_TIMEOUT" {
		t.Fatalf(
			"expected GATEWAY_TIMEOUT, got %s",
			result.ErrorCode,
		)
	}
}
func TestSimulatedGatewayReturnsStructuredFailure(t *testing.T) {
	gateway := NewSimulatedGateway()

	command := RecoveryCommand{
		CommandID: "structured-failure-001",
		PaymentID: "payment-structured-001",
		Action:    "RETRY_LATER",
		Amount:    5000,
	}

	result, err := gateway.Execute(command)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Status == "FAILED" {
		if result.ErrorCode == "" {
			t.Fatal("failed gateway result must contain an error code")
		}

		if !result.Retryable {
			t.Fatal("simulated gateway failure should be retryable")
		}
	}
}
func TestGatewayFailureHasFailureType(t *testing.T) {
	classifier := NewFailureClassifier()
	result := classifier.Classify("GATEWAY_TIMEOUT")

	if result.FailureType != "TRANSIENT_FAILURE" {
		t.Fatalf(
			"expected TRANSIENT_FAILURE, got %s",
			result.FailureType,
		)
	}
}
func TestSimulatedGatewayClassifiesFailure(t *testing.T) {
	gateway := NewSimulatedGateway()

	command := RecoveryCommand{
		CommandID: "any-command",
		PaymentID: "payment-123",
		Action:    "RETRY_NOW",
		Amount:    1000,
	}

	result, err := gateway.Execute(command)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Status == "FAILED" {
		if result.FailureType != "TRANSIENT_FAILURE" {
			t.Fatalf("expected TRANSIENT_FAILURE, got %s", result.FailureType)
		}

		if !result.Retryable {
			t.Fatal("expected transient failure to be retryable")
		}
	}
}

func TestPermanentFailureIsNotRetryable(t *testing.T) {
	// gateway := NewSimulatedGateway()

	result := GatewayResult{
		PaymentID: "payment-123",
		Action:    "RETRY_NOW",
		Status:    "FAILED",
		ErrorCode: "CARD_EXPIRED",
	}

	classifier := NewFailureClassifier()
	classification := classifier.Classify(result.ErrorCode)
	policy := NewRetryPolicy()

	if policy.ShouldRetry(classification) {
		t.Fatal("card expired must not be retried")
	}
}
func TestGatewayCanReturnInfrastructureError(t *testing.T) {
	gateway := &ErrorGateway{
		err: errors.New("gateway unavailable"),
	}

	_, err := gateway.ExecuteWithError(RecoveryCommand{
		CommandID: "infra-001",
		PaymentID: "payment-infra",
		Action:    "RETRY_NOW",
		Amount:    1000,
	})

	if err == nil {
		t.Fatal("expected gateway infrastructure error")
	}
}
