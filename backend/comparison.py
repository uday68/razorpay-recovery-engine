import random

from simulator.generator import (
    generate_customers,
    generate_payments,
)

from simulator.recovery import execute_recovery

from ml.model_store import load_model

from backend.decision.engine import choose_action
from backend.experiment import (
    build_context,
    predict_actions,
)


def run_comparison(
    customer_count=1000,
    payment_count=10000,
    seed=42,
):

    random.seed(seed)

    customers = generate_customers(
        customer_count
    )

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

    model = load_model()

    baseline_revenue = 0.0
    ai_revenue = 0.0

    baseline_actions = 0
    ai_actions = 0

    for payment in failed_payments:

        customer = customer_map[
            payment.customer_id
        ]

        # -------------------------
        # BASELINE
        # -------------------------

        random.seed(
            f"baseline-{payment.id}"
        )

        baseline_success = execute_recovery(
            customer,
            payment,
            "RETRY_NOW",
        )

        baseline_actions += 1

        if baseline_success:
            baseline_revenue += payment.amount

        # -------------------------
        # AI ENGINE
        # -------------------------

        context = build_context(
            customer,
            payment,
        )

        probabilities = predict_actions(
            model,
            context,
        )

        decision = choose_action(
            payment.amount,
            probabilities,
        )

        random.seed(
            f"ai-{payment.id}"
        )

        ai_success = execute_recovery(
            customer,
            payment,
            decision["action"],
        )

        ai_actions += 1

        if ai_success:
            ai_revenue += payment.amount

    return {
        "failed_payments": len(failed_payments),

        "baseline": {
            "actions": baseline_actions,
            "recovered_revenue": baseline_revenue,
        },

        "ai": {
            "actions": ai_actions,
            "recovered_revenue": ai_revenue,
        },

        "revenue_difference": (
            ai_revenue - baseline_revenue
        ),
    }