"""
Enhanced Embedding Manager with Incremental Processing and Smart Caching
"""

import asyncio
import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

import numpy as np
from sentence_transformers import SentenceTransformer
import torch
from transformers import AutoTokenizer, AutoModel

from ..utils.cache_service import CacheService
# from ..utils.change_tracker import ChangeTracker
from ..models.document import Document, DocumentChunk
from .config import get_settings


@dataclass
class EmbeddingResult:
    """Embedding result with metadata."""
    document_id: str
    chunk_id: str
    embedding: List[float]
    text: str
    timestamp: datetime
    model_name: str
    hash: str


class EmbeddingManager:
    """Enhanced Embedding Manager with incremental processing."""
    
    def __init__(self):
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        
        # Model and tokenizer
        self.model: Optional[SentenceTransformer] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Caching and tracking
        self.cache = CacheService(
            max_size=self.settings.CACHE_SIZE,
            ttl=self.settings.EMBEDDING_CACHE_TTL
        )
        # self.change_tracker = ChangeTracker()
        
        # Performance tracking
        self.stats = {
            "embeddings_created": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_processing_time": 0.0,
            "average_embedding_time": 0.0
        }
        
        # Model configuration
        self.model_name = self.settings.DEFAULT_EMBEDDING_MODEL
        self.max_chunk_size = 512  # tokens
        self.chunk_overlap = 50    # tokens
        
    async def initialize(self):
        """Initialize the embedding manager."""
        try:
            self.logger.info(f"Initializing Embedding Manager with model: {self.model_name}")
            
            # Load model
            await self._load_model()
            
            # Initialize cache
            await self.cache.initialize()
            
            # Initialize change tracker
            # await self.change_tracker.initialize()
            
            self.logger.info("Embedding Manager initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Embedding Manager: {e}")
            raise
    
    async def _load_model(self):
        """Load the embedding model."""
        try:
            # Load SentenceTransformer model
            self.model = SentenceTransformer(self.model_name, device=self.device)
            
            # Load tokenizer for text processing
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            self.logger.info(f"Model {self.model_name} loaded on device: {self.device}")
            
        except Exception as e:
            self.logger.error(f"Failed to load model {self.model_name}: {e}")
            raise
    
    async def process_document(self, document: Document, force_reprocess: bool = False) -> List[EmbeddingResult]:
        """Process a document with incremental embedding."""
        start_time = time.time()
        
        try:
            # Check if document has changed
            # if not force_reprocess:
            #     has_changed = await self.change_tracker.has_changed(document.id, document.content)
            #     if not has_changed:
            #         self.logger.debug(f"Document {document.id} unchanged, skipping processing")
            #         return await self._get_cached_embeddings(document.id)
            
            # Split document into chunks
            chunks = await self._split_document(document)
            
            # Process chunks incrementally
            results = []
            for chunk in chunks:
                embedding_result = await self._process_chunk(document.id, chunk, force_reprocess)
                if embedding_result:
                    results.append(embedding_result)
            
            # Update change tracker
            # await self.change_tracker.update_document(document.id, document.content)
            
            # Update statistics
            processing_time = time.time() - start_time
            self.stats["total_processing_time"] += processing_time
            self.stats["embeddings_created"] += len(results)
            self.stats["average_embedding_time"] = (
                self.stats["total_processing_time"] / max(self.stats["embeddings_created"], 1)
            )
            
            self.logger.info(f"Processed document {document.id}: {len(results)} embeddings in {processing_time:.2f}s")
            return results
            
        except Exception as e:
            self.logger.error(f"Failed to process document {document.id}: {e}")
            raise
    
    async def _split_document(self, document: Document) -> List[DocumentChunk]:
        """Split document into chunks for embedding."""
        chunks = []
        
        # Tokenize the document
        tokens = self.tokenizer.encode(document.content, add_special_tokens=False)
        
        # Split into chunks with overlap
        for i in range(0, len(tokens), self.max_chunk_size - self.chunk_overlap):
            chunk_tokens = tokens[i:i + self.max_chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens, skip_special_tokens=True)
            
            chunk = DocumentChunk(
                id=f"{document.id}_chunk_{len(chunks)}",
                document_id=document.id,
                text=chunk_text,
                start_index=i,
                end_index=min(i + self.max_chunk_size, len(tokens)),
                metadata={
                    "chunk_index": len(chunks),
                    "total_tokens": len(chunk_tokens),
                    "overlap_tokens": self.chunk_overlap if i > 0 else 0
                }
            )
            chunks.append(chunk)
        
        return chunks
    
    async def _process_chunk(self, document_id: str, chunk: DocumentChunk, force_reprocess: bool = False) -> Optional[EmbeddingResult]:
        """Process a single chunk."""
        # Generate content hash
        content_hash = hashlib.sha256(chunk.text.encode()).hexdigest()
        cache_key = f"{document_id}_{chunk.id}_{content_hash}"
        
        # Check cache first
        if not force_reprocess:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                self.stats["cache_hits"] += 1
                self.logger.debug(f"Cache hit for chunk {chunk.id}")
                return EmbeddingResult(**cached_result)
        
        self.stats["cache_misses"] += 1
        
        # Create embedding
        try:
            embedding = await self._create_embedding(chunk.text)
            
            result = EmbeddingResult(
                document_id=document_id,
                chunk_id=chunk.id,
                embedding=embedding.tolist(),
                text=chunk.text,
                timestamp=datetime.now(),
                model_name=self.model_name,
                hash=content_hash
            )
            
            # Cache the result
            await self.cache.set(cache_key, asdict(result))
            
            return result
            
        except Exception as e:
            self.logger.error(f"Failed to process chunk {chunk.id}: {e}")
            return None
    
    async def _create_embedding(self, text: str) -> np.ndarray:
        """Create embedding for text."""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None, 
                lambda: self.model.encode(text, convert_to_numpy=True)
            )
            return embedding
            
        except Exception as e:
            self.logger.error(f"Failed to create embedding: {e}")
            raise
    
    async def _get_cached_embeddings(self, document_id: str) -> List[EmbeddingResult]:
        """Get cached embeddings for a document."""
        results = []
        
        # Get all cache keys for this document
        cache_keys = await self.cache.get_keys_by_prefix(document_id)
        
        for key in cache_keys:
            cached_data = await self.cache.get(key)
            if cached_data:
                results.append(EmbeddingResult(**cached_data))
        
        return results
    
    async def batch_process_documents(self, documents: List[Document], batch_size: int = None) -> Dict[str, List[EmbeddingResult]]:
        """Process multiple documents in batches."""
        if batch_size is None:
            batch_size = self.settings.BATCH_SIZE
        
        results = {}
        
        # Process in batches
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.process_document(doc) for doc in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Collect results
            for doc, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    self.logger.error(f"Failed to process document {doc.id}: {result}")
                    results[doc.id] = []
                else:
                    results[doc.id] = result
        
        return results
    
    async def search_similar(self, query: str, top_k: int = 10, threshold: float = 0.7) -> List[Tuple[EmbeddingResult, float]]:
        """Search for similar embeddings."""
        try:
            # Create query embedding
            query_embedding = await self._create_embedding(query)
            
            # Get all cached embeddings
            all_embeddings = []
            cache_keys = await self.cache.get_all_keys()
            
            for key in cache_keys:
                cached_data = await self.cache.get(key)
                if cached_data:
                    embedding_result = EmbeddingResult(**cached_data)
                    all_embeddings.append(embedding_result)
            
            # Calculate similarities
            similarities = []
            for embedding_result in all_embeddings:
                embedding_vector = np.array(embedding_result.embedding)
                similarity = np.dot(query_embedding, embedding_vector) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(embedding_vector)
                )
                
                if similarity >= threshold:
                    similarities.append((embedding_result, float(similarity)))
            
            # Sort by similarity and return top_k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            self.logger.error(f"Failed to search similar embeddings: {e}")
            return []
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get embedding manager statistics."""
        cache_stats = await self.cache.get_statistics()
        
        return {
            **self.stats,
            "cache_stats": cache_stats,
            "model_name": self.model_name,
            "device": self.device,
            "cache_hit_rate": (
                self.stats["cache_hits"] / max(self.stats["cache_hits"] + self.stats["cache_misses"], 1)
            ) * 100
        }
    
    async def clear_cache(self):
        """Clear embedding cache."""
        await self.cache.clear()
        self.logger.info("Embedding cache cleared")
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            await self.cache.cleanup()
            # await self.change_tracker.cleanup()
            
            # Clear model from memory
            if self.model:
                del self.model
                self.model = None
            
            if self.tokenizer:
                del self.tokenizer
                self.tokenizer = None
            
            # Clear CUDA cache if using GPU
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            self.logger.info("Embedding Manager cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

