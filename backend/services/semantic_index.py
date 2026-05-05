from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any

import numpy as np

from backend.services.storage import SQLiteStore
from backend.utils.text import preprocess_text


@dataclass
class SemanticIndexedCandidate:
    document_id: str
    title: str
    source_path: str
    raw_text: str
    processed_text: str
    word_count: int


class SemanticCandidateIndex:
    def __init__(self, store: SQLiteStore, model_name: str) -> None:
        self.store = store
        self.model_name = model_name
        self._lock = Lock()
        self._model = None
        self._documents: list[SemanticIndexedCandidate] = []
        self._embeddings: np.ndarray | None = None
        self._faiss_index = None
        self._signature: tuple[int, int, int] | None = None
        self._faiss_enabled = False

    def _build_signature(self) -> tuple[int, int, int]:
        return self.store.corpus_signature()

    def _ensure_model(self) -> bool:
        if self._model is not None:
            return True
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
            return True
        except Exception:
            self._model = None
            return False

    def _encode(self, texts: list[str]) -> np.ndarray:
        if not self._ensure_model():
            return np.empty((0, 0), dtype=np.float32)

        embeddings = self._model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
        return np.asarray(embeddings, dtype=np.float32)

    def _build_index(self) -> None:
        records = self.store.fetch_all_documents()
        self._documents = [SemanticIndexedCandidate(**record) for record in records]

        payloads = [
            f"{doc.title}\n{doc.processed_text or preprocess_text(doc.raw_text)}"
            for doc in self._documents
        ]
        embeddings = self._encode(payloads)

        if embeddings.size == 0:
            self._embeddings = None
            self._faiss_index = None
            self._faiss_enabled = False
            self._signature = self._build_signature()
            return

        self._embeddings = embeddings
        self._faiss_index = None
        self._faiss_enabled = False

        try:
            import faiss  # type: ignore

            dimension = embeddings.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(embeddings)
            self._faiss_index = index
            self._faiss_enabled = True
        except Exception:
            self._faiss_index = None
            self._faiss_enabled = False

        self._signature = self._build_signature()

    def refresh(self, force: bool = False) -> None:
        with self._lock:
            signature = self._build_signature()
            if force or self._signature != signature or self._embeddings is None:
                self._build_index()

    def is_ready(self) -> bool:
        self.refresh(force=False)
        return self._embeddings is not None and bool(self._documents)

    def search(self, query_text: str, limit: int = 10) -> list[dict[str, Any]]:
        self.refresh(force=False)
        if self._embeddings is None or not self._documents:
            return []

        query_payload = f"query\n{preprocess_text(query_text)}"
        query_embedding = self._encode([query_payload])
        if query_embedding.size == 0:
            return []

        if self._faiss_enabled and self._faiss_index is not None:
            scores, indices = self._faiss_index.search(query_embedding, min(limit, len(self._documents)))
            score_row = scores[0]
            index_row = indices[0]
        else:
            score_row = (self._embeddings @ query_embedding[0]).astype(np.float32)
            index_row = np.argsort(score_row)[::-1][:limit]
            score_row = score_row[index_row]

        results: list[dict[str, Any]] = []
        for index, score in zip(index_row, score_row):
            if index < 0:
                continue
            document = self._documents[int(index)]
            similarity = float(score * 100)
            if similarity <= 0:
                continue
            results.append(
                {
                    "document_id": document.document_id,
                    "title": document.title,
                    "source_path": document.source_path,
                    "raw_text": document.raw_text,
                    "processed_text": document.processed_text,
                    "word_count": document.word_count,
                    "index_score": round(similarity, 2),
                    "semantic_rank": round(similarity, 2),
                }
            )

        return results