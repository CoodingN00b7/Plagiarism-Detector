from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any


class SQLiteStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    @contextmanager
    def connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _initialize(self) -> None:
        with self.connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    document_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    source_path TEXT NOT NULL,
                    raw_text TEXT NOT NULL,
                    processed_text TEXT NOT NULL,
                    word_count INTEGER NOT NULL,
                    metadata_json TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reports (
                    report_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    original_text TEXT NOT NULL,
                    highlighted_text TEXT NOT NULL,
                    similarity_score REAL NOT NULL,
                    classification TEXT NOT NULL,
                    matched_sources_json TEXT NOT NULL,
                    heatmap_json TEXT NOT NULL
                )
                """
            )

    def upsert_document(self, payload: dict[str, Any]) -> None:
        with self.connection() as conn:
            conn.execute(
                """
                INSERT INTO documents (document_id, title, source_path, raw_text, processed_text, word_count, metadata_json)
                VALUES (:document_id, :title, :source_path, :raw_text, :processed_text, :word_count, :metadata_json)
                ON CONFLICT(document_id) DO UPDATE SET
                    title=excluded.title,
                    source_path=excluded.source_path,
                    raw_text=excluded.raw_text,
                    processed_text=excluded.processed_text,
                    word_count=excluded.word_count,
                    metadata_json=excluded.metadata_json
                """,
                {
                    **payload,
                    "metadata_json": json.dumps(payload.get("metadata", {})),
                },
            )

    def list_documents(self, limit: int = 50) -> list[dict[str, Any]]:
        with self.connection() as conn:
            rows = conn.execute(
                """
                SELECT document_id, title, source_path, word_count
                FROM documents
                ORDER BY word_count DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def count_documents(self) -> int:
        with self.connection() as conn:
            row = conn.execute("SELECT COUNT(*) AS total FROM documents").fetchone()
        return int(row["total"] if row is not None else 0)

    def corpus_signature(self) -> tuple[int, int, int]:
        with self.connection() as conn:
            row = conn.execute(
                """
                SELECT
                    COUNT(*) AS total_documents,
                    COALESCE(SUM(LENGTH(raw_text)), 0) AS total_raw_length,
                    COALESCE(SUM(word_count), 0) AS total_word_count
                FROM documents
                """
            ).fetchone()
        if row is None:
            return 0, 0, 0
        return int(row["total_documents"]), int(row["total_raw_length"]), int(row["total_word_count"])

    def fetch_all_documents(self) -> list[dict[str, Any]]:
        with self.connection() as conn:
            rows = conn.execute(
                """
                SELECT document_id, title, source_path, raw_text, processed_text, word_count
                FROM documents
                ORDER BY word_count DESC, title ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def fetch_candidate_documents(self, limit: int = 10) -> list[dict[str, Any]]:
        with self.connection() as conn:
            rows = conn.execute(
                """
                SELECT document_id, title, source_path, raw_text, processed_text, word_count
                FROM documents
                ORDER BY word_count DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]

    def save_report(self, payload: dict[str, Any]) -> None:
        with self.connection() as conn:
            conn.execute(
                """
                INSERT INTO reports (
                    report_id,
                    created_at,
                    original_text,
                    highlighted_text,
                    similarity_score,
                    classification,
                    matched_sources_json,
                    heatmap_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload["report_id"],
                    payload["created_at"],
                    payload["original_text"],
                    payload["highlighted_text"],
                    payload["similarity_score"],
                    payload["classification"],
                    json.dumps(payload["matched_sources"]),
                    json.dumps(payload["heatmap"]),
                ),
            )

    def get_report(self, report_id: str) -> dict[str, Any] | None:
        with self.connection() as conn:
            row = conn.execute(
                """
                SELECT report_id, created_at, original_text, highlighted_text,
                       similarity_score, classification, matched_sources_json, heatmap_json
                FROM reports WHERE report_id = ?
                """,
                (report_id,),
            ).fetchone()
        if row is None:
            return None
        payload = dict(row)
        payload["matched_sources"] = json.loads(payload.pop("matched_sources_json"))
        payload["heatmap"] = json.loads(payload.pop("heatmap_json"))
        return payload
