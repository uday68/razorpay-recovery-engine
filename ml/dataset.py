import csv
import random
import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulator.generator import (
    generate_customers,
    generate_payments,
)
from simulator.recovery import (
    execute_recovery,
)
from simulator.config import ACTION as ACTIONS


def generate_dataset(
    num_customers: int = 20,
    num_payments: int = 50,
    trials_per_action: int = 5,
    **kwargs,
):
    if "customer_count" in kwargs:
        num_customers = kwargs["customer_count"]
    if "payment_count" in kwargs:
        num_payments = kwargs["payment_count"]

    customers = generate_customers(num_customers)
    payments = generate_payments(customers, num_payments)

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
            for _ in range(trials_per_action):
                success = execute_recovery(
                    customer,
                    payment,
                    action,
                )

                rows.append(
                    {
                        "payment_id": payment.id,
                        "customer_id": customer.id,
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

    return pd.DataFrame(rows)


def build_dataset(
    customer_count: int = 1000,
    payment_count: int = 10000,
):
    df = generate_dataset(
        num_customers=customer_count,
        num_payments=payment_count,
        trials_per_action=1,
    )
    return df.to_dict(orient="records")


def save_dataset(
    rows,
    filename: str = "data.csv",
):
    if isinstance(rows, pd.DataFrame):
        rows.to_csv(filename, index=False)
        return
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
    data_path = Path(__file__).parent / "data.csv"
    df = generate_dataset(
        num_customers=1000,
        num_payments=10000,
        trials_per_action=5,
    )

    save_dataset(df, filename=str(data_path))

    print("DATASET GENERATED")
    print("=================")
    print(f"Rows: {len(df):,}")