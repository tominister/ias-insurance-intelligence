from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass
from typing import Literal

from app.config import Settings
from app.services.azure_openai import AzureOpenAIError, AzureOpenAIService

logger = logging.getLogger("ias.intent")

IntentLabel = Literal[
    "GREETING",
    "CLAIMS_QUERY",
    "POLICY_QUERY",
    "PREMIUM_AGGREGATE",
    "HELP",
    "UNKNOWN",
]

INTENT_EXAMPLES: dict[IntentLabel, list[str]] = {
    "GREETING": [
        "hello",
        "hi",
        "hey",
        "howdy",
        "good morning",
        "good afternoon",
        "what's up",
        "sup",
        "yo",
        "thanks",
        "thank you",
        "bye",
        "how are you",
    ],
    "CLAIMS_QUERY": [
        "what is the most recent claim",
        "show open claims",
        "claim status for CLM-25-2934",
        "latest loss report",
        "incident details",
    ],
    "POLICY_QUERY": [
        "what policies expire this quarter",
        "show policy deductibles",
        "renewal dates",
        "coverage limits on property policy",
        "list active policies",
    ],
    "PREMIUM_AGGREGATE": [
        "total property premium for acme portfolio",
        "sum of premiums for portfolio company",
        "aggregate premium py 25-26",
        "how much premium across all locations",
    ],
    "HELP": [
        "what can you do",
        "help",
        "how do I use this assistant",
        "what data do you have access to",
    ],
    "UNKNOWN": [
        "asdf qwerty",
        "tell me a joke",
        "who won the game last night",
    ],
}


@dataclass
class IntentClassification:
    label: IntentLabel
    method: Literal["embedding", "rules"]
    confidence: float | None = None


class IntentClassifier:
    def __init__(self, azure: AzureOpenAIService | None, settings: Settings) -> None:
        self.azure = azure
        self.settings = settings
        self._centroids: dict[IntentLabel, list[float]] | None = None

    async def classify(self, user_message: str) -> IntentClassification:
        text = user_message.strip()
        if not text:
            return IntentClassification(label="GREETING", method="rules", confidence=1.0)

        if self.settings.origami_use_embedding_intent:
            embedding_result = await self._classify_with_embeddings(text)
            if embedding_result is not None:
                return embedding_result

        from app.services.query_intent import classify_query_intent_rules

        rules_intent = classify_query_intent_rules(text)
        label = _rules_kind_to_label(rules_intent.kind, text)
        return IntentClassification(label=label, method="rules", confidence=None)

    async def _classify_with_embeddings(self, text: str) -> IntentClassification | None:
        if not self.azure or not self.azure.settings.azure_openai_configured:
            return None
        try:
            await self._ensure_centroids()
            if not self._centroids:
                return None

            message_vector = await self.azure.create_embedding(text)
            best_label: IntentLabel | None = None
            best_score = -1.0

            for label, centroid in self._centroids.items():
                score = _cosine_similarity(message_vector, centroid)
                if score > best_score:
                    best_score = score
                    best_label = label

            threshold = self.settings.origami_intent_embedding_threshold
            if best_label and best_score >= threshold:
                return IntentClassification(
                    label=best_label,
                    method="embedding",
                    confidence=round(best_score, 3),
                )
        except AzureOpenAIError as exc:
            logger.warning("Embedding intent classification failed: %s", exc)
        return None

    async def _ensure_centroids(self) -> None:
        if self._centroids is not None:
            return

        all_examples: list[str] = []
        label_for_index: list[IntentLabel] = []
        for label, examples in INTENT_EXAMPLES.items():
            for example in examples:
                all_examples.append(example)
                label_for_index.append(label)

        vectors = await self.azure.create_embeddings(all_examples)
        grouped: dict[IntentLabel, list[list[float]]] = {label: [] for label in INTENT_EXAMPLES}
        for label, vector in zip(label_for_index, vectors):
            grouped[label].append(vector)

        self._centroids = {label: _average_vectors(vecs) for label, vecs in grouped.items()}


def _rules_kind_to_label(kind: str, text: str) -> IntentLabel:
    if kind == "greeting":
        return "GREETING"
    if kind == "help":
        return "HELP"
    if kind == "aggregate":
        return "PREMIUM_AGGREGATE"
    if kind == "single":
        return "CLAIMS_QUERY"
    if kind == "list":
        return "POLICY_QUERY"
    if re.search(r"(?i)\b(claim|loss|incident|clm-)\b", text):
        return "CLAIMS_QUERY"
    if re.search(r"(?i)\b(policy|policies|renew|expir|deductible|coverage)\b", text):
        return "POLICY_QUERY"
    return "UNKNOWN"


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _average_vectors(vectors: list[list[float]]) -> list[float]:
    if not vectors:
        return []
    size = len(vectors[0])
    totals = [0.0] * size
    for vector in vectors:
        for index, value in enumerate(vector):
            totals[index] += value
    return [value / len(vectors) for value in totals]
