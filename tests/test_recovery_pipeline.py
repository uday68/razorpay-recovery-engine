from backend.recovery_pipeline import RecoveryPipeline


def test_pipeline_processes_payment_and_persists_audit():
    pipeline = RecoveryPipeline(
        database_url=(
            "postgresql://recovery:recovery"
            "@localhost:5432/recovery_engine"
        )
    )

    import uuid
    payment_id = f"pipeline-test-{uuid.uuid4()}"

    result = pipeline.process_payment(
        payment_id=payment_id,
        customer_id="customer-test-001",
        amount=5000.0,
        failure_code="BANK_TIMEOUT",
        success_rate=0.90,
        recovery_rate=0.60,
        payment_method="UPI",
        bank="HDFC",
        hour=14,
    )

    assert result["payment_id"] == payment_id
    assert result["recommended_action"] in {
        "RETRY_NOW",
        "RETRY_LATER",
        "SEND_REMINDER",
        "NO_ACTION",
    }

    assert "probabilities" in result
    assert "expected_value" in result
    assert "policy_allowed" in result
    assert "executed_action" in result

    count = pipeline.audit_repository.count_by_payment_id(
        payment_id
    )
    assert count == 1

    stored = pipeline.audit_repository.get_by_payment_id(
        payment_id
    )

    assert stored is not None
    assert stored["payment_id"] == payment_id
    assert stored["executed_action"] == result["executed_action"]