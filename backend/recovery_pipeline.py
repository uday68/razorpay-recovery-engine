from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity, execute_recovery

from ml.model_store import load_model

from backend.audit import create_audit_event
from backend.audit_repository import AuditRepository
from backend.decision.engine import choose_action
from backend.experiment import build_context, predict_actions
from backend.policy.engine import apply_policy


ACTIONS = [
    "RETRY_NOW",
    "RETRY_LATER",
    "SEND_REMINDER",
    "NO_ACTION",
]


class RecoveryPipeline:

    def __init__(self, database_url):
        self.model = load_model()
        self.audit_repository = AuditRepository(database_url)

    def process_payment(
        self,
        payment_id,
        customer_id,
        amount,
        failure_code,
        success_rate,
        recovery_rate,
        payment_method,
        bank,
        hour,
    ):
        claimed = self.audit_repository.claim_payment(
            payment_id
                )

        if not claimed:
            event = self.audit_repository.get_by_payment_id(payment_id)
            return {
                "payment_id": payment_id,
                "duplicate": True,
                "executed_action": event["executed_action"] if event else None,
            }
        customer = Customer(
            id=customer_id,
            successful_payments=round(
                success_rate * 100
            ),
            failed_payments=100,
            recovered_payments=round(
                recovery_rate * 100
            ),
        )

        payment = Payment(
            id=payment_id,
            customer_id=customer_id,
            amount=amount,
            payment_method=payment_method,
            bank=bank,
            failure_code=failure_code,
            timestamp=None,
            status="FAILED",
        )

        context = {
            "success_rate": success_rate,
            "recovery_rate": recovery_rate,
            "amount": amount,
            "payment_method": payment_method,
            "bank": bank,
            "failure_code": failure_code,
            "hour": hour,
        }

        probabilities = predict_actions(
            self.model,
            context,
        )

        decision = choose_action(
            amount,
            probabilities,
        )

        recommended_action = decision["action"]

        selected_probability = probabilities[
            recommended_action
        ]

        policy = apply_policy(
            action=recommended_action,
            amount=amount,
            probability=selected_probability,
        )

        executed_action = policy["action"]

        audit_event = create_audit_event(
            payment_id=payment_id,
            customer_id=customer_id,
            amount=amount,
            failure_code=failure_code,
            probabilities=probabilities,
            recommended_action=recommended_action,
            expected_value=decision["expected_value"],
            policy_allowed=policy["allowed"],
            policy_reason=policy["reason"],
            executed_action=executed_action,
        )

        self.audit_repository.save(
            audit_event
        )

        execution_probability = recovery_probablity(
            customer,
            payment,
            executed_action,
        )

        success = execute_recovery(
            customer,
            payment,
            executed_action,
        )

        return {
            "payment_id": payment_id,
            "recommended_action": recommended_action,
            "probabilities": probabilities,
            "expected_value": decision["expected_value"],
            "policy_allowed": policy["allowed"],
            "policy_reason": policy["reason"],
            "executed_action": executed_action,
            "execution_probability": execution_probability,
            "recovered": success,
        }