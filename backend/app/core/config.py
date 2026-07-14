"""
CodeSage AI — Application Configuration
Uses pydantic-settings for environment-based config with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "CodeSage AI"
    APP_VERSION: str = "4.0.0"
    DEBUG: bool = False

    # ── Security ──────────────────────────────────────────
    SECRET_KEY: str = "codesage-ai-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── MongoDB ───────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "codesage_ai"

    # ── Google Gemini ─────────────────────────────────────
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # ── Judge0 Code Execution ─────────────────────────────
    JUDGE0_API_URL: str = "https://judge0-ce.p.rapidapi.com"
    JUDGE0_API_KEY: str = ""

    # ── CORS ──────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://codesage-ai.vercel.app",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
