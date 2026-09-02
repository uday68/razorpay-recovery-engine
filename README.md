# Razorpay Recovery Engine

The Razorpay Recovery Engine is a simulated framework and pipeline designed to optimize the recovery of failed payment transactions. It utilizes Machine Learning to predict the best recovery action, a Policy Engine to enforce business rules, and a robust Backend Pipeline for audit trailing and idempotency.

## Project Architecture

The repository is divided into several core modules:

### 1. `simulator/` (Data Generation & Simulation)
Simulates Razorpay customers and payment failures. 
- **`generator.py`**: Generates synthetic, deterministic data for customers and failed payments.
- **`recovery.py`**: Defines the ground-truth probabilities for different recovery actions across various payment failure codes (`BANK_TIMEOUT`, `INSUFFICIENT_FUNDS`, etc.).
- **`models.py`**: Pydantic/dataclass models for `Customer` and `Payment`.

### 2. `ml/` (Machine Learning)
Trains and serves the predictive model.
- **`dataset.py`**: Uses the simulator to build a training dataset (`data.csv`) of payment failures and action success rates.
- **`train.py`**: Trains a `RandomForestClassifier` on the generated dataset to learn non-linear interactions between failure codes and optimal actions.
- **`model_store.py`**: Handles persistence of the trained model (`model.pkl`).

### 3. `backend/` (Core Logic & Production Pipeline)
The primary application backend where the ML model is operationalized.
- **`decision/engine.py`**: Evaluates the probability predictions from the ML model and computes the *Expected Value* of each action (factoring in potential penalties for annoying the customer).
- **`policy/engine.py`**: A rule-based engine that overrides ML decisions when strict business constraints are met (e.g., blocking `RETRY_NOW` for `BANK_TIMEOUT`, or skipping actions for massive transactions to minimize risk).
- **`recovery_pipeline.py`**: The main entry point for processing failed payments. It orchestrates:
  1. Idempotency checks to prevent duplicate processing.
  2. Model prediction and policy evaluation.
  3. Saving the complete audit trail.
  4. Executing the final recovery action.
- **`audit_repository.py`**: Connects to PostgreSQL to store the `recovery_audit` and `recovery_idempotency` records.
- **`controlled_experiment.py` & `comparison.py`**: Tools to run simulated A/B tests comparing the AI Strategy against a Baseline Strategy (e.g., "always retry now") to measure revenue and recovery improvements.

### 4. `tests/` (Test Suite)
Contains comprehensive `pytest` test coverage for:
- Idempotency (`test_pipeline_idempotency.py`)
- Policy Integration (`test_policy_integration.py`, `test_policy.py`)
- Action Dynamics (`test_action_dynamics.py` ensuring the ML model differentiates actions)
- Audit Logs (`test_audit.py`, `test_audit_repository.py`)
- Stability Metrics (`test_stability_metrics.py`)

## Setup & Installation

1. **Install Dependencies:**
   Ensure you have Python 3.12+ installed.
   ```bash
   pip install pandas scikit-learn psycopg pytest
   ```

2. **Database Setup:**
   The `RecoveryPipeline` requires a running PostgreSQL instance.
   ```bash
   # Default connection string used in tests:
   postgresql://recovery:recovery@localhost:5432/recovery_engine
   ```

3. **Train the Model:**
   Generate the dataset and train the ML model.
   ```bash
   python -m ml.dataset
   python -m ml.train
   ```

## Running Tests

Run the full pytest suite from the root directory:
```bash
python -m pytest
```

## Running an Experiment

To compare the AI Recovery Engine's performance against the baseline strategy:
```bash
python -m backend.run_experiment
```
This will output detailed metrics including total recoveries, revenue recovered, policy blocks, and the percentage improvement the AI drove over the baseline.

## Key Features
- **Idempotency**: Prevents the same payment ID from being retried multiple times. If a duplicate is detected, the engine returns the previously `executed_action` without reprocessing.
- **Audit Logging**: Every decision is logged to Postgres, including the AI's predicted probabilities, the expected value, whether the policy engine intervened, and the final executed action.
- **Business Rule Enforcement**: The ML model maximizes recovery probability, but the Policy Engine ensures safe boundaries (e.g., stopping infinite retries or preventing risky high-value automated retries).

