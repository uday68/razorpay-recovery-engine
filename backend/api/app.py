from fastapi import FastAPI
from ml.model_store import load_model
from backend.experiment import predict_actions
from backend.decision.engine import choose_action
from backend.policy.engine import apply_policy
from .schemas import RecoveryDecisionRequest, RecoveryDecisionResponse

app = FastAPI(
    title="Recovery Decision API",
    version="1.0.0",
)

model = load_model()


@app.post(
    "/v1/recovery/decide",
    response_model=RecoveryDecisionResponse,
)
def decide_recovery(
    request: RecoveryDecisionRequest,
) -> RecoveryDecisionResponse:
    hour = request.timestamp.hour if request.timestamp else 0

    context = {
        "success_rate": request.success_rate,
        "recovery_rate": request.recovery_rate,
        "amount": request.amount,
        "payment_method": request.payment_method,
        "bank": request.bank,
        "failure_code": request.failure_code,
        "hour": hour,
    }

    probabilities = predict_actions(model, context)
    decision = choose_action(request.amount, probabilities)
    recommended_action = decision["action"]
    selected_probability = probabilities[recommended_action]

    policy = apply_policy(
        action=recommended_action,
        amount=request.amount,
        probability=selected_probability,
    )
    final_action = policy["action"]
    final_prob = probabilities.get(final_action, selected_probability)
    final_ev = decision["expected_value"]

    return RecoveryDecisionResponse(
        payment_id=request.payment_id,
        action=final_action,
        probability=float(final_prob),
        expected_value=float(final_ev),
    )