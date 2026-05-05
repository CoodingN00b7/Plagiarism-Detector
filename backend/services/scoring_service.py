from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from backend.models.schemas import HeatmapCell, SentencePlagiarismResult, SentenceSource, SourceMatch
from backend.services.classification import classify_similarity
from backend.services.highlighter import highlight_sentences


class ScoringService:
    def __init__(self, suspicious_threshold: float = 20.0, plagiarized_threshold: float = 50.0) -> None:
        self.suspicious_threshold = suspicious_threshold
        self.plagiarized_threshold = plagiarized_threshold
        self.source_weights = {
            "FAISS": 0.40,
            "Wikipedia": 0.30,
            "DuckDuckGo": 0.30,
        }

    def score_sentence(self, sentence: str, source_hits: dict[str, list[dict]]) -> dict:
        best_hits: dict[str, dict] = {}

        for source_name, hits in source_hits.items():
            for hit in hits:
                normalized = self._normalize_hit(hit, source_name)
                current = best_hits.get(source_name)
                if current is None or normalized["score"] > current["score"]:
                    best_hits[source_name] = normalized

        if best_hits:
            weighted_sum = 0.0
            weight_total = 0.0
            for source_name, hit in best_hits.items():
                weight = self.source_weights.get(source_name, 0.0)
                weighted_sum += hit["score"] * weight
                weight_total += weight
            similarity = weighted_sum / weight_total if weight_total else 0.0
        else:
            similarity = 0.0

        similarity = round(similarity, 2)
        ordered_sources = sorted(best_hits.values(), key=lambda item: item["score"], reverse=True)

        return {
            "text": sentence,
            "similarity": similarity,
            "is_plagiarized": similarity >= self.plagiarized_threshold,
            "sources": ordered_sources,
            "source_types": sorted(best_hits.keys()),
        }

    def build_report(self, text: str, sentence_results: list[dict]) -> dict:
        sentence_scores = [float(item.get("similarity", 0.0)) for item in sentence_results]
        similarity_score = round(sum(sentence_scores) / len(sentence_scores), 2) if sentence_scores else 0.0
        classification = classify_similarity(
            similarity_score,
            suspicious_threshold=self.suspicious_threshold,
            plagiarized_threshold=self.plagiarized_threshold,
        )

        overlapping_sentences = [
            item["text"]
            for item in sentence_results
            if float(item.get("similarity", 0.0)) >= self.suspicious_threshold
        ]
        highlighted_text = highlight_sentences(text, overlapping_sentences)

        aggregated_sources: dict[str, dict] = {}
        for item in sentence_results:
            sentence_text = item["text"]
            for source in item.get("sources", []):
                key = self._source_key(source)
                current = aggregated_sources.get(key)
                if current is None:
                    aggregated_sources[key] = {
                        "document_id": source["document_id"],
                        "title": source["title"],
                        "source": source["source"],
                        "url": source.get("url"),
                        "score_total": float(source["score"]),
                        "hits": 1,
                        "sentence_hits": {sentence_text},
                    }
                else:
                    current["score_total"] += float(source["score"])
                    current["hits"] += 1
                    current["sentence_hits"].add(sentence_text)

        matched_sources = []
        for source in aggregated_sources.values():
            average_score = source["score_total"] / max(source["hits"], 1)
            matched_sources.append(
                SourceMatch(
                    document_id=source["document_id"],
                    title=source["title"],
                    score=round(average_score, 2),
                    classification=classify_similarity(
                        average_score,
                        suspicious_threshold=self.suspicious_threshold,
                        plagiarized_threshold=self.plagiarized_threshold,
                    ),
                    overlap_sentences=sorted(source["sentence_hits"], key=len, reverse=True),
                )
            )

        matched_sources.sort(key=lambda item: item.score, reverse=True)

        heatmap = [
            HeatmapCell(chunk_index=index, sentence_index=index, score=round(float(item.get("similarity", 0.0)), 2))
            for index, item in enumerate(sentence_results)
        ]

        return {
            "report_id": uuid4().hex,
            "created_at": datetime.now(timezone.utc),
            "similarity_score": similarity_score,
            "classification": classification,
            "highlighted_text": highlighted_text,
            "matched_sources": matched_sources,
            "heatmap": heatmap,
            "sentence_results": sentence_results,
            "plagiarized_sentences": sum(1 for item in sentence_results if float(item.get("similarity", 0.0)) >= self.plagiarized_threshold),
        }

    def build_sentence_payload(self, sentence_result: dict) -> SentencePlagiarismResult:
        sources = [
            SentenceSource(
                title=source["title"],
                similarity=float(source["score"]),
                source=source["source"],
            )
            for source in sentence_result.get("sources", [])
        ]
        return SentencePlagiarismResult(
            text=sentence_result["text"],
            similarity=float(sentence_result.get("similarity", 0.0)),
            is_plagiarized=bool(sentence_result.get("is_plagiarized", False)),
            sources=sources,
            source_types=list(sentence_result.get("source_types", [])),
        )

    def _source_key(self, source: dict) -> str:
        identifier = source.get("document_id") or source.get("url") or source.get("title") or source.get("source")
        return f"{source.get('source')}::{identifier}"

    def _normalize_hit(self, hit: dict, source_name: str) -> dict:
        score = float(hit.get("score", 0.0))
        if score <= 1.0:
            score *= 100
        return {
            "document_id": hit.get("document_id") or hit.get("url") or hit.get("title") or source_name,
            "title": hit.get("title", source_name),
            "source": hit.get("source", source_name),
            "url": hit.get("url"),
            "excerpt": hit.get("excerpt", ""),
            "score": round(min(100.0, max(0.0, score)), 2),
        }