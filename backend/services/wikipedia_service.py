from __future__ import annotations

import logging
from typing import Any

import requests

from backend.utils.text import preprocess_tokens

logger = logging.getLogger(__name__)


class WikipediaService:
    def __init__(self) -> None:
        self.base_url = "https://en.wikipedia.org/w/api.php"
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "PlagiarismDetector/1.0 (https://localhost; contact: local-dev)",
                "Accept": "application/json",
            }
        )

    def _score_overlap(self, sentence: str, text: str) -> float:
        sentence_tokens = set(preprocess_tokens(sentence))
        text_tokens = set(preprocess_tokens(text))
        if not sentence_tokens or not text_tokens:
            return 0.0
        overlap = len(sentence_tokens.intersection(text_tokens)) / max(len(sentence_tokens), len(text_tokens))
        return round(min(1.0, 0.25 + overlap * 0.75) * 100, 2)

    def _fetch_extract(self, page_id: int) -> str:
        params = {
            "action": "query",
            "prop": "extracts",
            "exintro": 1,
            "explaintext": 1,
            "pageids": page_id,
            "format": "json",
            "origin": "*",
        }
        response = self.session.get(self.base_url, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        page = pages.get(str(page_id), {})
        return page.get("extract", "")

    def search(self, sentence: str, top_k: int = 3) -> list[dict[str, Any]]:
        sentence = sentence.strip()
        if len(sentence.split()) < 4:
            return []

        try:
            params = {
                "action": "query",
                "list": "search",
                "srsearch": sentence,
                "srwhat": "text",
                "srlimit": top_k,
                "format": "json",
                "origin": "*",
            }
            response = self.session.get(self.base_url, params=params, timeout=8)
            response.raise_for_status()

            results: list[dict[str, Any]] = []
            for item in response.json().get("query", {}).get("search", [])[:top_k]:
                page_id = int(item.get("pageid"))
                title = item.get("title", "Wikipedia result")
                snippet = item.get("snippet", "")
                extract = ""

                try:
                    extract = self._fetch_extract(page_id)
                except Exception:
                    extract = snippet

                score = self._score_overlap(sentence, f"{snippet} {extract}")
                if score <= 0:
                    continue

                results.append(
                    {
                        "document_id": f"wikipedia:{page_id}",
                        "title": title,
                        "source": "Wikipedia",
                        "url": f"https://en.wikipedia.org/?curid={page_id}",
                        "excerpt": extract or snippet,
                        "score": score,
                    }
                )

            results.sort(key=lambda item: item["score"], reverse=True)
            return results[:top_k]
        except Exception as exc:
            logger.warning("Wikipedia search failed for %r: %s", sentence[:120], exc)
            return []