package main

import "testing"

func TestExecutionOutcomeForSuccessfulGateway(t *testing.T) {
	result := GatewayResult{
		Status:    "SUCCESS",
		ErrorCode: "",
	}

	outcome := DetermineExecutionOutcome(result)

	if outcome != "EXECUTED" {
		t.Fatalf("expected EXECUTED, got %s", outcome)
	}
}

func TestExecutionOutcomeForTransientFailure(t *testing.T) {
	result := GatewayResult{
		Status:    "FAILED",
		ErrorCode: "GATEWAY_TIMEOUT",
	}

	outcome := DetermineExecutionOutcome(result)

	if outcome != "FAILED_RETRYABLE" {
		t.Fatalf("expected FAILED_RETRYABLE, got %s", outcome)
	}
}

func TestExecutionOutcomeForPermanentFailure(t *testing.T) {
	result := GatewayResult{
		Status:    "FAILED",
		ErrorCode: "CARD_EXPIRED",
	}

	outcome := DetermineExecutionOutcome(result)

	if outcome != "FAILED_PERMANENT" {
		t.Fatalf("expected FAILED_PERMANENT, got %s", outcome)
	}
}
