import json

import psycopg


class AuditRepository:
    def __init__(self,database_url):
        self.database_url = database_url
        self._create_table()

    def _connect(self):
        return psycopg.connect(self.database_url   )

    def _create_table(self,):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                        """
                    CREATE TABLE IF NOT EXISTS recovery_audit (
                        id BIGSERIAL PRIMARY KEY,
                        payment_id TEXT NOT NULL,
                        customer_id TEXT NOT NULL,
                        amount DOUBLE PRECISION NOT NULL,
                        failure_code TEXT,

                        probabilities JSONB NOT NULL,

                        recommended_action TEXT NOT NULL,
                        expected_value DOUBLE PRECISION NOT NULL,

                        policy_allowed BOOLEAN NOT NULL,
                        policy_reason TEXT NOT NULL,

                        executed_action TEXT NOT NULL,
                        timestamp TIMESTAMPTZ NOT NULL
                    );
                    """
                )
    def save(self,event):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                       """
                    INSERT INTO recovery_audit (
                        payment_id,
                        customer_id,
                        amount,
                        failure_code,
                        probabilities,
                        recommended_action,
                        expected_value,
                        policy_allowed,
                        policy_reason,
                        executed_action,
                        timestamp
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s
                    )
                    """,
                    (
                        event["payment_id"],
                        event["customer_id"],
                        event["amount"],
                        event["failure_code"],
                        json.dumps(event["probabilities"]),
                        event["recommended_action"],
                        event["expected_value"],
                        event["policy_allowed"],
                        event["policy_reason"],
                        event["executed_action"],
                        event["timestamp"],
                    ),
                )
    def get_by_payment_id(self, payment_id):
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        payment_id,
                        customer_id,
                        amount,
                        failure_code,
                        probabilities,
                        recommended_action,
                        expected_value,
                        policy_allowed,
                        policy_reason,
                        executed_action,
                        timestamp
                    FROM recovery_audit
                    WHERE payment_id = %s
                    ORDER BY id DESC
                    LIMIT 1
                    """,
                    (payment_id,),
                )

                row = cursor.fetchone()

                if row is None:
                    return None

                return {
                    "payment_id": row[0],
                    "customer_id": row[1],
                    "amount": row[2],
                    "failure_code": row[3],
                    "probabilities": row[4],
                    "recommended_action": row[5],
                    "expected_value": row[6],
                    "policy_allowed": row[7],
                    "policy_reason": row[8],
                    "executed_action": row[9],
                    "timestamp": row[10].isoformat(),
                }