"""Enterprise Analytics AI - FastAPI Application Entry Point.

Secure, modular backend with SQLite persistence and BigQuery
connection verification. No company data is sent to AI models
in this milestone.
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.database import DatabaseService
from app.routes.chat import router as chat_router
from app.routes.conversations import router as conversations_router
from app.routes.system import router as system_router

# ---------------------------------------------------------------------------
# Structured Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("enterprise_analytics")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown."""
    logger.info("Starting Enterprise Analytics AI backend …")

    db = DatabaseService(settings.DATABASE_PATH)
    await db.initialize()
    app.state.db = db

    logger.info("Backend ready")
    yield

    logger.info("Shutting down …")
    await db.close()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Enterprise Analytics AI",
    description="Secure enterprise analytics chatbot – Step 1",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url=None,
)

# ---------------------------------------------------------------------------
# CORS – restrict to configured frontend origin
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Global exception handler – never leak stack traces
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", type(exc).__name__, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
        },
    )


# ---------------------------------------------------------------------------
# Health endpoint (no prefix, always available)
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic liveness probe. Does not expose configuration secrets."""
    return {
        "status": "healthy",
        "service": "Enterprise Analytics AI",
        "version": "1.0.0",
    }


# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(system_router)


# ---------------------------------------------------------------------------
# CLI runner
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=settings.is_development,
    )
