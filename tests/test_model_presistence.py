import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.train import train_model
from ml.model_store import save_model, load_model
import pandas as pd

def test_saved_model_can_be_loaded_and_predict():
    model = train_model()

    # Save to a temporary location in the tests directory
    save_path = Path(__file__).parent / "temp_model.pkl"

    save_model(model, save_path)

    loaded_model = load_model(save_path)

    X = pd.DataFrame([{
        "success_rate": 0.8,
        "recovery_rate": 0.5,
        "amount": 2000.0,
        "payment_method": "UPI",
        "bank": "HDFC",
        "failure_code": "BANK_TIMEOUT",
        "hour": 14,
        "action": "RETRY_LATER",
    }])

    probabilities = loaded_model.predict_proba(X)

    assert probabilities.shape == (1, 2)
    
    # Clean up
    save_path.unlink()
