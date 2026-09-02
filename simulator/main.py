from generator import generate_customers, generate_payments
from recovery import  recovery_probablity
from config import ACTION


def main():
    customers = generate_customers(10)
    payments = generate_payments(customers, 50)

    failed = [p for p in payments if p.status == "FAILED"]

    print("PAYMENT SIMULATION REPORT")
    print("============================================")
    print(f"Total Customers: {len(customers)}")
    print(f"Total Payments: {len(payments)}")
    print(f"Total Failed Payments: {len(failed)}")
    print(
        f"Failure Rate: {len(failed) / len(payments):.2%}"
    )

    if failed:
        payment = failed[0]
        customer = next(
            c for c in customers
            if c.id == payment.customer_id
        )

        print("\nRECOVERY TEST")
        print("--------------------------------------------")
        print(f"Payment: {payment.id}")
        print(f"Amount: ₹{payment.amount:.2f}")
        print(f"Failure: {payment.failure_code}")

        for action in ACTION:
            probability = recovery_probablity(
                customer,
                payment,
                action,
            )

            print(
                f"{action:} "
                f"{probability:.2%}"
            )


if __name__ == "__main__":
    main()