"""
API Endpoints for Obsidian AI Plugin Backend Service
Provides REST API for frontend plugin to communicate with AI services
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import json
import asyncio
import logging
from datetime import datetime

from ..core.embedding_manager import EmbeddingManager
from ..core.rag_service import RAGService
from ..core.vector_store import VectorStore
from ..services.mcp_service import MCPService
from ..utils.tool_descriptor import ToolDescriptor
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize services
embedding_manager = EmbeddingManager()
vector_store = VectorStore()
rag_service = RAGService(embedding_manager)
mcp_service = MCPService()
tool_descriptor = ToolDescriptor()

# Create API router
router = APIRouter(prefix="/api/v1", tags=["obsidian-ai"])

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "embedding": await embedding_manager.health_check(),
            "vector_store": await vector_store.health_check(),
            "mcp": await mcp_service.health_check()
        }
    }

# Chat endpoints
@router.post("/chat/message")
async def send_chat_message(
    message: str = Form(...),
    model: str = Form("gpt-3.5-turbo"),
    conversation_id: Optional[str] = Form(None),
    use_rag: bool = Form(True),
    max_tokens: int = Form(1000),
    temperature: float = Form(0.7),
    files: List[UploadFile] = File(default=[])
):
    """Send a chat message and get AI response"""
    try:
        # Process uploaded files
        file_contents = []
        for file in files:
            content = await file.read()
            file_contents.append({
                "name": file.filename,
                "type": file.content_type,
                "content": content.decode('utf-8') if file.content_type.startswith('text/') else content
            })
        
        # Get AI response
        response = await rag_service.generate_response(
            query=message,
            model=model,
            conversation_id=conversation_id,
            use_rag=use_rag,
            max_tokens=max_tokens,
            temperature=temperature,
            attachments=file_contents
        )
        
        return {
            "response": response["content"],
            "conversation_id": response["conversation_id"],
            "model": model,
            "sources": response.get("sources", []),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in chat message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def stream_chat_message(
    message: str = Form(...),
    model: str = Form("gpt-3.5-turbo"),
    conversation_id: Optional[str] = Form(None),
    use_rag: bool = Form(True),
    max_tokens: int = Form(1000),
    temperature: float = Form(0.7)
):
    """Stream chat message response"""
    try:
        async def generate_stream():
            async for chunk in rag_service.stream_response(
                query=message,
                model=model,
                conversation_id=conversation_id,
                use_rag=use_rag,
                max_tokens=max_tokens,
                temperature=temperature
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        
    except Exception as e:
        logger.error(f"Error in stream chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Embedding endpoints
@router.post("/embeddings/process")
async def process_documents(
    documents: List[Dict[str, Any]],
    model: str = "all-MiniLM-L6-v2",
    batch_size: int = 32,
    force_reprocess: bool = False
):
    """Process documents and create embeddings"""
    try:
        result = await embedding_manager.process_documents(
            documents=documents,
            model=model,
            batch_size=batch_size,
            force_reprocess=force_reprocess
        )
        
        return {
            "processed_count": result["processed_count"],
            "skipped_count": result["skipped_count"],
            "total_embeddings": result["total_embeddings"],
            "processing_time": result["processing_time"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embeddings/search")
async def semantic_search(
    query: str,
    top_k: int = 10,
    threshold: float = 0.7,
    filters: Optional[Dict[str, Any]] = None
):
    """Perform semantic search"""
    try:
        results = await vector_store.similarity_search(
            query=query,
            top_k=top_k,
            threshold=threshold,
            filters=filters
        )
        
        return {
            "results": results,
            "query": query,
            "count": len(results),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# RAG endpoints
@router.post("/rag/query")
async def rag_query(
    query: str,
    model: str = "gpt-3.5-turbo",
    max_sources: int = 5,
    min_confidence: float = 0.7,
    max_tokens: int = 1000,
    temperature: float = 0.7
):
    """Perform RAG query"""
    try:
        response = await rag_service.query(
            query=query,
            model=model,
            max_sources=max_sources,
            min_confidence=min_confidence,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return {
            "answer": response["answer"],
            "sources": response["sources"],
            "confidence": response["confidence"],
            "model": model,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in RAG query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tool management endpoints
@router.get("/tools/descriptors")
async def list_tool_descriptors():
    """List all tool descriptors"""
    try:
        descriptors = tool_descriptor.list_descriptors()
        return {
            "descriptors": [desc.to_dict() for desc in descriptors],
            "count": len(descriptors),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error listing tool descriptors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools/descriptors/{descriptor_id}")
async def get_tool_descriptor(descriptor_id: str):
    """Get specific tool descriptor"""
    try:
        descriptor = tool_descriptor.get_descriptor(descriptor_id)
        if not descriptor:
            raise HTTPException(status_code=404, detail="Tool descriptor not found")
        
        return {
            "descriptor": descriptor.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tool descriptor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/descriptors")
async def create_tool_descriptor(
    name: str = Form(...),
    description: str = Form(...),
    author: Optional[str] = Form(None)
):
    """Create new tool descriptor"""
    try:
        descriptor = await tool_descriptor.create_descriptor(
            name=name,
            description=description,
            author=author
        )
        
        return {
            "descriptor": descriptor.to_dict(),
            "message": "Tool descriptor created successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating tool descriptor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/execute")
async def execute_tool(
    descriptor_id: str = Form(...),
    skill_id: str = Form(...),
    parameters: str = Form("{}"),  # JSON string
    context: Optional[str] = Form(None)
):
    """Execute a tool skill"""
    try:
        # Parse parameters
        params = json.loads(parameters) if parameters else {}
        
        # Get tool descriptor
        descriptor = tool_descriptor.get_descriptor(descriptor_id)
        if not descriptor:
            raise HTTPException(status_code=404, detail="Tool descriptor not found")
        
        # Get skill
        if skill_id not in descriptor.skills:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        skill = descriptor.skills[skill_id]
        
        # Execute through MCP service
        result = await mcp_service.execute_tool(
            tool_name=skill.name,
            parameters=params,
            context=context
        )
        
        return {
            "result": result,
            "skill": skill.name,
            "descriptor": descriptor.name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Data integration endpoints
@router.post("/integrations/notion/sync")
async def sync_notion_data(
    integration_token: str = Form(...),
    database_id: Optional[str] = Form(None),
    action: str = Form("sync")  # sync, pull, push
):
    """Sync data with Notion"""
    try:
        # This would integrate with actual Notion API
        # For now, return mock response
        return {
            "status": "success",
            "action": action,
            "database_id": database_id,
            "synced_items": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Notion sync functionality will be implemented"
        }
        
    except Exception as e:
        logger.error(f"Error syncing Notion data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/integrations/airtable/sync")
async def sync_airtable_data(
    access_token: str = Form(...),
    base_id: str = Form(...),
    table_name: str = Form(...),
    action: str = Form("sync")  # sync, pull, push
):
    """Sync data with Airtable"""
    try:
        # This would integrate with actual Airtable API
        # For now, return mock response
        return {
            "status": "success",
            "action": action,
            "base_id": base_id,
            "table_name": table_name,
            "synced_items": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Airtable sync functionality will be implemented"
        }
        
    except Exception as e:
        logger.error(f"Error syncing Airtable data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Settings endpoints
@router.get("/settings")
async def get_settings():
    """Get current settings"""
    return {
        "models": {
            "embedding": settings.embedding_models,
            "chat": settings.chat_models
        },
        "features": {
            "rag_enabled": settings.rag_enabled,
            "mcp_enabled": settings.mcp_enabled,
            "caching_enabled": settings.caching_enabled
        },
        "limits": {
            "max_tokens": settings.max_tokens,
            "max_sources": settings.max_sources,
            "batch_size": settings.batch_size
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/settings")
async def update_settings(settings_data: Dict[str, Any]):
    """Update settings"""
    try:
        # Update settings (this would persist to config file/database)
        return {
            "status": "success",
            "updated_settings": settings_data,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Settings updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Statistics endpoints
@router.get("/stats")
async def get_statistics():
    """Get usage statistics"""
    try:
        stats = {
            "embeddings": {
                "total_documents": await vector_store.get_document_count(),
                "total_embeddings": await vector_store.get_embedding_count(),
                "storage_size": await vector_store.get_storage_size()
            },
            "chat": {
                "total_conversations": 0,  # Would be tracked in actual implementation
                "total_messages": 0,
                "average_response_time": 0
            },
            "tools": {
                "total_descriptors": len(tool_descriptor.list_descriptors()),
                "total_executions": 0  # Would be tracked in actual implementation
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize services on startup
@router.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        logger.info("Initializing Obsidian AI Backend services...")
        
        # Initialize embedding manager
        await embedding_manager.initialize()
        
        # Initialize vector store
        await vector_store.initialize()
        
        # Initialize MCP service
        await mcp_service.initialize()
        
        # Load tool descriptors
        await tool_descriptor.load_descriptors()
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise

@router.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        logger.info("Shutting down Obsidian AI Backend services...")
        
        # Cleanup services
        await embedding_manager.cleanup()
        await vector_store.cleanup()
        await mcp_service.cleanup()
        
        logger.info("All services shut down successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

