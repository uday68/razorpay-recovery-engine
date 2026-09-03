from backend.policy.engine import apply_policy
from backend.controlled_experiment import run_controlled_experiment


def test_experiment_distinguishes_no_action_from_policy_blocks():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert "ai_selected_no_action" in result
    assert "policy_blocked" in result

    assert result["ai_selected_no_action"] >= 0
    assert result["policy_blocked"] >= 0

def test_no_action_is_not_a_policy_fallback():
    result = apply_policy(
        action="NO_ACTION",
        amount=5000,
        probability=0.0,
    )

    assert result["allowed"] is True
    assert result["action"] == "NO_ACTION"


def test_low_confidence_retry_is_policy_blocked():
    result = apply_policy(
        action="RETRY_NOW",
        amount=5000,
        probability=0.20,
    )

    assert result["allowed"] is False
    assert result["action"] == "NO_ACTION"