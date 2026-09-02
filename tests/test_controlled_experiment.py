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