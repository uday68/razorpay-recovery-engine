"""
Comprehensive Unit & Concurrency Tests for Beta-Bernoulli Thompson Sampling.
"""
import pytest
import threading
from backend.bandit import ThompsonSamplingBandit
from backend.bandit_repository import BanditRepository
from backend.policy.engine import apply_policy, MIN_RETRY_CONFIDENCE


def test_beta_bernoulli_sampling_eligibility():
    """Verify that sampled action is always strictly within eligible_actions."""
    repo = BanditRepository()
    bandit = ThompsonSamplingBandit(repository=repo, random_state=42)

    eligible = ["RETRY_NOW", "SEND_REMINDER"]
    result = bandit.sample_arm(eligible_actions=eligible, amount=1000.0)

    assert result["selected_action"] in eligible
    assert "RETRY_LATER" not in result["sampled_probabilities"]
    assert "NO_ACTION" not in result["sampled_probabilities"]
    for action, prob in result["sampled_probabilities"].items():
        assert 0.0 <= prob <= 1.0


def test_posterior_updates_success_and_failure():
    """Verify conjugate Beta-Bernoulli updating rules."""
    repo = BanditRepository()
    bandit = ThompsonSamplingBandit(repository=repo)

    initial_state = bandit.get_state()
    retry_arm = next(a for a in initial_state["arms"] if a["action"] == "RETRY_NOW")
    init_alpha = retry_arm["alpha"]
    init_beta = retry_arm["beta"]
    init_succ = retry_arm["successes"]
    init_fail = retry_arm["failures"]

    # Success update (reward = 1.0)
    bandit.update("RETRY_NOW", success=True)
    state_after_succ = bandit.get_state()
    arm_after_succ = next(a for a in state_after_succ["arms"] if a["action"] == "RETRY_NOW")

    assert arm_after_succ["alpha"] == pytest.approx(init_alpha + 1.0)
    assert arm_after_succ["beta"] == pytest.approx(init_beta)
    assert arm_after_succ["successes"] == init_succ + 1
    assert arm_after_succ["failures"] == init_fail

    # Failure update (reward = 0.0)
    bandit.update("RETRY_NOW", success=False)
    state_after_fail = bandit.get_state()
    arm_after_fail = next(a for a in state_after_fail["arms"] if a["action"] == "RETRY_NOW")

    assert arm_after_fail["alpha"] == pytest.approx(init_alpha + 1.0)
    assert arm_after_fail["beta"] == pytest.approx(init_beta + 1.0)
    assert arm_after_fail["successes"] == init_succ + 1
    assert arm_after_fail["failures"] == init_fail + 1


def test_policy_gate_cannot_be_bypassed():
    """Verify that deterministic policy gate overrides bandit action if confidence is below threshold."""
    repo = BanditRepository()
    bandit = ThompsonSamplingBandit(repository=repo, random_state=42)

    # Bandit selects RETRY_NOW, but probability is 0.35 (< MIN_RETRY_CONFIDENCE 0.50)
    recommended_action = "RETRY_NOW"
    low_prob = 0.35

    policy_result = apply_policy(
        action=recommended_action,
        amount=1000.0,
        probability=low_prob,
    )

    assert policy_result["allowed"] is False
    assert policy_result["action"] == "NO_ACTION"
    assert "below" in policy_result["reason"].lower()


def test_credible_intervals_validity():
    """Verify that 95% Bayesian credible intervals properly envelope the posterior mean."""
    repo = BanditRepository()
    bandit = ThompsonSamplingBandit(repository=repo)

    state = bandit.get_state()
    assert state["status"] in ("LIVE", "IN_MEMORY")
    assert state["algorithm"] == "Beta-Bernoulli Thompson Sampling"

    for arm in state["arms"]:
        ci = arm["credible_interval_95"]
        assert len(ci) == 2
        assert 0.0 <= ci[0] <= arm["mean_reward"] <= ci[1] <= 1.0


def test_concurrent_posterior_updates():
    """Verify atomic updates under concurrent threads without data loss."""
    repo = BanditRepository()
    bandit = ThompsonSamplingBandit(repository=repo)

    initial_arm = repo.get_all_arms()["SEND_REMINDER"]
    init_pulls = initial_arm["total_pulls"]
    init_succ = initial_arm["successes"]
    init_fail = initial_arm["failures"]

    num_threads = 10
    successes_per_thread = 5
    failures_per_thread = 5

    def worker():
        for _ in range(successes_per_thread):
            bandit.update("SEND_REMINDER", success=True)
        for _ in range(failures_per_thread):
            bandit.update("SEND_REMINDER", success=False)

    threads = [threading.Thread(target=worker) for _ in range(num_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    final_arm = repo.get_all_arms()["SEND_REMINDER"]
    expected_new_succ = num_threads * successes_per_thread
    expected_new_fail = num_threads * failures_per_thread
    expected_new_pulls = expected_new_succ + expected_new_fail

    assert final_arm["successes"] == init_succ + expected_new_succ
    assert final_arm["failures"] == init_fail + expected_new_fail
    assert final_arm["total_pulls"] == init_pulls + expected_new_pulls
