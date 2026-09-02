from backend.controlled_experiment import run_controlled_experiment


def test_controlled_experiment_reports_policy_metrics():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert "policy_allowed" in result
    assert "policy_blocked" in result

    assert (
        result["policy_allowed"]+ result["policy_blocked"]== result["failed_payments"]
    )