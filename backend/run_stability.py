import sys
from pathlib import Path
import statistics

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from backend.controlled_experiment import run_controlled_experiment
    from ml.model_store import load_model
except ImportError:
    from controlled_experiment import run_controlled_experiment
    from ml.model_store import load_model


def main():
    print("Running Recovery Policy Stability Experiment across 5 random seeds...", flush=True)

    seeds = [1, 2, 3, 4, 5]
    model = load_model()

    print()
    print("=" * 78)
    print("                  3-WAY RECOVERY POLICY STABILITY")
    print("=" * 78)
    print(
        f"{'Seed':<10}"
        f"{'Baseline':>15}"
        f"{'Rule-Based':>15}"
        f"{'AI Engine':>15}"
        f"{'AI vs Rule':>14}"
    )
    print("-" * 78)

    baseline_improvements = []
    ai_vs_rule_improvements = []
    seed_details = []

    for seed in seeds:
        result = run_controlled_experiment(
            customer_count=1000,
            payment_count=10000,
            seed=seed,
            model=model,
        )

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

        baseline_improvements.append(ai_vs_baseline)
        ai_vs_rule_improvements.append(ai_vs_rule)

        print(
            f"{seed:<10}"
            f"{baseline_revenue:>15,.2f}"
            f"{rule_revenue:>15,.2f}"
            f"{ai_revenue:>15,.2f}"
            f"{ai_vs_rule:>12.2f}%"
        )

        seed_details.append({
            "seed": seed,
            "failed_payments": result["failed_payments"],
            "at_risk_revenue": result["at_risk_revenue"],
            "baseline_revenue": baseline_revenue,
            "rule_revenue": rule_revenue,
            "ai_revenue": ai_revenue,
            "baseline_recovery_rate": baseline_rate,
            "rule_recovery_rate": rule_rate,
            "ai_recovery_rate": ai_rate,
            "ai_vs_baseline": ai_vs_baseline,
            "ai_vs_rule": ai_vs_rule,
            "action_counts": result["action_counts"],
        })

    print("-" * 78)

    print()
    print("=" * 78)
    print("PER-SEED BREAKDOWN")
    print("=" * 78)

    for row in seed_details:
        print()
        print(f"SEED {row['seed']}")
        print("-" * 78)
        print(f"Failed payments:        {row['failed_payments']:,}")
        print(f"At-risk revenue:        Rs. {row['at_risk_revenue']:,.2f}")
        print(f"Baseline recovery rate: {row['baseline_recovery_rate']:.2%}")
        print(f"Rule recovery rate:     {row['rule_recovery_rate']:.2%}")
        print(f"AI recovery rate:       {row['ai_recovery_rate']:.2%}")
        print(f"Baseline revenue:       Rs. {row['baseline_revenue']:,.2f}")
        print(f"Rule revenue:           Rs. {row['rule_revenue']:,.2f}")
        print(f"AI revenue:             Rs. {row['ai_revenue']:,.2f}")
        print(f"vs Always Retry:        {row['ai_vs_baseline']:+.2f}%")
        print(f"vs Rule-Based:          {row['ai_vs_rule']:+.2f}%")
        print()
        print("AI Actions:")
        for action, count in row["action_counts"].items():
            print(f"   {action:<20} {count:,}")

    mean_baseline = statistics.mean(baseline_improvements)
    std_baseline = statistics.stdev(baseline_improvements)

    mean_ai_rule = statistics.mean(ai_vs_rule_improvements)
    std_ai_rule = statistics.stdev(ai_vs_rule_improvements)

    positive_seeds = sum(
        value > 0
        for value in ai_vs_rule_improvements
    )

    print()
    print("=" * 78)
    print("STABILITY SUMMARY")
    print("=" * 78)

    print(f"AI vs Always Retry")
    print(f"Mean:        {mean_baseline:+.2f}%")
    print(f"Std Dev:     {std_baseline:.2f}%")

    print()

    print(f"AI vs Rule-Based")
    print(f"Mean:        {mean_ai_rule:+.2f}%")
    print(f"Std Dev:     {std_ai_rule:.2f}%")
    print(f"Positive:    {positive_seeds}/5 seeds")
    print("=" * 78)


if __name__ == "__main__":
    main()