from backend.stability import run_stability_experiment


def test_stability_contains_detailed_metrics():
    result = run_stability_experiment(
        seeds=[1, 2],
        customer_count=100,
        payment_count=500,
    )

    for row in result["results"]:
        assert "failed_payments" in row
        assert "at_risk_revenue" in row
        assert "baseline_recovery_rate" in row
        assert "ai_recovery_rate" in row
        assert "baseline_revenue" in row
        assert "ai_revenue" in row
        assert "improvement" in row
        assert "action_counts" in row