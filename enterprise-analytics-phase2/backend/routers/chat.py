"""
chat.py — Phase 2 chat router.
Works with Phase 1 orchestrator's run_pipeline() function.
Copy to: backend/routers/chat.py

Key fixes:
 - Uses run_pipeline() not Orchestrator class
 - make_serializable() handles datetime → string
 - Guardrail check returns clarification before pipeline
 - Memory save is non-blocking (won't crash if BQ tables missing)
 - run_pipeline called with only the args it accepts
"""
import uuid
import json
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import structlog

from models.schemas import ChatRequest, ClarificationResponse
from agents.orchestrator import run_pipeline
from services.guardrail_service import check as guardrail_check

# Memory service imports — wrapped in try/except so Phase 1 still works
# even if Phase 2 BQ tables don't exist yet
try:
    from services.memory_service import (
        create_conversation,
        save_message,
        load_messages,
        build_context_string,
        upsert_user,
    )
    MEMORY_ENABLED = True
except Exception:
    MEMORY_ENABLED = False

router = APIRouter(prefix="/api/v1", tags=["chat"])
logger = structlog.get_logger()


def make_serializable(obj):
    """Recursively convert datetime and other non-JSON types to strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    return obj


@router.post("/chat")
async def chat(request: ChatRequest):
    user_id    = getattr(request, "user_id", None) or f"user_{uuid.uuid4().hex[:8]}"
    persona_id = getattr(request, "persona_id", None) or "analyst"
    conv_id    = request.conversation_id
    query      = request.query.strip()
    dataset_id = request.dataset_id or "ireland"

    logger.info("Chat request", user_id=user_id,
                persona_id=persona_id, query=query[:80])

    # ── 1. Register user in BQ (non-blocking) ─────────────────────────
    if MEMORY_ENABLED:
        try:
            await upsert_user(user_id=user_id, persona_id=persona_id)
        except Exception as e:
            logger.warning("upsert_user failed", error=str(e)[:60])

    # ── 2. Guardrail check ─────────────────────────────────────────────
    try:
        gr = guardrail_check(query=query)
        if not gr.passed:
            if gr.action == "clarify":
                return JSONResponse(content={
                    "is_clarification_needed": True,
                    "clarification_question": gr.message or "Could you clarify?",
                    "matching_columns": [
                        {"column": o.column, "description": o.description}
                        for o in (gr.options or [])
                    ],
                    "original_query": query,
                    "user_id": user_id,
                    "persona_id": persona_id,
                })
            else:
                return JSONResponse(content={
                    "is_clarification_needed": False,
                    "guardrail_message": gr.message,
                    "action": gr.action,
                    "query": query,
                    "user_id": user_id,
                })
    except Exception as e:
        logger.warning("Guardrail error (non-blocking)", error=str(e)[:60])

    # ── 3. Auto-create conversation (non-blocking) ─────────────────────
    is_new_conv = False
    if not conv_id:
        if MEMORY_ENABLED:
            try:
                title = query[:80] + ("..." if len(query) > 80 else "")
                conv_id = await create_conversation(
                    user_id=user_id,
                    persona_id=persona_id,
                    dataset_id=dataset_id,
                    title=title,
                )
                is_new_conv = True
            except Exception as e:
                logger.warning("create_conversation failed", error=str(e)[:60])
                conv_id = str(uuid.uuid4())
        else:
            conv_id = str(uuid.uuid4())

    # ── 4. Load conversation history for context (non-blocking) ────────
    history_context = ""
    if MEMORY_ENABLED:
        try:
            if not is_new_conv and conv_id:
                messages = await load_messages(conversation_id=conv_id, limit=10)
                history_context = build_context_string(messages, max_chars=2000)
        except Exception as e:
            logger.warning("load_messages failed", error=str(e)[:60])

    # ── 5. Run Phase 1 pipeline ────────────────────────────────────────
    # IMPORTANT: run_pipeline only accepts these 4 keyword args.
    # Do NOT pass user_id, persona_id, history_context — it will TypeError.
    try:
        result = await run_pipeline(
            query=query,
            dataset_id=dataset_id,
            conversation_id=conv_id,
            history=[m.model_dump() for m in request.history] if request.history else [],
        )
    except Exception as e:
        logger.error("Pipeline failed", error=str(e)[:150])
        return JSONResponse(status_code=500, content={
            "error": "Analytics pipeline error. Please try again.",
            "detail": str(e)[:200],
            "user_id": user_id,
            "persona_id": persona_id,
            "conversation_id": conv_id,
        })

    # ── 6. Serialize result (handle datetime objects) ──────────────────
    try:
        if hasattr(result, "model_dump"):
            result_dict = result.model_dump()
        elif isinstance(result, dict):
            result_dict = result
        else:
            result_dict = dict(result)

        # Convert ALL datetime objects recursively
        result_dict = make_serializable(result_dict)

    except Exception as e:
        logger.error("Serialization failed", error=str(e)[:80])
        result_dict = {
            "error": "Response serialization failed",
            "detail": str(e)[:100],
        }

    # ── 7. Save messages to BQ (non-blocking) ─────────────────────────
    if MEMORY_ENABLED:
        try:
            await save_message(conv_id, user_id, "user", query,
                               {"text": query})
            await save_message(conv_id, user_id, "assistant", query,
                               result_dict)
        except Exception as e:
            logger.warning("Message save failed", error=str(e)[:60])

    # ── 8. Add Phase 2 fields and return ──────────────────────────────
    result_dict["user_id"]         = user_id
    result_dict["persona_id"]      = persona_id
    result_dict["conversation_id"] = conv_id

    return JSONResponse(content=result_dict)
