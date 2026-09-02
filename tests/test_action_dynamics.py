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
    import pandas as pd
    from ml.model_store import load_model

    model = load_model()

    # Use a neutral customer so failure_code+action signal dominates
    # rather than being swamped by high base success/recovery rates
    customer = Customer(
        id="customer-neutral",
        successful_payments=10,
        failed_payments=10,
        recovered_payments=5,
    )

    scenarios = [
        make_payment("BANK_TIMEOUT"),
        make_payment("INSUFFICIENT_FUNDS"),
        make_payment("CARD_EXPIRED"),
    ]

    actions = ["RETRY_NOW", "RETRY_LATER", "SEND_REMINDER", "NO_ACTION"]

    selected_actions = []

    for payment in scenarios:
        rows = [
            {
                "success_rate": customer.success_rate,
                "recovery_rate": customer.recovery_rate,
                "amount": payment.amount,
                "payment_method": payment.payment_method,
                "bank": payment.bank,
                "failure_code": payment.failure_code,
                "hour": payment.timestamp.hour,
                "action": action,
            }
            for action in actions
        ]
        df = pd.DataFrame(rows)
        probs = model.predict_proba(df)[:, 1]
        best_action = actions[probs.argmax()]
        selected_actions.append(best_action)

    assert len(set(selected_actions)) >= 2, (
        f"Model always picks same action across different failure codes: {selected_actions}"
    )
