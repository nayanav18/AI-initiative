"""
insights_router.py — Saved insights endpoints (Phase 2 — BQ-backed).
"""
from fastapi import APIRouter, Query, Body
from fastapi.responses import JSONResponse
import structlog

from services.insights_service import (
    save_insight, get_insights, patch_insight, delete_insight
)
# Invalidate dashboard story cache when insight saved
from routers.dashboard_router import invalidate_story_cache

router = APIRouter(prefix="/api/v1", tags=["insights"])
logger = structlog.get_logger()


@router.post("/insights")
async def create_insight(body: dict = Body(...)):
    """
    Save a new insight to BigQuery.
    Body: {user_id, persona_id, title, query, dataset_id, analytics_response, tags?}
    """
    iid = await save_insight(
        user_id=body.get("user_id", "anonymous"),
        persona_id=body.get("persona_id", "analyst"),
        title=body.get("title", "Untitled Insight"),
        query=body.get("query", ""),
        dataset_id=body.get("dataset_id", "ireland"),
        analytics_response=body.get("analytics_response", {}),
        tags=body.get("tags", []),
    )
    # Invalidate story cache so dashboard regenerates on next load
    await invalidate_story_cache(body.get("user_id", ""), body.get("persona_id", "analyst"))

    return JSONResponse(content={"insight_id": iid, "status": "saved"})


@router.get("/insights")
async def list_insights(
    user_id: str = Query(...),
    limit: int = Query(default=50, le=200),
    search: str = Query(default=""),
    tag: str = Query(default=""),
    pinned_only: bool = Query(default=False),
):
    """Return insights for a user with optional filters."""
    insights = await get_insights(
        user_id=user_id,
        limit=limit,
        search=search,
        tag_filter=tag,
        pinned_only=pinned_only,
    )
    pinned = [i for i in insights if i.get("is_pinned")]
    return JSONResponse(content={
        "insights": insights,
        "total": len(insights),
        "pinned_count": len(pinned),
    })


@router.patch("/insights/{insight_id}")
async def update_insight(
    insight_id: str,
    user_id: str = Query(...),
    body: dict = Body(default={}),
):
    """Update tags, is_pinned, or title on an insight."""
    ok = await patch_insight(insight_id, user_id, **body)
    return JSONResponse(content={"updated": ok})


@router.delete("/insights/{insight_id}")
async def remove_insight(
    insight_id: str,
    user_id: str = Query(...),
):
    """Delete an insight."""
    ok = await delete_insight(insight_id, user_id)
    return JSONResponse(content={"deleted": ok})
