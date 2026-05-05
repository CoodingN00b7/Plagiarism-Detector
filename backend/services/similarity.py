from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.utils.text import preprocess_text, split_sentences


@dataclass
class SimilarityResult:
    score: float
    overlap_sentences: list[str]
    heatmap: list[dict[str, Any]]


class SimilarityEngine:
    def __init__(self, chunk_size: int = 6) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = max(1, chunk_size // 3)
        self.max_sentence_candidates = 120

    def _chunk_sentences(self, text: str) -> list[str]:
        sentences = split_sentences(text)
        if not sentences:
            return []

        chunks: list[str] = []
        step = max(1, self.chunk_size - self.chunk_overlap)
        for i in range(0, len(sentences), step):
            chunks.append(" ".join(sentences[i : i + self.chunk_size]))
        return chunks

    def _tfidf_cosine(self, left: str, right: str) -> float:
        left_processed = preprocess_text(left)
        right_processed = preprocess_text(right)
        if not left_processed or not right_processed:
            return 0.0

        corpus = [left_processed, right_processed]
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        matrix = vectorizer.fit_transform(corpus)
        return float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])

    def _sentence_overlap(self, left: str, right: str, top_n: int = 5) -> tuple[list[str], float]:
        left_sentences = split_sentences(left)
        right_sentences = split_sentences(right)
        if not left_sentences or not right_sentences:
            return [], 0.0

        left_sentences = left_sentences[: self.max_sentence_candidates]
        right_sentences = right_sentences[: self.max_sentence_candidates]

        matrix = TfidfVectorizer(ngram_range=(1, 2), min_df=1).fit_transform(left_sentences + right_sentences)
        left_matrix = matrix[: len(left_sentences)]
        right_matrix = matrix[len(left_sentences) :]
        sentence_scores = cosine_similarity(left_matrix, right_matrix)

        best_scores = sentence_scores.max(axis=1)
        overlaps = [
            (left_sentences[index], float(score))
            for index, score in enumerate(best_scores)
            if score >= 0.42
        ]
        overlaps.sort(key=lambda item: item[1], reverse=True)

        matched_ratio = float(np.mean(best_scores >= 0.42) * 100)
        return [sentence for sentence, _ in overlaps[:top_n]], matched_ratio

    @staticmethod
    def _chunk_containment(best_chunk_scores: np.ndarray) -> float:
        if best_chunk_scores.size == 0:
            return 0.0
        top_count = max(1, int(np.ceil(best_chunk_scores.size * 0.35)))
        top_scores = np.sort(best_chunk_scores)[-top_count:]
        return float(np.mean(top_scores) * 100)

    def compare(self, text: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        query_chunks = self._chunk_sentences(text)
        if not query_chunks:
            return []

        processed_query = preprocess_text(text)
        if not processed_query:
            return []

        results: list[dict[str, Any]] = []
        for candidate in candidates:
            candidate_chunks = self._chunk_sentences(candidate["raw_text"])
            if not candidate_chunks:
                continue

            processed_candidate = candidate.get("processed_text") or preprocess_text(candidate["raw_text"])

            matrix = TfidfVectorizer(ngram_range=(1, 3), min_df=1).fit_transform(query_chunks + candidate_chunks)
            q_matrix = matrix[: len(query_chunks)]
            c_matrix = matrix[len(query_chunks) :]
            chunk_scores = cosine_similarity(q_matrix, c_matrix)

            best_chunk_scores = chunk_scores.max(axis=1)
            chunk_mean_score = float(np.mean(best_chunk_scores) * 100)
            containment_score = self._chunk_containment(best_chunk_scores)
            document_score = self._tfidf_cosine(processed_query, processed_candidate) * 100

            overlap_sentences, sentence_match_ratio = self._sentence_overlap(text, candidate["raw_text"])

            score = (
                0.35 * document_score
                + 0.4 * chunk_mean_score
                + 0.15 * containment_score
                + 0.1 * sentence_match_ratio
            )

            heatmap = [
                {
                    "chunk_index": int(i),
                    "sentence_index": int(np.argmax(row)),
                    "score": float(np.max(row) * 100),
                }
                for i, row in enumerate(chunk_scores)
            ]
            results.append(
                {
                    "document_id": candidate["document_id"],
                    "title": candidate["title"],
                    "score": round(min(100.0, max(0.0, score)), 2),
                    "overlap_sentences": overlap_sentences,
                    "heatmap": heatmap,
                }
            )

        results.sort(key=lambda item: item["score"], reverse=True)
        return results


class SemanticSimilarityEngine:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self.model = None

    def _ensure_model(self) -> bool:
        if self.model is not None:
            return True
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(self.model_name)
            return True
        except Exception:
            self.model = None
            return False

    def rerank(self, query_text: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not candidates or not self._ensure_model():
            return candidates

        texts = [query_text] + [
            f"{c['title']}\n{c['overlap_sentences'][0]}" if c["overlap_sentences"] else c["title"]
            for c in candidates
        ]
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        query_embedding = embeddings[0]
        candidate_embeddings = embeddings[1:]

        similarities = candidate_embeddings @ query_embedding
        for idx, sim in enumerate(similarities):
            semantic_score = float(sim) * 100.0
            lexical_score = float(candidates[idx]["score"])
            blended = (0.75 * lexical_score) + (0.25 * semantic_score)
            candidates[idx]["score"] = round(min(100.0, max(0.0, blended)), 2)

        candidates.sort(key=lambda item: item["score"], reverse=True)
        return candidates
