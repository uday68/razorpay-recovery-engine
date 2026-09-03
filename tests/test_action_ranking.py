from datetime import datetime

from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions


def make_case(failure_code, payment_method="UPI"):
    customer = Customer(
        id=f"customer-{failure_code}",
        successful_payments=80,
        failed_payments=20,
        recovered_payments=10,
    )

    payment = Payment(
        id=f"payment-{failure_code}",
        customer_id=customer.id,
        amount=5000,
        payment_method=payment_method,
        bank="HDFC",
        failure_code=failure_code,
        timestamp=datetime(2026, 1, 1, 12, 0),
        status="FAILED",
    )

    return customer, payment


def test_model_ranks_actions_across_failure_types():
    model = load_model()

    failure_codes = [
        "BANK_TIMEOUT",
        "NETWORK_ERROR",
        "INSUFFICIENT_FUNDS",
        "CARD_EXPIRED",
        "LIMIT_EXCEEDED",
        "AUTHENTICATION_FAILED",
    ]

    for failure_code in failure_codes:
        customer, payment = make_case(failure_code)

        context = build_context(customer, payment)
        predictions = predict_actions(model, context)

        true_probabilities = {
            action: recovery_probablity(customer, payment, action)
            for action in predictions
        }

        predicted_best = max(predictions, key=predictions.get)
        true_best = max(true_probabilities, key=true_probabilities.get)

        print(f"\n=== {failure_code} ===")
        print("MODEL:", predictions)
        print("TRUE :", true_probabilities)
        print("MODEL BEST:", predicted_best)
        print("TRUE BEST :", true_best)

        assert predicted_best in predictions
        assert true_best in true_probabilities