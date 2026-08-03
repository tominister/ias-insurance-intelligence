from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

IntentKind = Literal["greeting", "single", "aggregate", "list", "standard", "help"]

INSURANCE_KEYWORDS = re.compile(
    r"(?i)\b(claim|policy|policies|premium|incident|coverage|program|"
    r"renew|expir|deductible|portfolio|property|broker|carrier|loss|clm-|inc-)\b"
)

SINGLE_RECORD_PATTERN = re.compile(
    r"(?i)(?:most recent|latest|newest|last)\s+(?:claim|incident)|"
    r"\bclm-\d{2}-\d{4}\b|"
    r"\binc-\d{2}-\d{4}\b"
)

AGGREGATE_PATTERN = re.compile(
    r"(?i)\b(total|sum|aggregate|combined|across|entire|all)\b|"
    r"how many\b|"
    r"\bcount\b"
)

LIST_PATTERN = re.compile(
    r"(?i)\b(list|show|which|what)\b.*\b(policies|claims|programs|coverages)\b|"
    r"\b(expir|quarter|renew)\b"
)


@dataclass(frozen=True)
class QueryIntent:
    kind: IntentKind
    top_k: int | None
    skip_data_fetch: bool = False
    use_all_matched: bool = False
    intent_label: str | None = None
    classifier_method: str | None = None
    classifier_confidence: float | None = None

    @property
    def label(self) -> str:
        prefix = self.intent_label or self.kind
        method = f" via {self.classifier_method}" if self.classifier_method else ""
        if self.skip_data_fetch:
            return f"{prefix}{method} (no data fetch)"
        if self.use_all_matched:
            return f"{prefix}{method} (dynamic top_k)"
        return f"{prefix}{method} (top_k={self.top_k})"


def classify_query_intent_rules(user_message: str) -> QueryIntent:
    text = user_message.strip()

    if not text:
        return QueryIntent(kind="greeting", top_k=0, skip_data_fetch=True, classifier_method="rules")

    if re.search(r"(?i)^(help|what can you do|how do i use)", text):
        return QueryIntent(kind="help", top_k=0, skip_data_fetch=True, classifier_method="rules")

    if len(text) < 40 and not INSURANCE_KEYWORDS.search(text):
        return QueryIntent(kind="greeting", top_k=0, skip_data_fetch=True, classifier_method="rules")

    if SINGLE_RECORD_PATTERN.search(text):
        return QueryIntent(kind="single", top_k=1, classifier_method="rules")

    if AGGREGATE_PATTERN.search(text):
        return QueryIntent(kind="aggregate", top_k=None, use_all_matched=True, classifier_method="rules")

    if LIST_PATTERN.search(text):
        return QueryIntent(kind="list", top_k=20, classifier_method="rules")

    return QueryIntent(kind="standard", top_k=10, classifier_method="rules")
