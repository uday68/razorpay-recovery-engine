from backend.recovery_pipeline import RecoveryPipeline
from dotenv import load_dotenv
load_dotenv()
import os

from datetime import datetime
def test_pipeline_returns_recovery_command():
    pipeline = RecoveryPipeline(os.getenv("DATABASE_URL"))

    import uuid
    payment_id = f"payment-command-{uuid.uuid4()}"
    result = pipeline.process_payment(
        payment_id=payment_id,
        customer_id="customer-1",
        amount=5000,
        success_rate=0.9,
        recovery_rate=0.5,
        payment_method="UPI",
        bank="HDFC",
        failure_code="BANK_TIMEOUT",
        hour=14
    )

    assert result["duplicate"] is False

    assert "recovery_command" in result

    command = result["recovery_command"]

    assert command["payment_id"] == payment_id
    assert command["amount"] == 5000
    assert command["action"] == result["executed_action"]
    assert "command_id" in command
    assert "created_at" in command