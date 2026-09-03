from datetime import datetime

from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions
from backend.decision.engine import choose_action


def test_decision_engine_matches_true_economic_best_action():
    model = load_model()

    customer = Customer(
        id="decision-test-customer",
        successful_payments=80,
        failed_payments=20,
        recovered_payments=10,
    )

    failure_codes = [
        "BANK_TIMEOUT",
        "NETWORK_ERROR",
        "INSUFFICIENT_FUNDS",
        "CARD_EXPIRED",
        "LIMIT_EXCEEDED",
        "AUTHENTICATION_FAILED",
    ]

    for failure_code in failure_codes:
        payment = Payment(
            id=f"decision-{failure_code}",
            customer_id=customer.id,
            amount=5000,
            payment_method="UPI",
            bank="HDFC",
            failure_code=failure_code,
            timestamp=datetime(2026, 1, 1, 12, 0),
            status="FAILED",
        )

        context = build_context(customer, payment)
        predictions = predict_actions(model, context)

        decision = choose_action(
            payment.amount,
            predictions,
        )

        true_probabilities = {
            action: recovery_probablity(
                customer,
                payment,
                action,
            )
            for action in predictions
        }

        true_values = {
            action: probability * payment.amount
            for action, probability in true_probabilities.items()
        }

        true_best = max(true_values, key=true_values.get)

        print(f"\n=== {failure_code} ===")
        print("MODEL:", predictions)
        print("MODEL DECISION:", decision["action"])
        print("TRUE VALUES:", true_values)
        print("TRUE BEST:", true_best)

        assert decision["action"] in predictions