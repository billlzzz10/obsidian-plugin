"""
Model Context Protocol (MCP) Service
Integrated from notion-mcp-server project for enhanced AI model communication
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import websockets
import aiohttp

from ..core.config import get_settings
from ..utils.tool_descriptor import ToolDescriptor, ToolSkill


@dataclass
class MCPTool:
    """MCP Tool definition."""
    id: str
    name: str
    description: str
    category: str
    provider: str
    parameters: Dict[str, Any]
    endpoint: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    body_template: Optional[str] = None


@dataclass
class MCPConnection:
    """MCP Connection definition."""
    id: str
    name: str
    provider: str
    url: str
    credentials: Dict[str, Any]
    status: str = "disconnected"
    last_ping: Optional[datetime] = None


@dataclass
class MCPMessage:
    """MCP Message structure."""
    id: str
    method: str
    params: Dict[str, Any]
    timestamp: datetime
    source: str
    target: Optional[str] = None


class MCPService:
    """Enhanced MCP Service with multi-provider support."""
    
    def __init__(self):
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        
        # MCP state
        self.tools: Dict[str, MCPTool] = {}
        self.connections: Dict[str, MCPConnection] = {}
        self.active_sessions: Dict[str, Any] = {}
        
        # WebSocket connections for real-time communication
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        
        # Tool descriptor manager
        self.tool_descriptor = ToolDescriptor()
        
        # Statistics
        self.stats = {
            "tools_registered": 0,
            "connections_active": 0,
            "messages_processed": 0,
            "errors_count": 0,
            "average_response_time": 0.0
        }
    
    async def initialize(self):
        """Initialize MCP Service."""
        try:
            self.logger.info("Initializing MCP Service...")
            
            # Load tool descriptors
            await self.tool_descriptor.load_descriptors()
            
            # Register default tools
            await self._register_default_tools()
            
            # Initialize connections
            await self._initialize_connections()
            
            self.logger.info(f"MCP Service initialized with {len(self.tools)} tools")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize MCP Service: {e}")
            raise
    
    async def _register_default_tools(self):
        """Register default MCP tools."""
        default_tools = [
            {
                "id": "obsidian_rag_query",
                "name": "Obsidian RAG Query",
                "description": "Search and answer based on Obsidian vault content",
                "category": "SEARCH",
                "provider": "obsidian_vault",
                "parameters": {
                    "query": {"type": "string", "required": True},
                    "max_results": {"type": "integer", "default": 10},
                    "threshold": {"type": "float", "default": 0.7}
                }
            },
            {
                "id": "notion_sync",
                "name": "Notion Synchronization",
                "description": "Synchronize data with Notion databases",
                "category": "SYNC",
                "provider": "notion_api",
                "parameters": {
                    "database_id": {"type": "string", "required": True},
                    "action": {"type": "string", "enum": ["sync", "pull", "push"]},
                    "filter": {"type": "object", "default": {}}
                }
            },
            {
                "id": "airtable_sync",
                "name": "Airtable Synchronization",
                "description": "Synchronize data with Airtable bases",
                "category": "SYNC",
                "provider": "airtable_api",
                "parameters": {
                    "base_id": {"type": "string", "required": True},
                    "table_name": {"type": "string", "required": True},
                    "action": {"type": "string", "enum": ["sync", "pull", "push"]}
                }
            },
            {
                "id": "ai_content_analysis",
                "name": "AI Content Analysis",
                "description": "Analyze content for consistency, structure, and quality",
                "category": "ANALYZE",
                "provider": "ai_models",
                "parameters": {
                    "content": {"type": "string", "required": True},
                    "analysis_type": {"type": "string", "enum": ["consistency", "structure", "quality", "all"]},
                    "model": {"type": "string", "default": "gpt-4"}
                }
            },
            {
                "id": "vector_search",
                "name": "Enhanced Vector Search",
                "description": "Semantic search across all content using vector embeddings",
                "category": "SEARCH",
                "provider": "vector_store",
                "parameters": {
                    "query": {"type": "string", "required": True},
                    "top_k": {"type": "integer", "default": 10},
                    "similarity_threshold": {"type": "float", "default": 0.8},
                    "filter": {"type": "object", "default": {}}
                }
            }
        ]
        
        for tool_data in default_tools:
            tool = MCPTool(**tool_data)
            await self.register_tool(tool)
    
    async def _initialize_connections(self):
        """Initialize MCP connections."""
        # Notion connection
        if self.settings.NOTION_API_KEY:
            notion_conn = MCPConnection(
                id="notion_primary",
                name="Notion Primary Connection",
                provider="notion",
                url="https://api.notion.com/v1",
                credentials={"token": self.settings.NOTION_API_KEY}
            )
            await self.register_connection(notion_conn)
        
        # Airtable connection
        if self.settings.AIRTABLE_API_KEY:
            airtable_conn = MCPConnection(
                id="airtable_primary",
                name="Airtable Primary Connection",
                provider="airtable",
                url="https://api.airtable.com/v0",
                credentials={"token": self.settings.AIRTABLE_API_KEY}
            )
            await self.register_connection(airtable_conn)
    
    async def register_tool(self, tool: MCPTool):
        """Register a new MCP tool."""
        try:
            self.tools[tool.id] = tool
            self.stats["tools_registered"] += 1
            
            self.logger.info(f"Registered MCP tool: {tool.name} ({tool.id})")
            
        except Exception as e:
            self.logger.error(f"Failed to register tool {tool.id}: {e}")
            raise
    
    async def register_connection(self, connection: MCPConnection):
        """Register a new MCP connection."""
        try:
            # Test connection
            connection.status = "connecting"
            is_healthy = await self._test_connection(connection)
            
            if is_healthy:
                connection.status = "connected"
                connection.last_ping = datetime.now()
                self.connections[connection.id] = connection
                self.stats["connections_active"] += 1
                
                self.logger.info(f"Registered MCP connection: {connection.name} ({connection.id})")
            else:
                connection.status = "failed"
                self.logger.warning(f"Connection test failed for: {connection.name}")
                
        except Exception as e:
            self.logger.error(f"Failed to register connection {connection.id}: {e}")
            connection.status = "error"
            raise
    
    async def _test_connection(self, connection: MCPConnection) -> bool:
        """Test MCP connection health."""
        try:
            if connection.provider == "notion":
                return await self._test_notion_connection(connection)
            elif connection.provider == "airtable":
                return await self._test_airtable_connection(connection)
            else:
                return True  # Default to healthy for unknown providers
                
        except Exception as e:
            self.logger.error(f"Connection test error for {connection.id}: {e}")
            return False
    
    async def _test_notion_connection(self, connection: MCPConnection) -> bool:
        """Test Notion API connection."""
        try:
            headers = {
                "Authorization": f"Bearer {connection.credentials['token']}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{connection.url}/users/me", headers=headers) as response:
                    return response.status == 200
                    
        except Exception:
            return False
    
    async def _test_airtable_connection(self, connection: MCPConnection) -> bool:
        """Test Airtable API connection."""
        try:
            headers = {
                "Authorization": f"Bearer {connection.credentials['token']}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{connection.url}/meta/whoami", headers=headers) as response:
                    return response.status == 200
                    
        except Exception:
            return False
    
    async def call_tool(self, tool_id: str, parameters: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Call an MCP tool."""
        import time
        start_time = time.time()
        
        try:
            if tool_id not in self.tools:
                raise ValueError(f"Tool {tool_id} not found")
            
            tool = self.tools[tool_id]
            
            # Validate parameters
            await self._validate_parameters(tool, parameters)
            
            # Execute tool based on category
            result = await self._execute_tool(tool, parameters, context)
            
            # Update statistics
            processing_time = time.time() - start_time
            self.stats["messages_processed"] += 1
            self.stats["average_response_time"] = (
                (self.stats["average_response_time"] * (self.stats["messages_processed"] - 1) + processing_time) /
                self.stats["messages_processed"]
            )
            
            return {
                "success": True,
                "result": result,
                "tool_id": tool_id,
                "processing_time": processing_time,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.stats["errors_count"] += 1
            self.logger.error(f"Tool execution failed for {tool_id}: {e}")
            
            return {
                "success": False,
                "error": str(e),
                "tool_id": tool_id,
                "timestamp": datetime.now().isoformat()
            }
    
    async def _validate_parameters(self, tool: MCPTool, parameters: Dict[str, Any]):
        """Validate tool parameters."""
        for param_name, param_config in tool.parameters.items():
            if param_config.get("required", False) and param_name not in parameters:
                raise ValueError(f"Required parameter '{param_name}' missing for tool {tool.id}")
            
            if param_name in parameters:
                param_value = parameters[param_name]
                param_type = param_config.get("type")
                
                # Type validation
                if param_type == "string" and not isinstance(param_value, str):
                    raise ValueError(f"Parameter '{param_name}' must be a string")
                elif param_type == "integer" and not isinstance(param_value, int):
                    raise ValueError(f"Parameter '{param_name}' must be an integer")
                elif param_type == "float" and not isinstance(param_value, (int, float)):
                    raise ValueError(f"Parameter '{param_name}' must be a number")
                elif param_type == "object" and not isinstance(param_value, dict):
                    raise ValueError(f"Parameter '{param_name}' must be an object")
                
                # Enum validation
                if "enum" in param_config and param_value not in param_config["enum"]:
                    raise ValueError(f"Parameter '{param_name}' must be one of: {param_config['enum']}")
    
    async def _execute_tool(self, tool: MCPTool, parameters: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Any:
        """Execute MCP tool based on its category."""
        if tool.category == "SEARCH":
            return await self._execute_search_tool(tool, parameters, context)
        elif tool.category == "SYNC":
            return await self._execute_sync_tool(tool, parameters, context)
        elif tool.category == "ANALYZE":
            return await self._execute_analyze_tool(tool, parameters, context)
        else:
            return await self._execute_generic_tool(tool, parameters, context)
    
    async def _execute_search_tool(self, tool: MCPTool, parameters: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Any:
        """Execute search-category tools."""
        if tool.id == "obsidian_rag_query":
            # Import here to avoid circular imports
            from ..core.rag_service import RAGService
            
            # Get RAG service from application state
            # This would be injected in a real implementation
            rag_service = context.get("rag_service") if context else None
            if not rag_service:
                raise ValueError("RAG service not available")
            
            result = await rag_service.query(
                query=parameters["query"],
                max_results=parameters.get("max_results", 10),
                threshold=parameters.get("threshold", 0.7)
            )
            
            return {
                "answer": result.answer,
                "sources": [{"text": src.text, "confidence": result.confidence} for src in result.sources],
                "confidence": result.confidence,
                "model_used": result.model_used
            }
        
        elif tool.id == "vector_search":
            # Vector search implementation
            from ..core.vector_store import VectorStore
            
            vector_store = context.get("vector_store") if context else None
            if not vector_store:
                raise ValueError("Vector store not available")
            
            # Create query embedding
            embedding_manager = context.get("embedding_manager")
            if not embedding_manager:
                raise ValueError("Embedding manager not available")
            
            query_embedding = await embedding_manager._create_embedding(parameters["query"])
            
            # Search
            results = await vector_store.search(
                query_embedding=query_embedding,
                top_k=parameters.get("top_k", 10),
                threshold=parameters.get("similarity_threshold", 0.8)
            )
            
            return {
                "results": [
                    {
                        "chunk_id": chunk_id,
                        "similarity": similarity,
                        "metadata": metadata
                    }
                    for chunk_id, similarity, metadata in results
                ],
                "total_results": len(results)
            }
        
        else:
            raise ValueError(f"Unknown search tool: {tool.id}")
    
    async def _execute_sync_tool(self, tool: MCPTool, parameters: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Any:
        """Execute sync-category tools."""
        if tool.id == "notion_sync":
            # Notion sync implementation
            from ..services.notion_service import NotionService
            
            notion_service = context.get("notion_service") if context else None
            if not notion_service:
                notion_service = NotionService()
                await notion_service.initialize()
            
            database_id = parameters["database_id"]
            action = parameters.get("action", "sync")
            filter_params = parameters.get("filter", {})
            
            if action == "pull":
                result = await notion_service.pull_database(database_id, filter_params)
            elif action == "push":
                result = await notion_service.push_to_database(database_id, filter_params)
            else:  # sync
                result = await notion_service.sync_database(database_id, filter_params)
            
            return result
        
        elif tool.id == "airtable_sync":
            # Airtable sync implementation
            from ..services.airtable_service import AirtableService
            
            airtable_service = context.get("airtable_service") if context else None
            if not airtable_service:
                airtable_service = AirtableService()
                await airtable_service.initialize()
            
            base_id = parameters["base_id"]
            table_name = parameters["table_name"]
            action = parameters.get("action", "sync")
            
            if action == "pull":
                result = await airtable_service.pull_table(base_id, table_name)
            elif action == "push":
                result = await airtable_service.push_to_table(base_id, table_name)
            else:  # sync
                result = await airtable_service.sync_table(base_id, table_name)
            
            return result
        
        else:
            raise ValueError(f"Unknown sync tool: {tool.id}")
    
    async def _execute_analyze_tool(self, tool: MCPTool, parameters: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Any:
        """Execute analyze-category tools."""
        if tool.id == "ai_content_analysis":
            # AI content analysis implementation
            from ..core.rag_service import RAGService
            
            rag_service = context.get("rag_service") if context else None
            if not rag_service:
                raise ValueError("RAG service not available")
            
            content = parameters["content"]
            analysis_type = parameters.get("analysis_type", "all")
            model = parameters.get("model", "gpt-4")
            
            # Build analysis prompt based on type
            if analysis_type == "consistency":
                prompt = f"Analyze the following content for consistency and coherence:\n\n{content}"
            elif analysis_type == "structure":
                prompt = f"Analyze the structure and organization of the following content:\n\n{content}"
            elif analysis_type == "quality":
                prompt = f"Evaluate the quality, clarity, and effectiveness of the following content:\n\n{content}"
            else:  # all
                prompt = f"Provide a comprehensive analysis of the following content including consistency, structure, and quality:\n\n{content}"
            
            # Use RAG service to generate analysis
            result = await rag_service._generate_response(
                query=prompt,
                context="",
                provider="openai",  # or based on model parameter
                model=model
            )
            
            return {
                "analysis": result,
                "analysis_type": analysis_type,
                "model_used": model,
                "content_length": len(content)
            }
        
        else:
            raise ValueError(f"Unknown analyze tool: {tool.id}")
    
    async def _execute_generic_tool(self, tool: MCPTool, parameters: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Any:
        """Execute generic tools."""
        # Generic HTTP-based tool execution
        if tool.endpoint:
            headers = tool.headers or {"Content-Type": "application/json"}
            
            # Build request body
            if tool.body_template:
                body = json.loads(tool.body_template.format(**parameters))
            else:
                body = parameters
            
            async with aiohttp.ClientSession() as session:
                async with session.post(tool.endpoint, headers=headers, json=body) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        raise Exception(f"Tool execution failed with status {response.status}")
        
        else:
            raise ValueError(f"No execution method defined for tool: {tool.id}")
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """List all registered MCP tools."""
        return [
            {
                "id": tool.id,
                "name": tool.name,
                "description": tool.description,
                "category": tool.category,
                "provider": tool.provider,
                "parameters": tool.parameters
            }
            for tool in self.tools.values()
        ]
    
    async def get_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """Get specific tool information."""
        if tool_id in self.tools:
            tool = self.tools[tool_id]
            return asdict(tool)
        return None
    
    async def list_connections(self) -> List[Dict[str, Any]]:
        """List all MCP connections."""
        return [
            {
                "id": conn.id,
                "name": conn.name,
                "provider": conn.provider,
                "status": conn.status,
                "last_ping": conn.last_ping.isoformat() if conn.last_ping else None
            }
            for conn in self.connections.values()
        ]
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get MCP service statistics."""
        return {
            **self.stats,
            "tools_count": len(self.tools),
            "connections_count": len(self.connections),
            "active_sessions": len(self.active_sessions)
        }
    
    async def cleanup(self):
        """Cleanup MCP service resources."""
        try:
            # Close WebSocket connections
            for ws in self.websocket_connections.values():
                await ws.close()
            
            # Clear state
            self.tools.clear()
            self.connections.clear()
            self.active_sessions.clear()
            self.websocket_connections.clear()
            
            self.logger.info("MCP Service cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Error during MCP cleanup: {e}")

