"""Conversation agent — integration point for future AI conversation.

In Step 1, this delegates to the deterministic chat_service.
In future milestones, it will use Vertex AI for natural language
understanding and context-aware responses.
"""
import logging

logger = logging.getLogger("enterprise_analytics.agents.conversation")

# TODO: Integrate with Vertex AI in a future milestone.
# This module is intentionally minimal to serve as a clean integration point.
