"""Pydantic request/response models.

Centralizes validation for chat, conversation, and system endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    """Incoming chat message."""
    message: str = Field(..., min_length=1, max_length=10_000)
    conversation_id: Optional[str] = Field(None, max_length=36)


class ChatResponse(BaseModel):
    """Response returned after processing a message."""
    conversation_id: str
    message_id: str
    reply: str
    intent: str = "general"


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------
class ConversationSummary(BaseModel):
    """Compact conversation for the sidebar list."""
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class MessageOut(BaseModel):
    """Single message in a conversation."""
    id: str
    conversation_id: str
    role: str
    content: str
    intent: Optional[str] = None
    created_at: str


class ConversationListResponse(BaseModel):
    conversations: List[ConversationSummary]


class ConversationDetailResponse(BaseModel):
    conversation: ConversationSummary
    messages: List[MessageOut]


class DeleteResponse(BaseModel):
    success: bool
    message: str


# ---------------------------------------------------------------------------
# System / BigQuery status
# ---------------------------------------------------------------------------
class BigQueryStatusResponse(BaseModel):
    """Sanitized BigQuery connection status."""
    connected: bool
    project: Optional[str] = None
    dataset: Optional[str] = None
    metadata_accessible: Optional[bool] = None
    table_count: Optional[int] = None
    error_category: Optional[str] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------
class ErrorResponse(BaseModel):
    """Structured error envelope."""
    error: bool = True
    code: str
    message: str
