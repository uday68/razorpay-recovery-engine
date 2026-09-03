from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity


RULE_BASELINE = {
    "BANK_TIMEOUT": "RETRY_NOW",
    "NETWORK_ERROR": "RETRY_NOW",
    "INSUFFICIENT_FUNDS": "SEND_REMINDER",
    "CARD_EXPIRED": "SEND_REMINDER",
    "LIMIT_EXCEEDED": "RETRY_NOW",
    "AUTHENTICATION_FAILED": "SEND_REMINDER",
}


def test_rule_baseline_is_defined_for_all_failure_types():
    customer = Customer(
        id="baseline-customer",
        successful_payments=80,
        failed_payments=20,
        recovered_payments=10,
    )

    for failure_code, action in RULE_BASELINE.items():
        payment = Payment(
            id=f"baseline-{failure_code}",
            customer_id=customer.id,
            amount=5000,
            payment_method="UPI",
            bank="HDFC",
            failure_code=failure_code,
            timestamp=__import__("datetime").datetime(2026, 1, 1, 12, 0),
            status="FAILED",
        )

        probability = recovery_probablity(
            customer,
            payment,
            action,
        )

        print(
            f"{failure_code:25} "
            f"{action:15} "
            f"true_probability={probability:.2f}"
        )

        assert action in {
            "RETRY_NOW",
            "RETRY_LATER",
            "SEND_REMINDER",
            "NO_ACTION",
        }