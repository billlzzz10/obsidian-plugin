"""
Database configuration and initialization for Obsidian AI Plugin Backend
"""

import asyncio
import logging
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database manager for Obsidian AI Plugin"""
    
    def __init__(self, db_path: str = "data/obsidian_ai.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._connection: Optional[sqlite3.Connection] = None
    
    async def initialize(self):
        """Initialize database and create tables"""
        try:
            self._connection = sqlite3.connect(str(self.db_path))
            self._connection.row_factory = sqlite3.Row
            
            await self._create_tables()
            logger.info(f"Database initialized at {self.db_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def _create_tables(self):
        """Create database tables"""
        cursor = self._connection.cursor()
        
        # Documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                metadata TEXT,
                embedding_model TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Embeddings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                vector BLOB NOT NULL,
                model TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents (id)
            )
        """)
        
        # Conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                model TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
        """)
        
        # Tool descriptors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tool_descriptors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                author TEXT,
                skills TEXT,
                connections TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_model ON documents (embedding_model)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_document ON embeddings (document_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at)")
        
        self._connection.commit()
        logger.info("Database tables created successfully")
    
    async def save_document(self, doc_id: str, content: str, metadata: Dict[str, Any], embedding_model: str):
        """Save document to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO documents (id, content, metadata, embedding_model, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (doc_id, content, json.dumps(metadata), embedding_model))
        self._connection.commit()
    
    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        cursor = self._connection.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        
        if row:
            return {
                "id": row["id"],
                "content": row["content"],
                "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
                "embedding_model": row["embedding_model"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
        return None
    
    async def save_embedding(self, embedding_id: str, document_id: str, vector: bytes, model: str):
        """Save embedding to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO embeddings (id, document_id, vector, model)
            VALUES (?, ?, ?, ?)
        """, (embedding_id, document_id, vector, model))
        self._connection.commit()
    
    async def get_embeddings(self, document_id: str) -> List[Dict[str, Any]]:
        """Get embeddings for document"""
        cursor = self._connection.cursor()
        cursor.execute("SELECT * FROM embeddings WHERE document_id = ?", (document_id,))
        rows = cursor.fetchall()
        
        return [{
            "id": row["id"],
            "document_id": row["document_id"],
            "vector": row["vector"],
            "model": row["model"],
            "created_at": row["created_at"]
        } for row in rows]
    
    async def save_conversation(self, conversation_id: str, title: str = None):
        """Save conversation to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO conversations (id, title, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (conversation_id, title))
        self._connection.commit()
    
    async def save_message(self, message_id: str, conversation_id: str, role: str, 
                          content: str, model: str = None, metadata: Dict[str, Any] = None):
        """Save message to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT INTO messages (id, conversation_id, role, content, model, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (message_id, conversation_id, role, content, model, 
              json.dumps(metadata) if metadata else None))
        self._connection.commit()
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get messages for conversation"""
        cursor = self._connection.cursor()
        cursor.execute("""
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        """, (conversation_id,))
        rows = cursor.fetchall()
        
        return [{
            "id": row["id"],
            "conversation_id": row["conversation_id"],
            "role": row["role"],
            "content": row["content"],
            "model": row["model"],
            "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
            "created_at": row["created_at"]
        } for row in rows]
    
    async def save_tool_descriptor(self, descriptor_id: str, name: str, description: str,
                                  author: str, skills: Dict[str, Any], connections: Dict[str, Any]):
        """Save tool descriptor to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO tool_descriptors 
            (id, name, description, author, skills, connections, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (descriptor_id, name, description, author, 
              json.dumps(skills), json.dumps(connections)))
        self._connection.commit()
    
    async def get_tool_descriptors(self) -> List[Dict[str, Any]]:
        """Get all tool descriptors"""
        cursor = self._connection.cursor()
        cursor.execute("SELECT * FROM tool_descriptors ORDER BY created_at DESC")
        rows = cursor.fetchall()
        
        return [{
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "author": row["author"],
            "skills": json.loads(row["skills"]) if row["skills"] else {},
            "connections": json.loads(row["connections"]) if row["connections"] else {},
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        } for row in rows]
    
    async def save_setting(self, key: str, value: str):
        """Save setting to database"""
        cursor = self._connection.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (key, value))
        self._connection.commit()
    
    async def get_setting(self, key: str) -> Optional[str]:
        """Get setting by key"""
        cursor = self._connection.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else None
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics"""
        cursor = self._connection.cursor()
        
        # Document count
        cursor.execute("SELECT COUNT(*) as count FROM documents")
        doc_count = cursor.fetchone()["count"]
        
        # Embedding count
        cursor.execute("SELECT COUNT(*) as count FROM embeddings")
        embedding_count = cursor.fetchone()["count"]
        
        # Conversation count
        cursor.execute("SELECT COUNT(*) as count FROM conversations")
        conversation_count = cursor.fetchone()["count"]
        
        # Message count
        cursor.execute("SELECT COUNT(*) as count FROM messages")
        message_count = cursor.fetchone()["count"]
        
        # Tool descriptor count
        cursor.execute("SELECT COUNT(*) as count FROM tool_descriptors")
        tool_count = cursor.fetchone()["count"]
        
        return {
            "documents": doc_count,
            "embeddings": embedding_count,
            "conversations": conversation_count,
            "messages": message_count,
            "tool_descriptors": tool_count,
            "database_size": self.db_path.stat().st_size if self.db_path.exists() else 0
        }
    
    async def cleanup(self):
        """Cleanup database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None
            logger.info("Database connection closed")

# Global database instance
_db_manager: Optional[DatabaseManager] = None

async def init_database(db_path: str = "data/obsidian_ai.db") -> DatabaseManager:
    """Initialize database"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager(db_path)
        await _db_manager.initialize()
    return _db_manager

def get_database() -> DatabaseManager:
    """Get database instance"""
    if _db_manager is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    return _db_manager

