# Enterprise Analytics AI — Step 1 Milestone

**Secure Chatbot Foundation + Existing Google Cloud Connection Verification**

This repository contains Milestone 1 of the Enterprise Analytics AI application: a full-stack, enterprise-grade AI chatbot foundation with persistent conversation history, clean modular architecture, and secure Google Cloud BigQuery connectivity verification.

---

## 1. Architecture & Tech Stack

```
enterprise-analytics-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point, lifespan, CORS & error handling
│   │   ├── config.py                # Environment configuration loader
│   │   ├── models/                  # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   ├── chat.py              # POST /api/chat
│   │   │   ├── conversations.py     # GET/DELETE /api/conversations
│   │   │   └── system.py            # GET /api/system/bigquery-status
│   │   ├── services/
│   │   │   ├── database.py          # SQLite WAL-mode async conversation persistence
│   │   │   ├── chat_service.py      # Deterministic development responder
│   │   │   └── bigquery.py          # Read-only BigQuery ADC connection verification
│   │   └── agents/
│   │       ├── router_agent.py      # Integration point for future intent classification
│   │       └── conversation_agent.py# Integration point for future AI agent
│   ├── requirements.txt             # Minimal dependencies
│   ├── .env.example                 # Non-secret environment template
│   └── .env                         # Local environment settings (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main application state & layout coordinator
│   │   ├── main.jsx                 # React root renderer
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Collapsible navigation & conversation history
│   │   │   ├── ChatWindow.jsx       # Chat header, status badge, welcome & message list
│   │   │   ├── MessageBubble.jsx    # User & assistant bubbles with markdown formatting
│   │   │   └── ChatInput.jsx        # Keyboard-navigable text input & submit
│   │   ├── services/
│   │   │   └── api.js               # Centralized API service (Vite proxy integration)
│   │   └── styles/
│   │       └── theme.css            # Dark enterprise design system & theme variables
│   ├── package.json                 # Minimal React + Vite configuration
│   ├── vite.config.js               # Development proxy forwarding /api and /health
│   └── index.html                   # HTML entry point
├── .gitignore                       # Strict exclusion of .env, credentials, and SQLite databases
└── README.md                        # Documentation and verification instructions
```

### Technology Matrix
- **Frontend**: React 18, Vite, JavaScript, Custom CSS Design System (no heavy component frameworks).
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2.
- **Persistence**: SQLite (async with `aiosqlite`) with WAL mode, transactions, and foreign key cascades.
- **Google Cloud**: Google Cloud BigQuery client with Application Default Credentials (ADC).
- **Vertex AI**: Pre-configured integration points ready for Gemini models in Milestone 2.

---

## 2. Security & Compliance Controls

1. **No Data Leakage to AI**: In this milestone, zero company rows or dataset contents are forwarded to Vertex AI or any external model.
2. **Read-Only Metadata Verification**: BigQuery connectivity checks only query dataset existence and table counts (`client.get_dataset()` / `client.list_tables()`). No table rows or confidential business records are retrieved or displayed.
3. **Application Default Credentials (ADC)**: No service account keys or private credentials are hard-coded in source code or sent to the frontend.
4. **CORS Hardening**: Strict CORS configured exclusively for the intended frontend origin (`http://localhost:5173`). Wildcard credentialed CORS is forbidden.
5. **No Telemetry / No PHP**: Free of PHP and free of external tracking or telemetry libraries.
6. **Error Redaction**: Internal tracebacks and secrets are stripped before sending HTTP error envelopes (`ErrorResponse`) to clients.

---

## 3. Configuration & Environment Variables

### Existing Google Cloud Configuration Values:
```env
GCP_PROJECT_ID=vf-grp-gbissdbx-dev-1
GCP_LOCATION=us-central1

BIGQUERY_DATASET=KarthikRudrapati
BIGQUERY_LOCATION=US

VERTEX_AI_MODEL=gemini-2.5-flash-lite
VERTEX_AI_TEMPERATURE=0.2
VERTEX_AI_MAX_TOKENS=2048
```

Copy the example template to `.env`:
```bash
cp backend/.env.example backend/.env
```
Ensure `backend/.env` is never committed to Git (verified in `.gitignore`).

---

## 4. Quickstart & Installation

### Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd enterprise-analytics-ai/backend
   ```
2. Create and activate a Python 3.12 virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS/Cloud Shell:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Verify health:
   ```bash
   curl http://localhost:8000/health
   # Returns: {"status": "healthy", "service": "Enterprise Analytics AI", "version": "1.0.0"}
   ```

### Frontend Setup (React + Vite)
1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd enterprise-analytics-ai/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check probe (no secrets returned) |
| `POST` | `/api/chat` | Send message, persist exchange, and return deterministic reply |
| `GET` | `/api/conversations` | List conversation summaries sorted by `updated_at DESC` |
| `GET` | `/api/conversations/{id}` | Retrieve specific conversation and all associated messages |
| `DELETE` | `/api/conversations/{id}` | Delete conversation and cascade delete all messages |
| `GET` | `/api/system/bigquery-status`| Run safe BigQuery metadata check via ADC |

---

## 6. BigQuery Connection Verification

The BigQuery diagnostic (`GET /api/system/bigquery-status`) tests connectivity without querying data rows:
- If Application Default Credentials (ADC) are configured in the environment (`gcloud auth application-default login` or Cloud Run metadata server), it verifies access to dataset `KarthikRudrapati`.
- If credentials or dataset permissions are unavailable, the application gracefully reports `connected: false` with a sanitized `error_category` (`AUTHENTICATION_FAILURE`, `PERMISSION_DENIED`, or `DATASET_NOT_FOUND`).
- The application starts and runs cleanly regardless of whether BigQuery is reachable.

---

## 7. Milestone 1 Status & Integration Points

- [x] Modern Enterprise Dark UI matching design tokens
- [x] Asynchronous SQLite database with automatic table creation & migrations
- [x] Chat message persistence surviving refresh and server restart
- [x] Conversation management (creation, listing, restoration, deletion)
- [x] Centralized API client with Vite proxy integration
- [x] Safe BigQuery ADC verification service
- [x] Future agent stubs: `router_agent.py` and `conversation_agent.py` ready for Vertex AI
