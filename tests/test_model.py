import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.train import build_pipeline
import pandas as pd


def test_pipeline_can_predict_recovery_probability():
    pipeline = build_pipeline()

    X = pd.DataFrame([
        {
            "success_rate": 0.9,
            "recovery_rate": 0.7,
            "amount": 2500.0,
            "payment_method": "UPI",
            "bank": "HDFC",
            "failure_code": "BANK_TIMEOUT",
            "hour": 14,
            "action": "RETRY_LATER",
        },
        {
            "success_rate": 0.2,
            "recovery_rate": 0.1,
            "amount": 8000.0,
            "payment_method": "CARD",
            "bank": "SBI",
            "failure_code": "CARD_EXPIRED",
            "hour": 2,
            "action": "RETRY_NOW",
        },
    ])

    y = [1, 0]

    pipeline.fit(X, y)

    probabilities = pipeline.predict_proba(X)

    assert len(probabilities) == 2
    assert probabilities.shape[1] == 2
    assert all(0 <= p <= 1 for p in probabilities[:, 1])
