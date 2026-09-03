from backend.controlled_experiment import run_controlled_experiment


def test_three_way_experiment_returns_all_strategies():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert "baseline" in result
    assert "rule_based" in result
    assert "ai" in result

    for strategy in ["baseline", "rule_based", "ai"]:
        assert "recoveries" in result[strategy]
        assert "recovery_rate" in result[strategy]
        assert "recovered_revenue" in result[strategy]
        assert "revenue_per_failure" in result[strategy]


def test_rule_based_strategy_uses_same_failed_payment_population():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert result["baseline"]["failed_payments"] == result["rule_based"]["failed_payments"]
    assert result["baseline"]["failed_payments"] == result["ai"]["failed_payments"]
    assert result["baseline"]["failed_payments"] == result["ai"]["failed_payments"]