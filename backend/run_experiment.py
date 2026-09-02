import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from comparison import run_comparison

def main():
    result = run_comparison(
        customer_count=1000,
        payment_count=10000,
        seed = 42
    )
    failed = result["failed_payments"]

    baseline = result["baseline"]
    ai = result["ai"]

    baseline_rate =  ( baseline["recovered_revenue"]/failed)

    ai_rate = (ai["recovered_revenue"]/failed)

    difference = result["revenue_difference"]

    print()
    print("="*55)
    print("                  PAYMENT RECOVERY EXPERIMENT")
    print("="*55)

    print(f"failed payments:{failed:,}")
    print()
    print("BASELINE")
    print("="*55)
    print(f"Revenue/failed payment :"f"{baseline_rate:,.2f}")

    print()
    print("AI DECISION ENGINE")
    print("="*55)

    print(f"Recovered Revenue:" f"{ai_rate:,.2f}")

    print()

    print("RESULT")
    print("="*55)

    print(
        f"Additional Revenue"
        f"{difference:,.2f}"
    )
    if baseline["recovered_revenue"] >0:
        improvement = (
            difference / baseline["recovered_revenue"] * 100
        )
        print(
            f"imporvement"
            f"{improvement:.2f}%"
        )
    print("="*55)

if __name__ == "__main__":
    main()