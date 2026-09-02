# from backend.policy.engine import validate_action

# def test_policy_rejects_low_confidence_retry():
#     result = validate_action(
#         action = "RETRY_NOW",
#         amount = 10000,
#         probability=0.30
#     )
#     assert result["allowed"] is False

# def test_policy_allows_high_confidence_retry():
#     result = validate_action(
#         action="RETRY_LATER",
#         amount=10000,
#         probability=0.80
#     )
#     assert result["allowed"] is True


from backend.policy.engine import apply_policy


def test_policy_returns_original_action_when_allowed():
    result = apply_policy(
        action="RETRY_LATER",
        amount=5000,
        probability=0.80,
    )

    assert result["action"] == "RETRY_LATER"
    assert result["allowed"] is True


def test_policy_falls_back_when_action_is_rejected():
    result = apply_policy(
        action="RETRY_NOW",
        amount=5000,
        probability=0.20,
    )

    assert result["action"] == "NO_ACTION"
    assert result["allowed"] is False