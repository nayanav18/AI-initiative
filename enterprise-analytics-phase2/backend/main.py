"""
main.py — Phase 2 FastAPI application.
Copy to: backend/main.py  (REPLACES existing)

Registers Phase 1 + Phase 2 routers.
Phase 2 routers fail gracefully if BQ tables don't exist yet.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

logger = structlog.get_logger()

# ── Phase 1 routers (always available) ────────────────────────────────────
from routers.chat import router as chat_router

from services.vertex_client import init_vertex_ai
   

# Phase 1 other routers — include only if they exist
try:
    from routers.datasets import router as datasets_router
    HAS_DATASETS = True
except ImportError:
    HAS_DATASETS = False

try:
    from routers.insights import router as insights_router_p1
    HAS_INSIGHTS_P1 = True
except ImportError:
    HAS_INSIGHTS_P1 = False

try:
    from routers.health import router as health_router
    HAS_HEALTH = True
except ImportError:
    HAS_HEALTH = False

# ── Phase 2 routers (optional) ────────────────────────────────────────────
try:
    from routers.conversations import router as conv_router
    HAS_CONV = True
except ImportError:
    HAS_CONV = False

try:
    from routers.insights_router import router as insights_router_p2
    HAS_INSIGHTS_P2 = True
except ImportError:
    HAS_INSIGHTS_P2 = False

try:
    from routers.persona_router import router as persona_router
    HAS_PERSONA = True
except ImportError:
    HAS_PERSONA = False

try:
    from routers.dashboard_router import router as dashboard_router
    HAS_DASHBOARD = True
except ImportError:
    HAS_DASHBOARD = False

try:
    from routers.widgets_router import router as widgets_router
    HAS_WIDGETS = True
except ImportError:
    HAS_WIDGETS = False

# ── App ───────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Vodafone Ireland Analytics Platform",
    description="AI-powered analytics — Phase 1 + Phase 2",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000",
                   "https://*.cloudshell.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────────────────────
app.include_router(chat_router)           # POST /api/v1/chat

if HAS_DATASETS:
    app.include_router(datasets_router)   # GET  /api/v1/datasets
if HAS_INSIGHTS_P1:
    app.include_router(insights_router_p1)
if HAS_HEALTH:
    app.include_router(health_router)

# Phase 2
if HAS_CONV:
    app.include_router(conv_router)       # GET  /api/v1/conversations
if HAS_INSIGHTS_P2:
    app.include_router(insights_router_p2)  # /api/v1/insights (BQ-backed)
if HAS_PERSONA:
    app.include_router(persona_router)    # GET/POST /api/v1/persona
if HAS_DASHBOARD:
    app.include_router(dashboard_router)  # GET  /api/v1/dashboard/{persona_id}
if HAS_WIDGETS:
    app.include_router(widgets_router)    # GET/PUT  /api/v1/widgets


@app.on_event("startup")
async def startup():
    init_vertex_ai()  # Add this line
    logger.info("Starting Vodafone Ireland Analytics v2.0")
    # Create BQ memory tables non-blocking
    try:
        from services.memory_service import ensure_tables_exist
        await ensure_tables_exist()
    except Exception as e:
        logger.warning("Memory table setup skipped", error=str(e)[:80])
    # Create insights table non-blocking
    try:
        from services.insights_service import ensure_table
        await ensure_table()
    except Exception as e:
        logger.warning("Insights table setup skipped", error=str(e)[:80])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "phase": 2,
        "features": {
            "guardrails":         True,
            "memory":             HAS_CONV,
            "persona_dashboard":  HAS_DASHBOARD,
            "insights":           HAS_INSIGHTS_P2 or HAS_INSIGHTS_P1,
            "widgets":            HAS_WIDGETS,
        }
    }
