from backend.audit import create_audit_event


def test_audit_event_contains_decision_details():
    event = create_audit_event(
        payment_id="payment-123",
        customer_id="customer-456",
        amount=5000,
        failure_code="BANK_TIMEOUT",
        probabilities={
            "RETRY_NOW": 0.55,
            "RETRY_LATER": 0.75,
            "SEND_REMINDER": 0.30,
            "NO_ACTION": 0.01,
        },
        recommended_action="RETRY_LATER",
        expected_value=3748,
        policy_allowed=True,
        policy_reason="Action satisfies policy",
        executed_action="RETRY_LATER",
    )

    assert event["payment_id"] == "payment-123"
    assert event["customer_id"] == "customer-456"
    assert event["amount"] == 5000
    assert event["failure_code"] == "BANK_TIMEOUT"

    assert event["recommended_action"] == "RETRY_LATER"
    assert event["expected_value"] == 3748

    assert event["policy_allowed"] is True
    assert event["executed_action"] == "RETRY_LATER"

    assert "timestamp" in event

def test_audit_event_contains_execution_result():
    event = create_audit_event(
        payment_id="payment-123",
        customer_id="customer-123",
        amount=5000,
        failure_code="BANK_TIMEOUT",
        probabilities={
            "RETRY_NOW": 0.6,
            "RETRY_LATER": 0.8,
            "SEND_REMINDER": 0.2,
            "NO_ACTION": 0.0,
        },
        recommended_action="RETRY_LATER",
        expected_value=3998,
        policy_allowed=True,
        policy_reason="Action satisfies policy",
        executed_action="RETRY_LATER",
        execution_result={
            "outcome": "EXECUTED",
            "attempts": 2,
            "recovered": True,
            "retryable": False,
        },
    )

    assert event["outcome"] == "EXECUTED"
    assert event["attempts"] == 2
    assert event["recovered"] is True
    assert event["retryable"] is False