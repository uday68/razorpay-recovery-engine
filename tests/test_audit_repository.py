
import sys
import uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.audit_repository import AuditRepository


def test_audit_event_can_be_saved_and_retrieved():
    repository = AuditRepository(
        "postgresql://recovery:recovery@localhost:5432/recovery_engine"
    )

    event = {
        "payment_id": "payment-test-001",
        "customer_id": "customer-test-001",
        "amount": 5000.0,
        "failure_code": "BANK_TIMEOUT",
        "probabilities": {
            "RETRY_NOW": 0.55,
            "RETRY_LATER": 0.75,
            "SEND_REMINDER": 0.30,
            "NO_ACTION": 0.01,
        },
        "recommended_action": "RETRY_LATER",
        "expected_value": 3748.0,
        "policy_allowed": True,
        "policy_reason": "Action satisfies policy",
        "executed_action": "RETRY_LATER",
        "timestamp": "2026-09-02T10:00:00+00:00",
    }

    repository.save(event)

    stored = repository.get_by_payment_id(
        "payment-test-001"
    )

    assert stored is not None
    assert stored["payment_id"] == "payment-test-001"
    assert stored["customer_id"] == "customer-test-001"
    assert stored["amount"] == 5000.0
    assert stored["failure_code"] == "BANK_TIMEOUT"
    assert stored["recommended_action"] == "RETRY_LATER"
    assert stored["policy_allowed"] is True
    assert stored["executed_action"] == "RETRY_LATER"
def test_command_can_be_claimed_only_once():
    repository = AuditRepository(
        "postgresql://recovery:recovery@localhost:5432/recovery_engine"
    )

    command_id = f"repository-command-test-{uuid.uuid4()}"

    first = repository.claim_command(command_id)
    second = repository.claim_command(command_id)

    assert first is True
    assert second is False




def test_audit_repository_persists_execution_result():
    repository = AuditRepository(
        "postgresql://recovery:recovery@localhost:5432/recovery_engine"
    )

    event = {
        "payment_id": "audit-execution-001",
        "customer_id": "customer-123",
        "amount": 5000,
        "failure_code": "BANK_TIMEOUT",
        "probabilities": {
            "RETRY_NOW": 0.6,
            "RETRY_LATER": 0.8,
            "SEND_REMINDER": 0.2,
            "NO_ACTION": 0.0,
        },
        "recommended_action": "RETRY_LATER",
        "expected_value": 3998,
        "policy_allowed": True,
        "policy_reason": "Action satisfies policy",
        "executed_action": "RETRY_LATER",
        "outcome": "EXECUTED",
        "attempts": 2,
        "recovered": True,
        "retryable": False,
        "timestamp": "2026-09-03T12:00:00+00:00",
    }

    repository.save(event)

    stored = repository.get_by_payment_id(
        "audit-execution-001"
    )

    assert stored["outcome"] == "EXECUTED"
    assert stored["attempts"] == 2
    assert stored["recovered"] is True
    assert stored["retryable"] is False