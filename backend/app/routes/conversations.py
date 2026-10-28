"""Conversation management routes.

GET  /api/conversations              — list all conversations
GET  /api/conversations/{id}         — get conversation with messages
DELETE /api/conversations/{id}       — delete conversation and messages
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from app.models import (
    ConversationListResponse,
    ConversationDetailResponse,
    ConversationSummary,
    MessageOut,
    DeleteResponse,
    ErrorResponse,
)
from app.services.database import DatabaseService

logger = logging.getLogger("enterprise_analytics.routes.conversations")

router = APIRouter(prefix="/api", tags=["Conversations"])


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(request: Request):
    """List all conversations ordered by most recently updated."""
    db: DatabaseService = request.app.state.db
    rows = await db.list_conversations()
    return ConversationListResponse(
        conversations=[
            ConversationSummary(**row) for row in rows
        ]
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_conversation(request: Request, conversation_id: str):
    """Get a conversation with all its messages."""
    db: DatabaseService = request.app.state.db

    conv = await db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "CONVERSATION_NOT_FOUND",
                "message": "Conversation not found.",
            },
        )

    messages = await db.get_messages(conversation_id)

    return ConversationDetailResponse(
        conversation=ConversationSummary(**conv),
        messages=[MessageOut(**m) for m in messages],
    )


@router.delete(
    "/conversations/{conversation_id}",
    response_model=DeleteResponse,
    responses={404: {"model": ErrorResponse}},
)
async def delete_conversation(request: Request, conversation_id: str):
    """Delete a conversation and all its messages."""
    db: DatabaseService = request.app.state.db

    deleted = await db.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "CONVERSATION_NOT_FOUND",
                "message": "Conversation not found.",
            },
        )

    return DeleteResponse(success=True, message="Conversation deleted.")
