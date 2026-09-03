import responses

from backend.recovery_pipeline import RecoveryPipeline


@responses.activate
def test_pipeline_delegates_execution_to_go_executor(monkeypatch):
    responses.add(
        responses.POST,
        "http://localhost:8080/v1/recovery/execute",
        json={
            "command_id": "cmd-123",
            "payment_id": "payment-123",
            "status": "SUCCESS",
            "action": "RETRY_NOW",
            "recovered": True,
            "retryable": False,
            "outcome": "EXECUTED",
            "attempts": 1,
        },
        status=200,
    )

    pipeline = RecoveryPipeline(
        go_executor_url="http://localhost:8080",
    )

    monkeypatch.setattr(
        pipeline.audit_repository,
        "claim_payment",
        lambda payment_id: True,
    )

    monkeypatch.setattr(
        pipeline.audit_repository,
        "save",
        lambda event: None,
    )

    result = pipeline.process_payment(
        payment_id="payment-123",
        customer_id="customer-123",
        amount=5000,
        failure_code="BANK_TIMEOUT",
        success_rate=0.8,
        recovery_rate=0.6,
        payment_method="UPI",
        bank="HDFC",
    )

    assert result["payment_id"] == "payment-123"
    assert result["recovered"] is True
    assert result["execution_result"]["outcome"] == "EXECUTED"

    assert len(responses.calls) == 1
    assert (
        responses.calls[0].request.url
        == "http://localhost:8080/v1/recovery/execute"
    )