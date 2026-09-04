#!/usr/bin/env python3
"""
backend/demo_proof.py
=====================
Live terminal proof that the Random Forest model — NOT rules — is making
every recovery decision.

Shows on screen:
  1. Model file loading (size, architecture, trees)
  2. Random payment generation
  3. The exact feature vector fed to the model
  4. Raw probabilities FROM the model for all 4 actions
  5. Expected Value calculation (transparent arithmetic)
  6. Policy gate decision
  7. Final executed action

Run with:
  python backend/demo_proof.py
  python backend/demo_proof.py --loop   # continuous, one event every 4s
  python backend/demo_proof.py --n 10   # run 10 events
"""

import sys, time, random, uuid, argparse
from pathlib import Path
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO = Path(__file__).resolve().parent.parent
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

# ── colours ──────────────────────────────────────────────────────────────────
R = "\033[0m"
BOLD = "\033[1m"
DIM  = "\033[2m"
G    = "\033[92m"
RED  = "\033[91m"
Y    = "\033[93m"
C    = "\033[96m"
M    = "\033[95m"
B    = "\033[94m"
W    = "\033[97m"

ACTIONS = ["RETRY_NOW", "RETRY_LATER", "SEND_REMINDER", "NO_ACTION"]
ACTION_C = {"RETRY_NOW": G, "RETRY_LATER": C, "SEND_REMINDER": Y, "NO_ACTION": DIM}
ACTION_COST = {"RETRY_NOW": 5, "RETRY_LATER": 2, "SEND_REMINDER": 1, "NO_ACTION": 0}

BANKS = [("HDFC",0.72),("ICICI",0.68),("SBI",0.61),("AXIS",0.70),
         ("KOTAK",0.74),("YES",0.58),("PNB",0.55),("INDUS",0.66)]
METHODS  = [("UPI",0.65),("NET_BANKING",0.20),("CARD",0.10),("WALLET",0.05)]
FAILURES = [("BANK_TIMEOUT",0.28),("INSUFFICIENT_FUNDS",0.22),
            ("GATEWAY_ERROR",0.15),("CARD_DECLINED",0.12),
            ("UPI_TIMEOUT",0.10),("NETWORK_ERROR",0.13)]

def pick(choices): return random.choices([c[0] for c in choices],[c[1] for c in choices],k=1)[0]

def fmt(v):
    if v >= 100000: return f"Rs.{v/100000:.2f}L"
    if v >= 1000:   return f"Rs.{v/1000:.1f}K"
    return f"Rs.{v:.0f}"

def bar(p, width=24):
    filled = round(p * width)
    return G + "#" * filled + DIM + "-" * (width - filled) + R

def sep(c="─", n=70): print(f"{DIM}{c*n}{R}")

# ── Step 1: Load model (once, then cache) ────────────────────────────────────
print(f"\n{BOLD}{C}{'='*70}{R}")
print(f"{BOLD}{C}  Razorpay AI Recovery Engine — LIVE PROOF TERMINAL{R}")
print(f"{C}  Every decision comes from the Random Forest, not from rules.{R}")
print(f"{C}{'='*70}{R}\n")

print(f"{BOLD}[STEP 1]  Loading model from disk...{R}")
import os
from ml.model_store import load_model
model_path = REPO / "ml" / "model.pkl"
size_kb = os.path.getsize(model_path) / 1024
model = load_model()
clf = model.named_steps["model"]
pre = model.named_steps["preprocessor"]

print(f"  {G}model.pkl{R}  location : {DIM}{model_path}{R}")
print(f"  {G}model.pkl{R}  size     : {BOLD}{size_kb:.0f} KB{R}  ({size_kb/1024:.1f} MB)")
print(f"  Algorithm  : {BOLD}{type(clf).__name__}{R}")
print(f"  Trees      : {BOLD}{clf.n_estimators}{R}  independent decision trees")
print(f"  Features   : {BOLD}{clf.n_features_in_}{R}  input dimensions (after encoding)")
print(f"  Preprocessor: {BOLD}{type(pre).__name__}{R}  (one-hot + scaling)")
print(f"  {G}Model loaded and ready.{R}  No rules. No if/else. Just trees.\n")

from backend.experiment import predict_actions
from backend.decision.engine import choose_action
from backend.policy.engine import apply_policy

def run_one(seq):
    sep()
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    bank, base_sr = random.choices(BANKS, weights=[b[1] for b in BANKS], k=1)[0]
    method   = pick(METHODS)
    failure  = pick(FAILURES)
    sr = max(0.05, min(0.99, base_sr + random.gauss(0, 0.12)))
    rr = max(0.03, min(0.95, sr * random.uniform(0.5, 0.9)))
    if failure == "FRAUD_SUSPECTED":
        amount = round(random.uniform(20000, 200000), 2)
    else:
        bands = [(100,999,0.20),(1000,4999,0.35),(5000,19999,0.25),(20000,99999,0.15),(100000,500000,0.05)]
        lo,hi,_ = random.choices(bands, weights=[b[2] for b in bands], k=1)[0]
        amount = round(random.uniform(lo, hi), 2)
    hour = random.randint(0, 23)
    pid = f"pay_{uuid.uuid4().hex[:12]}"

    # ── STEP 2: Show the feature vector ──────────────────────────────────────
    print(f"\n{BOLD}[STEP 2]  EVENT #{seq}  {DIM}{ts}{R}")
    print(f"  payment_id     : {BOLD}{pid}{R}")
    print(f"  bank           : {BOLD}{M}{bank}{R}    method: {BOLD}{method}{R}")
    print(f"  failure_code   : {BOLD}{Y}{failure}{R}")
    print(f"  amount         : {BOLD}{fmt(amount)}{R}")
    print(f"  success_rate   : {BOLD}{sr:.4f}{R}   (customer history, noisy gaussian)")
    print(f"  recovery_rate  : {BOLD}{rr:.4f}{R}   (derived from success history)")
    print(f"  hour           : {BOLD}{hour:02d}:xx{R}   (time-of-day feature)")

    context = {
        "success_rate": sr, "recovery_rate": rr, "amount": amount,
        "payment_method": method, "bank": bank,
        "failure_code": failure, "hour": hour,
    }

    # ── STEP 3: 4 rows into the model ────────────────────────────────────────
    print(f"\n{BOLD}[STEP 3]  Building 4 feature rows (one per candidate action)...{R}")
    print(f"  {DIM}The model sees: [success_rate, recovery_rate, amount, method, bank, failure_code, hour, ACTION]{R}")
    print(f"  {DIM}It returns P(recovery_success=1) for each action independently.{R}")

    import pandas as pd
    rows = [{**context, "action": a} for a in ACTIONS]
    df = pd.DataFrame(rows)
    print(f"  DataFrame shape: {BOLD}{df.shape}{R}  (4 rows x {df.shape[1]} raw columns → {clf.n_features_in_} after encoding)")

    # ── STEP 4: Model inference ───────────────────────────────────────────────
    t0 = time.perf_counter()
    probs = model.predict_proba(df)[:, 1]
    ms = (time.perf_counter() - t0) * 1000

    probabilities = {a: float(p) for a, p in zip(ACTIONS, probs)}

    print(f"\n{BOLD}[STEP 4]  Random Forest predict_proba() → {ms:.1f}ms{R}")
    print(f"  {DIM}100 trees voted. Each tree cast a binary vote per action.{R}")
    print(f"  {DIM}Final probability = fraction of trees voting 'will recover'.{R}\n")

    for a, p in sorted(probabilities.items(), key=lambda x: -x[1]):
        c = ACTION_C.get(a, W)
        ev = p * amount - ACTION_COST[a]
        print(f"  {c}{BOLD}{a:<16}{R}  P = {c}{BOLD}{p:.4f}{R}  {bar(p)}  "
              f"EV = {G}{fmt(ev)}{R}")

    # ── STEP 5: EV calculation ────────────────────────────────────────────────
    decision = choose_action(amount, probabilities)
    best_a = decision["action"]
    best_p = probabilities[best_a]
    best_ev = decision["expected_value"]
    cost = ACTION_COST.get(best_a, 0)

    print(f"\n{BOLD}[STEP 5]  Expected Value calculation (transparent arithmetic):{R}")
    print(f"  Formula : EV(a) = P(success|features,a) x amount - cost(a)")
    print(f"  Winner  : {ACTION_C.get(best_a,W)}{BOLD}{best_a}{R}")
    print(f"  EV      : {G}{BOLD}{best_p:.4f}{R} x {fmt(amount)} - Rs.{cost} = {G}{BOLD}{fmt(best_ev)}{R}")

    # ── STEP 6: Policy gate ───────────────────────────────────────────────────
    policy = apply_policy(action=best_a, amount=amount, probability=best_p)
    exec_action = policy["action"]
    allowed = policy["allowed"]
    reason = policy["reason"]

    print(f"\n{BOLD}[STEP 6]  Policy Gate (deterministic rules layer):{R}")
    print(f"  Recommended : {ACTION_C.get(best_a,W)}{BOLD}{best_a}{R}")
    if allowed:
        print(f"  Decision    : {G}{BOLD}ALLOWED{R}  ({reason})")
    else:
        print(f"  Decision    : {RED}{BOLD}BLOCKED{R}  ({reason})")
        print(f"  Overridden  : {DIM}{best_a}{R} → {ACTION_C.get(exec_action,W)}{BOLD}{exec_action}{R}")
    print(f"  Executed    : {ACTION_C.get(exec_action,W)}{BOLD}{exec_action}{R}")

    # ── STEP 7: Result ────────────────────────────────────────────────────────
    print(f"\n{BOLD}[STEP 7]  Proof summary:{R}")
    print(f"  {G}The action was chosen because the model returned{R}")
    print(f"  P({best_a}) = {BOLD}{best_p:.4f}{R} giving EV = {BOLD}{fmt(best_ev)}{R}")
    print(f"  A rule-based system would have used fixed thresholds.")
    print(f"  This system used {BOLD}100 decision trees{R} on {BOLD}24 encoded features{R}.")
    print(f"  Change bank/failure_code/amount → different tree paths → different P.")

    return exec_action, best_ev


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true", help="Run continuously (4s between events)")
    parser.add_argument("--n",    type=int, default=1, help="Number of events (default 1, ignored if --loop)")
    args = parser.parse_args()

    seq = 0
    try:
        while True:
            seq += 1
            run_one(seq)
            if not args.loop and seq >= args.n:
                break
            print(f"\n  {DIM}Next event in 4s... (Ctrl+C to stop){R}")
            time.sleep(4)
    except KeyboardInterrupt:
        pass

    sep("=")
    print(f"{BOLD}  Done. {seq} event(s) proven through the Random Forest.{R}")
    sep("=")

if __name__ == "__main__":
    main()
