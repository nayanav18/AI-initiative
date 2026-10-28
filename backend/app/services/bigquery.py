"""BigQuery connection verification service.

Provides safe, read-only metadata checks without retrieving business data.
Uses Application Default Credentials.
Never returns credentials, environment variables, or actual data rows.
"""
import logging
from typing import Dict, Any, Optional

from app.config import settings

logger = logging.getLogger("enterprise_analytics.bigquery")


class BigQueryService:
    """Service for BigQuery connection verification and metadata discovery."""

    def __init__(self):
        self._client = None
        self._available = False

    def _get_client(self):
        """Lazy-initialize the BigQuery client using ADC."""
        if self._client is not None:
            return self._client

        try:
            from google.cloud import bigquery

            self._client = bigquery.Client(
                project=settings.GCP_PROJECT_ID,
                location=settings.BIGQUERY_LOCATION,
            )
            self._available = True
            logger.info("BigQuery client initialized")
            return self._client
        except ImportError:
            logger.warning("google-cloud-bigquery package not installed")
            raise
        except Exception as e:
            logger.error("BigQuery client init failed: %s", type(e).__name__)
            raise

    async def check_connection(self) -> Dict[str, Any]:
        """Verify BigQuery connectivity with a safe metadata request.

        Returns a sanitized status dictionary. Never returns credentials,
        row data, or sensitive table metadata.
        """
        result: Dict[str, Any] = {
            "connected": False,
            "project": settings.GCP_PROJECT_ID or None,
            "dataset": settings.BIGQUERY_DATASET or None,
            "metadata_accessible": False,
            "table_count": None,
            "error_category": None,
            "message": None,
        }

        # Check configuration first
        if not settings.GCP_PROJECT_ID:
            result["error_category"] = "MISSING_CONFIG"
            result["message"] = "GCP_PROJECT_ID is not configured."
            return result

        if not settings.BIGQUERY_DATASET:
            result["error_category"] = "MISSING_CONFIG"
            result["message"] = "BIGQUERY_DATASET is not configured."
            return result

        try:
            from google.api_core import exceptions as gcp_exceptions
        except ImportError:
            result["error_category"] = "MISSING_DEPENDENCY"
            result["message"] = "Google Cloud libraries are not installed."
            return result

        try:
            client = self._get_client()
        except Exception:
            result["error_category"] = "AUTHENTICATION_FAILURE"
            result["message"] = (
                "Could not authenticate with Google Cloud. "
                "Ensure Application Default Credentials are configured."
            )
            return result

        # Attempt to access the dataset metadata
        dataset_ref = f"{settings.GCP_PROJECT_ID}.{settings.BIGQUERY_DATASET}"
        try:
            client.get_dataset(dataset_ref)
        except gcp_exceptions.NotFound:
            result["error_category"] = "DATASET_NOT_FOUND"
            result["message"] = (
                f"Dataset '{settings.BIGQUERY_DATASET}' was not found "
                f"in project '{settings.GCP_PROJECT_ID}'."
            )
            return result
        except gcp_exceptions.Forbidden:
            result["error_category"] = "PERMISSION_DENIED"
            result["message"] = (
                "Access denied. The service account does not have "
                "permission to access this dataset."
            )
            return result
        except Exception as e:
            logger.error("Dataset access check failed: %s", type(e).__name__)
            result["error_category"] = "CONNECTION_FAILURE"
            result["message"] = "Could not verify dataset access."
            return result

        # Count tables (metadata only, no row data)
        try:
            tables = list(client.list_tables(dataset_ref))
            result["connected"] = True
            result["metadata_accessible"] = True
            result["table_count"] = len(tables)
            result["message"] = "Connection verified successfully."
        except Exception as e:
            logger.error("Table listing failed: %s", type(e).__name__)
            result["error_category"] = "METADATA_ERROR"
            result["message"] = "Dataset accessible but could not list tables."

        return result

    @property
    def is_available(self) -> bool:
        return self._available


# Module-level singleton
bigquery_service = BigQueryService()
