MIN_RETRY_CONFIDENCE = 0.50

def validate_action( 
        action:str,
        amount:float,
        probability:float, )-> dict:
    if action =="NO_ACTION":
        return { 
            "allowed" :True,
            "reason" : "No money-moving action requested"
        }
    if action in ("RETRY_NOW","RETRY_LATER"):
        if probability < MIN_RETRY_CONFIDENCE:
            return { 
                "allowed":False,
                "reason" : "Recovery probability below  retry threshold"
            }
    return {
        "allowed":True,
        "reason":"Action satisfies policy"
    }


def apply_policy(action:str,amount:float,probability:float) ->dict  :
    validation =  validate_action(action,amount,probability)

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
