from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import get_settings, reload_settings
from app.security.auth import require_auth
from app.services.azure_openai import AzureOpenAIError, AzureOpenAIService, TokenUsage as LLMTokenUsage
from app.services.data_retriever import DataRetriever
from app.services.mock_data import DataSource, list_domains, list_views, preview_view

logger = logging.getLogger("ias.chat")
logging.basicConfig(level=logging.INFO)

settings = reload_settings()
azure_service = AzureOpenAIService(settings)
data_retriever = DataRetriever(azure_service if settings.azure_openai_configured else None, settings)

_auth_dependency = [Depends(require_auth)]

SYSTEM_PROMPT = (
    "You are an Insurance Intelligence Assistant for enterprise insurance operations. "
    "The user message includes structured insurance data fetched on demand. "
    "Answer using ONLY the data provided in the user message context. "
    "When premium totals appear in a '### Answer (computed)' section, use those figures exactly. "
    "Be concise and professional. Include source metadata when relevant."
)

GREETING_SYSTEM_PROMPT = (
    "You are an Insurance Intelligence Assistant. "
    "The user sent a greeting — respond briefly and invite insurance data questions."
)

HELP_SYSTEM_PROMPT = (
    "You are an Insurance Intelligence Assistant. "
    "Explain that you answer questions about policies, claims, programs, and premiums "
    "using structured insurance data. Give 3-4 example questions."
)

Confidence = Literal["High", "Medium", "Low"]
SourceType = Literal["Policy Document", "Guideline", "Claims Procedure", "Program Summary", "SharePoint", "RMIS"]
MessageRole = Literal["user", "assistant"]


class Source(BaseModel):
    id: str
    documentName: str
    sourceType: SourceType
    confidence: Confidence
    preview: str
    url: str | None = None


class TokenUsage(BaseModel):
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class RequestMetrics(BaseModel):
    total_runtime_ms: float
    origami_retrieval_ms: float
    llm_runtime_ms: float | None = None
    origami_records_used: int = 0
    origami_domains_queried: list[str] = Field(default_factory=list)
    model: str | None = None
    total_tokens: int | None = None
    tokens: TokenUsage | None = None
    intent_kind: str | None = None
    top_k_used: int | None = None


class Message(BaseModel):
    id: str
    role: MessageRole
    content: str
    timestamp: str
    sources: list[Source] | None = None
    metrics: RequestMetrics | None = None


class ChatHistoryMessage(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: str | None = None
    history: list[ChatHistoryMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    origami_records_used: int = 0
    metrics: RequestMetrics


class IntegrationStatus(BaseModel):
    status: str
    detail: str


class HealthResponse(BaseModel):
    status: str
    service: str
    ready_for_rag: bool = False
    azure_openai: IntegrationStatus
    origami: IntegrationStatus


class LivenessResponse(BaseModel):
    status: str
    service: str


class IntegrationsResponse(BaseModel):
    azure_openai: IntegrationStatus
    origami: IntegrationStatus
    data_sources: list[dict[str, str]]


class AssistantSpecs(BaseModel):
    model: str
    top_k: str
    source_confidence: Confidence
    retrieval_mode: str
    origami_environment: str
    origami_account: str | None
    origami_retrieval_timeout_seconds: int
    origami_use_llm_router: bool
    origami_use_embedding_intent: bool
    origami_intent_embedding_threshold: float
    azure_openai_embedding_model: str
    origami_aggregate_max_records: int
    connected: list[str]
    not_connected: list[str]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _integration_status(raw: dict[str, str]) -> IntegrationStatus:
    return IntegrationStatus(status=raw["status"], detail=raw["detail"])


def _sources_to_response(sources: list[DataSource]) -> list[Source]:
    return [
        Source(
            id=source.id,
            documentName=source.document_name,
            sourceType=source.source_type,  # type: ignore[arg-type]
            confidence=source.confidence,  # type: ignore[arg-type]
            preview=source.preview,
        )
        for source in sources
    ]


def _trim_chat_history(history: list[ChatHistoryMessage]) -> list[ChatHistoryMessage]:
    trimmed = history[-settings.chat_max_history_messages :]
    output: list[ChatHistoryMessage] = []
    for item in trimmed:
        content = item.content.strip()
        if len(content) > settings.chat_max_history_chars_per_message:
            content = f"{content[: settings.chat_max_history_chars_per_message]}…"
        output.append(ChatHistoryMessage(role=item.role, content=content))
    return output


def _history_for_llm(history: list[ChatHistoryMessage]) -> list[dict[str, str]]:
    return [{"role": item.role, "content": item.content} for item in history]


def _build_prompt(user_message: str, context: str) -> str:
    return f"User question:\n{user_message}\n\nInsurance data (authoritative source):\n{context}"


def _data_source_catalog(*, data_status: str, azure_status: str) -> list[dict[str, str]]:
    return [
        {
            "id": "origami",
            "name": "Insurance RMIS (demo dataset)",
            "status": data_status,
            "description": "Structured policies, claims, programs, and premiums.",
        },
        {
            "id": "azure-openai",
            "name": "Azure OpenAI (APIM)",
            "status": azure_status,
            "description": "Enterprise language model gateway for assistant responses.",
        },
    ]


async def _data_connectivity() -> dict[str, str]:
    if settings.use_mock_data:
        return {"status": "connected", "detail": "Demo dataset mode enabled"}
    return {"status": "not_configured", "detail": "Configure USE_MOCK_DATA=true or wire a live data source"}


def _token_usage_from_reply(usage: LLMTokenUsage) -> tuple[TokenUsage, int | None]:
    token_usage = TokenUsage(
        prompt_tokens=usage.prompt_tokens,
        completion_tokens=usage.completion_tokens,
        total_tokens=usage.total_tokens,
    )
    total = usage.total_tokens
    if total is None and usage.prompt_tokens is not None and usage.completion_tokens is not None:
        total = usage.prompt_tokens + usage.completion_tokens
    return token_usage, total


app = FastAPI(
    title="Insurance Intelligence Assistant API",
    description="Structured-data insurance copilot with Azure OpenAI and embedding-based intent routing.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def log_startup() -> None:
    logger.info("startup mock_data=%s auth_enabled=%s", settings.use_mock_data, settings.auth_enabled)


async def _generate_reply(
    user_message: str,
    *,
    history: list[ChatHistoryMessage] | None = None,
) -> tuple[str, list[Source], RequestMetrics]:
    started = time.perf_counter()
    chat_history = _trim_chat_history(history or [])
    llm_history = _history_for_llm(chat_history)

    retrieval_started = time.perf_counter()
    retrieval = await data_retriever.retrieve(user_message, conversation_context=user_message)
    retrieval_ms = (time.perf_counter() - retrieval_started) * 1000
    sources = _sources_to_response(retrieval.sources)

    metrics = RequestMetrics(
        total_runtime_ms=0,
        origami_retrieval_ms=round(retrieval_ms, 1),
        origami_records_used=retrieval.record_count,
        origami_domains_queried=retrieval.domains_queried,
        model=settings.azure_openai_model if settings.azure_openai_configured else None,
        intent_kind=retrieval.intent.label if retrieval.intent else None,
        top_k_used=retrieval.top_k_applied,
    )

    if retrieval.skip_data_fetch:
        if not settings.azure_openai_configured:
            raise AzureOpenAIError("Azure OpenAI is not configured")
        llm_started = time.perf_counter()
        skip_prompt = HELP_SYSTEM_PROMPT if retrieval.intent and retrieval.intent.kind == "help" else GREETING_SYSTEM_PROMPT
        llm_reply = await azure_service.generate_reply(
            user_message=user_message,
            system_prompt=skip_prompt,
            history=llm_history,
        )
        metrics.llm_runtime_ms = round((time.perf_counter() - llm_started) * 1000, 1)
        metrics.model = llm_reply.model
        metrics.tokens, metrics.total_tokens = _token_usage_from_reply(llm_reply.usage)
        metrics.total_runtime_ms = round((time.perf_counter() - started) * 1000, 1)
        return llm_reply.content, [], metrics

    if retrieval.record_count == 0:
        content = retrieval.context_text or "No matching records found for that question."
        metrics.total_runtime_ms = round((time.perf_counter() - started) * 1000, 1)
        return content, sources, metrics

    if not settings.azure_openai_configured:
        metrics.total_runtime_ms = round((time.perf_counter() - started) * 1000, 1)
        return retrieval.context_text, sources, metrics

    prompt = _build_prompt(user_message, retrieval.context_text)
    llm_started = time.perf_counter()
    llm_reply = await azure_service.generate_reply(
        user_message=prompt,
        system_prompt=SYSTEM_PROMPT,
        history=llm_history,
    )
    metrics.llm_runtime_ms = round((time.perf_counter() - llm_started) * 1000, 1)
    metrics.model = llm_reply.model
    metrics.tokens, metrics.total_tokens = _token_usage_from_reply(llm_reply.usage)
    metrics.total_runtime_ms = round((time.perf_counter() - started) * 1000, 1)
    return llm_reply.content, sources, metrics


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    azure = _integration_status(await azure_service.health_check())
    data = _integration_status(await _data_connectivity())
    return HealthResponse(
        status="ok",
        service="insurance-intelligence-assistant",
        ready_for_rag=settings.azure_openai_configured and settings.use_mock_data,
        azure_openai=azure,
        origami=data,
    )


@app.get("/api/health", response_model=HealthResponse, include_in_schema=False)
async def api_health() -> HealthResponse:
    return await health()


@app.get("/health/live", response_model=LivenessResponse, include_in_schema=False)
@app.get("/api/health/live", response_model=LivenessResponse, include_in_schema=False)
async def health_live() -> LivenessResponse:
    return LivenessResponse(status="ok", service="insurance-intelligence-assistant")


@app.get("/specs", response_model=AssistantSpecs, dependencies=_auth_dependency)
async def specs() -> AssistantSpecs:
    connected = ["origami"] if settings.use_mock_data else []
    not_connected = [] if settings.use_mock_data else ["origami"]
    if settings.azure_openai_configured:
        connected.append("azure_openai")
    else:
        not_connected.append("azure_openai")
    return AssistantSpecs(
        model=settings.azure_openai_model,
        top_k="dynamic (greeting=0, single=1, aggregate=all matching rows, list=20, standard=10)",
        source_confidence="High",
        retrieval_mode="structured_on_demand with embedding intent (not RAG)",
        origami_environment="demo" if settings.use_mock_data else "not_configured",
        origami_account="demo-account" if settings.use_mock_data else None,
        origami_retrieval_timeout_seconds=30,
        origami_use_llm_router=False,
        origami_use_embedding_intent=settings.use_embedding_intent,
        origami_intent_embedding_threshold=settings.intent_embedding_threshold,
        azure_openai_embedding_model=settings.azure_openai_embedding_model,
        origami_aggregate_max_records=500,
        connected=connected,
        not_connected=not_connected,
    )


@app.get("/integrations", response_model=IntegrationsResponse, dependencies=_auth_dependency)
async def integrations() -> IntegrationsResponse:
    azure = _integration_status(await azure_service.health_check())
    data = _integration_status(await _data_connectivity())
    return IntegrationsResponse(
        azure_openai=azure,
        origami=data,
        data_sources=_data_source_catalog(
            data_status="Connected" if data.status == "connected" else "Not Connected",
            azure_status="Connected" if azure.status == "configured" else "Not Connected",
        ),
    )


@app.get("/origami/domains", dependencies=_auth_dependency)
@app.get("/origami/data-dictionary", dependencies=_auth_dependency)
async def origami_domains() -> dict[str, Any]:
    return {
        "status": "ok",
        "source": "Demo insurance domain catalog",
        "catalog_count": len(list_domains()),
        "domains": list_domains(),
    }


@app.get("/origami/views", dependencies=_auth_dependency)
async def origami_views() -> dict[str, Any]:
    return {"status": "ok", "source": "Demo reporting views", "views": list_views()}


@app.get("/origami/views/{view_id}/preview", dependencies=_auth_dependency)
async def origami_view_preview(view_id: str, limit: int = 25) -> dict[str, Any]:
    rows = preview_view(view_id, limit=limit)
    return {"status": "ok", "view_id": view_id, "row_count": len(rows), "rows": rows}


@app.post("/chat", response_model=ChatResponse, dependencies=_auth_dependency)
async def chat(request: ChatRequest) -> ChatResponse:
    conversation_id = request.conversation_id or str(uuid.uuid4())
    try:
        content, sources, metrics = await _generate_reply(request.message, history=request.history)
    except AzureOpenAIError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    message = Message(
        id=str(uuid.uuid4()),
        role="assistant",
        content=content,
        timestamp=_now(),
        sources=sources or None,
        metrics=metrics,
    )
    return ChatResponse(
        conversation_id=conversation_id,
        message=message,
        origami_records_used=metrics.origami_records_used,
        metrics=metrics,
    )


@app.post("/api/chat", response_model=ChatResponse, include_in_schema=False, dependencies=_auth_dependency)
async def api_chat(request: ChatRequest) -> ChatResponse:
    return await chat(request)
