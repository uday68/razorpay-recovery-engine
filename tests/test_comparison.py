import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.comparison import run_comparison


def test_baseline_and_ai_use_same_payment_batch():
    result = run_comparison(
        customer_count=20,
        payment_count=100,
        seed=42,
    )

    assert result["failed_payments"] > 0

    assert result["baseline"]["actions"] == (
        result["failed_payments"]
    )

    assert result["ai"]["actions"] == (
        result["failed_payments"]
    )

    assert "revenue_difference" in result