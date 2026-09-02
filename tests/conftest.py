"""
Pytest configuration and fixtures.
Sets up required models and data before tests run.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from ml.dataset import build_dataset
from ml.train import build_pipeline
from ml.model_store import save_model
import pandas as pd
import csv


@pytest.fixture(scope="session", autouse=True)
def setup_model():
    """
    Generate training data and train model before running tests.
    This ensures all tests have a valid model to load.
    """
    model_path = Path(__file__).parent.parent / "ml" / "model.pkl"
    
    # Only train if model doesn't exist
    if not model_path.exists():
        print("\n[Setup] Training model for tests...")
        
        # Generate training data
        rows = build_dataset(
            customer_count=500,
            payment_count=5000,
        )
        
        # Save data to temp file
        data_path = Path(__file__).parent / "temp_training_data.csv"
        if rows:
            with open(data_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
        
        # Load data and train model
        df = pd.read_csv(data_path)
        X = df[["success_rate", "recovery_rate", "amount", "payment_method", "bank", "failure_code", "hour", "action"]]
        y = df["success"]
        
        pipeline = build_pipeline()
        pipeline.fit(X, y)
        
        # Save model
        model_path.parent.mkdir(parents=True, exist_ok=True)
        save_model(pipeline, model_path)
        
        print(f"[Setup] Model trained and saved to {model_path}")
        
        # Cleanup temp data
        data_path.unlink(missing_ok=True)
    else:
        print(f"\n[Setup] Model already exists at {model_path}, skipping training")
    
    # Yield to allow tests to run
    yield
    
    # Optional: cleanup after all tests (comment out if you want to keep the model)
    # model_path.unlink(missing_ok=True)
