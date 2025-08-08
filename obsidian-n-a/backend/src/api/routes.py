"""
API Routes for Obsidian AI Plugin Backend Service
Centralized routing configuration
"""

from fastapi import APIRouter
from .endpoints import router as endpoints_router

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(endpoints_router, tags=["obsidian-ai"])

# Additional routers can be added here
# api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
# api_router.include_router(admin_router, prefix="/admin", tags=["administration"])

