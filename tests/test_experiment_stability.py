from backend.controlled_experiment import run_controlled_experiment


def test_experiment_is_reproducible():
    result1 = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    result2 = run_controlled_experiment(
        customer_count=100,
        payment_count=500,
        seed=42,
    )

    assert result1 == result2


def test_multiple_seeds_produce_valid_results():
    for seed in [1, 2, 3, 4, 5]:
        result = run_controlled_experiment(
            customer_count=100,
            payment_count=500,
            seed=seed,
        )

        assert result["failed_payments"] > 0
        assert result["baseline"]["recovered_revenue"] >= 0
        assert result["ai"]["recovered_revenue"] >= 0