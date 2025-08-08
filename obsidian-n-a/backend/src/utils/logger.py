"""
Logging configuration for Obsidian AI Plugin Backend
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional

def setup_logger(
    name: str = "obsidian-ai",
    level: str = "INFO",
    log_file: Optional[str] = None,
    rotation: str = "10 MB",
    retention: int = 5,
    format_string: Optional[str] = None
) -> logging.Logger:
    """
    Setup logger with console and file handlers
    
    Args:
        name: Logger name
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (optional)
        rotation: Log rotation size (e.g., "10 MB")
        retention: Number of backup files to keep
        format_string: Custom format string
    
    Returns:
        Configured logger instance
    """
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Default format
    if format_string is None:
        format_string = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "%(filename)s:%(lineno)d - %(message)s"
        )
    
    formatter = logging.Formatter(format_string)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Parse rotation size
        rotation_bytes = _parse_size(rotation)
        
        try:
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=rotation_bytes,
                backupCount=retention,
                encoding='utf-8'
            )
            file_handler.setLevel(getattr(logging, level.upper()))
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except (OSError, PermissionError) as e:
            logger.error(f"Failed to set up file logging at {log_file}: {e}")
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger

def _parse_size(size_str: str) -> int:
    """Parse size string to bytes"""
    size_str = size_str.strip().upper()
    
    if size_str.endswith('KB'):
        return int(float(size_str[:-2]) * 1024)
    elif size_str.endswith('MB'):
        return int(float(size_str[:-2]) * 1024 * 1024)
    elif size_str.endswith('GB'):
        return int(float(size_str[:-2]) * 1024 * 1024 * 1024)
    else:
        # Assume bytes
        return int(size_str)

def get_logger(name: str = "obsidian-ai") -> logging.Logger:
    """Get logger instance"""
    return logging.getLogger(name)

