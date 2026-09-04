from datetime import datetime, timezone


def create_audit_event(
    payment_id,
    customer_id,
    amount,
    failure_code,
    probabilities,
    recommended_action,
    expected_value,
    policy_allowed,
    policy_reason,
    executed_action,
    execution_result=None,
    bank=None,
    payment_method=None,
    event_id=None,
):
    event = {
        "payment_id": payment_id,
        "customer_id": customer_id,
        "amount": amount,
        "failure_code": failure_code,
        "probabilities": probabilities,
        "recommended_action": recommended_action,
        "expected_value": expected_value,
        "policy_allowed": policy_allowed,
        "policy_reason": policy_reason,
        "executed_action": executed_action,
        "bank": bank,
        "payment_method": payment_method,
        "event_id": event_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if execution_result is not None:
        event["outcome"] = execution_result.get("outcome")
        event["attempts"] = execution_result.get("attempts")
        event["recovered"] = execution_result.get("recovered")
        event["retryable"] = execution_result.get("retryable")

    return event