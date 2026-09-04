from datetime import datetime

from pydantic import BaseModel,Field

class RecoveryDecisionRequest(BaseModel):
    event_id: str
    event_type: str
    payment_id: str
    customer_id: str
    amount: float =Field(gt=0)
    payment_method: str
    bank: str
    failure_code: str
    timestamp: datetime
    success_rate: float = Field(default=0.80, ge=0, le=1)
    recovery_rate: float = Field(default=0.50, ge=0, le=1)


class RecoveryDecisionResponse(BaseModel):
    payment_id: str
    action: str
    probability: float
    expected_value: float