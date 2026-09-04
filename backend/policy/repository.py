import json
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

import psycopg

from backend.api.schemas import PolicyConfig


class PolicyConfigRepository:
    def __init__(self, database_url: Optional[str] = None, local_path: Optional[str] = None):
        self.database_url = database_url or os.getenv(
            "POLICY_DATABASE_URL",
            "postgresql://recovery:recovery@localhost:5432/recovery_engine",
        )
        default_path = Path(__file__).resolve().parents[2] / ".runtime" / "policy_config.json"
        self.local_path = Path(local_path or os.getenv("POLICY_CONFIG_PATH", str(default_path)))
        self._lock = Lock()
        self._db_available: Optional[bool] = None

    def _connect(self):
        return psycopg.connect(self.database_url)

    def _ensure_table(self) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS policy_threshold_history (
                        id BIGSERIAL PRIMARY KEY,
                        recovery_target DOUBLE PRECISION NOT NULL,
                        gateway_trip_rate DOUBLE PRECISION NOT NULL,
                        ev_floor DOUBLE PRECISION NOT NULL,
                        max_hops INTEGER NOT NULL,
                        auto_recovery_enabled BOOLEAN NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        source TEXT NOT NULL DEFAULT 'control_tower'
                    )
                    """
                )
            connection.commit()

    def _read_local(self) -> Optional[PolicyConfig]:
        try:
            with self.local_path.open("r", encoding="utf-8") as handle:
                return PolicyConfig(**json.load(handle))
        except (FileNotFoundError, OSError, TypeError, ValueError):
            return None

    def _write_local(self, config: PolicyConfig) -> None:
        try:
            self.local_path.parent.mkdir(parents=True, exist_ok=True)
            payload = config.model_dump()
            payload["updated_at"] = datetime.now(timezone.utc).isoformat()
            with self.local_path.open("w", encoding="utf-8") as handle:
                json.dump(payload, handle, indent=2)
        except OSError:
            pass

    def get_latest(self) -> PolicyConfig:
        with self._lock:
            if self._db_available is not False:
                try:
                    with self._connect() as connection:
                        with connection.cursor() as cursor:
                            self._ensure_table_on_connection(cursor)
                            cursor.execute(
                                """
                                SELECT recovery_target, gateway_trip_rate, ev_floor,
                                       max_hops, auto_recovery_enabled
                                FROM policy_threshold_history
                                ORDER BY id DESC
                                LIMIT 1
                                """
                            )
                            row = cursor.fetchone()
                            self._db_available = True
                            if row:
                                return PolicyConfig(
                                    recovery_target=row[0],
                                    gateway_trip_rate=row[1],
                                    ev_floor=row[2],
                                    max_hops=row[3],
                                    auto_recovery_enabled=row[4],
                                )
                except Exception:
                    self._db_available = False

            return self._read_local() or PolicyConfig()

    def _ensure_table_on_connection(self, cursor) -> None:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS policy_threshold_history (
                id BIGSERIAL PRIMARY KEY,
                recovery_target DOUBLE PRECISION NOT NULL,
                gateway_trip_rate DOUBLE PRECISION NOT NULL,
                ev_floor DOUBLE PRECISION NOT NULL,
                max_hops INTEGER NOT NULL,
                auto_recovery_enabled BOOLEAN NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                source TEXT NOT NULL DEFAULT 'control_tower'
            )
            """
        )

    def save(self, config: PolicyConfig) -> PolicyConfig:
        with self._lock:
            self._write_local(config)
            if self._db_available is not False:
                try:
                    with self._connect() as connection:
                        with connection.cursor() as cursor:
                            self._ensure_table_on_connection(cursor)
                            cursor.execute(
                                """
                                INSERT INTO policy_threshold_history (
                                    recovery_target, gateway_trip_rate, ev_floor,
                                    max_hops, auto_recovery_enabled
                                ) VALUES (%s, %s, %s, %s, %s)
                                """,
                                (
                                    config.recovery_target,
                                    config.gateway_trip_rate,
                                    config.ev_floor,
                                    config.max_hops,
                                    config.auto_recovery_enabled,
                                ),
                            )
                        connection.commit()
                    self._db_available = True
                except Exception:
                    self._db_available = False
            return config
