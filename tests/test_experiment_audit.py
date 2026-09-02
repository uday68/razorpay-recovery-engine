from backend.controlled_experiment import run_controlled_experiment


def test_experiment_generates_audit_events():
    result = run_controlled_experiment(
        customer_count=10,
        payment_count=50,
        seed=42,
        return_audit_events=True,
    )

    assert "audit_events" in result

    assert len(result["audit_events"]) == result["failed_payments"]

    event = result["audit_events"][0]

    assert "payment_id" in event
    assert "customer_id" in event
    assert "amount" in event
    assert "failure_code" in event

    assert "probabilities" in event
    assert "recommended_action" in event
    assert "expected_value" in event

    assert "policy_allowed" in event
    assert "policy_reason" in event
    assert "executed_action" in event
    assert "timestamp" in event