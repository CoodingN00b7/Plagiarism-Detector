"""
Text normalization and cleaning module.
Handles broken text, whitespace normalization, and readability improvements.
"""

import re
from typing import Optional


class TextNormalizer:
    """
    Normalize and clean text extracted from PDFs and other sources.
    Handles:
    - Broken characters (e.g., "T e c h n o l o g y" -> "Technology")
    - Excessive whitespace
    - Line breaks in wrong places
    - Word merging issues
    """

    # Pattern for single characters separated by spaces
    # Matches: "T e c h n o l o g y"
    SPACED_CHARS_PATTERN = re.compile(r'\b([a-z])\s+(?=[a-z]\s)')

    # Pattern for excessive spaces
    EXCESSIVE_SPACES = re.compile(r' {2,}')

    # Pattern for newlines that break words
    BROKEN_NEWLINES = re.compile(r'(\w)-\n(\w)')

    def normalize(self, text: str) -> str:
        """
        Complete text cleaning pipeline.
        
        Args:
            text: Input text to clean
        
        Returns:
            Cleaned text ready for analysis
        """
        if not text:
            return text

        # Step 1: Normalize whitespace first
        text = self._normalize_whitespace(text)

        # Step 2: Fix spaced characters
        text = self._fix_spaced_characters(text)

        # Step 3: Fix merged words
        text = self._fix_merged_words(text)

        # Step 4: Final whitespace cleanup
        text = self._normalize_whitespace(text)

        return text

    @staticmethod
    def _normalize_whitespace(text: str) -> str:
        """
        Normalize whitespace in text.
        - Remove extra spaces between words
        - Fix newlines that break words
        - Clean leading/trailing whitespace
        """
        if not text:
            return text

        # Fix hyphens at line breaks (e.g., "word-\nbreak" -> "wordbreak")
        text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)

        # Replace multiple spaces with single space
        text = re.sub(r' {2,}', ' ', text)

        # Replace tabs and multiple newlines
        text = text.replace('\t', ' ')
        text = re.sub(r'\n{2,}', '\n', text)

        # Clean up spaces around newlines
        text = re.sub(r' +\n', '\n', text)
        text = re.sub(r'\n +', '\n', text)

        return text.strip()

    @staticmethod
    def _fix_spaced_characters(text: str) -> str:
        """
        Fix broken characters that are separated by spaces.
        Example: "T e c h n o l o g y" -> "Technology"
        
        Only fixes cases where:
        - All characters are lowercase letters separated by single spaces
        - The sequence is at least 4 characters long (to avoid false positives)
        """
        if not text or len(text) < 7:  # Minimum: "T e c h" (7 chars)
            return text

        # Pattern: word character followed by space, repeated pattern (4+ chars)
        pattern = r'[a-zA-Z](?:\s+[a-zA-Z]){3,}'
        
        def fix_match(m):
            spaced_word = m.group(0)
            chars = spaced_word.split()
            if len(chars) >= 4:
                # Check if this looks like a real word (not an acronym)
                # Skip if it's all uppercase (likely an acronym)
                if not spaced_word.replace(' ', '').isupper():
                    return ''.join(chars)
            return spaced_word

        result = re.sub(pattern, fix_match, text)
        return result

    @staticmethod
    def _fix_merged_words(text: str) -> str:
        """
        Fix merged words without separators.
        Example: "CryptographyandNetworkSecurity" -> "Cryptography and Network Security"
        
        Uses simple heuristics:
        - Look for transitions from lowercase to uppercase (camelCase)
        - Insert spaces between adjacent capital letters followed by lowercase
        """
        if not text:
            return text

        # Pattern: lowercase followed by uppercase (camelCase)
        # Example: "word" + "Word" = "wordWord" -> "word Word"
        result = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

        # Pattern: multiple capitals followed by lowercase
        # Example: "XMLHttpRequest" -> "XML Http Request"
        result = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', result)

        # Pattern: "and", "or", "the" merged with words
        result = re.sub(r'([a-z])and([A-Z])', r'\1 and \2', result)
        result = re.sub(r'([a-z])or([A-Z])', r'\1 or \2', result)
        result = re.sub(r'([a-z])the([A-Z])', r'\1 the \2', result)

        return result
