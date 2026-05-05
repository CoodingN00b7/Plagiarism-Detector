from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Plagiarism Detection Platform"
    app_env: str = "development"
    api_prefix: str = "/api/v1"

    backend_root: Path = Path(__file__).resolve().parents[1]
    storage_dir: Path = backend_root / "storage"
    upload_dir: Path = storage_dir / "uploads"
    reports_pdf_dir: Path = storage_dir / "pdf_reports"

    sqlite_path: Path = storage_dir / "plagiarism_platform.db"
    pan_dataset_root: Path = storage_dir / "pan2011"
    processed_dataset_json: Path = storage_dir / "pan2011_processed.json"

    similarity_threshold_original: float = 20.0
    similarity_threshold_suspicious: float = 50.0

    chunk_size: int = 6
    max_source_candidates: int = 10
    cache_ttl_seconds: int = 600

    sentence_transformer_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    enable_semantic_engine: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.reports_pdf_dir.mkdir(parents=True, exist_ok=True)
    return settings
