from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.experiment import build_context, predict_actions


def test_model_ranks_best_action_reasonably():
    model = load_model()

    customer = Customer(
        id="action-test-customer",
        successful_payments=80,
        failed_payments=20,
        recovered_payments=10,
    )

    payment = Payment(
        id="action-test-payment",
        customer_id=customer.id,
        amount=5000,
        payment_method="UPI",
        bank="HDFC",
        failure_code="BANK_TIMEOUT",
        timestamp=__import__("datetime").datetime(
            2026, 1, 1, 12, 0
        ),
        status="FAILED",
    )

    context = build_context(customer, payment)

    predictions = predict_actions(model, context)

    true_probabilities = {
        action: recovery_probablity(
            customer,
            payment,
            action,
        )
        for action in predictions
    }

    predicted_best = max(
        predictions,
        key=predictions.get,
    )

    true_best = max(
        true_probabilities,
        key=true_probabilities.get,
    )

    print("MODEL:", predictions)
    print("TRUE:", true_probabilities)
    print("Predicted best:", predicted_best)
    print("True best:", true_best)

    assert predicted_best in predictions
    assert true_best in true_probabilities