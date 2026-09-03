from backend.controlled_experiment import run_controlled_experiment


def test_experiment_tracks_ai_recommendations_separately():
    result = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert "recommended_action_counts" in result

    counts = result["recommended_action_counts"]

    assert set(counts.keys()) == {
        "RETRY_NOW",
        "RETRY_LATER",
        "SEND_REMINDER",
        "NO_ACTION",
    }

    assert sum(counts.values()) == result["failed_payments"]