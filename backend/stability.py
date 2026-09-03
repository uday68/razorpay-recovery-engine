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
        rule_revenue = result["rule_based"]["recovered_revenue"]
        ai_revenue = result["ai"]["recovered_revenue"]

        baseline_rate = result["baseline"]["recovery_rate"]
        rule_rate = result["rule_based"]["recovery_rate"]
        ai_rate = result["ai"]["recovery_rate"]

        ai_vs_baseline = (
            (ai_revenue - baseline_revenue)
            / baseline_revenue
            * 100
            if baseline_revenue
            else 0.0
        )

        ai_vs_rule = (
            (ai_revenue - rule_revenue)
            / rule_revenue
            * 100
            if rule_revenue
            else 0.0
        )

        results.append({
            "seed": seed,
            "failed_payments": result["failed_payments"],
            "at_risk_revenue": result["at_risk_revenue"],

            "baseline_revenue": baseline_revenue,
            "rule_revenue": rule_revenue,
            "ai_revenue": ai_revenue,

            "baseline_recovery_rate": baseline_rate,
            "rule_recovery_rate": rule_rate,
            "ai_recovery_rate": ai_rate,

            "improvement": ai_vs_baseline,
            "ai_vs_baseline": ai_vs_baseline,
            "ai_vs_rule": ai_vs_rule,

            "action_counts": result["action_counts"],
        })

    baseline_improvements = [r["ai_vs_baseline"] for r in results]
    rule_improvements = [r["ai_vs_rule"] for r in results]

    return {
        "results": results,
        "mean_improvement": mean(baseline_improvements) if baseline_improvements else 0.0,
        "std_improvement": (
            stdev(baseline_improvements) if len(baseline_improvements) > 1 else 0.0
        ),
        "mean_baseline": mean(baseline_improvements) if baseline_improvements else 0.0,
        "std_baseline": (
            stdev(baseline_improvements) if len(baseline_improvements) > 1 else 0.0
        ),
        "mean_ai_rule": mean(rule_improvements) if rule_improvements else 0.0,
        "std_ai_rule": (
            stdev(rule_improvements) if len(rule_improvements) > 1 else 0.0
        ),
        "positive_seeds": sum(v > 0 for v in rule_improvements),
    }