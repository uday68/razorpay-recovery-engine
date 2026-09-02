from datetime import datetime,timezone


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
        executed_action ):
    return { 
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
        "timestamp": datetime.now(timezone.utc).isoformat(),
    

    }