"""
Configuration management for the backend service.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ENVIRONMENT: str = Field(default="production", description="Environment")
    
    # Security
    SECRET_KEY: str = Field(description="Secret key for JWT tokens")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "app://obsidian.md"],
        description="CORS allowed origins"
    )
    
    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite:///{(Path(__file__).parent.parent.parent / 'data' / 'obsidian_ai.db').resolve()}",
        description="Database connection URL"
    )
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # AI Model Configuration
    DEFAULT_EMBEDDING_MODEL: str = Field(
        default="all-MiniLM-L6-v2",
        description="Default embedding model"
    )
    DEFAULT_LLM_PROVIDER: str = Field(
        default="openai",
        description="Default LLM provider"
    )
    MAX_CONTEXT_LENGTH: int = Field(
        default=100000,
        description="Maximum context length for processing"
    )
    EMBEDDING_CACHE_TTL: int = Field(
        default=3600,
        description="Embedding cache TTL in seconds"
    )
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
    OPENAI_API_BASE: str = Field(
        default="https://api.openai.com/v1",
        description="OpenAI API base URL"
    )
    OPENAI_MODEL: str = Field(default="gpt-4", description="Default OpenAI model")
    
    # Anthropic Configuration
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key")
    ANTHROPIC_MODEL: str = Field(
        default="claude-3-sonnet-20240229",
        description="Default Anthropic model"
    )
    
    # Google AI Configuration
    GOOGLE_API_KEY: Optional[str] = Field(default=None, description="Google AI API key")
    GOOGLE_MODEL: str = Field(default="gemini-pro", description="Default Google model")
    
    # Notion Integration
    NOTION_API_KEY: Optional[str] = Field(default=None, description="Notion API key")
    NOTION_DATABASE_ID: Optional[str] = Field(default=None, description="Notion database ID")
    
    # Airtable Integration
    AIRTABLE_API_KEY: Optional[str] = Field(default=None, description="Airtable API key")
    AIRTABLE_BASE_ID: Optional[str] = Field(default=None, description="Airtable base ID")
    AIRTABLE_TABLE_NAME: Optional[str] = Field(default=None, description="Airtable table name")
    
    # Google Drive Integration
    GOOGLE_DRIVE_CREDENTIALS_FILE: Optional[str] = Field(
        default=None,
        description="Google Drive credentials file path"
    )
    GOOGLE_DRIVE_TOKEN_FILE: Optional[str] = Field(
        default=None,
        description="Google Drive token file path"
    )
    
    # Dropbox Integration
    DROPBOX_ACCESS_TOKEN: Optional[str] = Field(default=None, description="Dropbox access token")
    DROPBOX_APP_KEY: Optional[str] = Field(default=None, description="Dropbox app key")
    DROPBOX_APP_SECRET: Optional[str] = Field(default=None, description="Dropbox app secret")
    
    # OneDrive Integration
    ONEDRIVE_CLIENT_ID: Optional[str] = Field(default=None, description="OneDrive client ID")
    ONEDRIVE_CLIENT_SECRET: Optional[str] = Field(default=None, description="OneDrive client secret")
    
    # Performance Settings
    MAX_WORKERS: int = Field(default=4, description="Maximum number of workers")
    BATCH_SIZE: int = Field(default=32, description="Batch size for processing")
    CACHE_SIZE: int = Field(default=1000, description="Cache size")
    MEMORY_LIMIT_MB: int = Field(default=2048, description="Memory limit in MB")
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", description="Log level")
    LOG_FILE: str = Field(default="logs/obsidian_ai.log", description="Log file path")
    LOG_ROTATION: str = Field(default="1 week", description="Log rotation interval")
    LOG_RETENTION: str = Field(default="4 weeks", description="Log retention period")
    
    # Feature Flags
    ENABLE_INCREMENTAL_EMBEDDING: bool = Field(
        default=True,
        description="Enable incremental embedding"
    )
    ENABLE_SMART_CACHING: bool = Field(
        default=True,
        description="Enable smart caching"
    )
    ENABLE_HYBRID_PROCESSING: bool = Field(
        default=True,
        description="Enable hybrid processing"
    )
    ENABLE_CLOUD_SYNC: bool = Field(
        default=True,
        description="Enable cloud synchronization"
    )
    ENABLE_ANALYTICS: bool = Field(
        default=True,
        description="Enable analytics"
    )
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
    def get_database_path(self) -> Path:
        """Get the database file path."""
        if self.DATABASE_URL.startswith("sqlite:///"):
            db_path = self.DATABASE_URL.replace("sqlite:///", "")
            if not db_path.startswith("/"):
                # Relative path
                return Path(__file__).parent.parent.parent / db_path
            return Path(db_path)
        return None
    
    def get_log_path(self) -> Path:
        """Get the log file path."""
        log_path = Path(self.LOG_FILE)
        if not log_path.is_absolute():
            return Path(__file__).parent.parent.parent / log_path
        return log_path
    
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT.lower() in ("development", "dev", "local")
    
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT.lower() in ("production", "prod")
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    # Look for .env file in config directory
    config_dir = Path(__file__).parent.parent.parent / "config"
    env_file = config_dir / ".env"
    
    if env_file.exists():
        return Settings(_env_file=str(env_file))
    
    return Settings()

