# AGENTS.md — Insurance Intelligence Assistant **(REVANTAGE)**

**Read this first** if you are an AI coding agent working in this repository.

Human docs: [README.md](README.md) · [docs/SOURCE_AND_PORTFOLIO.md](docs/SOURCE_AND_PORTFOLIO.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md)

---

## Project identity

| Field | Value |
|-------|-------|
| Name | Insurance Intelligence Assistant **(REVANTAGE)** |
| Employer | Revantage — Blackstone portfolio company |
| Canonical source | Azure DevOps `RevantageCS/RNA-APP/ias-insurance-intelligence` |
| GitHub | `tominister/ias-insurance-intelligence` — sanitized portfolio mirror only |
| Owner | Haoran (Tommy) Fang — AI Engineering intern, Revantage |
| Pattern | **Structured-data copilot** — NOT RAG |
| Default data | Synthetic mock dataset (`USE_MOCK_DATA=true`) |

**Workflow:** Develop in ADO first; push to GitHub only when the intern approves. Recruiters cannot see ADO commits, PRs, or deploy history.

**Do not confuse with:** [ias-loan-agreement-extraction **(REVANTAGE)**](https://github.com/tominister/ias-loan-agreement-extraction) (RAG over PDFs).

---

## What this system does

Answers insurance **data** questions by:

1. Classifying user intent (embeddings + rules)
2. Fetching structured records on demand
3. Grounding an Azure OpenAI reply in that context
4. Returning **source metadata** with each answer

There is **no vector database**, no document chunking, no pgvector/FAISS/Qdrant.

---

## Stack

| Layer | Path | Tech |
|-------|------|------|
| Frontend | `apps/frontend/` | React, Vite, TypeScript, Tailwind |
| Backend | `apps/backend/app/` | FastAPI, Pydantic |
| LLM | `services/azure_openai.py` | Azure OpenAI via APIM |
| Demo data | `services/mock_data.py` | In-memory synthetic records |
| Auth (optional) | `security/`, `frontend/src/auth/` | Entra MSAL + JWT |

---

## Directory map (edit here)

```text
apps/backend/app/
  main.py                 ← HTTP routes, chat orchestration, prompts
  config.py               ← all env settings (Pydantic Settings)
  services/
    intent_classifier.py  ← embedding centroids + rule fallback
    query_intent.py       ← query kind: single | aggregate | list | …
    data_retriever.py     ← retrieval orchestration (keep interface stable)
    mock_data.py          ← demo dataset (replace for real API gateway)
    azure_openai.py       ← APIM chat + embeddings client
  security/               ← JWT validation when AUTH_ENABLED=true

apps/frontend/src/
  context/ChatContext.tsx ← client chat state + history
  services/chatService.ts ← API client (/api proxy in dev)
  components/             ← UI; SourceCard shows retrieval metadata
```

---

## Request flow (chat)

```text
POST /chat → main.py
  → IntentClassifier.classify()
  → DataRetriever.retrieve()
      → mock_data.retrieve_context()
  → AzureOpenAIService.generate_reply()  [optional]
  → ChatResponse { message, sources, metrics }
```

---

## Hard constraints

1. **No secrets in code, commits, logs, or docs.** Use `apps/backend/.env` (gitignored).
2. **Portfolio repo — sanitized.** Do not add proprietary RMIS field mappings, employer infra URLs, or internal Azure DevOps/Terraform from other repos.
3. **Minimize scope.** Small, focused diffs. Do not over-engineer.
4. **Mock by default.** `USE_MOCK_DATA=true` unless explicitly wiring a new public-safe data source.
5. **Not RAG.** Do not add vector stores or document pipelines — that belongs in the loan-extraction repo.
6. **Preserve API contract.** Frontend expects `/chat`, `/health`, `/origami/domains`, `/origami/views` response shapes.

---

## Configuration

Copy `apps/backend/.env.example` → `.env`.

| Variable | Default | Notes |
|----------|---------|-------|
| `USE_MOCK_DATA` | `true` | Keep true for portfolio demo |
| `USE_EMBEDDING_INTENT` | `true` | Needs Azure embeddings route |
| `AUTH_ENABLED` | `false` | Local dev stays open |
| `AZURE_OPENAI_*` | unset | Optional for LLM answers |

---

## Run locally

```powershell
# Backend (from apps/backend)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (from apps/frontend)
npm install
npm run dev
```

Or from repo root: `.\scripts\run-backend.ps1` and `.\scripts\run-frontend.ps1`

Backend import path: `app.main:app` when cwd is `apps/backend`.

---

## Common agent tasks

| Task | Where to edit |
|------|---------------|
| Change demo records | `services/mock_data.py` |
| Adjust intent routing | `services/intent_classifier.py`, `services/query_intent.py` |
| Modify LLM behavior | `main.py` system prompts |
| Add API endpoint | `main.py` (+ `chatService.ts` if frontend needs it) |
| UI changes | `apps/frontend/src/components/` |
| New env setting | `config.py` + `.env.example` |

---

## Testing changes

No formal test suite yet. After backend edits:

```powershell
cd apps/backend
python -c "from app.main import app; print(app.title)"
curl http://127.0.0.1:8000/health
```

Manual smoke: premium question → sources appear → totals in response.

---

## Anti-patterns (avoid)

- Scanning the entire repo before a small change
- Adding parallel retrieval paths instead of extending `DataRetriever`
- Putting business logic in React components or `main.py` when it belongs in `services/`
- Renaming `/origami/*` routes (frontend depends on them)
- Committing `.env`, credentials, or employer-specific names (Revantage, LivCor, etc.)

---

## Extension roadmap (if asked)

Production evolution of this pattern:

1. Replace `mock_data.py` with **Data Gateway** (auth + HTTP client)
2. Add **Semantic Layer** (field → business concept mapping)
3. Split `main.py` into `api/endpoints/`
4. Enable MSAL auth + audit logging
5. Expose tools to Copilot/MCP (capabilities, not chat UI)

---

## License

MIT — portfolio/educational use.
