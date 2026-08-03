# Insurance Intelligence Assistant — **(REVANTAGE)**

Structured-data insurance copilot: **React + FastAPI + Azure OpenAI** with embedding-based intent routing. Answers business questions by fetching structured insurance records on demand — **not RAG**.

> **Employer project:** Built during an AI Engineering internship at **Revantage** (Blackstone portfolio company).  
> **Source of truth:** Azure DevOps (RNA-APP) — deployed by the platform engineering team.  
> **GitHub:** [Sanitized portfolio mirror](docs/SOURCE_AND_PORTFOLIO.md) — you will **not** see ADO commits, PRs, or deployment history here.

Uses a **synthetic demo dataset** by default; no proprietary RMIS mappings or employer infrastructure are included.

## Documentation

| Doc | Audience |
|-----|----------|
| [docs/SOURCE_AND_PORTFOLIO.md](docs/SOURCE_AND_PORTFOLIO.md) | **Recruiters** — ADO vs GitHub |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, request pipeline, API surface |
| [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md) | Step-by-step local setup and code tour |
| [AGENTS.md](AGENTS.md) | **AI coding agents** — read this first for repo context |

## Highlights

- **Intent routing** — embedding centroids + rule fallback (`GREETING`, `CLAIMS`, `POLICY`, `PREMIUM`, `HELP`)
- **Structured retrieval** — on-demand fetch per question with source metadata (policies, claims, premiums, programs)
- **Full-stack** — React/Vite/TypeScript chat UI + FastAPI service layer
- **Azure-ready** — APIM-backed Azure OpenAI, optional MSAL auth scaffold
- **Demo mode** — runs locally without live RMIS credentials (`USE_MOCK_DATA=true`)

## Architecture

```text
User message
  → Embedding intent classifier
  → Domain-aware structured data fetch (demo dataset or live API)
  → Context assembly with computed aggregates
  → Azure OpenAI grounded response + sources
```

This is intentionally **not** a vector-RAG design. It demonstrates tool-using data assistants where the durable asset is the **semantic data layer**, not the chat UI.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| LLM | Azure OpenAI via APIM |
| Auth | Microsoft Entra ID (MSAL scaffold, off by default) |

## Quick start

### Backend

```powershell
cd apps/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from repo root: `.\scripts\run-backend.ps1`

### Frontend

```powershell
cd apps/frontend
npm install
npm run dev
```

Open http://localhost:5173. Try: *"What is total property premium for Acme Portfolio for PY 25-26?"*

### With Azure OpenAI

Add to `apps/backend/.env`:

```env
AZURE_OPENAI_API_BASE_URL=https://your-apim.azure-api.net/your-product
AZURE_OPENAI_SUBSCRIPTION_KEY=your-key
AZURE_OPENAI_MODEL=gpt-4o
```

## Project structure

```text
ias-insurance-intelligence/
├── AGENTS.md
├── docs/
│   ├── SOURCE_AND_PORTFOLIO.md
│   ├── ARCHITECTURE.md
│   └── WALKTHROUGH.md
├── apps/
│   ├── frontend/
│   └── backend/app/
└── scripts/
```

## Related work

- [ias-loan-agreement-extraction **(REVANTAGE)**](https://github.com/tominister/ias-loan-agreement-extraction) — RAG document extraction
- [intent-llm-chatbot](https://github.com/tominister/intent-llm-chatbot) — Flask intent + LLM chatbot

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

Sanitized **portfolio mirror** of employer work. Canonical development and deployment occur in **Azure DevOps**, not on GitHub. See [docs/SOURCE_AND_PORTFOLIO.md](docs/SOURCE_AND_PORTFOLIO.md).
