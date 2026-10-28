"""Router agent — integration point for future intent classification.

In Step 1, this module is a placeholder that classifies all messages
as 'general' conversation. It will later be extended to route messages
to specialized agents (analytics, dashboard, RAG, etc.).
"""
import logging
from typing import Tuple

logger = logging.getLogger("enterprise_analytics.agents.router")


def classify_intent(message: str) -> Tuple[str, float]:
    """Classify the intent of a user message.

    Returns:
        Tuple of (intent_label, confidence_score).

    In Step 1, all messages are classified as 'general'.
    Future milestones will add intent classification via Vertex AI.
    """
    # TODO: Replace with Vertex AI intent classification
    return ("general", 1.0)
