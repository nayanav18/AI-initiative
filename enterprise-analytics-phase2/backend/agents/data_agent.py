"""
Data Agent — generates multiple SQL queries from auto-discovered schema
and executes them against BigQuery.
"""
import json
import re
import structlog
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from agents.base_agent import BaseAgent
from services.bigquery_service import run_query
from config import settings

logger = structlog.get_logger()

SQL_GEN_PROMPT = """You are a BigQuery SQL expert.

Generate MULTIPLE SQL queries to comprehensively answer the user question.
Return a JSON object with exactly these keys — each value is a complete SQL string:
{{
  "current_period": "SQL for the main metric for the current or requested period",
  "previous_period": "SQL for same metric for the previous period for variance. If user asks May 2026, previous = April 2026.",
  "by_dimensions": "SQL that breaks down the metric by the most relevant string/categorical columns using GROUP BY. Include metric aggregation. LIMIT 50.",
  "trend": "SQL for monthly/periodic trend of the metric ordered by date ascending. LIMIT 24."
}}

Rules:
- Use fully qualified table names with backticks: `project.dataset.table`
- Return ONLY valid JSON — no markdown, no explanation
- Each SQL must be independently executable
- Numeric columns: use SUM() or COUNT()
- Always include date column in results
- LIMIT 100 on current/previous, LIMIT 50 on dimensions, LIMIT 24 on trend

Schema:
{schema}

User question: {query}"""


class DataAgent(BaseAgent):
    agent_id = "data"
    label    = "Data"

    async def _execute(self, context: dict) -> dict:
        query    = context.get("query", "")
        metadata = context.get("metadata", {})
        tables   = metadata.get("tables", {})

        if not tables:
            logger.warning("No tables in metadata")
            context["data"] = {"source": "synthetic"}
            return context

        # Skip system tables
        skip = {"analytics_logs", "sample", "context"}
        schema_lines = []
        for tname, info in tables.items():
            if tname in skip:
                continue
            schema_lines.append(
                f"Table: {info['full_name']}\n"
                f"  Numeric (metrics): {info.get('numeric_columns', [])}\n"
                f"  Date columns: {info.get('date_columns', [])}\n"
                f"  String (dimensions): {info.get('string_columns', [])}"
            )
        schema_text = "\n\n".join(schema_lines)

        if not schema_text:
            context["data"] = {"source": "synthetic"}
            return context

        sql_queries = {}
        try:
            vertexai.init(
                project=settings.GCP_PROJECT_ID,
                location=settings.GCP_LOCATION
            )
            model = GenerativeModel(model_name=settings.VERTEX_AI_MODEL)
            response = await model.generate_content_async(
                SQL_GEN_PROMPT.format(schema=schema_text, query=query),
                generation_config=GenerationConfig(temperature=0.1, max_output_tokens=2048),
            )
            raw = response.text.strip()
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                sql_queries = json.loads(match.group(0))
            else:
                raw_clean = raw.replace("```json", "").replace("```", "").strip()
                sql_queries = json.loads(raw_clean)
            logger.info("SQL queries generated", keys=list(sql_queries.keys()))
        except Exception as e:
            logger.error("SQL generation failed", error=str(e))
            context["data"] = {"source": "synthetic", "error": str(e)}
            return context

        results = {}
        for key, sql in sql_queries.items():
            if not sql or not isinstance(sql, str):
                continue
            sql = sql.strip().replace("```sql", "").replace("```", "").strip()
            try:
                rows = await run_query(sql)
                results[key] = {"rows": rows, "sql": sql, "row_count": len(rows)}
                logger.info(f"BQ {key} success", row_count=len(rows))
            except Exception as e:
                logger.error(f"BQ {key} failed", error=str(e), sql=sql[:200])
                results[key] = {"rows": [], "sql": sql, "row_count": 0, "error": str(e)}

        current_rows = results.get("current_period", {}).get("rows", [])
        previous_rows = results.get("previous_period", {}).get("rows", [])
        dimension_rows = results.get("by_dimensions", {}).get("rows", [])
        trend_rows = results.get("trend", {}).get("rows", [])

        # Crucial: Populate context keys expected by AnalyticsAgent
        context["schema_text"]   = schema_text
        context["current_data"]  = current_rows
        context["previous_data"] = previous_rows
        context["dimensions_data"] = dimension_rows
        context["trend_data"]    = trend_rows

        context["data"] = {
            "source":      "bigquery",
            "results":     results,
            "sql_queries": sql_queries,
            "rows":        current_rows,
            "sql":         sql_queries.get("current_period", ""),
            "row_count":   len(current_rows),
        }
        logger.info(
            "Data agent complete",
            current_rows=len(current_rows),
            dimension_rows=len(dimension_rows),
            trend_rows=len(trend_rows),
        )
        return context
