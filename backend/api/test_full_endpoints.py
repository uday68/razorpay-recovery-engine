from fastapi.testclient import TestClient
from backend.api.app import app

client = TestClient(app)

def test_get_recovery_transactions():
    res = client.get("/v1/recovery/transactions?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "payment_id" in data[0]
    assert "amount" in data[0]

def test_get_recovery_transactions_filter_gateway():
    res = client.get("/v1/recovery/transactions?gateway=HDFC")
    assert res.status_code == 200
    data = res.json()
    for item in data:
        assert item["bank"].upper() == "HDFC"

def test_get_audit_detail():
    res = client.get("/v1/recovery/audit/pay_9281a182")
    assert res.status_code == 200
    data = res.json()
    assert data["payment_id"] == "pay_9281a182"
    assert "probabilities" in data
    assert "merkle_leaf_hash" in data

def test_get_overview_summary():
    res = client.get("/v1/analytics/overview-summary")
    assert res.status_code == 200
    data = res.json()
    assert "at_risk_revenue" in data
    assert "recovered_revenue" in data
    assert "recovery_rate" in data
    assert "circuit_breakers" in data
    assert len(data["circuit_breakers"]) == 4

def test_get_mab_experiments():
    res = client.get("/v1/experiments/mab")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ACTIVE_EXPLORATION"
    assert len(data["arms"]) == 3
    assert data["winning_arm"] == "arm-a"

def test_get_ai_model_health():
    res = client.get("/v1/ai/model-health")
    assert res.status_code == 200
    data = res.json()
    assert data["accuracy"] > 0.70
    assert data["roc_auc"] > 0.80
    assert "calibration_curve" in data
    assert len(data["calibration_curve"]) > 0

def test_get_policies():
    res = client.get("/v1/policies")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    assert data[0]["tier"] == "P0"

def test_post_policies_simulate():
    payload = {
        "recovery_target": 65.0,
        "gateway_trip_rate": 12.0,
        "ev_floor": 40.0,
        "max_hops": 3,
        "auto_recovery_enabled": True
    }
    res = client.post("/v1/policies/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "simulated_recovery_rate" in data
    assert "simulated_recovered_revenue" in data
    assert "gateway_protection_score" in data

def test_get_audit_ledger():
    res = client.get("/v1/audit/ledger?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "merkle_root" in data
    assert len(data["entries"]) > 0

def test_get_merkle_proof():
    res = client.get("/v1/audit/proof/pay_9281a182")
    assert res.status_code == 200
    data = res.json()
    assert data["payment_id"] == "pay_9281a182"
    assert data["verified"] is True
