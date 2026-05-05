from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from backend.models.schemas import CheckResponse, HeatmapCell, SourceMatch
from backend.services.classification import classify_similarity
from backend.services.candidate_index import CandidateIndex
from backend.services.highlighter import highlight_sentences
from backend.services.pdf_report import generate_report_pdf
from backend.services.semantic_index import SemanticCandidateIndex
from backend.services.similarity import SemanticSimilarityEngine, SimilarityEngine
from backend.services.storage import SQLiteStore
from backend.services.preprocessing import Preprocessor  
from backend.utils.cache import TTLCache
from backend.utils.text import preprocess_text


@dataclass
class ReportingDependencies:
    store: SQLiteStore
    candidate_index: CandidateIndex
    semantic_index: SemanticCandidateIndex
    similarity_engine: SimilarityEngine
    semantic_engine: SemanticSimilarityEngine
    cache: TTLCache
    suspicious_threshold: float
    plagiarized_threshold: float
    max_source_candidates: int
    reports_pdf_dir: Path


class ReportingService:
    def __init__(self, deps: ReportingDependencies) -> None:
        self.deps = deps
        self.preprocessor = Preprocessor()  

    def run_check(self, text: str, top_k: int = 5, use_semantic: bool = False) -> CheckResponse:
        cache_key = self.deps.cache.build_key(text, str(top_k), str(use_semantic))
        cached = self.deps.cache.get(cache_key)
        if cached is not None:
            cached["from_cache"] = True
            return CheckResponse(**cached)

        #  clean text first
        processed = self.preprocessor.process(text)
        clean_text = processed.raw_text

        if use_semantic:
            indexed_candidates = self.deps.semantic_index.search(
                clean_text, limit=self.deps.max_source_candidates
            )
        else:
            indexed_candidates = self.deps.candidate_index.search(
                clean_text, limit=self.deps.max_source_candidates
            )

        candidates = indexed_candidates or self.deps.store.fetch_candidate_documents(
            limit=self.deps.max_source_candidates
        )

        comparisons = self.deps.similarity_engine.compare(clean_text, candidates)

        if use_semantic:
            comparisons = self.deps.semantic_engine.rerank(clean_text, comparisons)

        selected = comparisons[:top_k]
        top_score = selected[0]["score"] if selected else 0.0

        classification = classify_similarity(
            top_score,
            suspicious_threshold=self.deps.suspicious_threshold,
            plagiarized_threshold=self.deps.plagiarized_threshold,
        )

        overlap_pool: list[str] = []
        for item in selected:
            overlap_pool.extend(item.get("overlap_sentences", []))

        #  highlight clean text
        highlighted = highlight_sentences(clean_text, overlap_pool)

        report_id = uuid4().hex
        created_at = datetime.now(timezone.utc)

        matched_sources = [
            SourceMatch(
                document_id=item["document_id"],
                title=item["title"],
                score=item["score"],
                classification=classify_similarity(
                    item["score"],
                    suspicious_threshold=self.deps.suspicious_threshold,
                    plagiarized_threshold=self.deps.plagiarized_threshold,
                ),
                overlap_sentences=item.get("overlap_sentences", []),
            )
            for item in selected
        ]

        heatmap = [
            HeatmapCell(
                chunk_index=cell["chunk_index"],
                sentence_index=cell["sentence_index"],
                score=round(cell["score"], 2),
            )
            for item in selected
            for cell in item.get("heatmap", [])[:15]
        ]

        response = CheckResponse(
            report_id=report_id,
            similarity_score=round(top_score, 2),
            classification=classification,
            highlighted_text=highlighted,
            matched_sources=matched_sources,
            heatmap=heatmap,
            created_at=created_at,
            from_cache=False,
        )

        # store clean text
        self.deps.store.save_report(
            {
                "report_id": report_id,
                "created_at": created_at.isoformat(),
                "original_text": clean_text,
                "highlighted_text": highlighted,
                "similarity_score": response.similarity_score,
                "classification": response.classification,
                "matched_sources": [asdict(item) for item in matched_sources],
                "heatmap": [asdict(item) for item in heatmap],
            }
        )

        payload = response.model_dump(mode="json")
        self.deps.cache.set(cache_key, payload)

        return response

    def fetch_report(self, report_id: str) -> dict | None:
        return self.deps.store.get_report(report_id)

    def generate_pdf(self, report_id: str) -> Path | None:
        report = self.fetch_report(report_id)
        if report is None:
            return None
        target = self.deps.reports_pdf_dir / f"{report_id}.pdf"
        return generate_report_pdf(target, report)

    def compare_texts(self, left_text: str, right_text: str) -> dict:
        #  clean both texts
        left_clean = self.preprocessor.process(left_text).raw_text
        right_clean = self.preprocessor.process(right_text).raw_text

        left_candidate = [
            {
                "document_id": "right-text",
                "title": "Right Text",
                "raw_text": right_clean,
                "processed_text": preprocess_text(right_clean),
            }
        ]

        right_candidate = [
            {
                "document_id": "left-text",
                "title": "Left Text",
                "raw_text": left_clean,
                "processed_text": preprocess_text(left_clean),
            }
        ]

        forward_matches = self.deps.similarity_engine.compare(left_clean, left_candidate)
        backward_matches = self.deps.similarity_engine.compare(right_clean, right_candidate)

        forward = forward_matches[0] if forward_matches else {"score": 0.0, "overlap_sentences": [], "heatmap": []}
        backward = backward_matches[0] if backward_matches else {"score": 0.0, "overlap_sentences": [], "heatmap": []}

        similarity_score = round(
            (float(forward.get("score", 0.0)) + float(backward.get("score", 0.0))) / 2,
            2,
        )

        classification = classify_similarity(
            similarity_score,
            suspicious_threshold=self.deps.suspicious_threshold,
            plagiarized_threshold=self.deps.plagiarized_threshold,
        )

        overlap_sentences = sorted(
            set((forward.get("overlap_sentences", []) or []) +
                (backward.get("overlap_sentences", []) or [])),
            key=len,
            reverse=True,
        )

        return {
            "comparison_id": uuid4().hex,
            "similarity_score": similarity_score,
            "classification": classification,
            "highlighted_text_a": highlight_sentences(left_clean, overlap_sentences),
            "highlighted_text_b": highlight_sentences(right_clean, overlap_sentences),
            "overlap_sentences": overlap_sentences,
            "source_count": 2,
            "heatmap": forward.get("heatmap", []),
        }
