"""
Vector Store for efficient embedding storage and retrieval
"""

import asyncio
import logging
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import json

import numpy as np
import faiss
from chromadb import Client, Settings
from chromadb.config import Settings as ChromaSettings
import chromadb.utils.embedding_functions as embedding_functions

from .embedding_manager import EmbeddingResult
from .config import get_settings


class VectorStore:
    """Enhanced Vector Store with multiple backend support."""
    
    def __init__(self, backend: str = "faiss"):
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        
        self.backend = backend
        self.dimension = 384  # Default for all-MiniLM-L6-v2
        
        # FAISS backend
        self.faiss_index: Optional[faiss.Index] = None
        self.faiss_id_map: Dict[int, str] = {}
        self.faiss_metadata: Dict[str, Dict] = {}
        
        # ChromaDB backend
        self.chroma_client: Optional[Client] = None
        self.chroma_collection = None
        
        # Storage paths
        self.storage_dir = Path("data/vector_store")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Statistics
        self.stats = {
            "total_embeddings": 0,
            "total_documents": 0,
            "index_size_mb": 0.0,
            "search_count": 0,
            "average_search_time": 0.0
        }
    
    async def initialize(self):
        """Initialize the vector store."""
        try:
            self.logger.info(f"Initializing Vector Store with backend: {self.backend}")
            
            if self.backend == "faiss":
                await self._initialize_faiss()
            elif self.backend == "chromadb":
                await self._initialize_chromadb()
            else:
                raise ValueError(f"Unsupported backend: {self.backend}")
            
            # Load existing data
            await self._load_existing_data()
            
            self.logger.info("Vector Store initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Vector Store: {e}")
            raise
    
    async def _initialize_faiss(self):
        """Initialize FAISS backend."""
        # Create FAISS index
        self.faiss_index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        
        # Enable GPU if available
        if faiss.get_num_gpus() > 0:
            self.logger.info("Using GPU for FAISS")
            res = faiss.StandardGpuResources()
            self.faiss_index = faiss.index_cpu_to_gpu(res, 0, self.faiss_index)
    
    async def _initialize_chromadb(self):
        """Initialize ChromaDB backend."""
        # Create ChromaDB client
        self.chroma_client = Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=str(self.storage_dir / "chromadb")
        ))
        
        # Create or get collection
        try:
            self.chroma_collection = self.chroma_client.create_collection(
                name="obsidian_embeddings",
                embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name=self.settings.DEFAULT_EMBEDDING_MODEL
                )
            )
        except Exception:
            # Collection already exists
            self.chroma_collection = self.chroma_client.get_collection("obsidian_embeddings")
    
    async def _load_existing_data(self):
        """Load existing vector data."""
        if self.backend == "faiss":
            await self._load_faiss_data()
        elif self.backend == "chromadb":
            await self._load_chromadb_data()
    
    async def _load_faiss_data(self):
        """Load existing FAISS data."""
        index_file = self.storage_dir / "faiss_index.bin"
        metadata_file = self.storage_dir / "faiss_metadata.json"
        id_map_file = self.storage_dir / "faiss_id_map.json"
        
        if index_file.exists():
            try:
                # Load FAISS index
                self.faiss_index = faiss.read_index(str(index_file))
                
                # Load metadata
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        self.faiss_metadata = json.load(f)
                
                # Load ID mapping
                if id_map_file.exists():
                    with open(id_map_file, 'r') as f:
                        id_map_data = json.load(f)
                        self.faiss_id_map = {int(k): v for k, v in id_map_data.items()}
                
                self.stats["total_embeddings"] = self.faiss_index.ntotal
                self.logger.info(f"Loaded {self.stats['total_embeddings']} embeddings from FAISS")
                
            except Exception as e:
                self.logger.error(f"Failed to load FAISS data: {e}")
    
    async def _load_chromadb_data(self):
        """Load existing ChromaDB data."""
        if self.chroma_collection:
            try:
                count = self.chroma_collection.count()
                self.stats["total_embeddings"] = count
                self.logger.info(f"Loaded {count} embeddings from ChromaDB")
            except Exception as e:
                self.logger.error(f"Failed to load ChromaDB data: {e}")
    
    async def add_embeddings(self, document_id: str, embeddings: List[EmbeddingResult]):
        """Add embeddings to the vector store."""
        try:
            if self.backend == "faiss":
                await self._add_embeddings_faiss(document_id, embeddings)
            elif self.backend == "chromadb":
                await self._add_embeddings_chromadb(document_id, embeddings)
            
            # Update statistics
            self.stats["total_embeddings"] += len(embeddings)
            
            # Update document count
            doc_ids = set()
            if self.backend == "faiss":
                doc_ids = set(meta.get("document_id") for meta in self.faiss_metadata.values())
            elif self.backend == "chromadb":
                # Get unique document IDs from ChromaDB
                pass  # Implementation depends on ChromaDB query capabilities
            
            self.stats["total_documents"] = len(doc_ids)
            
            self.logger.info(f"Added {len(embeddings)} embeddings for document {document_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to add embeddings: {e}")
            raise
    
    async def _add_embeddings_faiss(self, document_id: str, embeddings: List[EmbeddingResult]):
        """Add embeddings to FAISS index."""
        if not embeddings:
            return
        
        # Prepare vectors
        vectors = np.array([emb.embedding for emb in embeddings], dtype=np.float32)
        
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(vectors)
        
        # Add to index
        start_id = self.faiss_index.ntotal
        self.faiss_index.add(vectors)
        
        # Update mappings and metadata
        for i, embedding in enumerate(embeddings):
            faiss_id = start_id + i
            self.faiss_id_map[faiss_id] = embedding.chunk_id
            self.faiss_metadata[embedding.chunk_id] = {
                "document_id": document_id,
                "chunk_id": embedding.chunk_id,
                "text": embedding.text,
                "timestamp": embedding.timestamp.isoformat(),
                "model_name": embedding.model_name,
                "hash": embedding.hash
            }
    
    async def _add_embeddings_chromadb(self, document_id: str, embeddings: List[EmbeddingResult]):
        """Add embeddings to ChromaDB."""
        if not embeddings:
            return
        
        # Prepare data for ChromaDB
        ids = [emb.chunk_id for emb in embeddings]
        embeddings_list = [emb.embedding for emb in embeddings]
        documents = [emb.text for emb in embeddings]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_id": emb.chunk_id,
                "timestamp": emb.timestamp.isoformat(),
                "model_name": emb.model_name,
                "hash": emb.hash
            }
            for emb in embeddings
        ]
        
        # Add to collection
        self.chroma_collection.add(
            ids=ids,
            embeddings=embeddings_list,
            documents=documents,
            metadatas=metadatas
        )
    
    async def search(self, query_embedding: np.ndarray, top_k: int = 10, threshold: float = 0.7) -> List[Tuple[str, float, Dict]]:
        """Search for similar embeddings."""
        try:
            if self.backend == "faiss":
                return await self._search_faiss(query_embedding, top_k, threshold)
            elif self.backend == "chromadb":
                return await self._search_chromadb(query_embedding, top_k, threshold)
            
        except Exception as e:
            self.logger.error(f"Failed to search embeddings: {e}")
            return []
    
    async def _search_faiss(self, query_embedding: np.ndarray, top_k: int, threshold: float) -> List[Tuple[str, float, Dict]]:
        """Search using FAISS index."""
        if self.faiss_index.ntotal == 0:
            return []
        
        # Normalize query vector
        query_vector = query_embedding.reshape(1, -1).astype(np.float32)
        faiss.normalize_L2(query_vector)
        
        # Search
        scores, indices = self.faiss_index.search(query_vector, top_k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or score < threshold:
                continue
            
            chunk_id = self.faiss_id_map.get(idx)
            if chunk_id and chunk_id in self.faiss_metadata:
                metadata = self.faiss_metadata[chunk_id]
                results.append((chunk_id, float(score), metadata))
        
        return results
    
    async def _search_chromadb(self, query_embedding: np.ndarray, top_k: int, threshold: float) -> List[Tuple[str, float, Dict]]:
        """Search using ChromaDB."""
        if not self.chroma_collection:
            return []
        
        # Query ChromaDB
        results = self.chroma_collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k
        )
        
        # Process results
        search_results = []
        if results["ids"] and results["distances"] and results["metadatas"]:
            for chunk_id, distance, metadata in zip(
                results["ids"][0],
                results["distances"][0],
                results["metadatas"][0]
            ):
                # Convert distance to similarity score
                similarity = 1.0 - distance
                
                if similarity >= threshold:
                    search_results.append((chunk_id, similarity, metadata))
        
        return search_results
    
    async def remove_document(self, document_id: str):
        """Remove all embeddings for a document."""
        try:
            if self.backend == "faiss":
                await self._remove_document_faiss(document_id)
            elif self.backend == "chromadb":
                await self._remove_document_chromadb(document_id)
            
            self.logger.info(f"Removed document {document_id} from vector store")
            
        except Exception as e:
            self.logger.error(f"Failed to remove document {document_id}: {e}")
            raise
    
    async def _remove_document_faiss(self, document_id: str):
        """Remove document from FAISS (requires rebuilding index)."""
        # Find chunks to remove
        chunks_to_remove = [
            chunk_id for chunk_id, metadata in self.faiss_metadata.items()
            if metadata.get("document_id") == document_id
        ]
        
        if not chunks_to_remove:
            return
        
        # Remove from metadata
        for chunk_id in chunks_to_remove:
            del self.faiss_metadata[chunk_id]
        
        # Rebuild FAISS index (expensive operation)
        await self._rebuild_faiss_index()
    
    async def _remove_document_chromadb(self, document_id: str):
        """Remove document from ChromaDB."""
        if not self.chroma_collection:
            return
        
        # Query for document chunks
        results = self.chroma_collection.get(
            where={"document_id": document_id}
        )
        
        if results["ids"]:
            # Delete chunks
            self.chroma_collection.delete(ids=results["ids"])
    
    async def _rebuild_faiss_index(self):
        """Rebuild FAISS index after deletions."""
        if not self.faiss_metadata:
            # Empty index
            self.faiss_index = faiss.IndexFlatIP(self.dimension)
            self.faiss_id_map = {}
            return
        
        # Collect all remaining embeddings
        embeddings = []
        chunk_ids = []
        
        for chunk_id, metadata in self.faiss_metadata.items():
            # Note: This is a simplified approach
            # In practice, you'd need to store embeddings separately or recreate them
            chunk_ids.append(chunk_id)
        
        # Create new index
        self.faiss_index = faiss.IndexFlatIP(self.dimension)
        self.faiss_id_map = {}
        
        # Re-add embeddings (this would need actual embedding vectors)
        # This is a placeholder - in practice, you'd need to store embeddings
        # or recreate them from the original text
    
    async def save(self):
        """Save vector store to disk."""
        try:
            if self.backend == "faiss":
                await self._save_faiss()
            elif self.backend == "chromadb":
                await self._save_chromadb()
            
            self.logger.info("Vector store saved successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to save vector store: {e}")
            raise
    
    async def _save_faiss(self):
        """Save FAISS data to disk."""
        # Save index
        index_file = self.storage_dir / "faiss_index.bin"
        faiss.write_index(self.faiss_index, str(index_file))
        
        # Save metadata
        metadata_file = self.storage_dir / "faiss_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(self.faiss_metadata, f, indent=2)
        
        # Save ID mapping
        id_map_file = self.storage_dir / "faiss_id_map.json"
        with open(id_map_file, 'w') as f:
            json.dump({str(k): v for k, v in self.faiss_id_map.items()}, f, indent=2)
    
    async def _save_chromadb(self):
        """Save ChromaDB data (handled automatically by ChromaDB)."""
        if self.chroma_client:
            # ChromaDB handles persistence automatically
            pass
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get vector store statistics."""
        # Calculate index size
        if self.backend == "faiss" and self.faiss_index:
            # Estimate FAISS index size
            self.stats["index_size_mb"] = (
                self.faiss_index.ntotal * self.dimension * 4  # 4 bytes per float32
            ) / (1024 * 1024)
        
        return {
            **self.stats,
            "backend": self.backend,
            "dimension": self.dimension,
            "storage_dir": str(self.storage_dir)
        }
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            # Save current state
            await self.save()
            
            # Cleanup ChromaDB
            if self.chroma_client:
                # ChromaDB cleanup is handled automatically
                pass
            
            self.logger.info("Vector Store cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

