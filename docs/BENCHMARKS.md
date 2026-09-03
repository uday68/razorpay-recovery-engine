# Razorpay Recovery Engine: Benchmark & Performance Tracking

This document serves as the single source of truth for all recovery benchmarks, multi-seed stability evaluations, and comparative analyses across strategies.

---

## 1. Executive Summary & Strategy Matrix

Every transaction is evaluated counterfactually under identical transaction conditions across three strategies:

1. **Always Retry (Naive Baseline):** The legacy approach of immediately retrying all failed payments regardless of failure reason.
2. **Rule-Based (Heuristic Baseline):** An industry-standard static routing policy mapping failure codes to fixed actions (e.g. `BANK_TIMEOUT` -> `RETRY_NOW`, `INSUFFICIENT_FUNDS` -> `SEND_REMINDER`).
3. **AI Decision Engine:** An expected-value optimizing machine learning engine (`RandomForestClassifier` trained on multi-trial distributions) governed by a safety policy engine with idempotency controls.

### End-to-End System Flow

```text
                         ┌──────────────────┐
                         │ Failed Payment   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Feature Context  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ ML Model         │
                         │ P(success|X,A)   │
                         └────────┬─────────┘
                                  │
                            probabilities
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Decision Engine  │
                         │ Expected Value   │
                         └────────┬─────────┘
                                  │
                            recommendation
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Policy Engine    │
                         │ deterministic    │
                         │ guardrails       │
                         └────────┬─────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                    APPROVE                BLOCK
                       │                     │
                       ▼                     ▼
                Recovery Command          NO_ACTION
                       │
                       ▼
                ┌──────────────┐
                │ Go Executor  │
                └──────┬───────┘
                       │
                       ▼
                    Gateway
                       │
                       ▼
                    Outcome
                       │
                       ▼
                Audit + Metrics
```

---

## 2. Multi-Seed Stability Benchmark (5 Random Seeds)

Run via:
```powershell
python backend/run_stability.py
```

### Aggregate Seed Results (1,000 Customers, 10,000 Total Payments per Seed)

| Seed | Failed Payments | At-Risk Revenue | Always Retry (₹) | Rule-Based (₹) | AI Engine (₹) | AI vs Always Retry | AI vs Rule-Based |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 3,020 | ₹15,356,524.82 | ₹5,762,572.32 | ₹7,650,196.15 | **₹8,241,580.83** | **+43.02%** | **+7.73%** |
| **2** | 3,029 | ₹15,432,331.85 | ₹6,064,587.71 | ₹7,909,474.16 | **₹8,413,203.36** | **+38.73%** | **+6.37%** |
| **3** | 3,067 | ₹15,765,172.29 | ₹6,006,345.20 | ₹7,584,962.26 | **₹7,982,195.34** | **+32.90%** | **+5.24%** |
| **4** | 3,058 | ₹15,289,628.01 | ₹5,972,236.83 | ₹7,798,148.73 | **₹8,363,149.63** | **+40.03%** | **+7.25%** |
| **5** | 2,992 | ₹15,315,915.18 | ₹5,857,471.91 | ₹7,543,897.89 | **₹8,121,766.42** | **+38.66%** | **+7.66%** |

---

## 3. Statistical Analysis

### AI vs Always Retry (Naive Benchmark)
* **Mean Revenue Improvement:** **+38.67%**
* **Standard Deviation:** **3.68%**
* **Range:** +32.90% to +43.02%
* **Win Rate:** **100% (5/5 seeds)**

### AI vs Rule-Based (Heuristic Benchmark)
* **Mean Revenue Improvement:** **+6.85%**
* **Standard Deviation:** **1.05%**
* **Range:** +5.24% to +7.73%
* **Win Rate:** **100% (5/5 seeds)**

> **Key Takeaway for Pitch:**  
> The standard deviation of improvement against the Rule-Based strategy is exceptionally tight at **1.05%**. This demonstrates that the AI's advantage is structural and algorithmic, not a product of stochastic variance or favorable seeds.

---

## 4. Single-Batch Controlled Experiment (Detailed Diagnostics)

Run via:
```powershell
python backend/run_experiment.py
```

### Strategy Performance Summary (Seed 42)

| Metric | Always Retry (Naive) | Rule-Based (Heuristic) | AI Decision Engine | AI vs Always Retry | AI vs Rule-Based |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Failed Payments** | 2,978 | 2,978 | 2,978 | - | - |
| **Recovered Count** | 1,173 | 1,529 | **1,616** | **+443 (+37.8%)** | **+87 (+5.7%)** |
| **Recovery Rate** | 39.39% | 51.34% | **54.26%** | **+14.87 pp** | **+2.92 pp** |
| **Recovered Revenue** | ₹6,031,208.04 | ₹7,743,805.85 | **₹8,255,913.70** | **+₹2,224,705.66 (+36.89%)** | **+₹512,107.85 (+6.61%)** |
| **Revenue / Failure** | ₹2,025.25 | ₹2,600.34 | **₹2,772.30** | **+₹747.05** | **+₹171.96** |

---

## 5. AI Action Breakdown & Gateway Load Reduction

A critical advantage of the AI Decision Engine is **operational efficiency** and **gateway health**:

```text
AI Action Distribution:
   RETRY_NOW:          70 ( 2.4%)
   RETRY_LATER:     1,194 (40.1%)
   SEND_REMINDER:   1,365 (45.8%)
   NO_ACTION:         349 (11.7%)
Total Retries:      1,264
```

### Gateway Health Impact:
* **Naive Strategy:** Fires **2,978 immediate retries**, contributing to bank rate-limiting, cascade failures during bank outages, and high transaction gateway fees.
* **AI Engine:** Fires only **70 immediate retries** and schedules **1,194 deferred retries**, reducing peak gateway congestion by **>57%** while recovering **+36.89% more revenue**.

---

## 6. How to Reproduce All Benchmarks

```powershell
# 1. Run full unit and integration tests (62 Python + 46 Go tests)
python -m pytest -v
cd backend/go-executor && go test -v ./... && cd ../..

# 2. Run single controlled 3-way experiment
python backend/run_experiment.py

# 3. Run multi-seed stability evaluation
python backend/run_stability.py
```

