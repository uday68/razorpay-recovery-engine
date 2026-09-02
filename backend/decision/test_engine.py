import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from backend.decision.engine import choose_action
except ImportError:
    from engine import choose_action

def test_choose_action_maximizes_expected_value():
    probabilities = {
        "RETRY_NOW": 0.50,
        "RETRY_LATER": 0.8,
        "SEND_REMINDER": 0.60,
        "NO_ACTION": 0.0,
    }
    result = choose_action(
        amount=1000.0,
        probabilities=probabilities,
    )

    assert result['action'] == "RETRY_LATER"
    assert result['expected_value'] > 0
