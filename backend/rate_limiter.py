"""
Distributed Global Rate Limiter backed by Redis atomic Lua scripts.
Shared across concurrent Python API workers and Go executor processes.
"""
import redis
from typing import Dict, Any, Optional

RATE_LIMIT_LUA = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end

local ttl = redis.call('TTL', key)
if current > limit then
    return {0, current, ttl}
else
    return {1, current, ttl}
end
"""


class RedisDistributedRateLimiter:
    _instance: Optional["RedisDistributedRateLimiter"] = None

    @classmethod
    def get_instance(cls, host: str = "localhost", port: int = 6379, db: int = 0) -> "RedisDistributedRateLimiter":
        if cls._instance is None:
            cls._instance = cls(host=host, port=port, db=db)
        return cls._instance

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        fail_closed: bool = True,
        socket_timeout: float = 1.0,
    ):
        self.host = host
        self.port = port
        self.db = db
        self.fail_closed = fail_closed
        self.client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            socket_timeout=socket_timeout,
            socket_connect_timeout=socket_timeout,
            decode_responses=False,
        )
        self._script = self.client.register_script(RATE_LIMIT_LUA)

    def check_limit(
        self,
        key: str,
        limit: int = 100,
        window_seconds: int = 60,
    ) -> Dict[str, Any]:
        """
        Atomically evaluates rate limit for the given key using Redis Lua script.
        """
        redis_key = f"recovery:ratelimit:{key}"
        try:
            res = self._script(keys=[redis_key], args=[limit, window_seconds])
            allowed_code, current, ttl = res
            allowed = bool(allowed_code == 1)
            remaining = max(0, limit - current)

            return {
                "status": "LIVE",
                "source": f"redis:{self.port}",
                "key": redis_key,
                "limit": limit,
                "window_seconds": window_seconds,
                "current_tokens": int(current),
                "remaining_tokens": int(remaining),
                "ttl_seconds": int(ttl) if ttl > 0 else window_seconds,
                "allowed": allowed,
            }
        except Exception as e:
            if self.fail_closed:
                return {
                    "status": "UNAVAILABLE",
                    "source": f"redis:{self.port}",
                    "key": redis_key,
                    "limit": limit,
                    "window_seconds": window_seconds,
                    "current_tokens": limit + 1,
                    "remaining_tokens": 0,
                    "ttl_seconds": 0,
                    "allowed": False,
                    "error": str(e),
                }
            return {
                "status": "UNAVAILABLE",
                "source": f"redis:{self.port}",
                "key": redis_key,
                "limit": limit,
                "window_seconds": window_seconds,
                "current_tokens": 0,
                "remaining_tokens": limit,
                "ttl_seconds": 0,
                "allowed": True,
                "error": str(e),
            }
