"""
Cache Service for Obsidian AI Plugin Backend
Provides caching functionality for embeddings, responses, and other data
"""

import asyncio
import json
import logging
import pickle
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import hashlib

logger = logging.getLogger(__name__)

class CacheService:
    """Cache service with TTL and LRU eviction"""
    
    def __init__(self, cache_dir: str = "data/cache", max_size: int = 1000, default_ttl: int = 3600):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.max_size = max_size
        self.default_ttl = default_ttl
        
        # In-memory cache for fast access
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, float] = {}
        
        # File-based cache for persistence
        self.cache_file = self.cache_dir / "cache_index.json"
        
    async def initialize(self):
        """Initialize cache service"""
        try:
            await self._load_cache_index()
            await self._cleanup_expired()
            logger.info("Cache service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize cache service: {e}")
            raise
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            cache_key = self._hash_key(key)
            
            # Check memory cache first
            if cache_key in self._memory_cache:
                entry = self._memory_cache[cache_key]
                
                # Check if expired
                if entry["expires_at"] > time.time():
                    self._access_times[cache_key] = time.time()
                    return entry["value"]
                else:
                    # Remove expired entry
                    await self._remove_entry(cache_key)
                    return None
            
            # Check file cache
            cache_file_path = self.cache_dir / f"{cache_key}.cache"
            if cache_file_path.exists():
                try:
                    with open(cache_file_path, 'rb') as f:
                        entry = pickle.load(f)
                    
                    # Check if expired
                    if entry["expires_at"] > time.time():
                        # Load into memory cache
                        self._memory_cache[cache_key] = entry
                        self._access_times[cache_key] = time.time()
                        
                        # Ensure memory cache size limit
                        await self._enforce_memory_limit()
                        
                        return entry["value"]
                    else:
                        # Remove expired file
                        cache_file_path.unlink()
                        return None
                        
                except Exception as e:
                    logger.warning(f"Failed to load cache file {cache_file_path}: {e}")
                    cache_file_path.unlink(missing_ok=True)
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        try:
            cache_key = self._hash_key(key)
            ttl = ttl or self.default_ttl
            expires_at = time.time() + ttl
            
            entry = {
                "value": value,
                "created_at": time.time(),
                "expires_at": expires_at,
                "ttl": ttl
            }
            
            # Store in memory cache
            self._memory_cache[cache_key] = entry
            self._access_times[cache_key] = time.time()
            
            # Enforce memory cache size limit
            await self._enforce_memory_limit()
            
            # Store in file cache for persistence
            cache_file_path = self.cache_dir / f"{cache_key}.cache"
            try:
                with open(cache_file_path, 'wb') as f:
                    pickle.dump(entry, f)
            except Exception as e:
                logger.warning(f"Failed to save cache file {cache_file_path}: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            cache_key = self._hash_key(key)
            await self._remove_entry(cache_key)
            return True
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        value = await self.get(key)
        return value is not None
    
    async def clear(self) -> bool:
        """Clear all cache entries"""
        try:
            # Clear memory cache
            self._memory_cache.clear()
            self._access_times.clear()
            
            # Clear file cache
            for cache_file in self.cache_dir.glob("*.cache"):
                cache_file.unlink()
            
            # Clear cache index
            if self.cache_file.exists():
                self.cache_file.unlink()
            
            logger.info("Cache cleared successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            memory_count = len(self._memory_cache)
            file_count = len(list(self.cache_dir.glob("*.cache")))
            
            # Calculate total size
            total_size = 0
            for cache_file in self.cache_dir.glob("*.cache"):
                total_size += cache_file.stat().st_size
            
            # Count expired entries
            expired_count = 0
            current_time = time.time()
            for entry in self._memory_cache.values():
                if entry["expires_at"] <= current_time:
                    expired_count += 1
            
            return {
                "memory_entries": memory_count,
                "file_entries": file_count,
                "total_size_bytes": total_size,
                "expired_entries": expired_count,
                "max_size": self.max_size,
                "default_ttl": self.default_ttl,
                "cache_dir": str(self.cache_dir)
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}
    
    async def cleanup_expired(self) -> int:
        """Cleanup expired cache entries"""
        return await self._cleanup_expired()
    
    def _hash_key(self, key: str) -> str:
        """Generate hash for cache key"""
        return hashlib.sha256(key.encode()).hexdigest()[:16]
    
    async def _remove_entry(self, cache_key: str):
        """Remove cache entry from both memory and file"""
        # Remove from memory
        self._memory_cache.pop(cache_key, None)
        self._access_times.pop(cache_key, None)
        
        # Remove file
        cache_file_path = self.cache_dir / f"{cache_key}.cache"
        cache_file_path.unlink(missing_ok=True)
    
    async def _enforce_memory_limit(self):
        """Enforce memory cache size limit using LRU eviction"""
        while len(self._memory_cache) > self.max_size:
            # Find least recently used entry
            lru_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
            
            # Remove from memory (but keep in file cache)
            self._memory_cache.pop(lru_key, None)
            self._access_times.pop(lru_key, None)
    
    async def _cleanup_expired(self) -> int:
        """Cleanup expired cache entries"""
        try:
            current_time = time.time()
            expired_count = 0
            
            # Cleanup memory cache
            expired_keys = []
            for cache_key, entry in self._memory_cache.items():
                if entry["expires_at"] <= current_time:
                    expired_keys.append(cache_key)
            
            for cache_key in expired_keys:
                await self._remove_entry(cache_key)
                expired_count += 1
            
            # Cleanup file cache
            for cache_file in self.cache_dir.glob("*.cache"):
                try:
                    with open(cache_file, 'rb') as f:
                        entry = pickle.load(f)
                    
                    if entry["expires_at"] <= current_time:
                        cache_file.unlink()
                        expired_count += 1
                        
                except Exception as e:
                    logger.warning(f"Failed to check cache file {cache_file}: {e}")
                    cache_file.unlink()
                    expired_count += 1
            
            if expired_count > 0:
                logger.info(f"Cleaned up {expired_count} expired cache entries")
            
            return expired_count
            
        except Exception as e:
            logger.error(f"Error during cache cleanup: {e}")
            return 0
    
    async def _load_cache_index(self):
        """Load cache index from file"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r') as f:
                    index_data = json.load(f)
                
                # Load frequently accessed items into memory
                for cache_key, metadata in index_data.items():
                    cache_file_path = self.cache_dir / f"{cache_key}.cache"
                    if cache_file_path.exists():
                        try:
                            with open(cache_file_path, 'rb') as f:
                                entry = pickle.load(f)
                            
                            # Only load if not expired
                            if entry["expires_at"] > time.time():
                                self._memory_cache[cache_key] = entry
                                self._access_times[cache_key] = metadata.get("last_access", time.time())
                                
                        except Exception as e:
                            logger.warning(f"Failed to load cache entry {cache_key}: {e}")
                
                # Enforce memory limit
                await self._enforce_memory_limit()
                
        except Exception as e:
            logger.warning(f"Failed to load cache index: {e}")
    
    async def _save_cache_index(self):
        """Save cache index to file"""
        try:
            index_data = {}
            for cache_key, access_time in self._access_times.items():
                index_data[cache_key] = {
                    "last_access": access_time
                }
            
            with open(self.cache_file, 'w') as f:
                json.dump(index_data, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Failed to save cache index: {e}")
    
    async def cleanup(self):
        """Cleanup cache service"""
        try:
            await self._save_cache_index()
            logger.info("Cache service cleanup completed")
        except Exception as e:
            logger.error(f"Error during cache cleanup: {e}")

# Specialized cache classes

class EmbeddingCache(CacheService):
    """Specialized cache for embeddings"""
    
    def __init__(self, cache_dir: str = "data/cache/embeddings", **kwargs):
        super().__init__(cache_dir=cache_dir, **kwargs)
    
    async def get_embedding(self, text: str, model: str) -> Optional[List[float]]:
        """Get embedding from cache"""
        key = f"embedding:{model}:{text}"
        return await self.get(key)
    
    async def set_embedding(self, text: str, model: str, embedding: List[float], ttl: int = 86400) -> bool:
        """Set embedding in cache (default 24h TTL)"""
        key = f"embedding:{model}:{text}"
        return await self.set(key, embedding, ttl)

class ResponseCache(CacheService):
    """Specialized cache for AI responses"""
    
    def __init__(self, cache_dir: str = "data/cache/responses", **kwargs):
        super().__init__(cache_dir=cache_dir, **kwargs)
    
    async def get_response(self, query: str, model: str, context_hash: str = "") -> Optional[str]:
        """Get response from cache"""
        key = f"response:{model}:{context_hash}:{query}"
        return await self.get(key)
    
    async def set_response(self, query: str, model: str, response: str, context_hash: str = "", ttl: int = 3600) -> bool:
        """Set response in cache (default 1h TTL)"""
        key = f"response:{model}:{context_hash}:{query}"
        return await self.set(key, response, ttl)

