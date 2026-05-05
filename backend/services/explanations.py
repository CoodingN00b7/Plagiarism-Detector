from __future__ import annotations

from collections import Counter
from typing import Any

from backend.models.schemas import ExplanationSignal, ExplanationSource, ReportExplanationResponse
from backend.services.classification import classify_similarity


def _overlap_count(source: dict[str, Any]) -> int:
    return len(source.get("overlap_sentences", []) or [])


def build_report_explanation(
    report: dict[str, Any],
    suspicious_threshold: float,
    plagiarized_threshold: float,
) -> ReportExplanationResponse:
    sources = report.get("matched_sources", []) or []
    top_sources = [
        ExplanationSource(
            document_id=source["document_id"],
            title=source["title"],
            score=float(source["score"]),
            classification=classify_similarity(
                float(source["score"]),
                suspicious_threshold=suspicious_threshold,
                plagiarized_threshold=plagiarized_threshold,
            ),
            overlap_count=_overlap_count(source),
        )
        for source in sources[:5]
    ]

    max_source_score = max((source.score for source in top_sources), default=0.0)
    total_overlap_sentences = sum(source.overlap_count for source in top_sources)
    heatmap_values = [float(cell.get("score", 0.0)) for cell in report.get("heatmap", []) or []]
    avg_heatmap = sum(heatmap_values) / len(heatmap_values) if heatmap_values else 0.0
    high_heat_cells = sum(1 for value in heatmap_values if value >= 60)

    weighted_signals = [
        ("Top source similarity", round(max_source_score, 2), 0.45, "Highest source score after hybrid retrieval and chunk comparison."),
        ("Sentence overlap", float(total_overlap_sentences), 0.25, "Count of suspicious sentence overlaps retained from matched sources."),
        ("Heatmap intensity", round(avg_heatmap, 2), 0.20, "Average chunk-level heat intensity across the selected source candidates."),
        ("High-confidence chunks", float(high_heat_cells), 0.10, "Number of chunks scoring at least 60% similarity."),
    ]

    raw_weighted_total = sum(value * weight for _, value, weight, _ in weighted_signals)
    confidence_score = min(100.0, max(0.0, raw_weighted_total))

    if raw_weighted_total > 0:
        signal_breakdown = [
            ExplanationSignal(
                name="Top source similarity",
                value=round(max_source_score, 2),
                weight=0.45,
                contribution=round((max_source_score * 0.45 / raw_weighted_total) * 100, 2),
                note="Highest source score after hybrid retrieval and chunk comparison.",
            ),
            ExplanationSignal(
                name="Sentence overlap",
                value=float(total_overlap_sentences),
                weight=0.25,
                contribution=round((total_overlap_sentences * 0.25 / raw_weighted_total) * 100, 2),
                note="Count of suspicious sentence overlaps retained from matched sources.",
            ),
            ExplanationSignal(
                name="Heatmap intensity",
                value=round(avg_heatmap, 2),
                weight=0.20,
                contribution=round((avg_heatmap * 0.20 / raw_weighted_total) * 100, 2),
                note="Average chunk-level heat intensity across the selected source candidates.",
            ),
            ExplanationSignal(
                name="High-confidence chunks",
                value=float(high_heat_cells),
                weight=0.10,
                contribution=round((high_heat_cells * 0.10 / raw_weighted_total) * 100, 2),
                note="Number of chunks scoring at least 60% similarity.",
            ),
        ]
    else:
        signal_breakdown = [
            ExplanationSignal(
                name=name,
                value=value,
                weight=weight,
                contribution=0.0,
                note=note,
            )
            for name, value, weight, note in weighted_signals
        ]

    counts = Counter(source.classification for source in top_sources)
    if report["classification"] == "Plagiarized":
        recommendation = "Strong overlap detected. Review the highlighted sentences and cite or rewrite the affected sections."
    elif report["classification"] == "Suspicious":
        recommendation = "Moderate overlap detected. Review the source matches and verify paraphrasing or citations."
    else:
        recommendation = "Low similarity detected. The text appears mostly original, but review the highest-scoring sources if needed."

    if counts["Plagiarized"]:
        recommendation = f"{recommendation} One or more source matches are classified as plagiarized."

    return ReportExplanationResponse(
        report_id=report["report_id"],
        similarity_score=float(report["similarity_score"]),
        confidence_score=round(confidence_score, 2),
        classification=report["classification"],
        signal_breakdown=signal_breakdown,
        top_sources=top_sources,
        recommendation=recommendation,
    )