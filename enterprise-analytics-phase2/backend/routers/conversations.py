"""
conversations.py — Conversation history endpoints.
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import structlog

from services.memory_service import (
    load_conversations,
    load_messages,
    create_conversation,
    update_conversation_title,
)

router = APIRouter(prefix="/api/v1", tags=["conversations"])
logger = structlog.get_logger()


@router.get("/conversations")
async def get_conversations(
    user_id: str = Query(..., description="User UUID"),
    limit: int = Query(default=50, le=200),
):
    """Return all conversations for a user, grouped by date."""
    convs = await load_conversations(user_id=user_id, limit=limit)
    # Group by date for frontend display
    from collections import defaultdict
    from datetime import datetime, timezone
    grouped = defaultdict(list)
    now = datetime.now(timezone.utc)
    for conv in convs:
        ts = conv.get("updated_at")
        if hasattr(ts, "date"):
            d = ts.date()
            today = now.date()
            delta = (today - d).days
            if delta == 0:
                group = "Today"
            elif delta == 1:
                group = "Yesterday"
            elif delta <= 7:
                group = "This Week"
            else:
                group = "Older"
        else:
            group = "Older"
        grouped[group].append(conv)
    return JSONResponse(content={
        "groups": dict(grouped),
        "total": len(convs),
    })


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = Query(default=20, le=100),
):
    """Return messages for a conversation."""
    msgs = await load_messages(conversation_id=conversation_id, limit=limit)
    return JSONResponse(content={"messages": msgs, "count": len(msgs)})


@router.post("/conversations")
async def new_conversation(
    user_id: str = Query(...),
    persona_id: str = Query(default="analyst"),
    dataset_id: str = Query(default="ireland"),
    title: str = Query(default="New Conversation"),
):
    """Explicitly create a new conversation."""
    conv_id = await create_conversation(
        user_id=user_id,
        persona_id=persona_id,
        dataset_id=dataset_id,
        title=title,
    )
    return JSONResponse(content={"conversation_id": conv_id})
