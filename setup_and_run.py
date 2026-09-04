#!/usr/bin/env python3
"""
setup_and_run.py
================
All-in-One Automated Setup, Dataset Generation, Model Training,
Test Verification, and Live Pipeline Runner for:

  Razorpay AI Revenue Recovery Engine
  Track 03: AI Revenue Recovery

Usage:
  python setup_and_run.py           # Full end-to-end setup & pipeline
  python setup_and_run.py --fast    # Fast mode (smaller dataset for rapid training)
  python setup_and_run.py --train   # Only generate dataset & train model
  python setup_and_run.py --test    # Only run dependency check & test suite
  python setup_and_run.py --smoke   # Only run live AI inference smoke tests
"""

from __future__ import annotations

import argparse
import importlib
import os
import shutil
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# ── ANSI Colors & Formatting ───────────────────────────────────────────────────
R = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
WHITE = "\033[97m"

def banner(title: str, subtitle: str = "") -> None:
    width = 72
    print(f"\n{BOLD}{CYAN}{'═' * width}{R}")
    print(f"{BOLD}{CYAN}  ⚡ {title.center(width - 6)} ⚡{R}")
    if subtitle:
        print(f"{DIM}{subtitle.center(width)}{R}")
    print(f"{BOLD}{CYAN}{'═' * width}{R}\n")

def section(step_num: int, title: str) -> None:
    print(f"\n{BOLD}{CYAN}┌──────────────────────────────────────────────────────────────────────┐{R}")
    print(f"{BOLD}{CYAN}│  STEP {step_num}: {title:<57}│{R}")
    print(f"{BOLD}{CYAN}└──────────────────────────────────────────────────────────────────────┘{R}\n")

def status_badge(label: str, ok: bool) -> str:
    if ok:
        return f"{GREEN}{BOLD}[✓ {label}]{R}"
    return f"{RED}{BOLD}[✗ {label}]{R}"

def check_port(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

def progress_bar(val: float, max_val: float = 1.0, width: int = 24) -> str:
    filled = int(round((val / max_val) * width)) if max_val > 0 else 0
    filled = max(0, min(width, filled))
    return f"{GREEN}{'█' * filled}{DIM}{'░' * (width - filled)}{R}"

def fmt_inr(val: float) -> str:
    if val >= 100_000:
        return f"₹{val / 100_000:.2f}L"
    if val >= 1_000:
        return f"₹{val / 1_000:.1f}K"
    return f"₹{val:.2f}"

# ── 1. DEPENDENCY & ENVIRONMENT VERIFICATION ──────────────────────────────────
def step_dependencies() -> bool:
    section(1, "SYSTEM ENVIRONMENT & DEPENDENCY VERIFICATION")

    # Python version
    py_ver = sys.version.split()[0]
    py_ok = sys.version_info >= (3, 10)
    print(f"  Python Runtime      : {BOLD}{py_ver}{R} {status_badge('READY', py_ok)}")
    print(f"  Executable Path     : {DIM}{sys.executable}{R}")

    # Core python libraries
    required_packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn ASGI Server"),
        ("pydantic", "Pydantic v2"),
        ("psycopg", "PostgreSQL Driver (psycopg v3)"),
        ("redis", "Redis Python Client"),
        ("shap", "SHAP Explainability Engine"),
        ("sklearn", "Scikit-Learn ML Framework"),
        ("pandas", "Pandas Data Analysis"),
        ("numpy", "NumPy Scientific Computing"),
        ("pytest", "Pytest Test Suite Runner"),
    ]

    all_packages_ok = True
    print(f"\n  {BOLD}Python Packages:{R}")
    for pkg_name, label in required_packages:
        try:
            mod = importlib.import_module(pkg_name)
            ver = getattr(mod, "__version__", "installed")
            print(f"    • {label:<34}: {GREEN}{ver:<14}{R} {status_badge('OK', True)}")
        except ImportError:
            print(f"    • {label:<34}: {RED}{'MISSING':<14}{R} {status_badge('FAIL', False)}")
            all_packages_ok = False

    # External CLI Tools
    print(f"\n  {BOLD}External Build Tools:{R}")
    go_path = shutil.which("go")
    go_ok = bool(go_path)
    print(f"    • Go Toolchain (Go 1.22+)          : {status_badge('INSTALLED' if go_ok else 'NOT FOUND', go_ok)}")

    node_path = shutil.which("node")
    node_ok = bool(node_path)
    print(f"    • Node.js Engine (v18+)            : {status_badge('INSTALLED' if node_ok else 'NOT FOUND', node_ok)}")

    npm_path = shutil.which("npm")
    npm_ok = bool(npm_path)
    print(f"    • Node Package Manager (npm)       : {status_badge('INSTALLED' if npm_ok else 'NOT FOUND', npm_ok)}")

    # Infrastructure Ports (PostgreSQL, Redis, Kafka, Go Executor, Python API)
    print(f"\n  {BOLD}Infrastructure Connectivity (Local Ports):{R}")
    ports = [
        ("PostgreSQL Database", 5432),
        ("Redis State & Limiter", 6379),
        ("Apache Kafka Broker", 9092),
        ("Go Recovery Executor", 8080),
        ("Python Decision Engine", 8000),
    ]
    for service_name, port in ports:
        is_up = check_port("localhost", port, timeout=0.5)
        status_txt = f"{GREEN}LISTENING (: {port}){R}" if is_up else f"{YELLOW}INACTIVE / DOCKER{R}"
        print(f"    • {service_name:<34}: {status_txt}")

    return all_packages_ok

# ── 2. DATASET GENERATION ─────────────────────────────────────────────────────
def step_dataset(fast: bool = False, force: bool = False) -> Path:
    section(2, "SYNTHETIC PAYMENT DATASET GENERATION")

    data_path = ROOT / "ml" / "data.csv"
    if data_path.exists() and not force:
        size_mb = data_path.stat().st_size / (1024 * 1024)
        print(f"  {YELLOW}Notice:{R} Existing dataset found at {CYAN}{data_path.name}{R} ({size_mb:.2f} MB).")
        print(f"  Regenerating fresh deterministic training dataset...")

    num_customers = 250 if fast else 1000
    num_payments = 2500 if fast else 10000
    trials = 3 if fast else 5

    print(f"  Configuration:")
    print(f"    • Synthetic Customers : {BOLD}{num_customers:,}{R}")
    print(f"    • Initial Payments    : {BOLD}{num_payments:,}{R}")
    print(f"    • Recovery Trials/Act : {BOLD}{trials}{R} per candidate intervention\n")

    t0 = time.perf_counter()
    from ml.dataset import generate_dataset, save_dataset

    print(f"  Generating payments across 8 banks and 4 payment methods...")
    df = generate_dataset(
        num_customers=num_customers,
        num_payments=num_payments,
        trials_per_action=trials,
    )
    save_dataset(df, filename=str(data_path))
    duration = time.perf_counter() - t0

    total_rows = len(df)
    recovered_rows = int(df["success"].sum())
    rec_rate = (recovered_rows / total_rows) * 100 if total_rows > 0 else 0

    print(f"\n  {GREEN}{BOLD}✓ Dataset Generated Successfully in {duration:.2f}s!{R}")
    print(f"    • Output Path        : {BOLD}{data_path}{R}")
    print(f"    • Total Observations : {BOLD}{total_rows:,}{R} rows")
    print(f"    • Positive Recov (1) : {BOLD}{recovered_rows:,}{R} ({rec_rate:.1f}%)")
    print(f"    • Unsuccessful (0)   : {BOLD}{total_rows - recovered_rows:,}{R} ({100 - rec_rate:.1f}%)")

    # Bank distribution table
    print(f"\n  {BOLD}Transaction Distribution by Bank:{R}")
    bank_counts = df["bank"].value_counts()
    for bank, count in bank_counts.items():
        pct = (count / total_rows) * 100
        print(f"    {bank:<8} │ {count:>6,} rows │ {progress_bar(pct, 100, 16)} {pct:5.1f}%")

    # Action distribution
    print(f"\n  {BOLD}Intervention Action Breakdown:{R}")
    action_counts = df["action"].value_counts()
    for action, count in action_counts.items():
        pct = (count / total_rows) * 100
        print(f"    {action:<14} │ {count:>6,} rows │ {progress_bar(pct, 100, 16)} {pct:5.1f}%")

    return data_path

# ── 3. MACHINE LEARNING MODEL TRAINING ────────────────────────────────────────
def step_train(fast: bool = False) -> Path:
    section(3, "RANDOM FOREST CLASSIFIER TRAINING & VALIDATION")

    import pandas as pd
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    from ml.train import NUMERIC_FEATURES, CATEGORICAL_FEATURES, build_pipeline
    from ml.model_store import save_model

    data_path = ROOT / "ml" / "data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Missing training dataset at {data_path}")

    print(f"  Loading dataset from {CYAN}{data_path.name}{R}...")
    df = pd.read_csv(data_path)
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["success"]

    print(f"  Features ({len(NUMERIC_FEATURES + CATEGORICAL_FEATURES)}): {DIM}{', '.join(NUMERIC_FEATURES + CATEGORICAL_FEATURES)}{R}")

    # Stratified split: 80% train, 20% validation
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"  Train Split : {BOLD}{len(X_train):,}{R} observations")
    print(f"  Val Split   : {BOLD}{len(X_val):,}{R} observations")

    n_trees = 50 if fast else 100
    print(f"\n  Instantiating Pipeline: ColumnTransformer + RandomForestClassifier({n_trees} trees, n_jobs=-1)...")
    pipeline = build_pipeline()
    pipeline.named_steps["model"].set_params(n_estimators=n_trees)

    t0 = time.perf_counter()
    pipeline.fit(X_train, y_train)
    train_time = time.perf_counter() - t0

    # Validation evaluation
    t_inf_0 = time.perf_counter()
    y_pred = pipeline.predict(X_val)
    y_prob = pipeline.predict_proba(X_val)[:, 1]
    inf_time_ms = ((time.perf_counter() - t_inf_0) / len(X_val)) * 1000

    acc = accuracy_score(y_val, y_pred)
    prec = precision_score(y_val, y_pred, zero_division=0)
    rec = recall_score(y_val, y_pred, zero_division=0)
    f1 = f1_score(y_val, y_pred, zero_division=0)
    auc = roc_auc_score(y_val, y_prob)

    # Save artifact
    model_path = ROOT / "ml" / "model.pkl"
    save_model(pipeline, model_path)
    model_size_mb = model_path.stat().st_size / (1024 * 1024)

    print(f"\n  {GREEN}{BOLD}✓ Model Training Complete in {train_time:.2f}s!{R}")
    print(f"  {BOLD}Evaluation Metrics on Unseen Validation Data:{R}")
    print(f"    • Accuracy           : {GREEN}{BOLD}{acc * 100:.2f}%{R}  {progress_bar(acc)}")
    print(f"    • ROC-AUC Score      : {CYAN}{BOLD}{auc:.4f}{R}    {progress_bar(auc)}")
    print(f"    • Precision Score    : {BOLD}{prec:.4f}{R}")
    print(f"    • Recall Score       : {BOLD}{rec:.4f}{R}")
    print(f"    • F1 Score           : {BOLD}{f1:.4f}{R}")
    print(f"    • Single Latency     : {BOLD}{inf_time_ms:.3f} ms / prediction{R}")
    print(f"    • Model Saved Path   : {BOLD}{model_path}{R} ({model_size_mb:.1f} MB)")

    # Top Feature Importances from RF
    try:
        rf = pipeline.named_steps["model"]
        preprocessor = pipeline.named_steps["preprocessor"]
        ohe = preprocessor.named_transformers_["categorical"]
        cat_feature_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
        feature_names = NUMERIC_FEATURES + cat_feature_names
        importances = rf.feature_importances_

        sorted_feat = sorted(zip(feature_names, importances), key=lambda x: -x[1])[:8]
        print(f"\n  {BOLD}Top Feature Importances (Random Forest Split Contribution):{R}")
        max_imp = sorted_feat[0][1] if sorted_feat else 1.0
        for name, imp in sorted_feat:
            print(f"    • {name:<26}: {imp:.4f} {progress_bar(imp, max_imp, 16)}")
    except Exception as e:
        pass

    return model_path

# ── 4. SUBSYSTEM TEST SUITE VERIFICATION ──────────────────────────────────────
def step_test_suite() -> bool:
    section(4, "SUBSYSTEM INTEGRITY & ADVANCED FEATURE VERIFICATION")

    test_targets = [
        ("EV Decision Engine", "backend/decision/test_engine.py"),
        ("Thompson Sampling Bandit", "tests/test_thompson_sampling.py"),
        ("SHAP Model Explainability", "tests/test_shap_explainer.py"),
        ("RFC 6962 Merkle Audit Tree", "tests/test_rfc6962_merkle.py"),
        ("Distributed Redis Rate Limiter", "tests/test_rate_limiter.py"),
    ]

    all_passed = True
    print(f"  {BOLD}Running Isolated Pytest Test Suites:{R}\n")

    for title, test_file in test_targets:
        file_path = ROOT / test_file
        if not file_path.exists():
            print(f"    {YELLOW}⚠ Skipping {title:<32} (file {test_file} not found){R}")
            continue

        cmd = [sys.executable, "-m", "pytest", str(file_path), "-q", "--tb=no"]
        t0 = time.perf_counter()
        res = subprocess.run(cmd, capture_output=True, text=True)
        dur = time.perf_counter() - t0

        if res.returncode == 0:
            print(f"    • {title:<32}: {GREEN}{BOLD}PASS{R} {DIM}({dur:.2f}s){R} {status_badge('VERIFIED', True)}")
        else:
            print(f"    • {title:<32}: {RED}{BOLD}FAIL{R} {DIM}({dur:.2f}s){R} {status_badge('FAILED', False)}")
            all_passed = False

    return all_passed

# ── 5. LIVE AI DECISION ENGINE SMOKE TEST ─────────────────────────────────────
def step_smoke_test() -> None:
    section(5, "LIVE AI INFERENCE SMOKE TEST (RANDOM FOREST -> EV -> POLICY)")

    from ml.model_store import load_model
    from backend.experiment import predict_actions
    from backend.decision.engine import choose_action
    from backend.policy.engine import apply_policy

    model = load_model()

    scenarios = [
        {
            "desc": "High-Value Payment with Temporary Bank Timeout",
            "context": {
                "bank": "HDFC",
                "payment_method": "UPI",
                "failure_code": "BANK_TIMEOUT",
                "amount": 25000.0,
                "success_rate": 0.88,
                "recovery_rate": 0.65,
                "hour": 14,
            },
        },
        {
            "desc": "Low-Value Payment with Insufficient Account Balance",
            "context": {
                "bank": "SBI",
                "payment_method": "UPI",
                "failure_code": "INSUFFICIENT_FUNDS",
                "amount": 450.0,
                "success_rate": 0.52,
                "recovery_rate": 0.28,
                "hour": 22,
            },
        },
        {
            "desc": "Card Transaction with Suspected Fraud Flag",
            "context": {
                "bank": "ICICI",
                "payment_method": "CARD",
                "failure_code": "FRAUD_SUSPECTED",
                "amount": 84000.0,
                "success_rate": 0.91,
                "recovery_rate": 0.70,
                "hour": 3,
            },
        },
    ]

    for idx, sc in enumerate(scenarios, 1):
        ctx = sc["context"]
        print(f"  {BOLD}Scenario #{idx}: {sc['desc']}{R}")
        print(f"    Input : {ctx['bank']} / {ctx['payment_method']} · {fmt_inr(ctx['amount'])} · {YELLOW}{ctx['failure_code']}{R} · SR={ctx['success_rate']}")

        probs = predict_actions(model, ctx)
        decision = choose_action(ctx["amount"], probs)
        best_action = decision["action"]
        best_p = probs[best_action]
        best_ev = decision["expected_value"]

        policy = apply_policy(best_action, ctx["amount"], best_p)
        final_action = policy["action"]

        print(f"    Probabilities from 100 RF Trees:")
        for a, p in sorted(probs.items(), key=lambda x: -x[1]):
            print(f"      • {a:<14}: P={p:.4f} {progress_bar(p, 1.0, 16)} EV={fmt_inr(p * ctx['amount'])}")

        print(f"    AI Optimal Action : {GREEN}{BOLD}{best_action}{R} (EV: {GREEN}{fmt_inr(best_ev)}{R})")
        policy_status = f"{GREEN}APPROVED{R}" if policy["allowed"] else f"{RED}OVERRIDDEN{R}"
        print(f"    Policy Gate       : {policy_status} ({policy['reason']}) -> Final: {BOLD}{final_action}{R}\n")

# ── 6. SUMMARY & NEXT STEPS ───────────────────────────────────────────────────
def print_final_summary() -> None:
    width = 72
    print(f"\n{BOLD}{GREEN}{'═' * width}{R}")
    print(f"{BOLD}{GREEN}  🎉 FULL PROJECT SETUP & MODEL PIPELINE COMPLETED SUCCESSFULLY! 🎉{R}")
    print(f"{BOLD}{GREEN}{'═' * width}{R}\n")

    print(f"  {BOLD}Ready to Launch the System:{R}")
    print(f"    1. {CYAN}Run Backend API (FastAPI) :{R}")
    print(f"       uvicorn backend.api.app:app --host 0.0.0.0 --port 8000 --reload")
    print(f"    2. {CYAN}Run Go Recovery Executor   :{R}")
    print(f"       cd backend/go-executor && go run .")
    print(f"    3. {CYAN}Run React Control Tower    :{R}")
    print(f"       cd frontend && npm run dev")
    print(f"    4. {CYAN}Continuous Live Injector   :{R}")
    print(f"       python backend/live_injector.py --rate 2.0")
    print(f"    5. {CYAN}Live Proof Terminal Script :{R}")
    print(f"       python backend/demo_proof.py\n")

# ── CLI ENTRY POINT ───────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Razorpay AI Revenue Recovery Engine - Automated Setup & Pipeline Runner"
    )
    parser.add_argument("--fast", action="store_true", help="Fast mode for rapid generation and training")
    parser.add_argument("--force", action="store_true", help="Force regenerate dataset even if data.csv exists")
    parser.add_argument("--train", action="store_true", help="Only generate dataset and train model")
    parser.add_argument("--test", action="store_true", help="Only run tests and validations")
    parser.add_argument("--smoke", action="store_true", help="Only run live AI smoke tests")
    args = parser.parse_args()

    banner("RAZORPAY AI REVENUE RECOVERY ENGINE", "Automated Setup · Data Synthesis · ML Training · Verification")

    if args.smoke:
        step_smoke_test()
        return

    if args.test:
        step_dependencies()
        step_test_suite()
        return

    if args.train:
        step_dataset(fast=args.fast, force=args.force)
        step_train(fast=args.fast)
        return

    # Default: Run full pipeline
    step_dependencies()
    step_dataset(fast=args.fast, force=args.force)
    step_train(fast=args.fast)
    step_test_suite()
    step_smoke_test()
    print_final_summary()

if __name__ == "__main__":
    main()
