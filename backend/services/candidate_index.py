from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.services.storage import SQLiteStore
from backend.utils.text import preprocess_text


@dataclass
class IndexedCandidate:
    document_id: str
    title: str
    source_path: str
    raw_text: str
    processed_text: str
    word_count: int


class CandidateIndex:
    def __init__(self, store: SQLiteStore) -> None:
        self.store = store
        self._lock = Lock()
        self._vectorizer: TfidfVectorizer | None = None
        self._matrix = None
        self._documents: list[IndexedCandidate] = []
        self._signature: tuple[int, int, int] | None = None

    def _build_signature(self) -> tuple[int, int, int]:
        return self.store.corpus_signature()

    def _build_index(self) -> None:
        records = self.store.fetch_all_documents()
        self._documents = [IndexedCandidate(**record) for record in records]
        corpus = [doc.processed_text or preprocess_text(doc.raw_text) for doc in self._documents]

        if not corpus:
            self._vectorizer = None
            self._matrix = None
            self._signature = self._build_signature()
            return

        self._vectorizer = TfidfVectorizer(ngram_range=(1, 3), min_df=1)
        self._matrix = self._vectorizer.fit_transform(corpus)
        self._signature = self._build_signature()

    def refresh(self, force: bool = False) -> None:
        with self._lock:
            signature = self._build_signature()
            if force or self._signature != signature or self._vectorizer is None or self._matrix is None:
                self._build_index()

    def is_ready(self) -> bool:
        self.refresh(force=False)
        return self._matrix is not None and self._vectorizer is not None

    def search(self, query_text: str, limit: int = 10) -> list[dict[str, Any]]:
        self.refresh(force=False)
        if self._matrix is None or self._vectorizer is None or not self._documents:
            return []

        processed_query = preprocess_text(query_text)
        if not processed_query:
            return []

        query_vector = self._vectorizer.transform([processed_query])
        scores = cosine_similarity(query_vector, self._matrix)[0]
        top_indices = np.argsort(scores)[::-1][:limit]

        results: list[dict[str, Any]] = []
        for index in top_indices:
            score = float(scores[index] * 100)
            if score <= 0:
                continue
            document = self._documents[int(index)]
            results.append(
                {
                    "document_id": document.document_id,
                    "title": document.title,
                    "source_path": document.source_path,
                    "raw_text": document.raw_text,
                    "processed_text": document.processed_text,
                    "word_count": document.word_count,
                    "index_score": round(score, 2),
                }
            )

        return results