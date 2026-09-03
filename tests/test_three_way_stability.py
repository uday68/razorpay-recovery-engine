from backend.controlled_experiment import run_controlled_experiment


def test_stability_result_contains_three_strategies():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert "baseline" in result
    assert "rule_based" in result
    assert "ai" in result

    for strategy in ["baseline", "rule_based", "ai"]:
        assert result[strategy]["recovered_revenue"] >= 0
        assert result[strategy]["recoveries"] >= 0
        assert 0 <= result[strategy]["recovery_rate"] <= 1