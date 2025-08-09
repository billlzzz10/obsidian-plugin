from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
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

# Helper function to get API keys from headers or settings
async def get_api_keys(request: Request):
    # Get API keys from headers (from plugin settings)
    api_key = request.headers.get("X-API-Key", "")
    openai_api_key = request.headers.get("X-OpenAI-Key", "")
    azure_openai_key = request.headers.get("X-Azure-OpenAI-Key", "")
    azure_openai_endpoint = request.headers.get("X-Azure-OpenAI-Endpoint", "")
    azure_openai_deployment = request.headers.get("X-Azure-OpenAI-Deployment", "")
    
    # If not in headers and USE_PLUGIN_SETTINGS is False, use values from .env
    if not openai_api_key and settings.get("USE_PLUGIN_SETTINGS", True) is False:
        openai_api_key = settings.get("OPENAI_API_KEY", "")
        
    if not azure_openai_key and settings.get("USE_PLUGIN_SETTINGS", True) is False:
        azure_openai_key = settings.get("AZURE_OPENAI_API_KEY", "")
        
    if not azure_openai_endpoint and settings.get("USE_PLUGIN_SETTINGS", True) is False:
        azure_openai_endpoint = settings.get("OPENAI_API_BASE", "")
        
    if not azure_openai_deployment and settings.get("USE_PLUGIN_SETTINGS", True) is False:
        azure_openai_deployment = settings.get("AZURE_DEPLOYMENT_NAME", "")
    
    return {
        "api_key": api_key,
        "openai_api_key": openai_api_key,
        "azure_openai_key": azure_openai_key,
        "azure_openai_endpoint": azure_openai_endpoint,
        "azure_openai_deployment": azure_openai_deployment
    }

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
    request: Request,
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
        # Get API keys from headers or settings
        api_keys = await get_api_keys(request)
        
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
            attachments=file_contents,
            openai_api_key=api_keys["openai_api_key"],
            azure_openai_key=api_keys["azure_openai_key"],
            azure_openai_endpoint=api_keys["azure_openai_endpoint"]
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
    request: Request,
    message: str = Form(...),
    model: str = Form("gpt-3.5-turbo"),
    conversation_id: Optional[str] = Form(None),
    use_rag: bool = Form(True),
    max_tokens: int = Form(1000),
    temperature: float = Form(0.7)
):
    """Stream a chat message response"""
    try:
        # Get API keys from headers or settings
        api_keys = await get_api_keys(request)
        
        # Create async generator for streaming
        async def response_generator():
            async for chunk in rag_service.generate_streaming_response(
                query=message,
                model=model,
                conversation_id=conversation_id,
                use_rag=use_rag,
                max_tokens=max_tokens,
                temperature=temperature,
                openai_api_key=api_keys["openai_api_key"],
                azure_openai_key=api_keys["azure_openai_key"],
                azure_openai_endpoint=api_keys["azure_openai_endpoint"]
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            response_generator(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Error in streaming chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
