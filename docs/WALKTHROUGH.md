# Walkthrough — Insurance Intelligence Assistant

Step-by-step guide for recruiters, reviewers, and developers cloning this repo. Estimated time: **15–20 minutes** to run locally; **5 minutes** to skim architecture.

---

## What you are looking at

A full-stack **structured-data copilot**:

- User asks an insurance question in plain English
- Backend classifies intent, fetches relevant records from a **demo dataset**
- Azure OpenAI (optional) writes a grounded answer with **source cards**

**Demo question to try:**  
*"What is total property premium for Acme Portfolio for PY 25-26?"*

Expected: dollar totals from the computed section + RMIS source metadata in the UI.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| Git | any recent |

Azure OpenAI credentials are **optional** — the app returns structured context without LLM if APIM is not configured.

---

## Step 1 — Clone and open

```powershell
git clone https://github.com/tominister/ias-insurance-intelligence-revantage.git
cd ias-insurance-intelligence
```

**Start here for orientation:**

| File | Why read it |
|------|-------------|
| [README.md](../README.md) | Quick start + stack |
| [AGENTS.md](../AGENTS.md) | Context for AI coding agents |
| [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | System design deep dive |

---

## Step 2 — Backend

```powershell
cd apps/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify:

```powershell
curl http://127.0.0.1:8000/health
```

You should see `"status": "ok"` and mock data connected.

**Optional — enable Azure OpenAI** in `.env`:

```env
AZURE_OPENAI_API_BASE_URL=https://your-apim.azure-api.net/your-product
AZURE_OPENAI_SUBSCRIPTION_KEY=your-key
AZURE_OPENAI_MODEL=gpt-4o
```

Restart uvicorn after editing `.env`.

---

## Step 3 — Frontend

New terminal:

```powershell
cd apps/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

Vite proxies `/api/*` → backend port 8000 (see `apps/frontend/vite.config.ts`).

---

## Step 4 — Exercise the chat flow

1. Click a suggested prompt or type a premium question
2. Watch the assistant response and expand **Sources**
3. Open **Data Sources** in the sidebar — domain catalog and views load from mock API

### Suggested test messages

| Message | Expected behavior |
|---------|-------------------|
| "Hello" | Greeting, no data fetch |
| "What can you do?" | Help text, capabilities |
| "What is the most recent claim?" | Single claim record + sources |
| "What policies expire this quarter?" | Policy list |
| "Total property premium for Acme Portfolio PY 25-26" | Computed premium totals |

---

## Step 5 — Follow the code (recommended reading order)

### Backend trace for one chat message

```text
POST /chat
  main.py :: chat()
    → _generate_reply()
      → data_retriever.py :: DataRetriever.retrieve()
          → intent_classifier.py :: IntentClassifier.classify()
          → query_intent.py :: classify_query_intent_rules()
          → mock_data.py :: retrieve_context()
      → azure_openai.py :: generate_reply()   [if configured]
```

### Frontend trace

```text
ChatContext.sendMessage()
  → chatService.ts :: sendChatMessage()
  → POST /api/chat (proxied)
  → Message + SourceCard render
```

---

## Step 6 — Key files cheat sheet

```text
ias-insurance-intelligence/
├── AGENTS.md                         ← AI agent context (read first if you are an agent)
├── README.md
├── docs/
│   ├── ARCHITECTURE.md               ← design + diagrams
│   └── WALKTHROUGH.md                ← this file
├── apps/
│   ├── backend/app/
│   │   ├── main.py                   ← routes + chat pipeline
│   │   ├── config.py                 ← env settings
│   │   └── services/
│   │       ├── intent_classifier.py  ← embedding intent
│   │       ├── query_intent.py       ← rule intent / query kind
│   │       ├── data_retriever.py     ← retrieval orchestration
│   │       ├── mock_data.py          ← demo dataset (swap for real gateway)
│   │       └── azure_openai.py       ← LLM + embeddings
│   └── frontend/src/
│       ├── context/ChatContext.tsx   ← chat state
│       ├── services/chatService.ts   ← API client
│       └── components/               ← UI
└── scripts/
    ├── run-backend.ps1
    └── run-frontend.ps1
```

---

## Common tasks

### Change demo sample data

Edit `apps/backend/app/services/mock_data.py` → `_SAMPLE_RECORDS` and `MOCK_DOMAINS`.

### Add a new intent label

1. Add examples to `INTENT_EXAMPLES` in `intent_classifier.py`
2. Map label in `data_retriever.py` → `retrieve()`
3. Add routing branch in `mock_data.py` → `retrieve_context()`

### Tweak system prompts

Edit `SYSTEM_PROMPT`, `GREETING_SYSTEM_PROMPT`, `HELP_SYSTEM_PROMPT` in `main.py`.

### Enable auth locally

Backend `.env`:

```env
AUTH_ENABLED=true
AZURE_AD_TENANT_ID=...
AZURE_AD_CLIENT_ID=...
```

Frontend `.env.local`:

```env
VITE_AZURE_CLIENT_ID=...
VITE_AZURE_TENANT_ID=...
VITE_AUTH_ENABLED=true
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Frontend can't reach API | Ensure backend on :8000; check Vite proxy |
| "Azure OpenAI is not configured" on chat | Add APIM vars to `.env` or expect raw context-only responses |
| Empty sources | Check `USE_MOCK_DATA=true` in `.env` |
| Import errors | Run uvicorn from `apps/backend` with venv activated |

---

## Related portfolio repos

| Repo | Pattern |
|------|---------|
| [ias-insurance-intelligence](https://github.com/tominister/ias-insurance-intelligence-revantage) | Structured data assistant (this repo) |
| [ias-loan-agreement-extraction](https://github.com/tominister/ias-loan-agreement-extraction-revantage) | RAG document extraction |
| [intent-llm-chatbot](https://github.com/tominister/intent-llm-chatbot) | Intent + LLM (Flask) |

---

## Disclaimer

Sanitized portfolio version. No proprietary employer infrastructure, semantic mappings, or live RMIS credentials are included.
