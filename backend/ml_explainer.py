"""
SHAP TreeExplainer Module for Recovery Engine Random Forest Pipeline.
Computes genuine Shapley feature attributions mapping directly to payment context features.
"""
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import shap

from ml.model_store import load_model


class SHAPExplainer:
    _instance: Optional["SHAPExplainer"] = None

    @classmethod
    def get_instance(cls) -> "SHAPExplainer":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self, model_pipeline=None):
        self.pipeline = model_pipeline or load_model()
        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.rf_model = self.pipeline.named_steps["model"]
        
        # Initialize TreeExplainer on the Random Forest classifier
        self.explainer = shap.TreeExplainer(self.rf_model)
        self.feature_names_out = list(self.preprocessor.get_feature_names_out())
        
        # Determine expected value for Class 1 (Recovery Success)
        ev = self.explainer.expected_value
        if isinstance(ev, (list, np.ndarray)) and len(ev) > 1:
            self.base_value = float(ev[1])
        else:
            self.base_value = float(ev)

    def explain(
        self,
        context: Dict[str, Any],
        action: str = "RETRY_NOW",
        payment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Computes exact SHAP attributions for the given payment context and candidate action.
        """
        # Ensure complete feature dict
        row_dict = {
            "success_rate": float(context.get("success_rate", 0.8)),
            "recovery_rate": float(context.get("recovery_rate", 0.5)),
            "amount": float(context.get("amount", 1000.0)),
            "payment_method": str(context.get("payment_method", "CARD")),
            "bank": str(context.get("bank", "HDFC")),
            "failure_code": str(context.get("failure_code", "BANK_TIMEOUT")),
            "hour": int(context.get("hour", 12)),
            "action": action,
        }

        df = pd.DataFrame([row_dict])
        transformed = self.preprocessor.transform(df)
        if hasattr(transformed, "toarray"):
            transformed = transformed.toarray()

        shap_explanation = self.explainer(transformed)
        
        # Class 1 (Recovery Success) attributions
        if len(shap_explanation.shape) == 3:
            raw_shap_values = shap_explanation.values[0, :, 1]
        else:
            raw_shap_values = shap_explanation.values[0]

        # Model output probability for Class 1
        predicted_probs = self.rf_model.predict_proba(transformed)[0]
        output_prob = float(predicted_probs[1])

        # Group encoded one-hot columns into meaningful parent feature groups
        # Parent features: success_rate, recovery_rate, amount, hour, payment_method, bank, failure_code, action
        feature_groups: Dict[str, Dict[str, Any]] = {
            "success_rate": {"name": "Customer Success Rate", "raw": row_dict["success_rate"], "shap": 0.0},
            "recovery_rate": {"name": "Customer Historical Recovery Rate", "raw": row_dict["recovery_rate"], "shap": 0.0},
            "amount": {"name": f"Transaction Amount (₹{row_dict['amount']:,.2f})", "raw": row_dict["amount"], "shap": 0.0},
            "hour": {"name": f"Transaction Time ({row_dict['hour']:02d}:00)", "raw": row_dict["hour"], "shap": 0.0},
            "payment_method": {"name": f"Payment Method ({row_dict['payment_method']})", "raw": row_dict["payment_method"], "shap": 0.0},
            "bank": {"name": f"Issuing Bank ({row_dict['bank']})", "raw": row_dict["bank"], "shap": 0.0},
            "failure_code": {"name": f"Error Reason ({row_dict['failure_code']})", "raw": row_dict["failure_code"], "shap": 0.0},
            "action": {"name": f"Recovery Strategy ({row_dict['action']})", "raw": row_dict["action"], "shap": 0.0},
        }

        for fname, val in zip(self.feature_names_out, raw_shap_values):
            clean_name = fname.replace("numeric__", "").replace("categorical__", "")
            matched_group = None
            for gkey in feature_groups:
                if clean_name.startswith(gkey):
                    matched_group = gkey
                    break
            if matched_group:
                feature_groups[matched_group]["shap"] += float(val)

        # Sort feature attributions by absolute impact
        sorted_groups = sorted(
            feature_groups.values(),
            key=lambda item: abs(item["shap"]),
            reverse=True,
        )

        attributions = []
        for idx, item in enumerate(sorted_groups, start=1):
            attributions.append({
                "feature": item["name"],
                "raw_value": item["raw"],
                "shap_value": round(item["shap"], 4),
                "direction": "POSITIVE" if item["shap"] >= 0 else "NEGATIVE",
                "importance_rank": idx,
            })

        prediction_label = "RECOVERY_LIKELY" if output_prob >= 0.50 else "RECOVERY_UNLIKELY"

        return {
            "payment_id": payment_id,
            "model_name": "RandomForestClassifier (100 Estimators)",
            "base_value": round(self.base_value, 4),
            "output_probability": round(output_prob, 4),
            "prediction_label": prediction_label,
            "attributions": attributions,
        }
