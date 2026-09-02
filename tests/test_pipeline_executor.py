from backend.recovery_pipeline import RecoveryPipeline


def test_pipeline_uses_recovery_executor():
    pipeline = RecoveryPipeline()

    import uuid
    payment_id = f"payment-executor-{uuid.uuid4()}"

    result = pipeline.process_payment(
        payment_id=payment_id,
        customer_id="customer-1",
        amount=5000,
        success_rate=0.9,
        recovery_rate=0.5,
        payment_method="UPI",
        bank="HDFC",
        failure_code="BANK_TIMEOUT",
        hour=14,
    )

    assert result["duplicate"] is False

    assert "execution_result" in result

    execution = result["execution_result"]

    assert execution["payment_id"] == payment_id
    assert execution["action"] == result["executed_action"]
    assert "execution_probability" in execution
    assert "recovered" in execution