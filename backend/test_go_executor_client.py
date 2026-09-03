import responses

from backend.go_executor_client import GoExecutorClient


@responses.activate
def test_go_executor_client_executes_recovery_command():
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

    client = GoExecutorClient("http://localhost:8080")

    result = client.execute(
        {
            "command_id": "cmd-123",
            "payment_id": "payment-123",
            "action": "RETRY_NOW",
            "amount": 5000,
        }
    )

    assert result["payment_id"] == "payment-123"
    assert result["status"] == "SUCCESS"
    assert result["outcome"] == "EXECUTED"
    assert result["recovered"] is True
    assert result["attempts"] == 1

