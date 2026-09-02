ACTION_COSTS = {
    "RETRY_NOW": 2.0,
    "RETRY_LATER": 2.0,
    "SEND_REMINDER": 1.0,
    "NO_ACTION": 0.0,
}


def expected_value(
    probability: float,
    amount: float,
    action: str,
) -> float:

    recovery_value = probability * amount
    cost = ACTION_COSTS[action]

    return recovery_value - cost


def choose_action(
    amount: float,
    probabilities: dict[str, float],
) -> dict:

    values = {}

    for action, probability in probabilities.items():
        values[action] = expected_value(
            probability,
            amount,
            action,
        )

    best_action = max(
        values,
        key=values.get,
    )

    return {
        "action": best_action,
        "expected_value": values[best_action],
        "all_values": values,
    }