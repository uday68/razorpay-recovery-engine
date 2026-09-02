import sys
from pathlib import Path
from statistics import mean, stdev

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from backend.controlled_experiment import run_controlled_experiment
    from ml.model_store import load_model
except ImportError:
    from controlled_experiment import run_controlled_experiment
    from ml.model_store import load_model

def run_stability_experiment(seeds = None,customer_count = 1000,payment_count = 1000):
    if seeds is  None:
        seeds = [1,2,3,4,5]
    model = load_model()
    results =[]
    for seed in seeds:
        result = run_controlled_experiment( customer_count=customer_count,payment_count=payment_count,seed= seed, model=model)
        baseline_revenue = result["baseline"]["recovered_revenue"]
        ai_revenue = result["ai"]["recovered_revenue"]

        improvement= ((ai_revenue - baseline_revenue) /baseline_revenue)*100 if baseline_revenue > 0 else 0.0

        results.append({
            "seed": seed,
            "failed_payments": result["failed_payments"],
            "at_risk_revenue": result["at_risk_revenue"],

            "baseline_revenue": baseline_revenue,
            "ai_revenue": ai_revenue,

            "baseline_recovery_rate": (
                result["baseline"]["recovery_rate"]
            ),
            "ai_recovery_rate": (
                result["ai"]["recovery_rate"]
            ),

            "improvement": improvement,

            "action_counts": result["action_counts"],
        })

    improvements = [ result["improvement"] for result in results]

    return {
        "results" : results,
        "mean_improvement":mean(improvements) if improvements else 0.0,
        "std_improvement":(
            stdev(improvements) if len(improvements) >1 else 0.0
        ),
    }