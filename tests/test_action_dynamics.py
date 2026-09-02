from simulator.models import Customer,Payment
from simulator.recovery import recovery_probablity
from datetime import datetime

def make_customer():
    return Customer(
        id="customer-1",
        successful_payments=80,
        failed_payments =20,
        recovered_payments=12,
    )

def make_payment(failure_code):
    return Payment(
        id="payment-1",
        customer_id="customer-1",
        amount = 5000,
        payment_method="UPI",
        bank="HDFC",
        failure_code=failure_code,
        timestamp = datetime.now(),
        status="FAILED"
    )

def test_bank_timeout_prefers_retry_later():
    customer = make_customer()
    payment = make_payment("BANK_TIMEOUT")

    retry_later  = recovery_probablity( 
                customer,payment,"RETRY_LATER"
    )
    remainder = recovery_probablity(
        customer,payment,"SEND_REMAINDER"
    )
    assert retry_later >remainder

def test_insufficent_funds_prefers_reminder():
    customer = make_customer()
    payment = make_payment("INSUFFICIENT_FUNDS")

    retry_later = recovery_probablity(
        customer,payment,"RETRY_LATER"
    )
    reminder = recovery_probablity(
        customer,payment,"SEND_REMINDER"
    )
    assert reminder > retry_later


def test_card_expired_prefers_reminder():
    customer = make_customer()
    payment = make_payment("CARD_EXPIRED")

    retry_later = recovery_probablity(
            customer,payment,"RETRY_LATER"
        )
    reminder = recovery_probablity(
            customer,payment,"SEND_REMINDER"
        )
    assert reminder > retry_later



def test_model_can_prefer_different_actions():
    from ml.model_store import load_model

    model = load_model()

    customer = make_customer()

    scenarios = [
        make_payment("BANK_TIMEOUT"),
        make_payment("INSUFFICIENT_FUNDS"),
        make_payment("CARD_EXPIRED"),
    ]

    selected_actions = []

    for payment in scenarios:
        context = {
            "success_rate": customer.success_rate,
            "recovery_rate": customer.recovery_rate,
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "bank": payment.bank,
            "failure_code": payment.failure_code,
            "hour": payment.timestamp.hour,
        }

        probabilities = {}

        import pandas as pd
        for action in [
            "RETRY_NOW",
            "RETRY_LATER",
            "SEND_REMINDER",
            "NO_ACTION",
        ]:
            row = context.copy()
            row["action"] = action

            probabilities[action] = (
                model.predict_proba(pd.DataFrame([row]))[0][1]
            )

        selected_actions.append(
            max(probabilities, key=probabilities.get)
        )

    assert len(set(selected_actions)) >= 2
