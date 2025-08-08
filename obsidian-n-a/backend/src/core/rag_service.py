"""
Enhanced RAG (Retrieval-Augmented Generation) Service
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

import openai
import anthropic
from google.generativeai import GenerativeModel
import google.generativeai as genai

from .embedding_manager import EmbeddingManager, EmbeddingResult
from .vector_store import VectorStore
from ..models.document import Document
from ..models.chat import ChatMessage, ChatContext
from ..utils.prompt_builder import PromptBuilder
from .config import get_settings


@dataclass
class RAGResult:
    """RAG processing result."""
    query: str
    answer: str
    sources: List[EmbeddingResult]
    confidence: float
    processing_time: float
    model_used: str
    timestamp: datetime


class RAGService:
    """Enhanced RAG Service with multiple AI providers."""
    
    def __init__(self, embedding_manager: EmbeddingManager):
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        
        self.embedding_manager = embedding_manager
        self.vector_store: Optional[VectorStore] = None
        self.prompt_builder = PromptBuilder()
        
        # AI clients
        self.openai_client: Optional[openai.AsyncOpenAI] = None
        self.anthropic_client: Optional[anthropic.AsyncAnthropic] = None
        self.google_model: Optional[GenerativeModel] = None
        
        # Configuration
        self.max_context_length = self.settings.MAX_CONTEXT_LENGTH
        self.default_provider = self.settings.DEFAULT_LLM_PROVIDER
        
        # Statistics
        self.stats = {
            "queries_processed": 0,
            "total_processing_time": 0.0,
            "average_response_time": 0.0,
            "provider_usage": {},
            "error_count": 0
        }
    
    async def initialize(self):
        """Initialize the RAG service."""
        try:
            self.logger.info("Initializing RAG Service...")
            
            # Initialize vector store
            self.vector_store = VectorStore()
            await self.vector_store.initialize()
            
            # Initialize AI clients
            await self._initialize_ai_clients()
            
            # Initialize prompt builder
            await self.prompt_builder.initialize()
            
            self.logger.info("RAG Service initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize RAG Service: {e}")
            raise
    
    async def _initialize_ai_clients(self):
        """Initialize AI provider clients."""
        # OpenAI
        if self.settings.OPENAI_API_KEY:
            self.openai_client = openai.AsyncOpenAI(
                api_key=self.settings.OPENAI_API_KEY,
                base_url=self.settings.OPENAI_API_BASE
            )
            self.logger.info("OpenAI client initialized")
        
        # Anthropic
        if self.settings.ANTHROPIC_API_KEY:
            self.anthropic_client = anthropic.AsyncAnthropic(
                api_key=self.settings.ANTHROPIC_API_KEY
            )
            self.logger.info("Anthropic client initialized")
        
        # Google AI
        if self.settings.GOOGLE_API_KEY:
            genai.configure(api_key=self.settings.GOOGLE_API_KEY)
            self.google_model = GenerativeModel(self.settings.GOOGLE_MODEL)
            self.logger.info("Google AI client initialized")
    
    async def query(self, 
                   query: str, 
                   context: Optional[ChatContext] = None,
                   provider: Optional[str] = None,
                   model: Optional[str] = None,
                   max_sources: int = 5,
                   min_confidence: float = 0.7) -> RAGResult:
        """Process a RAG query."""
        start_time = time.time()
        
        try:
            # Use default provider if not specified
            if not provider:
                provider = self.default_provider
            
            # Retrieve relevant documents
            sources = await self._retrieve_documents(query, max_sources, min_confidence)
            
            # Build context from sources
            context_text = await self._build_context(sources, context)
            
            # Generate response
            answer = await self._generate_response(
                query=query,
                context=context_text,
                provider=provider,
                model=model
            )
            
            # Calculate confidence
            confidence = await self._calculate_confidence(query, sources, answer)
            
            # Create result
            processing_time = time.time() - start_time
            result = RAGResult(
                query=query,
                answer=answer,
                sources=sources,
                confidence=confidence,
                processing_time=processing_time,
                model_used=f"{provider}:{model or 'default'}",
                timestamp=datetime.now()
            )
            
            # Update statistics
            await self._update_stats(provider, processing_time)
            
            self.logger.info(f"RAG query processed in {processing_time:.2f}s with confidence {confidence:.2f}")
            return result
            
        except Exception as e:
            self.stats["error_count"] += 1
            self.logger.error(f"Failed to process RAG query: {e}")
            raise
    
    async def _retrieve_documents(self, query: str, max_sources: int, min_confidence: float) -> List[EmbeddingResult]:
        """Retrieve relevant documents using vector search."""
        try:
            # Search using embedding manager
            similar_embeddings = await self.embedding_manager.search_similar(
                query=query,
                top_k=max_sources * 2,  # Get more candidates
                threshold=min_confidence
            )
            
            # Filter and rank results
            sources = []
            for embedding_result, similarity in similar_embeddings:
                if len(sources) >= max_sources:
                    break
                
                # Additional filtering logic can be added here
                sources.append(embedding_result)
            
            self.logger.debug(f"Retrieved {len(sources)} relevant documents for query")
            return sources
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve documents: {e}")
            return []
    
    async def _build_context(self, sources: List[EmbeddingResult], chat_context: Optional[ChatContext] = None) -> str:
        """Build context from retrieved sources."""
        context_parts = []
        
        # Add chat context if provided
        if chat_context and chat_context.messages:
            context_parts.append("=== Previous Conversation ===")
            for message in chat_context.messages[-5:]:  # Last 5 messages
                role = "User" if message.role == "user" else "Assistant"
                context_parts.append(f"{role}: {message.content}")
            context_parts.append("")
        
        # Add retrieved sources
        if sources:
            context_parts.append("=== Relevant Information ===")
            for i, source in enumerate(sources, 1):
                context_parts.append(f"Source {i}:")
                context_parts.append(source.text)
                context_parts.append("")
        
        return "\n".join(context_parts)
    
    async def _generate_response(self, query: str, context: str, provider: str, model: Optional[str] = None) -> str:
        """Generate response using specified AI provider."""
        # Build prompt
        prompt = await self.prompt_builder.build_rag_prompt(
            query=query,
            context=context,
            provider=provider
        )
        
        try:
            if provider == "openai":
                return await self._generate_openai_response(prompt, model)
            elif provider == "anthropic":
                return await self._generate_anthropic_response(prompt, model)
            elif provider == "google":
                return await self._generate_google_response(prompt, model)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            self.logger.error(f"Failed to generate response with {provider}: {e}")
            # Fallback to default provider
            if provider != self.default_provider:
                self.logger.info(f"Falling back to {self.default_provider}")
                return await self._generate_response(query, context, self.default_provider, model)
            raise
    
    async def _generate_openai_response(self, prompt: str, model: Optional[str] = None) -> str:
        """Generate response using OpenAI."""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized")
        
        model_name = model or self.settings.OPENAI_MODEL
        
        response = await self.openai_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that provides accurate and relevant answers based on the given context."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    
    async def _generate_anthropic_response(self, prompt: str, model: Optional[str] = None) -> str:
        """Generate response using Anthropic."""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not initialized")
        
        model_name = model or self.settings.ANTHROPIC_MODEL
        
        response = await self.anthropic_client.messages.create(
            model=model_name,
            max_tokens=2000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.content[0].text
    
    async def _generate_google_response(self, prompt: str, model: Optional[str] = None) -> str:
        """Generate response using Google AI."""
        if not self.google_model:
            raise ValueError("Google AI client not initialized")
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.google_model.generate_content(prompt)
        )
        
        return response.text
    
    async def _calculate_confidence(self, query: str, sources: List[EmbeddingResult], answer: str) -> float:
        """Calculate confidence score for the answer."""
        if not sources:
            return 0.0
        
        # Simple confidence calculation based on source relevance
        # This can be enhanced with more sophisticated methods
        total_confidence = 0.0
        
        for source in sources:
            # Calculate semantic similarity between query and source
            query_embedding = await self.embedding_manager._create_embedding(query)
            source_embedding = await self.embedding_manager._create_embedding(source.text)
            
            import numpy as np
            similarity = np.dot(query_embedding, source_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(source_embedding)
            )
            
            total_confidence += similarity
        
        # Average confidence
        confidence = total_confidence / len(sources)
        
        # Normalize to 0-1 range
        return max(0.0, min(1.0, confidence))
    
    async def _update_stats(self, provider: str, processing_time: float):
        """Update service statistics."""
        self.stats["queries_processed"] += 1
        self.stats["total_processing_time"] += processing_time
        self.stats["average_response_time"] = (
            self.stats["total_processing_time"] / self.stats["queries_processed"]
        )
        
        if provider not in self.stats["provider_usage"]:
            self.stats["provider_usage"][provider] = 0
        self.stats["provider_usage"][provider] += 1
    
    async def add_documents(self, documents: List[Document]) -> Dict[str, List[EmbeddingResult]]:
        """Add documents to the RAG system."""
        try:
            # Process documents through embedding manager
            results = await self.embedding_manager.batch_process_documents(documents)
            
            # Add embeddings to vector store
            for doc_id, embeddings in results.items():
                if embeddings:
                    await self.vector_store.add_embeddings(doc_id, embeddings)
            
            self.logger.info(f"Added {len(documents)} documents to RAG system")
            return results
            
        except Exception as e:
            self.logger.error(f"Failed to add documents: {e}")
            raise
    
    async def remove_document(self, document_id: str):
        """Remove a document from the RAG system."""
        try:
            # Remove from vector store
            await self.vector_store.remove_document(document_id)
            
            # Clear related cache entries
            await self.embedding_manager.cache.remove_by_prefix(document_id)
            
            self.logger.info(f"Removed document {document_id} from RAG system")
            
        except Exception as e:
            self.logger.error(f"Failed to remove document {document_id}: {e}")
            raise
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get RAG service statistics."""
        embedding_stats = await self.embedding_manager.get_statistics()
        vector_stats = await self.vector_store.get_statistics() if self.vector_store else {}
        
        return {
            "rag_stats": self.stats,
            "embedding_stats": embedding_stats,
            "vector_stats": vector_stats,
            "available_providers": self._get_available_providers()
        }
    
    def _get_available_providers(self) -> List[str]:
        """Get list of available AI providers."""
        providers = []
        
        if self.openai_client:
            providers.append("openai")
        if self.anthropic_client:
            providers.append("anthropic")
        if self.google_model:
            providers.append("google")
        
        return providers
    
    async def cleanup(self):
        """Cleanup resources."""
        try:
            if self.vector_store:
                await self.vector_store.cleanup()
            
            # Close AI clients
            if self.openai_client:
                await self.openai_client.close()
            
            self.logger.info("RAG Service cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

