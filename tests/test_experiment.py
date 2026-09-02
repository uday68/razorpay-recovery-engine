import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.experiment import run_recovery_experiment
from ml.dataset import build_dataset
from ml.train import build_pipeline
from ml.model_store import save_model
import csv
import pandas as pd

def test_experiment_return_recovery_metrics():
    # Generate training data and train model first
    rows = build_dataset(
        customer_count=50,
        payment_count=200,
    )
    
    # Save data to temp file
    data_path = Path(__file__).parent / "temp_data.csv"
    if rows:
        with open(data_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
    
    # Train and save model to default location
    model_path = Path(__file__).parent.parent / "ml" / "model.pkl"
    df = pd.read_csv(data_path)
    X = df[["success_rate", "recovery_rate", "amount", "payment_method", "bank", "failure_code", "hour", "action"]]
    y = df["success"]
    
    pipeline = build_pipeline()
    pipeline.fit(X, y)
    save_model(pipeline, model_path)
    
    try:
        result = run_recovery_experiment(
            customer_count=50,
            payment_count=200,
        )

        assert result["failed_payments"] > 0
        assert result["recovered_count"] >= 0
        assert result["actions"] == result["failed_payments"]
    finally:
        # Cleanup
        data_path.unlink(missing_ok=True)
