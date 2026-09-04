#!/usr/bin/env python3
"""
backend/live_injector.py
========================
Continuous live payment-failure injector.

Generates realistic randomised PaymentFailedEvents and drives them through
the REAL RecoveryPipeline:

  Random payment data
       ↓
  RecoveryPipeline.process_payment()
       ↓
  Random Forest  →  EV  →  Thompson Sampling  →  Policy Gate
       ↓
  Go Executor (or local executor)
       ↓
  PostgreSQL audit  +  Bandit posterior update

Usage
-----
  python backend/live_injector.py                  # 1 event / 2 s, continuous
  python backend/live_injector.py --rate 0.5       # fast (0.5 s between events)
  python backend/live_injector.py --rate 5         # slow (5 s between events)
  python backend/live_injector.py --count 50       # stop after 50 events
  python backend/live_injector.py --no-go          # skip Go executor

Press Ctrl+C to stop.
"""

import argparse
import random
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Force UTF-8 output so Unicode chars render on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# repo root on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.recovery_pipeline import RecoveryPipeline  # noqa: E402

# ANSI colours
RESET   = "\033[0m"
BOLD    = "\033[1m"
DIM     = "\033[2m"
GREEN   = "\033[92m"
RED     = "\033[91m"
YELLOW  = "\033[93m"
CYAN    = "\033[96m"
MAGENTA = "\033[95m"
BLUE    = "\033[94m"
WHITE   = "\033[97m"

# Realistic payment universe
BANKS = [
    ("HDFC",  0.72),
    ("ICICI", 0.68),
    ("SBI",   0.61),
    ("AXIS",  0.70),
    ("KOTAK", 0.74),
    ("YES",   0.58),
    ("PNB",   0.55),
    ("INDUS", 0.66),
]

METHODS = [
    ("UPI",         0.65),
    ("NET_BANKING", 0.20),
    ("CARD",        0.10),
    ("WALLET",      0.05),
]

FAILURE_CODES = [
    ("BANK_TIMEOUT",       0.28),
    ("INSUFFICIENT_FUNDS", 0.22),
    ("GATEWAY_ERROR",      0.15),
    ("CARD_DECLINED",      0.12),
    ("UPI_TIMEOUT",        0.10),
    ("NETWORK_ERROR",      0.07),
    ("FRAUD_SUSPECTED",    0.04),
    ("ACCOUNT_BLOCKED",    0.02),
]

# (min, max, weight)
AMOUNT_BANDS = [
    (100,    999,    0.20),
    (1000,   4999,   0.35),
    (5000,   19999,  0.25),
    (20000,  99999,  0.15),
    (100000, 500000, 0.05),
]

CUSTOMER_IDS = [f"cust_{i:05d}" for i in range(1, 2001)]

ACTION_COLOUR = {
    "RETRY_NOW":     GREEN,
    "RETRY_LATER":   CYAN,
    "SEND_REMINDER": YELLOW,
    "NO_ACTION":     DIM,
}


def _pick(choices, weights):
    """Pick one item from choices using weights."""
    return random.choices(choices, weights=weights, k=1)[0]


def generate_payment_event():
    """Generate one realistic randomised payment failure event."""
    bank_names = [b[0] for b in BANKS]
    bank_weights = [b[1] for b in BANKS]
    bank_name, base_sr = _pick(BANKS, bank_weights)

    method_names = [m[0] for m in METHODS]
    method_weights = [m[1] for m in METHODS]
    method = _pick(method_names, method_weights)

    fail_names = [f[0] for f in FAILURE_CODES]
    fail_weights = [f[1] for f in FAILURE_CODES]
    failure_code = _pick(fail_names, fail_weights)

    success_rate  = max(0.05, min(0.99, base_sr + random.gauss(0, 0.12)))
    recovery_rate = max(0.03, min(0.95, success_rate * random.uniform(0.5, 0.9)))

    band_weights = [b[2] for b in AMOUNT_BANDS]
    lo, hi, _ = _pick(AMOUNT_BANDS, band_weights)
    amount = round(random.uniform(lo, hi), 2)
    if failure_code == "FRAUD_SUSPECTED":
        amount = round(random.uniform(20000, 200000), 2)

    return {
        "payment_id":     f"pay_{uuid.uuid4().hex[:12]}",
        "customer_id":    random.choice(CUSTOMER_IDS),
        "amount":         amount,
        "payment_method": method,
        "bank":           bank_name,
        "failure_code":   failure_code,
        "success_rate":   round(success_rate, 4),
        "recovery_rate":  round(recovery_rate, 4),
        "hour":           random.randint(0, 23),
    }


def colour_action(action):
    c = ACTION_COLOUR.get(action, WHITE)
    return f"{c}{BOLD}{action}{RESET}"


def colour_outcome(recovered):
    if recovered:
        return f"{GREEN}{BOLD}RECOVERED{RESET}"
    return f"{RED}NOT RECOVERED{RESET}"


def colour_policy(allowed, reason):
    if allowed:
        return f"{GREEN}ALLOWED{RESET} {DIM}({reason}){RESET}"
    return f"{RED}BLOCKED → NO_ACTION{RESET} {DIM}({reason}){RESET}"


def fmt_inr(amount):
    if amount >= 100_000:
        return f"Rs.{amount/100_000:.2f}L"
    if amount >= 1_000:
        return f"Rs.{amount/1_000:.1f}K"
    return f"Rs.{amount:.0f}"


def print_header():
    print(f"\n{BOLD}{CYAN}{'─'*70}{RESET}")
    print(f"{BOLD}{CYAN}  Razorpay AI Recovery Engine  — LIVE INJECTOR{RESET}")
    print(f"{CYAN}{'─'*70}{RESET}")
    print(f"  {DIM}Random data → RF Model → EV → Thompson Sampling → Policy → DB{RESET}")
    print(f"{CYAN}{'─'*70}{RESET}\n")


def print_event(seq, evt, result, elapsed_ms):
    ts        = datetime.now(timezone.utc).strftime("%H:%M:%S")
    action    = result.get("executed_action", "UNKNOWN")
    recommend = result.get("recommended_action", action)
    ev        = result.get("expected_value", 0)
    recovered = result.get("recovered", False)
    policy_ok = result.get("policy_allowed", True)
    reason    = result.get("policy_reason", "")
    probs     = result.get("probabilities", {})
    duplicate = result.get("duplicate", False)

    print(f"{DIM}{'─'*70}{RESET}")
    print(
        f"  {CYAN}#{seq:>4}{RESET}  {DIM}{ts}{RESET}  "
        f"{BOLD}{evt['payment_id']}{RESET}  "
        f"{MAGENTA}{evt['bank']}/{evt['payment_method']}{RESET}  "
        f"{BOLD}{fmt_inr(evt['amount'])}{RESET}"
    )
    print(
        f"         failure: {YELLOW}{evt['failure_code']}{RESET}  "
        f"sr={evt['success_rate']:.2f}  rr={evt['recovery_rate']:.2f}  "
        f"hour={evt['hour']:02d}:xx"
    )

    if duplicate:
        print(f"         {YELLOW}DUPLICATE — idempotency guard fired, skipped{RESET}")
        return

    if probs:
        top = sorted(probs.items(), key=lambda x: -x[1])
        prob_line = "  ".join(f"{a[:6]}:{p:.2f}" for a, p in top)
        print(f"         RF: {CYAN}{prob_line}{RESET}")

    print(
        f"         recommend: {colour_action(recommend)}  "
        f"EV: {GREEN}{fmt_inr(ev)}{RESET}  "
        f"policy: {colour_policy(policy_ok, reason)}"
    )
    print(
        f"         execute:   {colour_action(action)}  "
        f"→ {colour_outcome(recovered)}  "
        f"{DIM}({elapsed_ms:.0f}ms){RESET}"
    )


def print_summary(total, recovered, total_ev, total_amount):
    rec_rate = (recovered / total * 100) if total else 0
    print(f"\n{BOLD}{CYAN}{'='*70}{RESET}")
    print(f"{BOLD}  SESSION SUMMARY{RESET}")
    print(f"  Events injected : {BOLD}{total}{RESET}")
    print(f"  Recovered       : {GREEN}{BOLD}{recovered}{RESET} ({rec_rate:.1f}%)")
    print(f"  At-risk revenue : {fmt_inr(total_amount)}")
    print(f"  Total EV        : {GREEN}{fmt_inr(total_ev)}{RESET}")
    if total:
        print(f"  Avg EV/payment  : {GREEN}{fmt_inr(total_ev/total)}{RESET}")
    print(f"{BOLD}{CYAN}{'='*70}{RESET}\n")


def main():
    parser = argparse.ArgumentParser(description="Live payment failure injector")
    parser.add_argument("--rate",  type=float, default=2.0,
                        help="Seconds between events (default: 2.0)")
    parser.add_argument("--count", type=int,   default=0,
                        help="Stop after N events (0 = infinite)")
    parser.add_argument("--no-go", action="store_true",
                        help="Skip Go executor, use local Python executor")
    parser.add_argument("--db",    default="postgresql://recovery:recovery@localhost:5432/recovery_engine",
                        help="PostgreSQL connection URL")
    args = parser.parse_args()

    go_url = None if args.no_go else "http://localhost:8080"

    print_header()
    print(f"  Rate  : 1 event / {args.rate}s"
          + (f"  |  Stopping after: {args.count}" if args.count else "  |  Ctrl+C to stop"))
    print(f"  Go    : {'ENABLED (localhost:8080)' if not args.no_go else 'DISABLED (local executor)'}\n")

    try:
        pipeline = RecoveryPipeline(database_url=args.db, go_executor_url=go_url)
        print(f"  {GREEN}Pipeline initialised — model loaded, DB connected{RESET}\n")
    except Exception as e:
        print(f"  {RED}Pipeline init failed: {e}{RESET}")
        sys.exit(1)

    seq = 0
    total_recovered = 0
    total_ev = 0.0
    total_amount = 0.0

    try:
        while True:
            seq += 1
            if args.count and seq > args.count:
                break

            evt = generate_payment_event()
            total_amount += evt["amount"]

            t0 = time.perf_counter()
            try:
                result = pipeline.process_payment(
                    payment_id=evt["payment_id"],
                    customer_id=evt["customer_id"],
                    amount=evt["amount"],
                    failure_code=evt["failure_code"],
                    success_rate=evt["success_rate"],
                    recovery_rate=evt["recovery_rate"],
                    payment_method=evt["payment_method"],
                    bank=evt["bank"],
                    hour=evt["hour"],
                )
                elapsed_ms = (time.perf_counter() - t0) * 1000

                if result.get("recovered"):
                    total_recovered += 1
                total_ev += result.get("expected_value", 0)

                print_event(seq, evt, result, elapsed_ms)

            except Exception as e:
                elapsed_ms = (time.perf_counter() - t0) * 1000
                print(f"  {RED}#{seq} ERROR: {e}  ({elapsed_ms:.0f}ms){RESET}")

            time.sleep(args.rate)

    except KeyboardInterrupt:
        pass

    events_done = seq - 1 if not args.count else min(seq, args.count)
    print_summary(events_done, total_recovered, total_ev, total_amount)


if __name__ == "__main__":
    main()
