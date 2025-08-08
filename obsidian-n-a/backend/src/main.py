"""
Obsidian AI Plugin - Enhanced Backend Service
Main entry point for the FastAPI backend service.
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api.routes import api_router
from core.config import get_settings
from core.database import init_database
from core.embedding_manager import EmbeddingManager
from core.rag_service import RAGService
from services.cache_service import CacheService
from utils.logger import setup_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger = logging.getLogger(__name__)
    logger.info("Starting Obsidian AI Backend Service...")
    
    try:
        # Initialize database
        await init_database()
        logger.info("Database initialized successfully")
        
        # Initialize cache service
        cache_service = CacheService()
        await cache_service.initialize()
        app.state.cache_service = cache_service
        logger.info("Cache service initialized successfully")
        
        # Initialize embedding manager
        embedding_manager = EmbeddingManager()
        await embedding_manager.initialize()
        app.state.embedding_manager = embedding_manager
        logger.info("Embedding manager initialized successfully")
        
        # Initialize RAG service
        rag_service = RAGService(embedding_manager)
        await rag_service.initialize()
        app.state.rag_service = rag_service
        logger.info("RAG service initialized successfully")
        
        logger.info("Backend service startup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize backend service: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Obsidian AI Backend Service...")
    
    try:
        # Cleanup services
        if hasattr(app.state, 'cache_service'):
            await app.state.cache_service.cleanup()
        
        if hasattr(app.state, 'embedding_manager'):
            await app.state.embedding_manager.cleanup()
        
        if hasattr(app.state, 'rag_service'):
            await app.state.rag_service.cleanup()
        
        logger.info("Backend service shutdown completed successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    # Setup logging
    setup_logger(
        level=settings.LOG_LEVEL,
        log_file=settings.LOG_FILE,
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION
    )
    
    # Create FastAPI app
    app = FastAPI(
        title="Obsidian AI Plugin - Backend Service",
        description="Enhanced backend service for Obsidian AI Plugin with RAG, Embedding, and Cross-platform Integration",
        version="2.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan
    )
    
    # Add middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API routes
    app.include_router(api_router, prefix="/api/v1")
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "service": "obsidian-ai-backend",
            "version": "2.0.0"
        }
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        """Global exception handler."""
        logger = logging.getLogger(__name__)
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail}
            )
        
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    
    return app


def main():
    """Main entry point."""
    settings = get_settings()
    
    # Create logs directory if it doesn't exist
    log_dir = Path(settings.LOG_FILE).parent
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Run the application
    uvicorn.run(
        "main:create_app",
        factory=True,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        workers=1 if settings.DEBUG else settings.MAX_WORKERS
    )


if __name__ == "__main__":
    main()

