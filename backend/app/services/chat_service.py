"""Deterministic development chat responder.

This is a clearly labelled placeholder that provides basic conversational
responses. It is NOT a production AI model and is NOT Gemini.

It will be replaced by an intent router + Vertex AI service in a later
milestone. The interface (process_message) is designed to be a clean
drop-in point for future AI integration.
"""
import logging
import re
from typing import Tuple

logger = logging.getLogger("enterprise_analytics.chat_service")

# ---------------------------------------------------------------------------
# Intent keywords → (intent_label, response)
# ---------------------------------------------------------------------------
_GREETING_REGEX = re.compile(r"\b(hello|hi|hey|howdy|greetings|good\s+morning|good\s+afternoon|good\s+evening)\b", re.IGNORECASE)
_THANKS_REGEX = re.compile(r"\b(thank|thanks|cheers|appreciate)\b", re.IGNORECASE)
_HELP_REGEX = re.compile(r"\b(help|what can you do|capabilities|features)\b", re.IGNORECASE)

_SUGGESTED_QUESTIONS = [
    "What can you do?",
    "Explain what an analytics assistant does.",
    "Tell me about the data pipeline.",
    "What datasets are available?",
]


def process_message(message: str) -> Tuple[str, str]:
    """Process a user message and return (reply, intent).

    This is the integration point where a future AI service will plug in.
    Returns a tuple of (reply_text, intent_label).
    """
    msg = message.strip()
    msg_lower = msg.lower()

    # Greeting
    if _GREETING_REGEX.search(msg_lower):
        return (
            "Hello! 👋 I'm the Enterprise Analytics Assistant — a development "
            "preview. I can answer basic conversational messages right now. "
            "Full analytics capabilities including data exploration and AI-powered "
            "insights will be available in upcoming milestones.\n\n"
            "Try asking: *What can you do?*",
            "greeting",
        )

    # Thanks
    if _THANKS_REGEX.search(msg_lower):
        return (
            "You're welcome! Feel free to ask anything else. "
            "I'm here to help. 😊",
            "thanks",
        )

    # Help / capabilities
    if _HELP_REGEX.search(msg_lower):
        return (
            "I'm an Enterprise Analytics Assistant (development preview). "
            "Here's what's planned:\n\n"
            "📊 **Data Exploration** — browse datasets and table schemas\n"
            "🔍 **Natural Language Analytics** — ask questions in plain English\n"
            "📈 **AI-Powered Insights** — automated trend detection\n"
            "📋 **Dashboard Builder** — create and share visual reports\n\n"
            "In this milestone I can handle basic conversation. "
            "Analytics features are coming in future steps.",
            "help",
        )

    # Explain analytics assistant
    if "explain" in msg_lower and "analytics" in msg_lower:
        return (
            "An analytics assistant is a conversational AI that sits on top "
            "of your enterprise data warehouse. Instead of writing SQL queries "
            "or building reports manually, you describe what you want to know "
            "in plain English and the assistant translates that into secure, "
            "read-only queries, summarises the results, and optionally "
            "generates charts.\n\n"
            "This application connects to Google BigQuery for data and will "
            "use Vertex AI (Gemini) for natural language understanding in a "
            "future milestone.",
            "explanation",
        )

    # Datasets
    if "dataset" in msg_lower or "table" in msg_lower or "data" in msg_lower:
        return (
            "Dataset exploration is planned for an upcoming milestone. "
            "The application is configured to connect to a BigQuery dataset. "
            "You can check the connection status via the system diagnostics.\n\n"
            "Once analytics is enabled, you'll be able to browse tables, "
            "view schemas, and ask questions about your data.",
            "data_inquiry",
        )

    # Dashboard
    if "dashboard" in msg_lower or "chart" in msg_lower or "report" in msg_lower:
        return (
            "Dashboard and chart capabilities are planned for a future "
            "milestone. The application architecture is ready to support "
            "dynamic visualizations, but they aren't implemented yet.\n\n"
            "For now, I can help with basic conversational questions.",
            "dashboard_inquiry",
        )

    # Default fallback
    return (
        "Thanks for your message! I'm the Enterprise Analytics Assistant "
        "in development preview mode. I can handle basic conversation, "
        "but full analytics capabilities are coming soon.\n\n"
        "Here are some things you can ask:\n"
        "• *What can you do?*\n"
        "• *Explain what an analytics assistant does.*\n"
        "• *Hello!*",
        "general",
    )


def get_suggested_questions():
    """Return suggested starter questions for the UI."""
    return list(_SUGGESTED_QUESTIONS)
