from simulator.generator import (
    generate_customers,
    generate_payments,
)

from simulator.recovery import execute_recovery


def run_baseline(
    customer_count=1000,
    payment_count=10000,
):

    customers = generate_customers(customer_count)

    payments = generate_payments(
        customers,
        payment_count,
    )

    customer_map = {
        c.id: c
        for c in customers
    }

    failed_payments = [
        p for p in payments
        if p.status == "FAILED"
    ]

    recovered_revenue = 0.0

    for payment in failed_payments:

        customer = customer_map[
            payment.customer_id
        ]

        success = execute_recovery(
            customer,
            payment,
            "RETRY_NOW",
        )

        if success:
            recovered_revenue += payment.amount

    return {
        "failed_payments": len(failed_payments),
        "recovered_revenue": recovered_revenue,
    }