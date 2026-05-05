from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CheckRequest(BaseModel):
    text: str = Field(min_length=20, description="Text to analyze for plagiarism")
    top_k: int = Field(default=5, ge=1, le=20)
    use_semantic: bool = False


class SourceMatch(BaseModel):
    document_id: str
    title: str
    score: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    overlap_sentences: list[str]


class HeatmapCell(BaseModel):
    chunk_index: int
    sentence_index: int
    score: float


class CheckResponse(BaseModel):
    report_id: str
    similarity_score: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    highlighted_text: str
    matched_sources: list[SourceMatch]
    heatmap: list[HeatmapCell]
    created_at: datetime
    from_cache: bool = False


class ReportResponse(CheckResponse):
    original_text: str


class ExplanationSignal(BaseModel):
    name: str
    value: float
    weight: float
    contribution: float
    note: str


class ExplanationSource(BaseModel):
    document_id: str
    title: str
    score: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    overlap_count: int


class ReportExplanationResponse(BaseModel):
    report_id: str
    similarity_score: float
    confidence_score: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    signal_breakdown: list[ExplanationSignal]
    top_sources: list[ExplanationSource]
    recommendation: str


class DocumentSummary(BaseModel):
    document_id: str
    title: str
    source_path: str
    word_count: int


class UploadResponse(BaseModel):
    filename: str
    report: CheckResponse


class AnalyzeFileItem(BaseModel):
    filename: str
    report: CheckResponse


class AnalyzeFileResponse(BaseModel):
    reports: list[AnalyzeFileItem]


class CompareTextRequest(BaseModel):
    text_a: str = Field(min_length=20, description="First text to compare")
    text_b: str = Field(min_length=20, description="Second text to compare")


class CompareTextResponse(BaseModel):
    comparison_id: str
    similarity_score: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    highlighted_text_a: str
    highlighted_text_b: str
    overlap_sentences: list[str]
    source_count: int


# ===== Single Text Plagiarism Check Schemas =====

class SentenceSource(BaseModel):
    """Source information for a plagiarized sentence."""
    title: str
    similarity: float
    source: str  # "Wikipedia" or "Local Database"


class SentencePlagiarismResult(BaseModel):
    """Result for a single sentence."""
    text: str
    similarity: float
    is_plagiarized: bool
    sources: list[SentenceSource] = []
    source_types: list[str] = []


class TextPlagiarismCheckRequest(BaseModel):
    """Request body for single text plagiarism check."""
    text: str = Field(min_length=50, max_length=50000, description="Text to check for plagiarism")
    skip_wikipedia: bool = Field(default=False, description="Skip Wikipedia API search for faster processing")


class TextPlagiarismCheckResponse(BaseModel):
    """Response for single text plagiarism check."""
    plagiarism_percentage: float
    classification: Literal["Original", "Suspicious", "Plagiarized"]
    total_sentences: int
    plagiarized_sentences: int
    sentences: list[SentencePlagiarismResult]
