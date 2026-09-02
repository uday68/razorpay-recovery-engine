from backend.decision.engine import choose_action
from backend.policy.engine import apply_policy


def test_highest_value_action_can_be_policy_approved():
    probabilities = {
        "RETRY_NOW": 0.60,
        "RETRY_LATER": 0.75,
        "SEND_REMINDER": 0.40,
        "NO_ACTION": 0.01,
    }

    decision = choose_action(
        amount=5000,
        probabilities=probabilities,
    )

    probability = probabilities[decision["action"]]

    policy = apply_policy(
        action=decision["action"],
        amount=5000,
        probability=probability,
    )

    assert decision["action"] == "RETRY_LATER"
    assert policy["allowed"] is True
    assert policy["action"] == "RETRY_LATER"