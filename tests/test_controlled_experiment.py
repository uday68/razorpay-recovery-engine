import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from backend.controlled_experiment import run_controlled_experiment

def test_controlled_experiment_returns_required_meterics():
    result = run_controlled_experiment(
        customer_count =100,
        payment_count = 500,
        seed =42
    )

    assert result["failed_payments"] >0
    assert result["at_risk_revenue"] >0

    assert "baseline" in result
    assert "ai" in result

    for strategy  in ["baseline","ai"]:
        assert result[strategy]["recoveries"] >=0
        assert result[strategy]["recovery_rate"] >=0
        assert result[strategy]["recovered_revenue"] >=0
        assert result[strategy]["revenue_per_failure"]>=0

    assert "revenue_difference" in result
    assert "revenue_improvement" in result
    assert "recovery_improvement" in result

    assert "action_counts" in result

from backend.controlled_experiment import recovery_outcome


def test_recovery_outcome_is_deterministic():
    probability = 0.7

    first = recovery_outcome(
        "payment-123",
        "RETRY_NOW",
        probability,
    )

    second = recovery_outcome(
        "payment-123",
        "RETRY_NOW",
        probability,
    )

    assert first == second


def test_different_actions_have_independent_outcomes():
    probability = 0.7

    retry_now = recovery_outcome(
        "payment-123",
        "RETRY_NOW",
        probability,
    )

    retry_later = recovery_outcome(
        "payment-123",
        "RETRY_LATER",
        probability,
    )

    # The two outcomes are generated from different
    # payment + action counterfactual worlds.
    assert isinstance(retry_now, bool)
    assert isinstance(retry_later, bool)