from simulator.generator import (
    generate_customers,
    generate_payments,
)
from simulator.recovery import execute_recovery
from simulator.config import ACTION as ACTIONS 
from ml.model_store import load_model, save_model

from backend.decision.engine import choose_action
import pandas as pd
import sys
from pathlib import Path

# Add parent directory to path to enable imports from sibling packages
sys.path.insert(0, str(Path(__file__).parent.parent))


FEATURES = [
    "success_rate",
    "recovery_rate",
    "amount",
    "payment_method",
    "bank",
    "failure_code",
    "hour",
]


def build_context(customer,payment):
    return {
        "success_rate": customer.success_rate,
        "recovery_rate": customer.recovery_rate,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "bank": payment.bank,
        "failure_code": payment.failure_code,
        "hour": payment.timestamp.hour,
    }

def predict_actions(model, context):
    rows = [{**context, "action": action} for action in ACTIONS]
    df = pd.DataFrame(rows)
    probs = model.predict_proba(df)[:, 1]
    return {action: float(prob) for action, prob in zip(ACTIONS, probs)}

def run_recovery_experiment(
    customer_count:int =1000,
    payment_count:int =10000,
    model=None,
):
    customers = generate_customers(customer_count)
    payments = generate_payments(customers, payment_count)

    customer_map = {
        c.id:c for c in customers
    }
    if model is None:
        model = load_model()
    failed_payments = [p for p in payments if p.status =="FAILED"]

    recovered_count = 0.0
    recovered_revenue = 0.0
    actions = 0

    if failed_payments:
        contexts = [
            build_context(customer_map[payment.customer_id], payment)
            for payment in failed_payments
        ]
        all_rows = [
            {**ctx, "action": action}
            for ctx in contexts
            for action in ACTIONS
        ]
        df = pd.DataFrame(all_rows)
        all_probs = model.predict_proba(df)[:, 1]
        n_actions = len(ACTIONS)

    for i, payment in enumerate(failed_payments):
        customer = customer_map[payment.customer_id]
        start_idx = i * n_actions
        probs = all_probs[start_idx : start_idx + n_actions]
        probabilities = {
            action: float(prob)
            for action, prob in zip(ACTIONS, probs)
        }
        decision  = choose_action(payment.amount, probabilities)
        action = decision["action"]
        success = execute_recovery(customer,payment,action)

        actions += 1
        if success:
            recovered_revenue += payment.amount
            recovered_count += 1
    
    return {
        "total_payments": len(payments),
        "failed_payments": len(failed_payments),
        "recovered_count": recovered_count,
        "actions": actions,
        "total_recovered_revenue": recovered_revenue,
    }
