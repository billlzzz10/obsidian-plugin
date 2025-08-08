"""
Tool Descriptor System based on leverage-rule v1.0 Framework
Standard Entity Schema & Tool Mapping for flexible AI tool integration

Note: 'leverage-rule' refers to a hypothetical or internal framework for tool descriptors.
"""

import json
import uuid
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict, field
from pathlib import Path
from datetime import datetime


@dataclass
class ToolSkill:
    """Individual tool skill definition."""
    name: str
    category: str
    prompt: str
    api_endpoint: Optional[str] = None
    api_header: Optional[Dict[str, str]] = None
    api_body: Optional[Dict[str, Any]] = None
    writer: Optional[str] = None
    writer_settings: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "category": self.category,
            "prompt": self.prompt,
            "apiEndpoint": self.api_endpoint or "",
            "apiHeader": json.dumps(self.api_header or {"Content-Type": "application/json"}, indent=2),
            "apiBody": json.dumps(self.api_body or {}, indent=2),
            "writer": self.writer or "",
            "writerSettings": self.writer_settings or {},
            "parameters": self.parameters or {}
        }


@dataclass
class ToolConnection:
    """Tool connection definition."""
    provider: str
    name: str
    url: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "provider": self.provider,
            "name": self.name,
            "url": self.url,
            "credentials": self.credentials or {},
            "settings": self.settings or {}
        }


@dataclass
class ToolDescriptorSchema:
    """Complete tool descriptor schema following leverage-rule v1.0."""
    id: str
    version: str
    name: str
    description: str
    author: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    skills: Dict[str, ToolSkill] = field(default_factory=dict)
    connections: Dict[str, ToolConnection] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Post-initialization processing."""
        if not self.created_at:
            self.created_at = datetime.now()
        if not self.updated_at:
            self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format compatible with leverage-rule."""
        return {
            "id": self.id,
            "version": self.version,
            "name": self.name,
            "description": self.description,
            "author": self.author,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "skills": {skill_id: skill.to_dict() for skill_id, skill in self.skills.items()},
            "connections": {conn_id: conn.to_dict() for conn_id, conn in self.connections.items()},
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ToolDescriptorSchema':
        """Create from dictionary."""
        # Parse skills
        skills = {}
        for skill_id, skill_data in data.get("skills", {}).items():
            skills[skill_id] = ToolSkill(
                name=skill_data["name"],
                category=skill_data["category"],
                prompt=skill_data["prompt"],
                api_endpoint=skill_data.get("apiEndpoint"),
                api_header=json.loads(skill_data.get("apiHeader", "{}")),
                api_body=json.loads(skill_data.get("apiBody", "{}")),
                writer=skill_data.get("writer"),
                writer_settings=skill_data.get("writerSettings", {}),
                parameters=skill_data.get("parameters", {})
            )
        
        # Parse connections
        connections = {}
        for conn_id, conn_data in data.get("connections", {}).items():
            connections[conn_id] = ToolConnection(
                provider=conn_data["provider"],
                name=conn_data["name"],
                url=conn_data.get("url"),
                credentials=conn_data.get("credentials", {}),
                settings=conn_data.get("settings", {})
            )
        
        return cls(
            id=data["id"],
            version=data["version"],
            name=data["name"],
            description=data["description"],
            author=data.get("author"),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None,
            skills=skills,
            connections=connections,
            metadata=data.get("metadata", {})
        )


class ToolDescriptor:
    """Tool Descriptor Manager following leverage-rule v1.0 standard."""
    
    def __init__(self, descriptors_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.descriptors_path = Path(descriptors_path or "descriptors")
        self.descriptors: Dict[str, ToolDescriptorSchema] = {}
        
        # Ensure descriptors directory exists
        self.descriptors_path.mkdir(parents=True, exist_ok=True)
    
    def generate_unique_id(self, prefix: str = "tool") -> str:
        """Generate unique tool ID following leverage-rule standard."""
        # Format: tool_x7f3a2b1 (8 character hex)
        unique_suffix = uuid.uuid4().hex[:8]
        return f"{prefix}_{unique_suffix}"
    
    async def load_descriptors(self):
        """Load all tool descriptors from files."""
        try:
            descriptor_files = list(self.descriptors_path.glob("*.json"))
            
            for file_path in descriptor_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    descriptor = ToolDescriptorSchema.from_dict(data)
                    self.descriptors[descriptor.id] = descriptor
                    
                    self.logger.info(f"Loaded tool descriptor: {descriptor.name} ({descriptor.id})")
                    
                except Exception as e:
                    self.logger.error(f"Failed to load descriptor from {file_path}: {e}")
            
            # Create default descriptors if none exist
            if not self.descriptors:
                await self._create_default_descriptors()
            
            self.logger.info(f"Loaded {len(self.descriptors)} tool descriptors")
            
        except Exception as e:
            self.logger.error(f"Failed to load tool descriptors: {e}")
            raise
    
    async def _create_default_descriptors(self):
        """Create default tool descriptors."""
        # Obsidian AI Plugin Descriptor
        obsidian_descriptor = ToolDescriptorSchema(
            id=self.generate_unique_id("obsidian_ai"),
            version="1.0",
            name="Obsidian AI Plugin Tools",
            description="Enhanced AI tools for Obsidian with RAG, embedding, and cross-platform sync",
            author="Obsidian AI Plugin",
            skills={
                "rag_query": ToolSkill(
                    name="RAG Query",
                    category="SEARCH",
                    prompt="Search and answer questions based on vault content using RAG",
                    parameters={
                        "query": {"type": "string", "required": True},
                        "max_sources": {"type": "integer", "default": 5},
                        "min_confidence": {"type": "float", "default": 0.7}
                    }
                ),
                "semantic_search": ToolSkill(
                    name="Semantic Search",
                    category="SEARCH",
                    prompt="Perform semantic search across all vault content",
                    parameters={
                        "query": {"type": "string", "required": True},
                        "top_k": {"type": "integer", "default": 10},
                        "threshold": {"type": "float", "default": 0.8}
                    }
                ),
                "content_analysis": ToolSkill(
                    name="Content Analysis",
                    category="ANALYZE",
                    prompt="Analyze content for structure, consistency, and quality",
                    parameters={
                        "content": {"type": "string", "required": True},
                        "analysis_type": {"type": "string", "enum": ["structure", "consistency", "quality", "all"]}
                    }
                ),
                "notion_sync": ToolSkill(
                    name="Notion Sync",
                    category="SYNC",
                    prompt="Synchronize data with Notion databases",
                    writer="notion_writer",
                    writer_settings={
                        "provider": "notionDatabase",
                        "name": "Notion Sync Connection"
                    },
                    parameters={
                        "database_id": {"type": "string", "required": True},
                        "action": {"type": "string", "enum": ["sync", "pull", "push"]}
                    }
                ),
                "airtable_sync": ToolSkill(
                    name="Airtable Sync",
                    category="SYNC",
                    prompt="Synchronize data with Airtable bases",
                    writer="airtable_writer",
                    writer_settings={
                        "provider": "airtableBase",
                        "name": "Airtable Sync Connection"
                    },
                    parameters={
                        "base_id": {"type": "string", "required": True},
                        "table_name": {"type": "string", "required": True},
                        "action": {"type": "string", "enum": ["sync", "pull", "push"]}
                    }
                )
            },
            connections={
                "notion_writer": ToolConnection(
                    provider="notionDatabase",
                    name="Notion Database Connection",
                    url="https://api.notion.com/v1"
                ),
                "airtable_writer": ToolConnection(
                    provider="airtableBase",
                    name="Airtable Base Connection",
                    url="https://api.airtable.com/v0"
                ),
                "obsidian_vault": ToolConnection(
                    provider="obsidianVault",
                    name="Obsidian Vault Connection",
                    settings={"vault_path": ""}
                )
            },
            metadata={
                "tags": ["obsidian", "ai", "rag", "sync", "embedding"],
                "compatibility": ["desktop", "mobile"],
                "requirements": {
                    "obsidian_version": ">=1.0.0",
                    "node_version": ">=18.0.0",
                    "python_version": ">=3.8.0"
                }
            }
        )
        
        await self.save_descriptor(obsidian_descriptor)
        
        # Enhanced AI Tools Descriptor (from notion-mcp-server)
        enhanced_descriptor = ToolDescriptorSchema(
            id=self.generate_unique_id("enhanced_ai"),
            version="1.0",
            name="Enhanced AI Tools",
            description="Advanced AI tools with vector search, real-time collaboration, and content intelligence",
            author="Enhanced AI System",
            skills={
                "vector_search": ToolSkill(
                    name="Enhanced Vector Search",
                    category="SEARCH",
                    prompt="Semantic search with AI-powered similarity matching and multi-language support",
                    parameters={
                        "query": {"type": "string", "required": True},
                        "top_k": {"type": "integer", "default": 10},
                        "similarity_threshold": {"type": "float", "default": 0.8},
                        "language": {"type": "string", "enum": ["thai", "english", "auto"], "default": "auto"}
                    }
                ),
                "realtime_collaboration": ToolSkill(
                    name="Real-time Collaboration",
                    category="COLLABORATE",
                    prompt="Enable live multi-user editing with conflict resolution",
                    parameters={
                        "session_id": {"type": "string", "required": True},
                        "action": {"type": "string", "enum": ["join", "leave", "sync"]},
                        "user_id": {"type": "string", "required": True}
                    }
                ),
                "content_intelligence": ToolSkill(
                    name="AI Content Intelligence",
                    category="ANALYZE",
                    prompt="Advanced content analysis for story consistency, plot structure, and character development",
                    parameters={
                        "content": {"type": "string", "required": True},
                        "analysis_type": {"type": "string", "enum": ["story_consistency", "plot_structure", "character_development", "comprehensive"]},
                        "model": {"type": "string", "default": "gpt-4"}
                    }
                ),
                "performance_monitor": ToolSkill(
                    name="Performance Monitoring",
                    category="MONITOR",
                    prompt="Monitor system performance, API usage, and user activity",
                    parameters={
                        "metric_type": {"type": "string", "enum": ["api_performance", "user_activity", "system_health", "all"]},
                        "time_range": {"type": "string", "enum": ["1h", "24h", "7d", "30d"], "default": "24h"}
                    }
                )
            },
            connections={
                "vector_database": ToolConnection(
                    provider="vectorDatabase",
                    name="Vector Database Connection",
                    settings={
                        "provider": "chromadb",  # or "pinecone"
                        "collection_name": "obsidian_content"
                    }
                ),
                "websocket_server": ToolConnection(
                    provider="websocketServer",
                    name="WebSocket Server for Real-time",
                    settings={
                        "port": 8080,
                        "path": "/ws"
                    }
                ),
                "monitoring_service": ToolConnection(
                    provider="monitoringService",
                    name="Performance Monitoring Service",
                    settings={
                        "prometheus_endpoint": "http://localhost:9090",
                        "grafana_endpoint": "http://localhost:3000"
                    }
                )
            },
            metadata={
                "tags": ["ai", "vector-search", "collaboration", "monitoring", "enhanced"],
                "performance_metrics": {
                    "ai_response_time_improvement": "40%",
                    "semantic_search_accuracy": "89%",
                    "realtime_sync_latency": "50ms",
                    "system_health_score": "94%"
                },
                "technology_stack": [
                    "ChromaDB", "Pinecone", "WebSocket", "Redis", 
                    "Prometheus", "Grafana", "Multi-provider AI"
                ]
            }
        )
        
        await self.save_descriptor(enhanced_descriptor)
    
    async def save_descriptor(self, descriptor: ToolDescriptorSchema):
        """Save tool descriptor to file."""
        try:
            descriptor.updated_at = datetime.now()
            
            file_path = self.descriptors_path / f"{descriptor.id}.json"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(descriptor.to_dict(), f, indent=2, ensure_ascii=False)
            
            self.descriptors[descriptor.id] = descriptor
            
            self.logger.info(f"Saved tool descriptor: {descriptor.name} ({descriptor.id})")
            
        except Exception as e:
            self.logger.error(f"Failed to save descriptor {descriptor.id}: {e}")
            raise
    
    async def create_descriptor(self, name: str, description: str, author: Optional[str] = None) -> ToolDescriptorSchema:
        """Create new tool descriptor."""
        descriptor = ToolDescriptorSchema(
            id=self.generate_unique_id(),
            version="1.0",
            name=name,
            description=description,
            author=author
        )
        
        await self.save_descriptor(descriptor)
        return descriptor
    
    async def add_skill_to_descriptor(self, descriptor_id: str, skill_id: str, skill: ToolSkill):
        """Add skill to existing descriptor."""
        if descriptor_id not in self.descriptors:
            raise ValueError(f"Descriptor {descriptor_id} not found")
        
        descriptor = self.descriptors[descriptor_id]
        descriptor.skills[skill_id] = skill
        
        await self.save_descriptor(descriptor)
    
    async def add_connection_to_descriptor(self, descriptor_id: str, connection_id: str, connection: ToolConnection):
        """Add connection to existing descriptor."""
        if descriptor_id not in self.descriptors:
            raise ValueError(f"Descriptor {descriptor_id} not found")
        
        descriptor = self.descriptors[descriptor_id]
        descriptor.connections[connection_id] = connection
        
        await self.save_descriptor(descriptor)
    
    def get_descriptor(self, descriptor_id: str) -> Optional[ToolDescriptorSchema]:
        """Get tool descriptor by ID."""
        return self.descriptors.get(descriptor_id)
    
    def list_descriptors(self) -> List[ToolDescriptorSchema]:
        """List all tool descriptors."""
        return list(self.descriptors.values())
    
    def search_descriptors(self, query: str, category: Optional[str] = None) -> List[ToolDescriptorSchema]:
        """Search tool descriptors."""
        results = []
        
        for descriptor in self.descriptors.values():
            # Search in name and description
            if (query.lower() in descriptor.name.lower() or 
                query.lower() in descriptor.description.lower()):
                
                # Filter by category if specified
                if category:
                    has_category = any(
                        skill.category.lower() == category.lower() 
                        for skill in descriptor.skills.values()
                    )
                    if has_category:
                        results.append(descriptor)
                else:
                    results.append(descriptor)
        
        return results
    
    def get_skills_by_category(self, category: str) -> List[tuple]:
        """Get all skills by category across all descriptors."""
        skills = []
        
        for descriptor in self.descriptors.values():
            for skill_id, skill in descriptor.skills.items():
                if skill.category.lower() == category.lower():
                    skills.append((descriptor.id, skill_id, skill))
        
        return skills
    
    def validate_descriptor(self, descriptor: ToolDescriptorSchema) -> List[str]:
        """Validate tool descriptor and return list of issues."""
        issues = []
        
        # Basic validation
        if not descriptor.id:
            issues.append("Descriptor ID is required")
        
        if not descriptor.name:
            issues.append("Descriptor name is required")
        
        if not descriptor.version:
            issues.append("Descriptor version is required")
        
        # Skills validation
        for skill_id, skill in descriptor.skills.items():
            if not skill.name:
                issues.append(f"Skill {skill_id} is missing name")
            
            if not skill.category:
                issues.append(f"Skill {skill_id} is missing category")
            
            if not skill.prompt:
                issues.append(f"Skill {skill_id} is missing prompt")
            
            # Validate writer references
            if skill.writer and skill.writer not in descriptor.connections:
                issues.append(f"Skill {skill_id} references unknown connection: {skill.writer}")
        
        # Connections validation
        for conn_id, connection in descriptor.connections.items():
            if not connection.provider:
                issues.append(f"Connection {conn_id} is missing provider")
            
            if not connection.name:
                issues.append(f"Connection {conn_id} is missing name")
        
        return issues
    
    async def export_descriptor(self, descriptor_id: str, file_path: str):
        """Export descriptor to external file."""
        if descriptor_id not in self.descriptors:
            raise ValueError(f"Descriptor {descriptor_id} not found")
        
        descriptor = self.descriptors[descriptor_id]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(descriptor.to_dict(), f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Exported descriptor {descriptor_id} to {file_path}")
    
    async def import_descriptor(self, file_path: str) -> ToolDescriptorSchema:
        """Import descriptor from external file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        descriptor = ToolDescriptorSchema.from_dict(data)
        
        # Validate before saving
        issues = self.validate_descriptor(descriptor)
        if issues:
            raise ValueError(f"Descriptor validation failed: {', '.join(issues)}")
        
        await self.save_descriptor(descriptor)
        
        self.logger.info(f"Imported descriptor: {descriptor.name} ({descriptor.id})")
        return descriptor

