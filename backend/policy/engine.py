from threading import Lock

from backend.api.schemas import PolicyConfig


_config = PolicyConfig()
_config_lock = Lock()
MIN_RETRY_CONFIDENCE = 0.50


def get_policy_config() -> PolicyConfig:
    with _config_lock:
        return _config.model_copy()


def update_policy_config(config: PolicyConfig) -> PolicyConfig:
    global _config
    with _config_lock:
        _config = config
        return _config.model_copy()

def validate_action( 
        action:str,
        amount:float,
        probability:float,
        expected_value:float | None = None,
        )-> dict:
    config = get_policy_config()
    if not config.auto_recovery_enabled and action != "NO_ACTION":
        return {
            "allowed": False,
            "reason": "Autonomous recovery dispatch is paused",
        }
    if action =="NO_ACTION":
        return { 
            "allowed" :True,
            "reason" : "No money-moving action requested"
        }
    if action in ("RETRY_NOW","RETRY_LATER"):
        if probability < config.recovery_target / 100.0:
            return { 
                "allowed":False,
                "reason" : "Recovery probability below configured retry threshold"
            }
        if expected_value is not None and expected_value < config.ev_floor:
            return {
                "allowed": False,
                "reason": "Expected value below configured EV floor",
            }
    return {
        "allowed":True,
        "reason":"Action satisfies policy"
    }


def apply_policy(action:str,amount:float,probability:float, expected_value:float | None = None) ->dict  :
    validation =  validate_action(action,amount,probability, expected_value)

    if validation["allowed"]:
        return {
            "action" :action,
            "allowed":True,
            "reason":validation["reason"]
        }
    return {
        "action" : "NO_ACTION",
        "allowed":False,
        "reason":validation["reason"]
    }
