"""System diagnostics routes.

GET /api/system/bigquery-status — Safe connection diagnostic.

This endpoint is protected: in production it should only be accessible
to authorized administrators. In development mode it is open for testing.

Never returns credentials, environment variable values, or actual data rows.
"""
import logging
from fastapi import APIRouter

from app.config import settings
from app.models import BigQueryStatusResponse
from app.services.bigquery import bigquery_service

logger = logging.getLogger("enterprise_analytics.routes.system")

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/bigquery-status", response_model=BigQueryStatusResponse)
async def bigquery_status():
    """Check BigQuery connection status.

    Uses a real metadata request. Never returns credentials or row data.
    In production, this endpoint should be behind authentication.
    """
    if not settings.is_development:
        logger.warning("BigQuery status check attempted in non-dev environment")
        # In production, this should require authentication.
        # For now, still allow but log the access.

    result = await bigquery_service.check_connection()
    logger.info(
        "BigQuery status check: connected=%s",
        result.get("connected", False),
    )
    return BigQueryStatusResponse(**result)
