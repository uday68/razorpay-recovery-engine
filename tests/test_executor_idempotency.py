from backend.audit_repository import AuditRepository
from backend.recovery_executor import RecoveryExecutor
import uuid


DATABASE_URL = "postgresql://recovery:recovery@localhost:5432/recovery_engine"


def test_executor_idempotency_survives_executor_restart():
    repository = AuditRepository(DATABASE_URL)

    command = {
        "command_id": f"cmd-persistent-{uuid.uuid4()}",
        "payment_id": f"payment-persistent-{uuid.uuid4()}",
        "action": "RETRY_LATER",
        "amount": 5000,
    }

    executor_1 = RecoveryExecutor(repository)

    first = executor_1.execute(
        command=command,
        customer_success_rate=0.9,
        customer_recovery_rate=0.5,
        failure_code="BANK_TIMEOUT",
    )

    assert first["duplicate"] is False

    # Simulate executor restart.
    executor_2 = RecoveryExecutor(repository)

    second = executor_2.execute(
        command=command,
        customer_success_rate=0.9,
        customer_recovery_rate=0.5,
        failure_code="BANK_TIMEOUT",
    )

    assert second["duplicate"] is True