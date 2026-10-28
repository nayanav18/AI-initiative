"""Application configuration management.

Loads settings from environment variables with safe defaults.
Never logs or exposes secret values.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """Application settings loaded from environment variables."""

    # Google Cloud
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "")
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")

    # BigQuery
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "")
    BIGQUERY_LOCATION: str = os.getenv("BIGQUERY_LOCATION", "US")

    # Vertex AI (ready for future milestone)
    VERTEX_AI_MODEL: str = os.getenv("VERTEX_AI_MODEL", "gemini-2.5-flash-lite")
    VERTEX_AI_TEMPERATURE: float = float(os.getenv("VERTEX_AI_TEMPERATURE", "0.2"))
    VERTEX_AI_MAX_TOKENS: int = int(os.getenv("VERTEX_AI_MAX_TOKENS", "2048"))
    VERTEX_AI_LOCATION: str = os.getenv("VERTEX_AI_LOCATION", "us-central1")

    # Application
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Frontend URL for CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    # Database
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).parent.parent / "data" / "conversations.db")
    )

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
