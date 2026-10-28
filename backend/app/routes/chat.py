"""Chat route — POST /api/chat

Receives a user message, persists it, generates a response using the
deterministic development responder, persists the response, and returns
the result.
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from app.models import ChatRequest, ChatResponse, ErrorResponse
from app.services.database import DatabaseService
from app.services.chat_service import process_message

logger = logging.getLogger("enterprise_analytics.routes.chat")

router = APIRouter(prefix="/api", tags=["Chat"])

# Max message size enforced by Pydantic, but also limit at route level
_MAX_MESSAGE_LENGTH = 10_000


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def chat(request: Request, body: ChatRequest):
    """Process a chat message."""
    db: DatabaseService = request.app.state.db

    message = body.message.strip()
    if not message:
        raise HTTPException(
            status_code=400,
            detail={"error": True, "code": "EMPTY_MESSAGE", "message": "Message cannot be empty."},
        )

    conversation_id = body.conversation_id

    # Create new conversation if needed
    if not conversation_id:
        title = message[:50] + ("…" if len(message) > 50 else "")
        conversation_id = await db.create_conversation(title=title)
    else:
        # Verify conversation exists
        conv = await db.get_conversation(conversation_id)
        if not conv:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": True,
                    "code": "CONVERSATION_NOT_FOUND",
                    "message": "The specified conversation does not exist.",
                },
            )

    # Save user message
    await db.add_message(
        conversation_id=conversation_id,
        role="user",
        content=message,
        intent="user_input",
    )

    # Generate response (deterministic dev responder)
    reply_text, intent = process_message(message)

    # Save assistant response
    msg_id = await db.add_message(
        conversation_id=conversation_id,
        role="assistant",
        content=reply_text,
        intent=intent,
    )

    # Update conversation timestamp
    await db.update_conversation_timestamp(conversation_id)

    logger.info("Chat processed: conv=%s intent=%s", conversation_id[:8], intent)

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=msg_id,
        reply=reply_text,
        intent=intent,
    )
