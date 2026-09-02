

import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from backend.stability import run_stability_experiment
except ImportError:
    from stability import run_stability_experiment

def main():
    results = run_stability_experiment(
        seeds = [1,2,3,4,5],
        customer_count=1000,
        payment_count = 1000,
    )
    print()
    print("="* 70)
    print("             RECOVERY POLICY STABILITY")
    print("="* 70)
    print()

    print(
        f"{'Seed':<8}"
        f"{'Baseline':>20}"
        f"{'AI':>20}"
        f"{'Improvement':>18}"
    )

    print("-" * 70)

    for row in results["results"]:
        print()
        print(f"SEED {row['seed']}")
        print("-" * 70)

        print(f"Failed payments:     {row['failed_payments']:,}")
        print(f"At-risk revenue:     ₹{row['at_risk_revenue']:,.2f}")
        print()

        print(
            f"Baseline recovery:   "
            f"{row['baseline_recovery_rate']:.2%}"
        )

        print(
            f"AI recovery:         "
            f"{row['ai_recovery_rate']:.2%}"
        )

        print(
            f"Baseline revenue:    "
            f"₹{row['baseline_revenue']:,.2f}"
        )

        print(
            f"AI revenue:          "
            f"₹{row['ai_revenue']:,.2f}"
        )

        print(
            f"Improvement:         "
            f"{row['improvement']:.2f}%"
        )

        print()
        print("AI ACTIONS")

        for action, count in row["action_counts"].items():
            print(f"{action:<20} {count:,}")
    print("-" * 70)

    mean_str = f"{results['mean_improvement']:.2f}%"
    std_str = f"{results['std_improvement']:.2f}%"

    print(
        f"{'MEAN':<8}"
        f"{'':>20}"
        f"{'':>20}"
        f"{mean_str:>18}"
    )

    print(
        f"{'STD DEV':<8}"
        f"{'':>20}"
        f"{'':>20}"
        f"{std_str:>18}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()