"""
CodeSage AI — Central API Router
Registers all route modules.
"""

from fastapi import APIRouter
from app.api.routes import auth, ai, learn, practice, interview, analytics, history

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(ai.router)
api_router.include_router(learn.router)
api_router.include_router(practice.router)
api_router.include_router(interview.router)
api_router.include_router(analytics.router)
api_router.include_router(history.router)
