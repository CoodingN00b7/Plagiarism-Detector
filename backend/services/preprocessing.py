from dataclasses import dataclass

from backend.utils.text import preprocess_text, preprocess_tokens, split_sentences


@dataclass
class ProcessedDocument:
    raw_text: str
    processed_text: str
    tokens: list[str]
    sentences: list[str]


class Preprocessor:
    def process(self, text: str) -> ProcessedDocument:
        cleaned = text.strip()
        tokens = preprocess_tokens(cleaned)
        return ProcessedDocument(
            raw_text=cleaned,
            processed_text=preprocess_text(cleaned),
            tokens=tokens,
            sentences=split_sentences(cleaned),
        )
