"""
Rewrite suggestions service for paraphrasing and improving sentences.
Uses simple NLP techniques and patterns for generating alternatives.
Can be extended with OpenAI/Cohere APIs for advanced suggestions.
"""

from typing import List
import re


class RewriteService:
    """
    Generates alternative phrasings and rewrites for sentences.
    Uses pattern-based and synonym replacement strategies.
    """
    
    # Synonym mappings for common words
    SYNONYMS = {
        "important": ["crucial", "significant", "essential", "vital", "key"],
        "good": ["excellent", "great", "outstanding", "impressive", "remarkable"],
        "bad": ["poor", "inadequate", "unsatisfactory", "subpar", "inferior"],
        "big": ["large", "substantial", "significant", "extensive", "vast"],
        "small": ["tiny", "little", "minor", "modest", "compact"],
        "help": ["assist", "support", "aid", "facilitate", "enable"],
        "make": ["create", "produce", "generate", "construct", "build"],
        "get": ["obtain", "acquire", "receive", "secure", "retrieve"],
        "use": ["utilize", "employ", "leverage", "apply", "implement"],
        "show": ["demonstrate", "exhibit", "reveal", "display", "illustrate"],
        "need": ["require", "demand", "necessitate", "call for", "depend on"],
        "different": ["distinct", "diverse", "varied", "unique", "dissimilar"],
        "similar": ["alike", "comparable", "equivalent", "parallel", "analogous"],
        "think": ["believe", "consider", "assume", "suppose", "reckon"],
        "know": ["understand", "realize", "acknowledge", "recognize", "grasp"],
    }
    
    def __init__(self):
        pass
    
    def generate_rewrites(self, sentence: str, num_alternatives: int = 3) -> List[str]:
        """
        Generate multiple rewrites of a sentence.
        
        Args:
            sentence: Original sentence to rewrite
            num_alternatives: Number of alternative phrasings to generate
        
        Returns:
            List of alternative sentences
        """
        if not sentence or len(sentence.strip()) < 10:
            return []
        
        alternatives = []
        
        # Strategy 1: Synonym replacement
        alt1 = self._synonym_replacement(sentence)
        if alt1 and alt1 != sentence:
            alternatives.append(alt1)
        
        # Strategy 2: Voice change (active to passive or vice versa)
        alt2 = self._voice_transformation(sentence)
        if alt2 and alt2 != sentence:
            alternatives.append(alt2)
        
        # Strategy 3: Structural reorganization
        alt3 = self._restructure_sentence(sentence)
        if alt3 and alt3 != sentence:
            alternatives.append(alt3)
        
        # Strategy 4: Multiple synonym replacements
        alt4 = self._multi_synonym_replacement(sentence)
        if alt4 and alt4 != sentence:
            alternatives.append(alt4)
        
        # Return only unique alternatives up to requested count
        unique_alts = list(set(alternatives))[:num_alternatives]
        return unique_alts if unique_alts else [self._simple_restructure(sentence)]
    
    def _synonym_replacement(self, sentence: str) -> str:
        """
        Replace one word with a synonym.
        """
        words = sentence.lower().split()
        
        for word_base, synonyms in self.SYNONYMS.items():
            if word_base in words:
                idx = words.index(word_base)
                words[idx] = synonyms[0]  # Take first synonym
                # Capitalize if original was capitalized
                if sentence[sentence.find(word_base)] .isupper():
                    words[idx] = words[idx].capitalize()
                return ' '.join(words)
        
        return sentence
    
    def _multi_synonym_replacement(self, sentence: str) -> str:
        """
        Replace multiple words with synonyms.
        """
        words = sentence.split()
        original_words = sentence.lower().split()
        changed = False
        
        for i, word in enumerate(original_words):
            word_clean = word.strip('.,!?;:')
            if word_clean in self.SYNONYMS:
                synonyms = self.SYNONYMS[word_clean]
                words[i] = words[i].replace(word_clean, synonyms[1] if len(synonyms) > 1 else synonyms[0])
                changed = True
                if len([w for w in original_words if w.strip('.,!?;:') in self.SYNONYMS]) > 2:
                    break
        
        return ' '.join(words) if changed else sentence
    
    def _voice_transformation(self, sentence: str) -> str:
        """
        Transform between active and passive voice (simplified).
        Detects patterns like "X did Y" and suggests "Y was done by X"
        """
        # This is simplified; real implementation would use dependency parsing
        # Pattern: "X [verb] [object]" -> "[Object] is/was [verb]ed by X"
        
        patterns = [
            (r"(\w+)\s+(provide[ds]?)\s+(.*)", r"\3 is \2 by \1"),
            (r"(\w+)\s+(create[ds]?)\s+(.*)", r"\3 is created by \1"),
            (r"(\w+)\s+(develop[ds]?)\s+(.*)", r"\3 is developed by \1"),
            (r"(\w+)\s+(show[s]?)\s+(.*)", r"\3 is shown by \1"),
        ]
        
        for pattern, replacement in patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                return re.sub(pattern, replacement, sentence, flags=re.IGNORECASE)
        
        return sentence
    
    def _restructure_sentence(self, sentence: str) -> str:
        """
        Restructure sentence by moving clauses or phrases.
        """
        # Split on common conjunctions
        if " and " in sentence:
            parts = sentence.split(" and ")
            if len(parts) == 2:
                return f"{parts[1].capitalize()} and {parts[0].lower()}"
        
        if " because " in sentence:
            parts = sentence.split(" because ")
            if len(parts) == 2:
                return f"Since {parts[1].capitalize()}, {parts[0].lower()}"
        
        if " while " in sentence:
            parts = sentence.split(" while ")
            if len(parts) == 2:
                return f"While {parts[1].capitalize()}, {parts[0].lower()}"
        
        return sentence
    
    def _simple_restructure(self, sentence: str) -> str:
        """
        Simple structural change: move adjectives or add emphasis.
        """
        # Add transition phrases
        transitions = ["Essentially, ", "In summary, ", "Therefore, ", "Significantly, "]
        
        # Check if not already starting with a transition
        if not any(sentence.lower().startswith(t.lower()) for t in transitions):
            return f"{transitions[0]}{sentence[0].lower()}{sentence[1:]}"
        
        return sentence
    
    def get_improvement_suggestions(self, sentence: str) -> dict:
        """
        Analyze sentence and provide improvement suggestions beyond rewrites.
        
        Returns:
            Dict with rewrites and suggestions
        """
        rewrites = self.generate_rewrites(sentence, num_alternatives=3)
        
        suggestions = []
        
        # Check for common issues
        if len(sentence.split()) > 30:
            suggestions.append("Consider breaking this long sentence into smaller ones for better readability")
        
        if sentence.lower().count("and") >= 2:
            suggestions.append("Multiple 'and' conjunctions detected. Consider using varied sentence structure")
        
        if "very " in sentence.lower() or "really " in sentence.lower():
            suggestions.append("Remove intensifiers like 'very' or 'really' for more professional writing")
        
        if sentence.count(",") >= 3:
            suggestions.append("Multiple commas detected. Consider rephrasing for clarity")
        
        if "can be" in sentence.lower():
            suggestions.append("Use active voice instead of 'can be'")
        
        return {
            "original": sentence,
            "rewrites": rewrites,
            "suggestions": suggestions,
            "word_count": len(sentence.split()),
        }


def get_rewrite_service() -> RewriteService:
    """Factory function for rewrite service."""
    return RewriteService()
