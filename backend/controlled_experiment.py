import random
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from simulator.generator import generate_payments,generate_customers
from simulator.recovery import recovery_probablity
from ml.model_store import load_model
from backend.decision.engine import choose_action
from backend.experiment import build_context,predict_actions

ACTIONS = [
    "RETRY_NOW",
    "RETRY_LATER",
    "SEND_REMINDER",
    "NO_ACTION",
]

def recovery_outcome(payment_id,action, probability):
    """
    generate a deterministic recovery outcome.
    the same payment + action always produces the same outcome,
    allowing baseline and AI startegies  to be compared fairly
    """
    rng = random.Random(f"{payment_id}:{action}")
    return rng.random() < probability


def run_controlled_experiment(
        customer_count = 1000,
        payment_count =10000,
        seed=42,
        model=None,
):
    random.seed(seed)
    customers = generate_customers(customer_count)
    payments = generate_payments(customers,payment_count)

    customer_map = {
        customer.id:customer
        for customer in customers
    }

    failed_payments = [payment for payment in payments if payment.status == "FAILED"]

    at_risk_revenue = sum(payment.amount for payment in failed_payments)

    if model is None:
        model = load_model()
    baseline_recoveries = 0
    baseline_revenue = 0.0

    ai_recoveries =0
    ai_revenue =0.0

    action_counts = {
        action:0
        for action in ACTIONS   
    }
    for payment in failed_payments:
        customer = customer_map[payment.customer_id]
        #------------------------------
        #baseline
        #------------------------------

        baseline_probablity =  recovery_probablity(customer,payment,"RETRY_NOW")
        baseline_success = recovery_outcome(payment.id,"RETRY_NOW",baseline_probablity)


        if baseline_success:
            baseline_recoveries+=1
            baseline_revenue+=payment.amount

        #-----------------------------------
        # AI DECISION
        #-----------------------------------

        context = build_context(customer,payment)

        probabilities = predict_actions(model,context)

        decision  = choose_action(payment.amount,probabilities)

        selected_action  = decision["action"]

        action_counts[selected_action]+=1


        ai_probability = recovery_probablity(customer,payment,selected_action)

        ai_success = recovery_outcome(payment.id,selected_action,ai_probability)

        if  ai_success:
            ai_recoveries+=1
            ai_revenue +=payment.amount


    failed_count = len(failed_payments)

    baseline_recovery_rate = (baseline_recoveries/failed_count if failed_count else 0.0)

    ai_recovery_rate = (ai_recoveries/failed_count if failed_count else 0.0)

    baseline_revenue_per_failure = (baseline_revenue/ failed_count if failed_count else 0.0)

    ai_revenue_per_failure = ( ai_revenue / failed_count
        if failed_count
        else 0.0
    )

    revenue_difference = (ai_revenue - baseline_revenue)

    revenue_improvement = (revenue_difference / baseline_revenue * 100 if baseline_revenue else 0.0)

    recovery_improvement = ((ai_recovery_rate - baseline_recovery_rate)/ baseline_recovery_rate* 100
        if baseline_recovery_rate
        else 0.0)
    
    return {
          "customers": customer_count,
        "payments": payment_count,
        "failed_payments": failed_count,
        "at_risk_revenue": at_risk_revenue,

        "baseline": {
            "recoveries": baseline_recoveries,
            "recovery_rate": baseline_recovery_rate,
            "recovered_revenue": baseline_revenue,
            "revenue_per_failure": baseline_revenue_per_failure,
        },

        "ai": {
            "recoveries": ai_recoveries,
            "recovery_rate": ai_recovery_rate,
            "recovered_revenue": ai_revenue,
            "revenue_per_failure": ai_revenue_per_failure,
        },

        "revenue_difference": revenue_difference,
        "revenue_improvement": revenue_improvement,
        "recovery_improvement": recovery_improvement,

        "action_counts": action_counts,

    }


