import uuid

from datetime import datetime,timezone

def create_recovery_command(payment_id:str,action:str,amount:str)->dict:
    return {
          "command_id": str(uuid.uuid4()),
        "payment_id": payment_id,
        "action": action,
        "amount": amount,
        "created_at": datetime.now(timezone.utc).isoformat(),
    } 
