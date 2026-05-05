from dataclasses import dataclass
import re

from backend.utils.text import (
    preprocess_text,
    preprocess_tokens,
    split_sentences,
    normalize_whitespace,
)


@dataclass
class ProcessedDocument:
    raw_text: str
    processed_text: str
    tokens: list[str]
    sentences: list[str]


class Preprocessor:
    def _fix_broken_words(self, text: str) -> str:
        """
        Fix words that are incorrectly split by spaces (common in PDF extraction).
        Example:
        'T e c h n o l o g y' -> 'Technology'
        'Enginee ring' -> 'Engineering'
        """
        # Remove spaces between letters
        text = re.sub(r"(?<=\w)\s(?=\w)", "", text)
        return text

    def process(self, text: str) -> ProcessedDocument:
        # Step 1: Normalize whitespace
        cleaned = normalize_whitespace(text)

        # Step 2: Fix broken words (🔥 KEY FIX)
        cleaned = self._fix_broken_words(cleaned)

        # Step 3: Tokenization for ML
        tokens = preprocess_tokens(cleaned)

        # Step 4: Build final object
        return ProcessedDocument(
            raw_text=cleaned,                     
            processed_text=preprocess_text(cleaned),  
            tokens=tokens,
            sentences=split_sentences(cleaned),
        )
