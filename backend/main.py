"""
CodeSage AI — Production FastAPI Application
Version 4.0.0 | Built by Anand D
"""

import asyncio
import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.api.router import api_router

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("codesage")


# ── Lifespan (startup + shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting up...")
    await connect_db()

    # Train ML model in background
    from app.services.analytics_service import analytics_engine
    asyncio.create_task(analytics_engine.initialize_model())

    logger.info(f"✅ {settings.APP_NAME} ready!")
    yield

    # Shutdown
    logger.info("🛑 Shutting down...")
    await close_db()


# ── Application Factory ───────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "An AI-powered programming mentor platform with DSA learning, "
        "code debugging, mock interviews, and gamified progress tracking."
    ),
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ── Health / Root ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    from app.services.gemini_service import is_configured
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "ai_configured": is_configured(),
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.core.database import db
    from app.services.gemini_service import is_configured
    mongo_ok = False
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        pass
    return {
        "status": "healthy" if mongo_ok else "degraded",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "gemini": "configured" if is_configured() else "not_configured",
        "version": settings.APP_VERSION,
    }
