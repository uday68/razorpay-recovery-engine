from backend.recovery_executor import RecoveryExecutor


def test_executor_executes_recovery_command():
    executor = RecoveryExecutor()

    command = {
        "command_id": "cmd-123",
        "payment_id": "payment-123",
        "action": "RETRY_LATER",
        "amount": 5000,
    }

    result = executor.execute(
        command=command,
        customer_success_rate=0.9,
        customer_recovery_rate=0.5,
        failure_code="BANK_TIMEOUT",
    )

    assert result["command_id"] == "cmd-123"
    assert result["payment_id"] == "payment-123"
    assert result["action"] == "RETRY_LATER"

    assert "execution_probability" in result
    assert "recovered" in result