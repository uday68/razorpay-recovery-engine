from backend.recovery_command import create_recovery_command


def test_recovery_command_contains_execution_details():
    command = create_recovery_command(
        payment_id="payment-123",
        action="RETRY_LATER",
        amount=5000,
    )

    assert command["payment_id"] == "payment-123"
    assert command["action"] == "RETRY_LATER"
    assert command["amount"] == 5000

    assert "command_id" in command
    assert "created_at" in command