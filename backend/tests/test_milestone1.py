"""Automated validation suite for Step 1 Milestone.

Tests backend functionality, endpoints, error responses, database persistence,
and security constraints.
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.services.database import DatabaseService
from app.services.chat_service import process_message
from app.services.bigquery import bigquery_service


async def test_database_persistence():
    print("--- [TEST] Database Persistence & Foreign Key Cascade ---")
    test_db_path = str(Path(__file__).parent / "test_conversations.db")
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    db = DatabaseService(test_db_path)
    await db.initialize()

    # 1. Create conversation
    conv_id = await db.create_conversation("Test Conversation Title")
    assert conv_id is not None, "Failed to create conversation"

    # 2. Add user message
    user_msg_id = await db.add_message(conv_id, "user", "Hello there!", "greeting")
    assert user_msg_id is not None, "Failed to add user message"

    # 3. Add assistant message
    asst_msg_id = await db.add_message(conv_id, "assistant", "Hello! How can I help?", "greeting")
    assert asst_msg_id is not None, "Failed to add assistant message"

    # 4. Retrieve conversation
    conv = await db.get_conversation(conv_id)
    assert conv is not None, "Failed to retrieve conversation"
    assert conv["title"] == "Test Conversation Title"
    assert conv["message_count"] == 2

    # 5. Retrieve messages
    messages = await db.get_messages(conv_id)
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Hello there!"
    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == "Hello! How can I help?"

    # 6. Test delete cascade
    deleted = await db.delete_conversation(conv_id)
    assert deleted is True, "Failed to delete conversation"
    conv_after = await db.get_conversation(conv_id)
    assert conv_after is None, "Conversation was not deleted"
    msgs_after = await db.get_messages(conv_id)
    assert len(msgs_after) == 0, "Messages were not cascade-deleted"

    await db.close()
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    print("[PASS] Database Persistence & Cascading Deletion PASSED")


async def test_chat_service():
    print("--- [TEST] Chat Service (Deterministic Dev Responder) ---")
    # Greetings
    reply, intent = process_message("Hello there")
    assert intent == "greeting"
    assert "Enterprise Analytics Assistant" in reply

    # Help
    reply, intent = process_message("What can you do?")
    assert intent == "help"
    assert "Data Exploration" in reply

    # Explanation
    reply, intent = process_message("Explain what an analytics assistant does")
    assert intent == "explanation"
    assert "BigQuery" in reply

    # Thanks
    reply, intent = process_message("Thank you very much")
    assert intent == "thanks"
    assert "welcome" in reply.lower()

    # General
    reply, intent = process_message("Something completely random")
    assert intent == "general"
    print("[PASS] Chat Service Deterministic Responders PASSED")


async def test_bigquery_diagnostic_safety():
    print("--- [TEST] BigQuery Diagnostic Safety & Data Minimization ---")
    result = await bigquery_service.check_connection()
    # Ensure no rows, queries, or credentials leaked
    assert "rows" not in result, "Security violation: rows leaked in BigQuery status"
    assert "sql" not in result, "Security violation: sql leaked in BigQuery status"
    assert "credentials" not in result, "Security violation: credentials leaked in BigQuery status"
    assert "SECRET_KEY" not in str(result), "Security violation: secret leaked"
    print(f"BigQuery Connection Result: connected={result.get('connected')}, error_category={result.get('error_category')}")
    print("[PASS] BigQuery Diagnostic Safety Check PASSED")


def test_security_rules():
    print("--- [TEST] Security Rules & Git Ignore ---")
    # Check .gitignore exists and ignores .env and *.db
    gitignore_path = Path(__file__).parent.parent.parent / ".gitignore"
    assert gitignore_path.exists(), ".gitignore file missing"
    content = gitignore_path.read_text(encoding="utf-8")
    assert ".env" in content, ".gitignore must ignore .env"
    assert "*.db" in content or "data/*.db" in content, ".gitignore must ignore *.db"

    # Check .env.example contains no actual secrets
    env_example = (Path(__file__).parent.parent / ".env.example").read_text(encoding="utf-8")
    assert "your-gcp-project-id" in env_example
    assert "change-this-to-a-secure-random-string" in env_example
    print("[PASS] Security Rules & Repository Hygiene PASSED")


async def run_all():
    print("==================================================")
    print("RUNNING ENTERPRISE ANALYTICS AI STEP 1 TESTS")
    print("==================================================")
    await test_database_persistence()
    await test_chat_service()
    await test_bigquery_diagnostic_safety()
    test_security_rules()
    print("==================================================")
    print("ALL TEST SUITES PASSED SUCCESSFULLY")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_all())
