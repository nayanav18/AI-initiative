"""Insights router — save and retrieve analytics insights."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from typing import List
import structlog

from models.schemas import SaveInsightRequest, InsightSummary, AnalyticsResponse

router = APIRouter(tags=["insights"])
logger = structlog.get_logger()

# In-memory store (replace with Firestore / Cloud SQL in production)
_insights: dict[str, dict] = {}


@router.post("/insights", response_model=InsightSummary)
async def save_insight(request: SaveInsightRequest) -> InsightSummary:
    insight_id = str(uuid.uuid4())
    record = {
        "id": insight_id,
        "query": request.query,
        "dataset": request.analytics.dataset,
        "what_happened": request.analytics.what_happened,
        "kpis": [k.model_dump() for k in request.analytics.kpis],
        "analytics": request.analytics.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    _insights[insight_id] = record
    logger.info("Insight saved", id=insight_id, dataset=request.dataset_id)
    return InsightSummary(**{k: v for k, v in record.items() if k != "analytics"})


@router.get("/insights", response_model=List[InsightSummary])
async def list_insights() -> List[InsightSummary]:
    items = sorted(_insights.values(), key=lambda x: x["created_at"], reverse=True)
    return [InsightSummary(**{k: v for k, v in i.items() if k != "analytics"}) for i in items]


@router.get("/insights/{insight_id}", response_model=AnalyticsResponse)
async def get_insight(insight_id: str) -> AnalyticsResponse:
    if insight_id not in _insights:
        raise HTTPException(status_code=404, detail="Insight not found")
    return AnalyticsResponse(**_insights[insight_id]["analytics"])


@router.delete("/insights/{insight_id}", status_code=204)
async def delete_insight(insight_id: str):
    if insight_id not in _insights:
        raise HTTPException(status_code=404, detail="Insight not found")
    del _insights[insight_id]
