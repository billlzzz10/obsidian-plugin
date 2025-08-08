"""
Airtable Integration Service for Obsidian AI Plugin Backend
Provides integration with Airtable API for data synchronization
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
import aiohttp
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class AirtableService:
    """Service for Airtable API integration"""
    
    def __init__(self):
        self.base_url = "https://api.airtable.com/v0"
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def initialize(self):
        """Initialize Airtable service"""
        try:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={"Content-Type": "application/json"}
            )
            logger.info("Airtable service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Airtable service: {e}")
            raise
    
    async def test_connection(self, access_token: str, base_id: str) -> bool:
        """Test Airtable API connection"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with self._session.get(
                f"{self.base_url}/{base_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    logger.info("Airtable connection test successful")
                    return True
                else:
                    logger.warning(f"Airtable connection test failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Airtable connection test error: {e}")
            return False
    
    async def get_base_schema(self, access_token: str, base_id: str) -> Dict[str, Any]:
        """Get base schema information"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with self._session.get(
                f"{self.base_url}/meta/bases/{base_id}/tables",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    logger.error(f"Failed to get base schema: {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error getting base schema: {e}")
            return {}
    
    async def get_tables(self, access_token: str, base_id: str) -> List[Dict[str, Any]]:
        """Get list of tables in base"""
        try:
            schema = await self.get_base_schema(access_token, base_id)
            tables = []
            
            for table in schema.get("tables", []):
                tables.append({
                    "id": table["id"],
                    "name": table["name"],
                    "description": table.get("description", ""),
                    "fields": table.get("fields", [])
                })
            
            return tables
            
        except Exception as e:
            logger.error(f"Error getting tables: {e}")
            return []
    
    async def get_records(self, access_token: str, base_id: str, table_name: str,
                         max_records: int = 100, view: str = None) -> List[Dict[str, Any]]:
        """Get records from a table"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            params = {"maxRecords": max_records}
            
            if view:
                params["view"] = view
            
            async with self._session.get(
                f"{self.base_url}/{base_id}/{table_name}",
                headers=headers,
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    records = []
                    
                    for record in data.get("records", []):
                        records.append({
                            "id": record["id"],
                            "fields": record.get("fields", {}),
                            "created_time": record.get("createdTime", ""),
                            "table": table_name
                        })
                    
                    return records
                else:
                    logger.error(f"Failed to get records: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting records: {e}")
            return []
    
    async def create_record(self, access_token: str, base_id: str, table_name: str,
                           fields: Dict[str, Any]) -> Optional[str]:
        """Create a new record in table"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            record_data = {
                "fields": fields
            }
            
            async with self._session.post(
                f"{self.base_url}/{base_id}/{table_name}",
                headers=headers,
                json=record_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    record_id = data["id"]
                    logger.info(f"Created Airtable record: {record_id}")
                    return record_id
                else:
                    logger.error(f"Failed to create record: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating record: {e}")
            return None
    
    async def update_record(self, access_token: str, base_id: str, table_name: str,
                           record_id: str, fields: Dict[str, Any]) -> bool:
        """Update record fields"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            record_data = {
                "fields": fields
            }
            
            async with self._session.patch(
                f"{self.base_url}/{base_id}/{table_name}/{record_id}",
                headers=headers,
                json=record_data
            ) as response:
                if response.status == 200:
                    logger.info(f"Updated Airtable record: {record_id}")
                    return True
                else:
                    logger.error(f"Failed to update record: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error updating record: {e}")
            return False
    
    async def delete_record(self, access_token: str, base_id: str, table_name: str,
                           record_id: str) -> bool:
        """Delete a record"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with self._session.delete(
                f"{self.base_url}/{base_id}/{table_name}/{record_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    logger.info(f"Deleted Airtable record: {record_id}")
                    return True
                else:
                    logger.error(f"Failed to delete record: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error deleting record: {e}")
            return False
    
    async def sync_to_obsidian(self, access_token: str, base_id: str, 
                              table_name: str) -> Dict[str, Any]:
        """Sync Airtable table to Obsidian format"""
        try:
            # Get table schema
            tables = await self.get_tables(access_token, base_id)
            target_table = next((t for t in tables if t["name"] == table_name), None)
            
            if not target_table:
                return {"error": "Table not found"}
            
            # Get all records
            records = await self.get_records(access_token, base_id, table_name)
            
            # Convert to Obsidian format
            obsidian_notes = []
            for record in records:
                note = {
                    "id": f"airtable-{record['id']}",
                    "title": self._extract_title(record["fields"]),
                    "content": self._format_for_obsidian(record, target_table),
                    "metadata": {
                        "source": "airtable",
                        "airtable_id": record["id"],
                        "base_id": base_id,
                        "table": table_name,
                        "created": record["created_time"]
                    }
                }
                obsidian_notes.append(note)
            
            return {
                "success": True,
                "table": table_name,
                "notes": obsidian_notes,
                "count": len(obsidian_notes)
            }
            
        except Exception as e:
            logger.error(f"Error syncing from Airtable: {e}")
            return {"error": str(e)}
    
    async def sync_from_obsidian(self, access_token: str, base_id: str, 
                                table_name: str, notes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sync Obsidian notes to Airtable table"""
        try:
            created_count = 0
            updated_count = 0
            errors = []
            
            # Get table schema to understand field types
            tables = await self.get_tables(access_token, base_id)
            target_table = next((t for t in tables if t["name"] == table_name), None)
            
            if not target_table:
                return {"error": "Table not found"}
            
            for note in notes:
                try:
                    # Check if record already exists in Airtable
                    airtable_id = note.get("metadata", {}).get("airtable_id")
                    
                    # Prepare fields
                    fields = self._prepare_fields(note, target_table)
                    
                    if airtable_id:
                        # Update existing record
                        success = await self.update_record(
                            access_token, base_id, table_name, airtable_id, fields
                        )
                        if success:
                            updated_count += 1
                        else:
                            errors.append(f"Failed to update: {note['title']}")
                    else:
                        # Create new record
                        record_id = await self.create_record(
                            access_token, base_id, table_name, fields
                        )
                        if record_id:
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
            logger.error(f"Error syncing to Airtable: {e}")
            return {"error": str(e)}
    
    def _extract_title(self, fields: Dict[str, Any]) -> str:
        """Extract title from record fields"""
        # Try common title field names
        title_fields = ["Name", "Title", "Subject", "Summary"]
        
        for field_name in title_fields:
            if field_name in fields and fields[field_name]:
                return str(fields[field_name])
        
        # If no title field found, use first text field
        for field_name, value in fields.items():
            if isinstance(value, str) and value.strip():
                return value[:50] + "..." if len(value) > 50 else value
        
        return "Untitled"
    
    def _format_for_obsidian(self, record: Dict[str, Any], table_schema: Dict[str, Any]) -> str:
        """Format Airtable record for Obsidian"""
        content_parts = []
        
        # Add title
        title = self._extract_title(record["fields"])
        content_parts.append(f"# {title}")
        content_parts.append("")
        
        # Add metadata
        content_parts.append("---")
        content_parts.append(f"airtable_id: {record['id']}")
        content_parts.append(f"table: {record['table']}")
        content_parts.append(f"created: {record['created_time']}")
        content_parts.append("---")
        content_parts.append("")
        
        # Add fields as content
        for field_name, value in record["fields"].items():
            if value is not None:
                content_parts.append(f"## {field_name}")
                
                if isinstance(value, list):
                    for item in value:
                        content_parts.append(f"- {item}")
                elif isinstance(value, dict):
                    content_parts.append(f"```json")
                    content_parts.append(json.dumps(value, indent=2))
                    content_parts.append("```")
                else:
                    content_parts.append(str(value))
                
                content_parts.append("")
        
        return "\n".join(content_parts)
    
    def _prepare_fields(self, note: Dict[str, Any], table_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare fields for Airtable from Obsidian note"""
        fields = {}
        
        # Add title to Name field (most common primary field)
        fields["Name"] = note["title"]
        
        # Add content to a text field if available
        content_fields = ["Content", "Description", "Notes", "Text"]
        for field_name in content_fields:
            # Check if field exists in table schema
            if any(f["name"] == field_name for f in table_schema.get("fields", [])):
                fields[field_name] = note["content"]
                break
        
        # Add metadata fields if they exist in schema
        metadata = note.get("metadata", {})
        for field in table_schema.get("fields", []):
            field_name = field["name"]
            
            # Map common metadata fields
            if field_name == "Source" and "source" in metadata:
                fields[field_name] = metadata["source"]
            elif field_name == "Created" and "created" in metadata:
                fields[field_name] = metadata["created"]
            elif field_name == "Modified" and "modified" in metadata:
                fields[field_name] = metadata["modified"]
        
        return fields
    
    async def cleanup(self):
        """Cleanup Airtable service"""
        if self._session:
            await self._session.close()
            self._session = None
            logger.info("Airtable service cleanup completed")

