from fastapi.testclient import TestClient
from backend.decision.engine import expected_value

from .app import app
client = TestClient(app)

def test_recovery_decision_endpoint():
    response  = client.post("/v1/recovery/decide",
        json={
            "event_id": "evt-api-001",
            "event_type": "PAYMENT_FAILED",
            "payment_id": "pay-api-001",
            "customer_id": "cust-api-001",
            "amount": 5000,
            "payment_method": "UPI",
            "bank": "HDFC",
            "failure_code": "BANK_TIMEOUT",
            "timestamp": "2026-09-04T08:00:00Z",
        },
    )
    assert response.status_code == 200
    body = response.json()

    assert body["payment_id"] == "pay-api-001"

    assert body["action"] in {
        "RETRY_NOW",
        "RETRY_LATER",
        "SEND_REMINDER",
        "NO_ACTION"
    }
    assert "probability" in body
    assert "expected_value" in body

def test_recovery_decision_endpoint_uses_real_decision_pipeline():
    response = client.post(
        "/v1/recovery/decide",
        json={
            "event_id": "evt-api-001",
            "event_type": "PAYMENT_FAILED",
            "payment_id": "pay-api-001",
            "customer_id": "cust-api-001",
            "amount": 5000,
            "payment_method": "UPI",
            "bank": "HDFC",
            "failure_code": "BANK_TIMEOUT",
            "timestamp": "2026-09-04T08:00:00Z",
            "success_rate": 0.80,
            "recovery_rate": 0.50,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["payment_id"] == "pay-api-001"
    assert body["action"] in {
        "RETRY_NOW",
        "RETRY_LATER",
        "SEND_REMINDER",
        "NO_ACTION",
    }
    assert 0.0 <= body["probability"] <= 1.0
    assert "expected_value" in body


def test_recovery_decision_endpoint_rejects_invalid_amount():
    response = client.post(
        "/v1/recovery/decide",
        json={
            "event_id": "evt-api-002",
            "event_type": "PAYMENT_FAILED",
            "payment_id": "pay-api-002",
            "customer_id": "cust-api-002",
            "amount": 0,
            "payment_method": "UPI",
            "bank": "HDFC",
            "failure_code": "BANK_TIMEOUT",
            "timestamp": "2026-09-04T08:00:00Z",
            "success_rate": 0.80,
            "recovery_rate": 0.50,
        },
    )

    assert response.status_code == 422


def test_recovery_decision_returns_real_decision_values():
    response = client.post( 
        "/v1/recovery/decide",
        json={
              "event_id": "evt-api-real-001",
            "event_type": "PAYMENT_FAILED",
            "payment_id": "pay-api-real-001",
            "customer_id": "cust-api-real-001",
            "amount": 5000,
            "payment_method": "UPI",
            "bank": "HDFC",
            "failure_code": "BANK_TIMEOUT",
            "timestamp": "2026-09-04T08:00:00Z",
            "success_rate": 0.80,
            "recovery_rate": 0.50,
        }
    )
    assert response.status_code == 200
    body = response.json()

    assert body["payment_id"] == "pay-api-real-001"

    #placeholder implementation return NO_ACTION with zero values.
    #A real model/EV decision should produce a non-trival result.

    assert body["probability"] > 0
    assert body["expected_value"] >0

    assert body["action"] in {
         "RETRY_NOW",
        "RETRY_LATER",
        "SEND_REMINDER",
        "NO_ACTION",
    }