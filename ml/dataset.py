import csv
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulator.generator import (
    generate_customers,
    generate_payments,
)
from simulator.recovery import (
    execute_recovery,
)
from simulator.config import ACTION as ACTIONS


def build_dataset(
    customer_count: int = 1000,
    payment_count: int = 10000,
):
    customers = generate_customers(customer_count)
    payments = generate_payments(customers, payment_count)

    customer_map = {
        customer.id: customer
        for customer in customers
    }

    rows = []

    for payment in payments:

        if payment.status != "FAILED":
            continue

        customer = customer_map[payment.customer_id]

        for action in ACTIONS:

            success = execute_recovery(
                customer,
                payment,
                action,
            )

            rows.append(
                {
                    "success_rate": customer.success_rate,
                    "recovery_rate": customer.recovery_rate,
                    "amount": payment.amount,
                    "payment_method": payment.payment_method,
                    "bank": payment.bank,
                    "failure_code": payment.failure_code,
                    "hour": payment.timestamp.hour,
                    "action": action,
                    "success": int(success),
                }
            )

    random.shuffle(rows)

    return rows


def save_dataset(
    rows,
    filename: str = "data.csv",
):
    if not rows:
        return

    fieldnames = rows[0].keys()

    with open(
        filename,
        "w",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":

    rows = build_dataset(
        customer_count=1000,
        payment_count=10000,
    )

    save_dataset(rows)

    print("DATASET GENERATED")
    print("=================")
    print(f"Rows: {len(rows):,}")