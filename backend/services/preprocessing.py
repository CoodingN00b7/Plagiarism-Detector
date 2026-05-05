from dataclasses import dataclass

from backend.utils.text import preprocess_text, preprocess_tokens, split_sentences
from backend.services.text_normalization import TextNormalizer


@dataclass
class ProcessedDocument:
    raw_text: str
    normalized_text: str
    processed_text: str
    tokens: list[str]
    sentences: list[str]


class Preprocessor:
    def __init__(self):
        self.normalizer = TextNormalizer()
    
    def process(self, text: str) -> ProcessedDocument:
        cleaned = text.strip()
        # CRITICAL: Normalize text FIRST to fix spacing issues
        normalized = self.normalizer.normalize(cleaned)
        tokens = preprocess_tokens(normalized)
        return ProcessedDocument(
            raw_text=cleaned,
            normalized_text=normalized,
            processed_text=preprocess_text(normalized),
            tokens=tokens,
            sentences=split_sentences(normalized),
        )
