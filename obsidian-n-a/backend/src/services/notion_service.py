"""
Notion Integration Service for Obsidian AI Plugin Backend
Provides integration with Notion API for data synchronization
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
import aiohttp
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class NotionService:
    """Service for Notion API integration"""
    
    def __init__(self):
        self.base_url = "https://api.notion.com/v1"
        self.version = "2022-06-28"
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def initialize(self):
        """Initialize Notion service"""
        try:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    "Notion-Version": self.version,
                    "Content-Type": "application/json"
                }
            )
            logger.info("Notion service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Notion service: {e}")
            raise
    
    async def test_connection(self, integration_token: str) -> bool:
        """Test Notion API connection"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            async with self._session.get(
                f"{self.base_url}/users/me",
                headers=headers
            ) as response:
                if response.status == 200:
                    logger.info("Notion connection test successful")
                    return True
                else:
                    logger.warning(f"Notion connection test failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Notion connection test error: {e}")
            return False
    
    async def get_databases(self, integration_token: str) -> List[Dict[str, Any]]:
        """Get list of accessible databases"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            async with self._session.post(
                f"{self.base_url}/search",
                headers=headers,
                json={
                    "filter": {
                        "value": "database",
                        "property": "object"
                    }
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    databases = []
                    
                    for db in data.get("results", []):
                        databases.append({
                            "id": db["id"],
                            "title": self._extract_title(db.get("title", [])),
                            "url": db.get("url", ""),
                            "created_time": db.get("created_time", ""),
                            "last_edited_time": db.get("last_edited_time", ""),
                            "properties": db.get("properties", {})
                        })
                    
                    return databases
                else:
                    logger.error(f"Failed to get databases: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting databases: {e}")
            return []
    
    async def get_pages(self, integration_token: str, database_id: str, 
                       page_size: int = 100) -> List[Dict[str, Any]]:
        """Get pages from a database"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            async with self._session.post(
                f"{self.base_url}/databases/{database_id}/query",
                headers=headers,
                json={
                    "page_size": page_size
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    pages = []
                    
                    for page in data.get("results", []):
                        pages.append({
                            "id": page["id"],
                            "title": self._extract_title(page.get("properties", {}).get("Name", {}).get("title", [])),
                            "url": page.get("url", ""),
                            "created_time": page.get("created_time", ""),
                            "last_edited_time": page.get("last_edited_time", ""),
                            "properties": page.get("properties", {}),
                            "content": await self._get_page_content(integration_token, page["id"])
                        })
                    
                    return pages
                else:
                    logger.error(f"Failed to get pages: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting pages: {e}")
            return []
    
    async def _get_page_content(self, integration_token: str, page_id: str) -> str:
        """Get page content as text"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            async with self._session.get(
                f"{self.base_url}/blocks/{page_id}/children",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    content_parts = []
                    
                    for block in data.get("results", []):
                        text = self._extract_block_text(block)
                        if text:
                            content_parts.append(text)
                    
                    return "\n".join(content_parts)
                else:
                    logger.warning(f"Failed to get page content for {page_id}: {response.status}")
                    return ""
                    
        except Exception as e:
            logger.warning(f"Error getting page content for {page_id}: {e}")
            return ""
    
    async def create_page(self, integration_token: str, database_id: str, 
                         properties: Dict[str, Any], content: str = "") -> Optional[str]:
        """Create a new page in database"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            # Prepare page data
            page_data = {
                "parent": {"database_id": database_id},
                "properties": properties
            }
            
            # Add content blocks if provided
            if content:
                page_data["children"] = self._text_to_blocks(content)
            
            async with self._session.post(
                f"{self.base_url}/pages",
                headers=headers,
                json=page_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    page_id = data["id"]
                    logger.info(f"Created Notion page: {page_id}")
                    return page_id
                else:
                    logger.error(f"Failed to create page: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating page: {e}")
            return None
    
    async def update_page(self, integration_token: str, page_id: str, 
                         properties: Dict[str, Any]) -> bool:
        """Update page properties"""
        try:
            headers = {"Authorization": f"Bearer {integration_token}"}
            
            async with self._session.patch(
                f"{self.base_url}/pages/{page_id}",
                headers=headers,
                json={"properties": properties}
            ) as response:
                if response.status == 200:
                    logger.info(f"Updated Notion page: {page_id}")
                    return True
                else:
                    logger.error(f"Failed to update page: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error updating page: {e}")
            return False
    
    async def sync_to_obsidian(self, integration_token: str, database_id: str) -> Dict[str, Any]:
        """Sync Notion database to Obsidian format"""
        try:
            # Get database info
            databases = await self.get_databases(integration_token)
            target_db = next((db for db in databases if db["id"] == database_id), None)
            
            if not target_db:
                return {"error": "Database not found"}
            
            # Get all pages
            pages = await self.get_pages(integration_token, database_id)
            
            # Convert to Obsidian format
            obsidian_notes = []
            for page in pages:
                note = {
                    "id": f"notion-{page['id']}",
                    "title": page["title"] or "Untitled",
                    "content": self._format_for_obsidian(page),
                    "metadata": {
                        "source": "notion",
                        "notion_id": page["id"],
                        "notion_url": page["url"],
                        "created": page["created_time"],
                        "modified": page["last_edited_time"],
                        "database": target_db["title"]
                    }
                }
                obsidian_notes.append(note)
            
            return {
                "success": True,
                "database": target_db["title"],
                "notes": obsidian_notes,
                "count": len(obsidian_notes)
            }
            
        except Exception as e:
            logger.error(f"Error syncing from Notion: {e}")
            return {"error": str(e)}
    
    async def sync_from_obsidian(self, integration_token: str, database_id: str, 
                                notes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sync Obsidian notes to Notion database"""
        try:
            created_count = 0
            updated_count = 0
            errors = []
            
            for note in notes:
                try:
                    # Check if note already exists in Notion
                    notion_id = note.get("metadata", {}).get("notion_id")
                    
                    # Prepare properties
                    properties = {
                        "Name": {
                            "title": [{"text": {"content": note["title"]}}]
                        }
                    }
                    
                    if notion_id:
                        # Update existing page
                        success = await self.update_page(integration_token, notion_id, properties)
                        if success:
                            updated_count += 1
                        else:
                            errors.append(f"Failed to update: {note['title']}")
                    else:
                        # Create new page
                        page_id = await self.create_page(
                            integration_token, database_id, properties, note["content"]
                        )
                        if page_id:
                            created_count += 1
                        else:
                            errors.append(f"Failed to create: {note['title']}")
                            
                except Exception as e:
                    errors.append(f"Error processing {note.get('title', 'Unknown')}: {str(e)}")
            
            return {
                "success": True,
                "created": created_count,
                "updated": updated_count,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error syncing to Notion: {e}")
            return {"error": str(e)}
    
    def _extract_title(self, title_array: List[Dict[str, Any]]) -> str:
        """Extract title from Notion title array"""
        if not title_array:
            return ""
        
        title_parts = []
        for item in title_array:
            if "text" in item and "content" in item["text"]:
                title_parts.append(item["text"]["content"])
        
        return "".join(title_parts)
    
    def _extract_block_text(self, block: Dict[str, Any]) -> str:
        """Extract text from Notion block"""
        block_type = block.get("type", "")
        
        if block_type in ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item"]:
            rich_text = block.get(block_type, {}).get("rich_text", [])
            text_parts = []
            
            for text_item in rich_text:
                if "text" in text_item and "content" in text_item["text"]:
                    text_parts.append(text_item["text"]["content"])
            
            return "".join(text_parts)
        
        return ""
    
    def _text_to_blocks(self, text: str) -> List[Dict[str, Any]]:
        """Convert text to Notion blocks"""
        blocks = []
        lines = text.split("\n")
        
        for line in lines:
            if line.strip():
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{
                            "type": "text",
                            "text": {"content": line}
                        }]
                    }
                })
        
        return blocks
    
    def _format_for_obsidian(self, page: Dict[str, Any]) -> str:
        """Format Notion page for Obsidian"""
        content_parts = []
        
        # Add title
        title = page["title"]
        if title:
            content_parts.append(f"# {title}")
            content_parts.append("")
        
        # Add metadata
        content_parts.append("---")
        content_parts.append(f"notion_id: {page['id']}")
        content_parts.append(f"notion_url: {page['url']}")
        content_parts.append(f"created: {page['created_time']}")
        content_parts.append(f"modified: {page['last_edited_time']}")
        content_parts.append("---")
        content_parts.append("")
        
        # Add content
        if page["content"]:
            content_parts.append(page["content"])
        
        return "\n".join(content_parts)
    
    async def cleanup(self):
        """Cleanup Notion service"""
        if self._session:
            await self._session.close()
            self._session = None
            logger.info("Notion service cleanup completed")

