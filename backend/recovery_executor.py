from simulator.models import Customer, Payment
from simulator.recovery import recovery_probablity, execute_recovery



class RecoveryExecutor:

    def __init__(self,repository=None):
        self.repository = repository
        self.executed_commands = set()

    def execute(
        self,
        command: dict,
        customer_success_rate: float,
        customer_recovery_rate: float,
        failure_code: str,
    ) -> dict:

        command_id = command["command_id"]

        if self.repository is not None:
            claimed = self.repository.claim_command(command_id)

            if not claimed:
                return {
                    "command_id": command_id,
                    "payment_id": command["payment_id"],
                    "action": command["action"],
                    "duplicate": True,
                }
        else:
            if command_id in self.executed_commands:
                return {
                    "command_id": command_id,
                    "payment_id": command["payment_id"],
                    "action": command["action"],
                    "duplicate": True,
                }

            self.executed_commands.add(command_id)

        customer = Customer(
            id=command["payment_id"],
            successful_payments=1,
            failed_payments=1,
            recovered_payments=0,
        )

        customer.successful_payments = customer_success_rate
        customer.failed_payments = 1 - customer_success_rate
        customer.recovered_payments = (
            customer_recovery_rate * customer.failed_payments
        )

        payment = Payment(
            id=command["payment_id"],
            customer_id=command["payment_id"],
            amount=command["amount"],
            payment_method="UNKNOWN",
            bank="UNKNOWN",
            failure_code=failure_code,
            timestamp=None,
            status="FAILED",
        )

        action = command["action"]

        probability = recovery_probablity(
            customer,
            payment,
            action,
        )

        recovered = execute_recovery(
            customer,
            payment,
            action,
        )

        return {
            "command_id": command_id,
            "payment_id": command["payment_id"],
            "action": action,
            "execution_probability": probability,
            "recovered": recovered,
            "duplicate": False,
        }