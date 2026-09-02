import pandas as pd
from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


NUMERIC_FEATURES = [
    "success_rate",
    "recovery_rate",
    "amount",
    "hour",
]

CATEGORICAL_FEATURES = [
    "payment_method",
    "bank",
    "failure_code",
    "action",
]


def build_pipeline():
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                StandardScaler(),
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    model = LogisticRegression(
        max_iter=1000
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def load_dataset(path=None):
    if path is None:
        # Resolve path relative to this module's location
        path = Path(__file__).parent / "data.csv"
    return pd.read_csv(path)


def train_model(path=None):
    df = load_dataset(path)

    X = df[
        NUMERIC_FEATURES +
        CATEGORICAL_FEATURES
    ]

    y = df["success"]
    

    pipeline = build_pipeline()

    pipeline.fit(X, y)

    return pipeline

if __name__ == "__main__":
    model = train_model()
    save_path = Path(__file__).parent / "model.pkl"
    try:
        from .model_store import save_model
    except ImportError:
        from model_store import save_model
    save_model(model, save_path)
    print("Model trained successfully.")