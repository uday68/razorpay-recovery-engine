from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions


def test_model_predictions_are_reasonably_close_to_simulator_probability():
    model = load_model()

    customer = Customer(
        id="calibration-customer",
        successful_payments=80,
        failed_payments=20,
        recovered_payments=10,
    )

    payment = Payment(
        id="calibration-payment",
        customer_id=customer.id,
        amount=5000,
        payment_method="UPI",
        bank="HDFC",
        failure_code="BANK_TIMEOUT",
        timestamp=__import__("datetime").datetime(2026, 1, 1, 12, 0),
        status="FAILED",
    )

    context = build_context(customer, payment)

    predictions = predict_actions(
        model,
        context,
    )

    for action, predicted_probability in predictions.items():
        true_probability = recovery_probablity(
            customer,
            payment,
            action,
        )

        assert abs(
            predicted_probability - true_probability
        ) <=0.30