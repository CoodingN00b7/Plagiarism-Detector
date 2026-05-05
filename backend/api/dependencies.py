from functools import lru_cache

from backend.services.candidate_index import CandidateIndex
from backend.services.preprocessing import Preprocessor
from backend.services.text_plagiarism_check import get_text_plagiarism_checker
from backend.services.reporting import ReportingDependencies, ReportingService
from backend.services.semantic_index import SemanticCandidateIndex
from backend.services.similarity import SemanticSimilarityEngine, SimilarityEngine
from backend.services.storage import SQLiteStore
from backend.utils.cache import TTLCache
from backend.utils.config import get_settings


@lru_cache
def get_store() -> SQLiteStore:
    settings = get_settings()
    return SQLiteStore(settings.sqlite_path)


@lru_cache
def get_preprocessor() -> Preprocessor:
    return Preprocessor()


@lru_cache
def get_candidate_index() -> CandidateIndex:
    return CandidateIndex(get_store())


@lru_cache
def get_semantic_index() -> SemanticCandidateIndex:
    settings = get_settings()
    return SemanticCandidateIndex(get_store(), settings.sentence_transformer_model)


@lru_cache
def get_reporting_service() -> ReportingService:
    settings = get_settings()
    deps = ReportingDependencies(
        store=get_store(),
        candidate_index=get_candidate_index(),
        semantic_index=get_semantic_index(),
        similarity_engine=SimilarityEngine(chunk_size=settings.chunk_size),
        semantic_engine=SemanticSimilarityEngine(settings.sentence_transformer_model),
        cache=TTLCache(ttl_seconds=settings.cache_ttl_seconds),
        suspicious_threshold=settings.similarity_threshold_original,
        plagiarized_threshold=settings.similarity_threshold_suspicious,
        max_source_candidates=settings.max_source_candidates,
        reports_pdf_dir=settings.reports_pdf_dir,
    )
    return ReportingService(deps)


@lru_cache
def get_hybrid_text_checker():
    return get_text_plagiarism_checker()
