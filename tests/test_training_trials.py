from ml.dataset import generate_dataset


def test_training_dataset_uses_repeated_trials():
    df = generate_dataset(
        num_customers=20,
        num_payments=50,
        trials_per_action=5,
    )

    counts = (
        df.groupby(["payment_id", "action"])
        .size()
    )

    assert counts.min() == 5
    assert counts.max() == 5