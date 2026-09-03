import pandas as pd

from ml.dataset import generate_dataset


def test_dataset_contains_repeated_trials_per_payment_action():
    df = generate_dataset(
        num_customers=20,
        num_payments=50,
        trials_per_action=5,
    )

    grouped = (
        df.groupby(["payment_id", "action"])
        .size()
    )

    assert len(grouped) > 0
    assert grouped.min() == 5
    assert grouped.max() == 5