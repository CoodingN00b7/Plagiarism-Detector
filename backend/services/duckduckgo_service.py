from __future__ import annotations

import logging
from typing import Any

from backend.utils.text import preprocess_tokens

logger = logging.getLogger(__name__)

try:
    from duckduckgo_search import DDGS

    DDG_AVAILABLE = True
except ImportError:
    DDG_AVAILABLE = False
    logger.warning("duckduckgo-search is not installed.")


class DuckDuckGoService:
    def _score_overlap(self, sentence: str, text: str) -> float:
        sentence_tokens = set(preprocess_tokens(sentence))
        text_tokens = set(preprocess_tokens(text))
        if not sentence_tokens or not text_tokens:
            return 0.0
        overlap = len(sentence_tokens.intersection(text_tokens)) / max(len(sentence_tokens), len(text_tokens))
        return round(min(1.0, 0.15 + overlap * 0.85) * 100, 2)

    def search(self, sentence: str, top_k: int = 5) -> list[dict[str, Any]]:
        sentence = sentence.strip()
        if not DDG_AVAILABLE or not sentence:
            return []

        try:
            results: list[dict[str, Any]] = []
            with DDGS() as ddgs:
                for item in ddgs.text(sentence, max_results=top_k):
                    title = item.get("title") or "DuckDuckGo result"
                    body = item.get("body") or ""
                    href = item.get("href") or item.get("url") or ""
                    score = self._score_overlap(sentence, f"{title} {body}")
                    if score <= 0:
                        continue

                    results.append(
                        {
                            "document_id": href or f"duckduckgo:{title}",
                            "title": title,
                            "source": "DuckDuckGo",
                            "url": href,
                            "excerpt": body,
                            "score": score,
                        }
                    )

            results.sort(key=lambda item: item["score"], reverse=True)
            return results[:top_k]
        except Exception as exc:
            logger.warning("DuckDuckGo search failed for %r: %s", sentence[:120], exc)
            return []