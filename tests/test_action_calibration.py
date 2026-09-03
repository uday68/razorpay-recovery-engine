from datetime import datetime

from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions


def test_model_action_probabilities_are_reasonably_calibrated():
    model = load_model()

    customer = Customer(
        id="calibration-customer",
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

    errors = []

    for failure_code in failure_codes:
        payment = Payment(
            id=f"calibration-{failure_code}",
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

        for action, predicted_probability in predictions.items():
            true_probability = recovery_probablity(
                customer,
                payment,
                action,
            )

            error = abs(predicted_probability - true_probability)
            errors.append(error)

            print(
                f"{failure_code:25} "
                f"{action:15} "
                f"pred={predicted_probability:.2f} "
                f"true={true_probability:.2f} "
                f"error={error:.2f}"
            )

    mean_error = sum(errors) / len(errors)

    print(f"\nMean absolute probability error: {mean_error:.3f}")

    assert mean_error <= 0.20