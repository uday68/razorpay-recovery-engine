import joblib
from pathlib import Path


def save_model(model, filename=None):
    if filename is None:
        filename = Path(__file__).parent / "model.pkl"
    joblib.dump(model, filename)

def load_model(filename=None):
    if filename is None:
        filename = Path(__file__).parent / "model.pkl"
    return joblib.load(filename)