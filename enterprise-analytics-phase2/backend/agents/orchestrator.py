"""
Agent Orchestrator — runs full pipeline and returns typed AnalyticsResponse.
Includes summary_bullets and suggested_questions in response.
"""
import time
import uuid
from datetime import datetime, timezone
import structlog
from agents.planner_agent import PlannerAgent
from agents.metadata_agent import MetadataAgent
from agents.data_agent import DataAgent
from agents.analytics_agent import AnalyticsAgent
from services.logging_service import log_analytics_request
from models.schemas import (
    AnalyticsResponse, AgentStep, KPI, RootCause, Recommendation,
    Risk, Chart, ChartDataPoint, MarketAnalysis,
    CompetitorAnalysis, CompetitorItem,
)

logger = structlog.get_logger()
DATASETS = {
    "ireland":  "Vodafone Ireland",
    "mi":       "MI Constellation",
    "germany":  "Germany Constellation",
    "uk":       "UK Constellation",
    "finance":  "Finance Analytics",
    "customer": "Customer Analytics",
}


async def run_pipeline(
    query: str,
    dataset_id: str,
    conversation_id: str | None,
    history: list[dict],
) -> AnalyticsResponse:
    """Execute all agents sequentially and return typed AnalyticsResponse."""
    conv_id       = conversation_id or str(uuid.uuid4())
    dataset_label = DATASETS.get(dataset_id, dataset_id)
    start_time    = time.monotonic()

    context = {
        "query":           query,
        "dataset_id":      dataset_id,
        "dataset_label":   dataset_label,
        "history":         history,
        "conversation_id": conv_id,
        "_agent_steps":    [],
    }

    pipeline = [PlannerAgent(), MetadataAgent(), DataAgent(), AnalyticsAgent()]
    status        = "success"
    error_message = None

    try:
        for agent in pipeline:
            context = await agent.run(context)
    except Exception as e:
        status        = "error"
        error_message = str(e)
        logger.error("Pipeline failed", error=str(e))

    execution_time_ms = int((time.monotonic() - start_time) * 1000)
    raw          = context.get("analytics_result", {})
    agent_steps  = context.get("_agent_steps", [])
    data_context = context.get("data", {})

    # Log generated SQL to terminal
    if data_context.get("sql"):
        logger.info(
            "GENERATED SQL",
            sql=data_context["sql"],
            row_count=data_context.get("row_count", 0),
        )

    # Log full request to BigQuery (non-blocking)
    try:
        await log_analytics_request(
            user_query=query,
            dataset_id=dataset_id,
            generated_sql=data_context.get("sql", ""),
            bq_rows=data_context.get("rows", []),
            ai_response=raw,
            agent_steps=agent_steps,
            execution_time_ms=execution_time_ms,
            session_id=conv_id,
            status=status,
            error_message=error_message,
        )
    except Exception as e:
        logger.warning("Logging to BQ failed (non-blocking)", error=str(e)[:60])

    # ── Parse each section safely ────────────────────────────────────────────
    def safe_parse(cls, items):
        result = []
        for item in (items or []):
            if not isinstance(item, dict):
                continue
            try:
                # Handle root cause alias keys
                if cls == RootCause:
                    if "confidence" not in item and "confidence_pct" in item:
                        item["confidence"] = item["confidence_pct"]
                    if "impact" not in item and "impact_pct" in item:
                        item["impact"] = "High" if "high" in str(item["impact_pct"]).lower() else "Medium"
                # Handle recommendation alias keys
                elif cls == Recommendation:
                    if "detail" not in item:
                        item["detail"] = item.get("action", "")
                result.append(cls(**item))
            except Exception as e:
                logger.warning(f"Parse error for {cls.__name__}", error=str(e))
        return result

    kpis            = safe_parse(KPI,            raw.get("kpis",            []))
    root_causes     = safe_parse(RootCause,      raw.get("root_causes",     []))
    recommendations = safe_parse(Recommendation, raw.get("recommendations", []))
    risks           = safe_parse(Risk,           raw.get("risks",           []))

    # Chart
    chart = None
    try:
        if raw.get("chart") and isinstance(raw["chart"], dict) and raw["chart"].get("data"):
            chart = Chart(
                type=raw["chart"].get("type", "line"),
                title=raw["chart"].get("title", ""),
                data=[ChartDataPoint(**p) for p in raw["chart"]["data"] if isinstance(p, dict)],
            )
    except Exception as e:
        logger.error("Chart parse error", error=str(e))

    # Market analysis — supports both dict and list
    market_analysis = None
    try:
        raw_ma = raw.get("market_analysis")
        if isinstance(raw_ma, dict):
            market_analysis = MarketAnalysis(**raw_ma)
        elif isinstance(raw_ma, list) and len(raw_ma) > 0:
            text = " ".join(item.get("text", "") for item in raw_ma if isinstance(item, dict))
            market_analysis = MarketAnalysis(
                market_position=text or "Vodafone Ireland market leadership",
                market_trends=["5G network rollout", "Converged broadband bundles"],
                growth_outlook="Stable growth in mobile postpay",
            )
    except Exception as e:
        logger.error("Market analysis parse error", error=str(e))

    # Competitor analysis — supports both dict and list
    competitor_analysis = None
    try:
        raw_ca = raw.get("competitor_analysis")
        if isinstance(raw_ca, dict):
            competitors_list = []
            for c in raw_ca.get("competitors", []):
                if isinstance(c, dict):
                    competitors_list.append(CompetitorItem(
                        name=c.get("name") or c.get("operator", "Competitor"),
                        position=c.get("position", ""),
                        threat_level=c.get("threat_level", "Medium"),
                        insight=c.get("insight") or c.get("detail", ""),
                    ))
            competitor_analysis = CompetitorAnalysis(
                competitive_landscape=raw_ca.get("competitive_landscape", ""),
                competitors=competitors_list,
                competitive_advantage=raw_ca.get("competitive_advantage", ""),
                competitive_risk=raw_ca.get("competitive_risk", ""),
            )
        elif isinstance(raw_ca, list) and len(raw_ca) > 0:
            competitors_list = []
            for c in raw_ca:
                if isinstance(c, dict):
                    competitors_list.append(CompetitorItem(
                        name=c.get("operator") or c.get("name", "Competitor"),
                        position=c.get("market_share", ""),
                        threat_level=c.get("threat_level", "Medium"),
                        insight=c.get("detail") or c.get("insight", ""),
                    ))
            competitor_analysis = CompetitorAnalysis(
                competitive_landscape="Irish Mobile Operator Market",
                competitors=competitors_list,
                competitive_advantage="Vodafone Ireland network leadership",
                competitive_risk="Promotional price competition",
            )
    except Exception as e:
        logger.error("Competitor analysis parse error", error=str(e))

    # Summary bullets — list of strings
    summary_bullets = raw.get("summary_bullets", [])
    if not isinstance(summary_bullets, list):
        summary_bullets = []

    # Suggested questions — list of strings
    suggested_questions = raw.get("suggested_questions", [])
    if not isinstance(suggested_questions, list):
        suggested_questions = []

    logger.info(
        "Pipeline complete",
        query=query[:60],
        kpis=len(kpis),
        bullets=len(summary_bullets),
        questions=len(suggested_questions),
        duration_ms=execution_time_ms,
    )

    return AnalyticsResponse(
        conversation_id=conv_id,
        what_happened=raw.get("what_happened", "Analysis complete."),
        kpis=kpis,
        business_context=raw.get("business_context", ""),
        why_it_happened=raw.get("why_it_happened", ""),
        root_causes=root_causes,
        market_analysis=market_analysis,
        competitor_analysis=competitor_analysis,
        what_to_do=raw.get("what_to_do", ""),
        recommendations=recommendations,
        risks=risks,
        chart=chart,
        actions=raw.get("actions", ["Generate PowerPoint", "Export PDF", "Save Insight"]),
        agent_steps=agent_steps,
        dataset=dataset_label,
        query=query,
        summary_bullets=summary_bullets,
        suggested_questions=suggested_questions,
        generated_at=datetime.now(timezone.utc),
    )
