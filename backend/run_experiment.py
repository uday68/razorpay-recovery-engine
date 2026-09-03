import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from backend.controlled_experiment import run_controlled_experiment
except ImportError:
    from controlled_experiment import run_controlled_experiment


def main():
    print("Running Payment Recovery Experiment (1,000 customers, 10,000 payments)...", flush=True)

    result = run_controlled_experiment(
        customer_count=1000,
        payment_count=10000,
        seed=42,
    )

    failed = result["failed_payments"]
    at_risk = result.get("at_risk_revenue", 0.0)

    baseline = result["baseline"]
    rule = result.get("rule_based", {})
    ai = result["ai"]

    print()
    print("=" * 76)
    print("                 3-WAY PAYMENT RECOVERY EXPERIMENT")
    print("=" * 76)
    print(f"Failed Payments:          {failed:,}")
    print(f"At-Risk Revenue:          Rs. {at_risk:,.2f}")
    print()

    # 3-Way Summary Table
    print("-" * 76)
    print(f"{'Metric':<20} {'Always Retry':>18} {'Rule-Based':>18} {'AI Engine':>18}")
    print("-" * 76)

    b_rec = f"{baseline['recoveries']:,}"
    r_rec = f"{rule.get('recoveries', 0):,}"
    a_rec = f"{ai['recoveries']:,}"
    print(f"{'Recoveries':<20} {b_rec:>18} {r_rec:>18} {a_rec:>18}")

    b_rate = f"{baseline['recovery_rate']:.2%}"
    r_rate = f"{rule.get('recovery_rate', 0):.2%}"
    a_rate = f"{ai['recovery_rate']:.2%}"
    print(f"{'Recovery Rate':<20} {b_rate:>18} {r_rate:>18} {a_rate:>18}")

    b_rev = f"Rs. {baseline['recovered_revenue']:,.2f}"
    r_rev = f"Rs. {rule.get('recovered_revenue', 0):,.2f}"
    a_rev = f"Rs. {ai['recovered_revenue']:,.2f}"
    print(f"{'Recovered Revenue':<20} {b_rev:>18} {r_rev:>18} {a_rev:>18}")

    b_rpf = f"Rs. {baseline['revenue_per_failure']:,.2f}"
    r_rpf = f"Rs. {rule.get('revenue_per_failure', 0):,.2f}"
    a_rpf = f"Rs. {ai['revenue_per_failure']:,.2f}"
    print(f"{'Revenue / Failure':<20} {b_rpf:>18} {r_rpf:>18} {a_rpf:>18}")
    print("-" * 76)
    print()

    # Detailed Breakdowns
    print("STRATEGY PERFORMANCE")
    print("=" * 76)

    print("1. BASELINE (Always Retry Now)")
    print(f"   Recovered Revenue:        Rs. {baseline['recovered_revenue']:,.2f}")
    print(f"   Recovery Rate:            {baseline['recovery_rate']:.2%}")
    print(f"   Revenue / Failed Payment: Rs. {baseline['revenue_per_failure']:,.2f}")
    print()

    if rule:
        print("2. RULE-BASED (Heuristic by Failure Code)")
        print(f"   Recovered Revenue:        Rs. {rule['recovered_revenue']:,.2f}")
        print(f"   Recovery Rate:            {rule['recovery_rate']:.2%}")
        print(f"   Revenue / Failed Payment: Rs. {rule['revenue_per_failure']:,.2f}")
        print()

    print("3. AI DECISION ENGINE (ML + Expected Value Policy)")
    print(f"   Recovered Revenue:        Rs. {ai['recovered_revenue']:,.2f}")
    print(f"   Recovery Rate:            {ai['recovery_rate']:.2%}")
    print(f"   Revenue / Failed Payment: Rs. {ai['revenue_per_failure']:,.2f}")
    print()

    # Action Breakdown & Policy
    if "action_counts" in result:
        print("AI ACTION DISTRIBUTION")
        print("-" * 76)
        for action, count in result["action_counts"].items():
            pct = (count / failed * 100) if failed > 0 else 0
            print(f"   {action:<20} {count:>6,} ({pct:>5.1f}%)")
        print()

    if "policy_allowed" in result:
        print()
        print("AI RECOMMENDATIONS")
        print("-" * 68)

        for action, count in result["recommended_action_counts"].items():
            print(
                f"   {action:<20} "
                f"{count:>6,} "
                f"({count / result['failed_payments'] * 100:5.1f}%)"
            )

        print()
        print("AI POLICY OUTCOME")
        print("-" * 68)

        for action, count in result["action_counts"].items():
            print(
                f"   {action:<20} "
                f"{count:>6,} "
                f"({count / result['failed_payments'] * 100:5.1f}%)"
            )
        print()
    # Final Comparison
    diff_baseline = ai["recovered_revenue"] - baseline["recovered_revenue"]
    imp_baseline = (diff_baseline / baseline["recovered_revenue"] * 100) if baseline["recovered_revenue"] > 0 else 0.0

    print("COMPARISON & IMPACT")
    print("=" * 76)
    print(f"   vs Always Retry:          {'+' if diff_baseline >= 0 else ''}Rs. {diff_baseline:,.2f} ({'+' if imp_baseline >= 0 else ''}{imp_baseline:.2f}%)")

    if rule:
        diff_rule = ai["recovered_revenue"] - rule["recovered_revenue"]
        imp_rule = (diff_rule / rule["recovered_revenue"] * 100) if rule["recovered_revenue"] > 0 else 0.0
        print(f"   vs Rule-Based:            {'+' if diff_rule >= 0 else ''}Rs. {diff_rule:,.2f} ({'+' if imp_rule >= 0 else ''}{imp_rule:.2f}%)")

    print("=" * 76)


if __name__ == "__main__":
    main()