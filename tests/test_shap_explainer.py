"""
Unit Tests for SHAP TreeExplainer Model Explanations.
Verifies mathematical fidelity, efficiency property, and feature attribution structure.
"""
import pytest
from backend.ml_explainer import SHAPExplainer


def test_shap_explainer_initialization():
    """Verify that SHAP TreeExplainer initializes and calculates a legitimate base value."""
    explainer = SHAPExplainer.get_instance()
    assert explainer is not None
    assert 0.0 <= explainer.base_value <= 1.0
    assert len(explainer.feature_names_out) == 24


def test_shap_explanation_structure():
    """Verify that explain() returns complete attribution payload."""
    explainer = SHAPExplainer.get_instance()
    context = {
        "success_rate": 0.85,
        "recovery_rate": 0.60,
        "amount": 2500.0,
        "payment_method": "UPI",
        "bank": "HDFC",
        "failure_code": "BANK_TIMEOUT",
        "hour": 15,
    }
    result = explainer.explain(context, action="RETRY_NOW", payment_id="pay_test_shap_1")

    assert result["payment_id"] == "pay_test_shap_1"
    assert "RandomForestClassifier" in result["model_name"]
    assert 0.0 <= result["output_probability"] <= 1.0
    assert result["prediction_label"] in ("RECOVERY_LIKELY", "RECOVERY_UNLIKELY")
    assert len(result["attributions"]) == 8  # 8 grouped features

    # Check attribution fields and sorting
    ranks = [item["importance_rank"] for item in result["attributions"]]
    assert ranks == list(range(1, 9))

    for item in result["attributions"]:
        assert "feature" in item
        assert "raw_value" in item
        assert "shap_value" in item
        assert item["direction"] in ("POSITIVE", "NEGATIVE")
        if item["direction"] == "POSITIVE":
            assert item["shap_value"] >= 0
        else:
            assert item["shap_value"] < 0


def test_shap_efficiency_property():
    """
    Verify SHAP efficiency axiom:
    Base Value + Sum(SHAP values) == Output Probability (within rounding precision)
    """
    explainer = SHAPExplainer.get_instance()
    context = {
        "success_rate": 0.70,
        "recovery_rate": 0.40,
        "amount": 5000.0,
        "payment_method": "CARD",
        "bank": "ICICI",
        "failure_code": "INSUFFICIENT_FUNDS",
        "hour": 20,
    }
    result = explainer.explain(context, action="RETRY_NOW")

    base_val = result["base_value"]
    shap_sum = sum(item["shap_value"] for item in result["attributions"])
    reconstructed_prob = base_val + shap_sum

    # Rounded to 2 decimal places due to rounding of individual features in API payload
    assert reconstructed_prob == pytest.approx(result["output_probability"], abs=0.01)


def test_shap_different_payment_contexts():
    """Verify explainer operates correctly across different payment methods and failure reasons."""
    explainer = SHAPExplainer.get_instance()

    scenarios = [
        {"payment_method": "WALLET", "bank": "PAYTM", "failure_code": "NETWORK_ERROR"},
        {"payment_method": "NETBANKING", "bank": "SBI", "failure_code": "CARD_EXPIRED"},
    ]

    for sc in scenarios:
        res = explainer.explain(sc, action="SEND_REMINDER")
        assert 0.0 <= res["output_probability"] <= 1.0
        assert len(res["attributions"]) > 0
