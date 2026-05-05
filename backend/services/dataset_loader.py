from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.services.preprocessing import Preprocessor
from backend.services.storage import SQLiteStore
from backend.utils.text import normalize_whitespace


class PanDatasetLoader:
    def __init__(self, dataset_root: Path, store: SQLiteStore, preprocessor: Preprocessor, processed_json_path: Path) -> None:
        self.dataset_root = dataset_root
        self.store = store
        self.preprocessor = preprocessor
        self.processed_json_path = processed_json_path

    def _iter_document_paths(self) -> list[Path]:
        if not self.dataset_root.exists():
            return []
        supported_extensions = {".txt"}
        return [
            path
            for path in self.dataset_root.rglob("*")
            if path.is_file() and path.suffix.lower() in supported_extensions
        ]

    def _build_document_record(self, path: Path) -> dict[str, Any] | None:
        raw_text = path.read_text(encoding="utf-8", errors="ignore")
        raw_text = normalize_whitespace(raw_text)
        if len(raw_text) < 40:
            return None

        processed = self.preprocessor.process(raw_text)
        relative_path = str(path.relative_to(self.dataset_root))
        document_id = relative_path.replace("/", "_").replace("\\", "_")

        record = {
            "document_id": document_id,
            "title": path.stem,
            "source_path": relative_path,
            "raw_text": processed.raw_text,
            "processed_text": processed.processed_text,
            "word_count": len(processed.tokens),
            "metadata": {
                "folder": path.parent.name,
                "dataset": "PAN-PC-11",
            },
        }
        return record

    def build(self) -> dict[str, Any]:
        document_paths = self._iter_document_paths()
        processed_records: list[dict[str, Any]] = []

        for path in document_paths:
            record = self._build_document_record(path)
            if not record:
                continue
            self.store.upsert_document(record)
            processed_records.append(record)

        payload = {
            "dataset": "PAN Plagiarism Corpus 2011",
            "root": str(self.dataset_root),
            "document_count": len(processed_records),
            "documents": [
                {
                    "document_id": doc["document_id"],
                    "title": doc["title"],
                    "source_path": doc["source_path"],
                    "word_count": doc["word_count"],
                    "metadata": doc["metadata"],
                }
                for doc in processed_records
            ],
        }

        self.processed_json_path.parent.mkdir(parents=True, exist_ok=True)
        self.processed_json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return payload
