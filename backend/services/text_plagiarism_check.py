"""
Hybrid single-text plagiarism checking service.

Combines local FAISS search, Wikipedia lookups, and DuckDuckGo search on a
sentence-by-sentence basis.
"""

from __future__ import annotations

from typing import Optional

from backend.models.schemas import CheckResponse
from backend.services.duckduckgo_service import DuckDuckGoService
from backend.services.faiss_service import FaissService
from backend.services.scoring_service import ScoringService
from backend.services.storage import SQLiteStore
from backend.services.wikipedia_service import WikipediaService
from backend.utils.cache import TTLCache
from backend.utils.config import get_settings
from backend.utils.text import split_sentences
from backend.services.text_normalization import TextNormalizer


class HybridTextPlagiarismChecker:
    def __init__(self) -> None:
        settings = get_settings()
        self.store = SQLiteStore(settings.sqlite_path)
        self.cache = TTLCache(ttl_seconds=settings.cache_ttl_seconds)
        self.faiss_service = FaissService()
        self.wikipedia_service = WikipediaService()
        self.duckduckgo_service = DuckDuckGoService()
        self.scoring_service = ScoringService(
            suspicious_threshold=settings.similarity_threshold_original,
            plagiarized_threshold=settings.similarity_threshold_suspicious,
        )
        self.text_normalizer = TextNormalizer()

    def _analyze(self, text: str, skip_wikipedia: bool = False) -> dict:
        # CRITICAL: Normalize text first to fix spacing issues
        normalized_text = self.text_normalizer.normalize(text)
        
        sentences = split_sentences(normalized_text)
        if not sentences:
            sentences = [normalized_text.strip()] if normalized_text.strip() else []

        sentence_results: list[dict] = []
        for sentence in sentences:
            source_hits = {
                "FAISS": self.faiss_service.search(sentence, top_k=3),
                "Wikipedia": [] if skip_wikipedia else self.wikipedia_service.search(sentence, top_k=3),
                "DuckDuckGo": self.duckduckgo_service.search(sentence, top_k=5),
            }
            sentence_results.append(self.scoring_service.score_sentence(sentence, source_hits))

        # Use normalized text for highlighting
        report = self.scoring_service.build_report(normalized_text, sentence_results)
        report["sentence_results"] = sentence_results
        return report

    def run_check(self, text: str, skip_wikipedia: bool = False) -> CheckResponse:
        cache_key = self.cache.build_key(text, str(skip_wikipedia))
        cached = self.cache.get(cache_key)
        if cached is not None:
            cached["from_cache"] = True
            return CheckResponse(**cached)

        report = self._analyze(text, skip_wikipedia=skip_wikipedia)
        response = CheckResponse(
            report_id=report["report_id"],
            similarity_score=report["similarity_score"],
            classification=report["classification"],
            highlighted_text=report["highlighted_text"],
            matched_sources=report["matched_sources"],
            heatmap=report["heatmap"],
            created_at=report["created_at"],
            from_cache=False,
        )

        # Store normalized text
        normalized_text = self.text_normalizer.normalize(text)
        self.store.save_report(
            {
                "report_id": response.report_id,
                "created_at": response.created_at.isoformat(),
                "original_text": normalized_text,
                "highlighted_text": response.highlighted_text,
                "similarity_score": response.similarity_score,
                "classification": response.classification,
                "matched_sources": [item.model_dump(mode="json") for item in response.matched_sources],
                "heatmap": [item.model_dump(mode="json") for item in response.heatmap],
            }
        )

        payload = response.model_dump(mode="json")
        self.cache.set(cache_key, payload)
        return response

    def check_text(self, text: str, skip_wikipedia: bool = False) -> dict:
        report = self._analyze(text, skip_wikipedia=skip_wikipedia)
        sentence_payloads = [self.scoring_service.build_sentence_payload(sentence) for sentence in report["sentence_results"]]
        return {
            "plagiarism_percentage": report["similarity_score"],
            "classification": report["classification"],
            "total_sentences": len(sentence_payloads),
            "plagiarized_sentences": report["plagiarized_sentences"],
            "sentences": [
                {
                    "text": sentence.text,
                    "similarity": sentence.similarity,
                    "is_plagiarized": sentence.is_plagiarized,
                    "sources": [
                        {
                            "title": source.title,
                            "similarity": source.similarity,
                            "source": source.source,
                        }
                        for source in sentence.sources
                    ],
                    "source_types": sentence.source_types,
                }
                for sentence in sentence_payloads
            ],
        }


_checker_instance: Optional[HybridTextPlagiarismChecker] = None


def get_text_plagiarism_checker() -> HybridTextPlagiarismChecker:
    global _checker_instance
    if _checker_instance is None:
        _checker_instance = HybridTextPlagiarismChecker()
    return _checker_instance
