"""
memory_service.py — BigQuery persistent conversation memory.
Copy to: backend/services/memory_service.py

Creates tables automatically on first use.
All functions fail silently — app works even without BQ tables.
"""
import uuid
import json
import structlog
from datetime import datetime

logger = structlog.get_logger()

# ── Try to import BQ — fail silently if not available ─────────────────────
try:
    from google.cloud import bigquery
    from config import settings

    PROJECT  = settings.GCP_PROJECT_ID
    DATASET  = settings.BIGQUERY_DATASET
    BQ_USERS = f"`{PROJECT}.{DATASET}.analytics_users`"
    BQ_CONVS = f"`{PROJECT}.{DATASET}.analytics_conversations`"
    BQ_MSGS  = f"`{PROJECT}.{DATASET}.analytics_messages`"
    BQ_ENABLED = True

    def _client():
        return bigquery.Client(project=PROJECT)

except Exception as e:
    BQ_ENABLED = False
    logger.warning("BQ memory service disabled", error=str(e)[:80])


async def ensure_tables_exist():
    """Create all memory tables if they don't exist. Call on startup."""
    if not BQ_ENABLED:
        return
    ddl_statements = [
        f"""CREATE TABLE IF NOT EXISTS {BQ_USERS} (
            user_id STRING NOT NULL,
            persona_id STRING DEFAULT 'analyst',
            display_name STRING,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
        )""",
        f"""CREATE TABLE IF NOT EXISTS {BQ_CONVS} (
            conversation_id STRING NOT NULL,
            user_id STRING NOT NULL,
            persona_id STRING DEFAULT 'analyst',
            dataset_id STRING DEFAULT 'ireland',
            title STRING,
            message_count INT64 DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
        )""",
        f"""CREATE TABLE IF NOT EXISTS {BQ_MSGS} (
            message_id STRING NOT NULL,
            conversation_id STRING NOT NULL,
            user_id STRING NOT NULL,
            role STRING NOT NULL,
            query STRING,
            content JSON,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
        )""",
    ]
    client = _client()
    for sql in ddl_statements:
        try:
            client.query(sql).result()
        except Exception as e:
            logger.warning("Table create skipped", error=str(e)[:80])
    logger.info("Memory tables ready")


async def upsert_user(user_id: str, persona_id: str = "analyst") -> None:
    """Register or update user. Silent fail if BQ unavailable."""
    if not BQ_ENABLED:
        return
    try:
        client = _client()
        sql = f"""
        MERGE {BQ_USERS} T
        USING (SELECT @uid AS user_id, @pid AS persona_id) S
        ON T.user_id = S.user_id
        WHEN MATCHED THEN
          UPDATE SET persona_id = S.persona_id,
                     last_active = CURRENT_TIMESTAMP()
        WHEN NOT MATCHED THEN
          INSERT (user_id, persona_id, created_at, last_active)
          VALUES (S.user_id, S.persona_id,
                  CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        """
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("uid", "STRING", user_id),
            bigquery.ScalarQueryParameter("pid", "STRING", persona_id),
        ])
        client.query(sql, job_config=cfg).result()
    except Exception as e:
        logger.warning("upsert_user failed", error=str(e)[:80])


async def get_user_persona(user_id: str) -> str:
    """Return stored persona_id for a user. Defaults to 'analyst'."""
    if not BQ_ENABLED:
        return "analyst"
    try:
        client = _client()
        sql = f"SELECT persona_id FROM {BQ_USERS} WHERE user_id = @uid LIMIT 1"
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("uid", "STRING", user_id)
        ])
        rows = list(client.query(sql, job_config=cfg).result())
        return rows[0]["persona_id"] if rows else "analyst"
    except Exception:
        return "analyst"


async def create_conversation(
    user_id: str,
    persona_id: str = "analyst",
    dataset_id: str = "ireland",
    title: str = "New Conversation",
) -> str:
    """Create conversation row. Returns conversation_id."""
    conv_id = str(uuid.uuid4())
    if not BQ_ENABLED:
        return conv_id
    try:
        client = _client()
        sql = f"""
        INSERT INTO {BQ_CONVS}
          (conversation_id, user_id, persona_id, dataset_id,
           title, message_count, created_at, updated_at)
        VALUES
          (@cid, @uid, @pid, @did, @title, 0,
           CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
        """
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("cid",   "STRING", conv_id),
            bigquery.ScalarQueryParameter("uid",   "STRING", user_id),
            bigquery.ScalarQueryParameter("pid",   "STRING", persona_id),
            bigquery.ScalarQueryParameter("did",   "STRING", dataset_id),
            bigquery.ScalarQueryParameter("title", "STRING", title[:120]),
        ])
        client.query(sql, job_config=cfg).result()
        logger.info("Conversation created", conv_id=conv_id)
    except Exception as e:
        logger.warning("create_conversation failed", error=str(e)[:80])
    return conv_id


async def load_conversations(user_id: str, limit: int = 50) -> list:
    """Return conversations for a user, newest first."""
    if not BQ_ENABLED:
        return []
    try:
        client = _client()
        sql = f"""
        SELECT conversation_id, user_id, persona_id, dataset_id,
               title, message_count, created_at, updated_at
        FROM {BQ_CONVS}
        WHERE user_id = @uid
        ORDER BY updated_at DESC
        LIMIT @lim
        """
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("uid", "STRING", user_id),
            bigquery.ScalarQueryParameter("lim", "INT64",  limit),
        ])
        rows = list(client.query(sql, job_config=cfg).result())
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning("load_conversations failed", error=str(e)[:80])
        return []


async def save_message(
    conversation_id: str,
    user_id: str,
    role: str,
    query: str,
    content: dict = None,
) -> str:
    """Save one chat message to BQ. Silent fail."""
    msg_id = str(uuid.uuid4())
    if not BQ_ENABLED:
        return msg_id
    try:
        client = _client()
        content_json = json.dumps(content or {})
        sql = f"""
        INSERT INTO {BQ_MSGS}
          (message_id, conversation_id, user_id, role, query,
           content, generated_at)
        VALUES
          (@mid, @cid, @uid, @role, @query,
           PARSE_JSON(@content), CURRENT_TIMESTAMP())
        """
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("mid",     "STRING", msg_id),
            bigquery.ScalarQueryParameter("cid",     "STRING", conversation_id),
            bigquery.ScalarQueryParameter("uid",     "STRING", user_id),
            bigquery.ScalarQueryParameter("role",    "STRING", role),
            bigquery.ScalarQueryParameter("query",   "STRING", query[:2000]),
            bigquery.ScalarQueryParameter("content", "STRING", content_json),
        ])
        client.query(sql, job_config=cfg).result()
        # Increment message count
        upd = f"""
        UPDATE {BQ_CONVS}
        SET message_count = message_count + 1,
            updated_at = CURRENT_TIMESTAMP()
        WHERE conversation_id = @cid
        """
        ucfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("cid", "STRING", conversation_id)
        ])
        client.query(upd, job_config=ucfg).result()
    except Exception as e:
        logger.warning("save_message failed", error=str(e)[:80])
    return msg_id


async def load_messages(conversation_id: str, limit: int = 20) -> list:
    """Load messages for a conversation in chronological order."""
    if not BQ_ENABLED:
        return []
    try:
        client = _client()
        sql = f"""
        SELECT message_id, conversation_id, user_id, role, query,
               TO_JSON_STRING(content) AS content_json, generated_at
        FROM {BQ_MSGS}
        WHERE conversation_id = @cid
        ORDER BY generated_at DESC
        LIMIT @lim
        """
        cfg = bigquery.QueryJobConfig(query_parameters=[
            bigquery.ScalarQueryParameter("cid", "STRING", conversation_id),
            bigquery.ScalarQueryParameter("lim", "INT64",  limit),
        ])
        rows = list(client.query(sql, job_config=cfg).result())
        msgs = []
        for r in reversed(rows):   # chronological order
            msgs.append({
                "message_id":      r["message_id"],
                "conversation_id": r["conversation_id"],
                "user_id":         r["user_id"],
                "role":            r["role"],
                "query":           r["query"],
                "content":         json.loads(r["content_json"] or "{}"),
                "generated_at":    str(r["generated_at"]),
            })
        return msgs
    except Exception as e:
        logger.warning("load_messages failed", error=str(e)[:80])
        return []


def build_context_string(messages: list, max_chars: int = 2000) -> str:
    """Build compact context string from conversation history."""
    if not messages:
        return ""
    lines = ["PREVIOUS CONVERSATION CONTEXT:"]
    total = 0
    for msg in reversed(messages[-10:]):
        prefix = "User" if msg["role"] == "user" else "AI"
        line = f"  {prefix}: {msg['query'][:200]}"
        if total + len(line) > max_chars:
            break
        lines.append(line)
        total += len(line)
    lines.append("Use this context if the user references previous queries.")
    return "\n".join(lines)
