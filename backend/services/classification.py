from typing import Literal


ClassificationLabel = Literal["Original", "Suspicious", "Plagiarized"]


def classify_similarity(score: float, suspicious_threshold: float, plagiarized_threshold: float) -> ClassificationLabel:
    if score < suspicious_threshold:
        return "Original"
    if score < plagiarized_threshold:
        return "Suspicious"
    return "Plagiarized"
