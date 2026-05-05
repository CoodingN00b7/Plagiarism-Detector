from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class TTLCache:
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, CacheEntry] = {}

    @staticmethod
    def build_key(*parts: str) -> str:
        payload = "::".join(parts).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.time() > entry.expires_at:
            self._store.pop(key, None)
            return None
        return entry.value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = CacheEntry(value=value, expires_at=time.time() + self.ttl_seconds)
