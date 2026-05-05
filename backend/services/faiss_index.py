"""
FAISS Index Management for Plagiarism Detection

Handles creation, loading, and searching of embeddings using FAISS.
"""

import os
import pickle
import numpy as np
from pathlib import Path
from typing import Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not installed. Semantic search will be unavailable.")

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False
    logger.warning("Sentence Transformers not available for generating real embeddings.")


class FAISSIndex:
    """Manages FAISS index for semantic similarity search."""
    
    def __init__(self, index_path: Optional[Path] = None):
        self.index_path = index_path or Path(__file__).parent.parent / "storage" / "faiss_index"
        self.index_path.mkdir(parents=True, exist_ok=True)
        
        self.index_file = self.index_path / "index.faiss"
        self.metadata_file = self.index_path / "metadata.pkl"
        self.embeddings_file = self.index_path / "embeddings.npy"
        
        self.index = None
        self.metadata = []
        self.embeddings = None
        self.model = None
        
        # Try to load existing index
        if self.index_file.exists() and self.metadata_file.exists():
            self._load_index()
        else:
            self._initialize_demo_index()
    
    def _load_model(self):
        """Load sentence transformer model if available."""
        if ST_AVAILABLE and self.model is None:
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Loaded Sentence Transformer for FAISS index")
            except Exception as e:
                logger.warning(f"Could not load Sentence Transformer: {e}")
    
    def _initialize_demo_index(self):
        """Initialize a demo FAISS index with sample data."""
        if not FAISS_AVAILABLE:
            logger.error("FAISS not available. Cannot initialize index.")
            return
        
        logger.info("Creating demo FAISS index with sample data...")
        
        # Create sample documents
        sample_documents = [
            {
                "id": "doc_001",
                "title": "Introduction to Machine Learning",
                "text": "Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.",
                "source": "Local DB"
            },
            {
                "id": "doc_002",
                "title": "Deep Learning Fundamentals",
                "text": "Deep learning is a method based on learning representations of data with multiple levels of abstraction and is used for complex pattern recognition.",
                "source": "Local DB"
            },
            {
                "id": "doc_003",
                "title": "Natural Language Processing",
                "text": "Natural language processing is a subfield of artificial intelligence concerned with interactions between computers and human language.",
                "source": "Local DB"
            },
            {
                "id": "doc_004",
                "title": "Computer Vision Basics",
                "text": "Computer vision is a field of artificial intelligence that works with images and video to extract meaningful information and make decisions.",
                "source": "Local DB"
            },
            {
                "id": "doc_005",
                "title": "Data Science Overview",
                "text": "Data science is an interdisciplinary field that uses scientific methods to extract knowledge and insights from data.",
                "source": "Local DB"
            },
            {
                "id": "doc_006",
                "title": "Neural Networks",
                "text": "Neural networks are computing systems inspired by biological neural networks and are used for machine learning tasks.",
                "source": "Local DB"
            },
            {
                "id": "doc_007",
                "title": "Supervised Learning",
                "text": "Supervised learning is a machine learning approach using labeled training data to teach algorithms to make accurate predictions.",
                "source": "Local DB"
            },
            {
                "id": "doc_008",
                "title": "Feature Engineering",
                "text": "Feature engineering is the process of selecting and transforming raw data into features that better represent the problem.",
                "source": "Local DB"
            }
        ]
        
        texts = [doc["text"] for doc in sample_documents]
        embedding_dim = 384
        
        # Try to generate real embeddings
        self._load_model()
        if self.model is not None:
            try:
                logger.info("Generating real embeddings using Sentence Transformer...")
                embeddings = self.model.encode(texts, convert_to_numpy=True)
                logger.info(f"Generated {len(embeddings)} real embeddings")
            except Exception as e:
                logger.warning(f"Failed to generate real embeddings: {e}. Using random embeddings.")
                embeddings = np.random.randn(len(sample_documents), embedding_dim).astype('float32')
        else:
            logger.warning("Sentence Transformer not available. Using random embeddings.")
            embeddings = np.random.randn(len(sample_documents), embedding_dim).astype('float32')
        
        embeddings = embeddings.astype('float32')
        
        # Normalize embeddings for IP index
        faiss.normalize_L2(embeddings)
        
        self.metadata = sample_documents
        self.embeddings = embeddings
        
        # Create FAISS index
        self.index = faiss.IndexFlatIP(embedding_dim)
        self.index.add(embeddings)
        
        # Save index
        self._save_index()
        logger.info(f"Demo FAISS index created with {len(sample_documents)} documents.")
    
    def _load_index(self):
        """Load existing FAISS index from disk."""
        try:
            if FAISS_AVAILABLE:
                self.index = faiss.read_index(str(self.index_file))
            
            with open(self.metadata_file, 'rb') as f:
                self.metadata = pickle.load(f)
            
            if self.embeddings_file.exists():
                self.embeddings = np.load(self.embeddings_file)
            
            logger.info(f"Loaded FAISS index with {len(self.metadata)} documents.")
        except Exception as e:
            logger.error(f"Error loading FAISS index: {e}. Creating new index.")
            self._initialize_demo_index()
    
    def _save_index(self):
        """Save FAISS index to disk."""
        try:
            if self.index and FAISS_AVAILABLE:
                faiss.write_index(self.index, str(self.index_file))
            
            if self.metadata:
                with open(self.metadata_file, 'wb') as f:
                    pickle.dump(self.metadata, f)
            
            if self.embeddings is not None:
                np.save(self.embeddings_file, self.embeddings)
            
            logger.info("FAISS index saved successfully.")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {e}")
    
    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Tuple[str, float, str]]:
        """
        Search for similar embeddings in the index.
        
        Args:
            query_embedding: Query embedding vector
            top_k: Number of top results to return
        
        Returns:
            List of tuples (document_id, similarity_score, document_title)
        """
        if self.index is None or not FAISS_AVAILABLE:
            logger.warning("FAISS index not available. Returning empty results.")
            return []
        
        # Ensure query embedding is float32 and has correct shape
        query_embedding = np.array([query_embedding]).astype('float32')
        
        # Normalize for IP index
        faiss.normalize_L2(query_embedding)
        
        # Search
        similarities, indices = self.index.search(query_embedding, min(top_k, len(self.metadata)))
        
        results = []
        for idx, sim in zip(indices[0], similarities[0]):
            if 0 <= idx < len(self.metadata):
                doc = self.metadata[int(idx)]
                results.append((doc['id'], float(sim), doc['title']))
        
        return results
    
    def add_document(self, doc_id: str, title: str, text: str, embedding: np.ndarray, source: str = "Local DB"):
        """
        Add a new document to the index.
        
        Args:
            doc_id: Document ID
            title: Document title
            text: Document text
            embedding: Document embedding vector
            source: Document source
        """
        if self.index is None or not FAISS_AVAILABLE:
            logger.warning("FAISS index not available. Cannot add document.")
            return
        
        embedding = np.array([embedding]).astype('float32')
        faiss.normalize_L2(embedding)
        
        self.index.add(embedding)
        self.metadata.append({
            "id": doc_id,
            "title": title,
            "text": text,
            "source": source
        })
        
        if self.embeddings is None:
            self.embeddings = embedding
        else:
            self.embeddings = np.vstack([self.embeddings, embedding])
        
        self._save_index()
        logger.info(f"Added document {doc_id} to FAISS index.")
    
    def is_available(self) -> bool:
        """Check if FAISS index is available."""
        return self.index is not None and FAISS_AVAILABLE


# Global instance
_faiss_instance: Optional[FAISSIndex] = None


def get_faiss_index() -> FAISSIndex:
    """Get or create the global FAISS index instance."""
    global _faiss_instance
    if _faiss_instance is None:
        _faiss_instance = FAISSIndex()
    return _faiss_instance
