"""API routes for DSA Interviewer."""

from .interview import router as interview_router
from .auth import router as auth_router

__all__ = ["interview_router", "auth_router"]