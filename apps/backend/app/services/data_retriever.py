from __future__ import annotations

from dataclasses import dataclass, field

from app.config import Settings
from app.services.azure_openai import AzureOpenAIService
from app.services.intent_classifier import IntentClassifier
from app.services.mock_data import DataSource, retrieve_context
from app.services.query_intent import QueryIntent, classify_query_intent_rules


@dataclass
class RetrievalResult:
    context_text: str
    sources: list[DataSource] = field(default_factory=list)
    record_count: int = 0
    domains_queried: list[str] = field(default_factory=list)
    intent: QueryIntent | None = None
    skip_data_fetch: bool = False
    top_k_applied: int | None = None


class DataRetriever:
    def __init__(self, azure: AzureOpenAIService | None, settings: Settings) -> None:
        self.settings = settings
        self.classifier = IntentClassifier(azure, settings)

    async def retrieve(self, user_message: str, *, conversation_context: str | None = None) -> RetrievalResult:
        query_text = (conversation_context or user_message).strip()
        classification = await self.classifier.classify(query_text)
        intent = classify_query_intent_rules(query_text)

        if classification.label == "GREETING":
            intent = QueryIntent(kind="greeting", top_k=0, skip_data_fetch=True, classifier_method=classification.method)
        elif classification.label == "HELP":
            intent = QueryIntent(kind="help", top_k=0, skip_data_fetch=True, classifier_method=classification.method)
        elif classification.label == "PREMIUM_AGGREGATE":
            intent = QueryIntent(kind="aggregate", top_k=None, use_all_matched=True, classifier_method=classification.method)
        elif classification.label == "CLAIMS_QUERY":
            intent = QueryIntent(kind="single", top_k=1, classifier_method=classification.method)
        elif classification.label == "POLICY_QUERY":
            intent = QueryIntent(kind="list", top_k=20, classifier_method=classification.method)

        if intent.skip_data_fetch:
            return RetrievalResult(
                context_text="",
                intent=intent,
                skip_data_fetch=True,
                top_k_applied=intent.top_k,
            )

        context, sources, record_count, domains = retrieve_context(
            query_text,
            intent_kind=intent.kind,
        )
        return RetrievalResult(
            context_text=context,
            sources=sources,
            record_count=record_count,
            domains_queried=domains,
            intent=intent,
            top_k_applied=intent.top_k,
        )
