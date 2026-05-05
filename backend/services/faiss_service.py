from __future__ import annotations

import logging
from typing import Any

import numpy as np

from backend.services.faiss_index import get_faiss_index
from backend.utils.text import preprocess_tokens

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer

    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False
    logger.warning("Sentence Transformers not installed.")


class FaissService:
    def __init__(self) -> None:
        self.index = get_faiss_index()
        self.model = None
        if ST_AVAILABLE:
            try:
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception as exc:
                logger.warning("Could not load SentenceTransformer for FAISS search: %s", exc)

    def _embedding(self, sentence: str) -> np.ndarray | None:
        if self.model is None:
            return None

        try:
            return self.model.encode(sentence, convert_to_numpy=True)
        except Exception as exc:
            logger.warning("FAISS embedding generation failed: %s", exc)
            return None

    def _fallback_overlap(self, sentence: str, candidate_text: str) -> float:
        sentence_tokens = set(preprocess_tokens(sentence))
        candidate_tokens = set(preprocess_tokens(candidate_text))
        if not sentence_tokens or not candidate_tokens:
            return 0.0
        overlap = len(sentence_tokens.intersection(candidate_tokens)) / max(len(sentence_tokens), len(candidate_tokens))
        return round(overlap * 100, 2)

    def search(self, sentence: str, top_k: int = 3) -> list[dict[str, Any]]:
        sentence = sentence.strip()
        if not sentence:
            return []

        if self.index.is_available():
            embedding = self._embedding(sentence)
            if embedding is not None:
                results: list[dict[str, Any]] = []
                for document_id, similarity, title in self.index.search(embedding, top_k=top_k):
                    metadata = next((item for item in self.index.metadata if item.get("id") == document_id), {})
                    results.append(
                        {
                            "document_id": document_id,
                            "title": title,
                            "source": "FAISS",
                            "url": metadata.get("source_path"),
                            "excerpt": metadata.get("text", "")[:280],
                            "score": round(float(similarity) * 100, 2),
                        }
                    )
                return results[:top_k]

        fallback_results: list[dict[str, Any]] = []
        for metadata in self.index.metadata[: max(top_k, 5)]:
            score = self._fallback_overlap(sentence, metadata.get("text", ""))
            if score <= 0:
                continue
            fallback_results.append(
                {
                    "document_id": metadata.get("id", metadata.get("title", "faiss-source")),
                    "title": metadata.get("title", "Local source"),
                    "source": "FAISS",
                    "url": metadata.get("source_path"),
                    "excerpt": metadata.get("text", "")[:280],
                    "score": score,
                }
            )

        fallback_results.sort(key=lambda item: item["score"], reverse=True)
        return fallback_results[:top_k]