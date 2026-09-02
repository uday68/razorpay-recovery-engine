from backend.recovery_pipeline import RecoveryPipeline


def test_duplicate_payment_is_not_executed_twice():
    pipeline = RecoveryPipeline(
        database_url=(
            "postgresql://recovery:recovery"
            "@localhost:5432/recovery_engine"
        )
    )

    first = pipeline.process_payment(
        payment_id="duplicate-test-001",
        customer_id="customer-test-001",
        amount=5000.0,
        failure_code="BANK_TIMEOUT",
        success_rate=0.90,
        recovery_rate=0.60,
        payment_method="UPI",
        bank="HDFC",
        hour=14,
    )

    second = pipeline.process_payment(
        payment_id="duplicate-test-001",
        customer_id="customer-test-001",
        amount=5000.0,
        failure_code="BANK_TIMEOUT",
        success_rate=0.90,
        recovery_rate=0.60,
        payment_method="UPI",
        bank="HDFC",
        hour=14,
    )

    assert first["payment_id"] == second["payment_id"]

    assert second["duplicate"] is True

    assert first["executed_action"] == second["executed_action"]

    count = pipeline.audit_repository.count_by_payment_id(
        "duplicate-test-001"
    )

    assert count == 1