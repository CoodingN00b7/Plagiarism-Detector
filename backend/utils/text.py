import re
from typing import Iterable

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS


WORD_RE = re.compile(r"[A-Za-z']+")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")


def split_sentences(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text.strip())
    if not cleaned:
        return []
    return [s.strip() for s in SENTENCE_RE.split(cleaned) if s.strip()]


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def simple_lemmatize(word: str) -> str:
    # Lightweight rule-based lemmatization fallback for environments without NLP corpora.
    if len(word) <= 3:
        return word
    if word.endswith("ies") and len(word) > 4:
        return f"{word[:-3]}y"
    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    if word.endswith("s") and len(word) > 4:
        return word[:-1]
    return word


def tokenize(text: str) -> list[str]:
    return [m.group(0).lower() for m in WORD_RE.finditer(text)]


def preprocess_tokens(text: str, stopwords: Iterable[str] | None = None) -> list[str]:
    active_stopwords = set(stopwords) if stopwords is not None else set(ENGLISH_STOP_WORDS)
    tokens = tokenize(text)
    filtered = [t for t in tokens if t not in active_stopwords]
    return [simple_lemmatize(token) for token in filtered]


def preprocess_text(text: str) -> str:
    return " ".join(preprocess_tokens(text))
