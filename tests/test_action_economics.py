from datetime import datetime

from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions


def test_action_economics_across_failure_types():
    model = load_model()

    customer = Customer(
        id="economics-customer",
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

    amount = 5000

    for failure_code in failure_codes:
        payment = Payment(
            id=f"economics-{failure_code}",
            customer_id=customer.id,
            amount=amount,
            payment_method="UPI",
            bank="HDFC",
            failure_code=failure_code,
            timestamp=datetime(2026, 1, 1, 12, 0),
            status="FAILED",
        )

        context = build_context(customer, payment)
        predictions = predict_actions(model, context)

        print(f"\n=== {failure_code} ===")

        for action, predicted_probability in predictions.items():
            true_probability = recovery_probablity(
                customer,
                payment,
                action,
            )

            predicted_value = predicted_probability * amount
            true_value = true_probability * amount

            print(
                f"{action:15} "
                f"pred_p={predicted_probability:.2f} "
                f"true_p={true_probability:.2f} "
                f"pred_EV={predicted_value:.2f} "
                f"true_EV={true_value:.2f}"
            )

        assert len(predictions) == 4