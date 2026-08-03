"""Synthetic insurance records for portfolio/demo mode (no proprietary RMIS data)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DataSource:
    id: str
    document_name: str
    source_type: str
    confidence: str
    preview: str


MOCK_DOMAINS = [
    {"name": "Policy", "description": "Active and historical insurance policies"},
    {"name": "Claim", "description": "Loss and incident records"},
    {"name": "Program", "description": "Insurance program enrollment and terms"},
    {"name": "Location", "description": "Insured locations and property attributes"},
    {"name": "LocationProgram", "description": "Location-program premium enrollments"},
]

MOCK_VIEWS = [
    {
        "id": "location_program_summary",
        "name": "Location Program Summary",
        "description": "Portfolio premiums and TIV by program year",
    },
    {
        "id": "policy_renewals",
        "name": "Policy Renewals",
        "description": "Policies approaching renewal windows",
    },
    {
        "id": "recent_claims",
        "name": "Recent Claims",
        "description": "Latest open and closed claims",
    },
]

_SAMPLE_RECORDS: dict[str, list[dict[str, Any]]] = {
    "claims": [
        {
            "claim_number": "CLM-25-1042",
            "status": "Open",
            "loss_date": "2025-11-14",
            "portfolio": "Acme Portfolio",
            "paid": 125000.0,
        },
        {
            "claim_number": "CLM-25-0891",
            "status": "Closed",
            "loss_date": "2025-08-03",
            "portfolio": "Acme Portfolio",
            "paid": 48200.0,
        },
    ],
    "policies": [
        {
            "policy_number": "POL-2025-4410",
            "coverage": "Property",
            "expires": "2026-03-31",
            "deductible": 25000,
            "limit": 50000000,
        },
        {
            "policy_number": "POL-2025-4411",
            "coverage": "General Liability",
            "expires": "2026-06-30",
            "deductible": 10000,
            "limit": 10000000,
        },
    ],
    "premiums": [
        {
            "portfolio": "Acme Portfolio",
            "program_year": "PY 25-26",
            "property_premium": 1842500.0,
            "annualized_premium": 1920000.0,
            "total_insured_value": 890000000.0,
            "location_count": 42,
        }
    ],
}


def list_domains() -> list[dict[str, str]]:
    return [{"name": d["name"], "description": d["description"]} for d in MOCK_DOMAINS]


def list_views() -> list[dict[str, str]]:
    return MOCK_VIEWS


def preview_view(view_id: str, limit: int = 25) -> list[dict[str, Any]]:
    if view_id == "location_program_summary":
        return _SAMPLE_RECORDS["premiums"][:limit]
    if view_id == "policy_renewals":
        return _SAMPLE_RECORDS["policies"][:limit]
    if view_id == "recent_claims":
        return _SAMPLE_RECORDS["claims"][:limit]
    return []


def retrieve_context(user_message: str, *, intent_kind: str) -> tuple[str, list[DataSource], int, list[str]]:
    """Return formatted context, sources, record count, and domains queried."""
    text = user_message.lower()
    domains: list[str] = []
    records: list[dict[str, Any]] = []
    sources: list[DataSource] = []

    if intent_kind in {"single", "list"} and any(k in text for k in ("claim", "loss", "incident", "clm")):
        domains = ["Claim"]
        records = _SAMPLE_RECORDS["claims"][:1 if intent_kind == "single" else 5]
    elif intent_kind in {"list", "standard"} and any(k in text for k in ("policy", "policies", "renew", "expir")):
        domains = ["Policy"]
        records = _SAMPLE_RECORDS["policies"]
    elif intent_kind == "aggregate" or any(k in text for k in ("premium", "total", "aggregate", "tiv")):
        domains = ["LocationProgram", "Program"]
        records = _SAMPLE_RECORDS["premiums"]
    else:
        domains = ["Policy", "Claim"]
        records = _SAMPLE_RECORDS["claims"][:1] + _SAMPLE_RECORDS["policies"][:1]

    lines = ["### Answer (computed)"]
    if records and "property_premium" in records[0]:
        row = records[0]
        lines.append(f"Total property premium: ${row['property_premium']:,.2f}")
        lines.append(f"Annualized premium: ${row['annualized_premium']:,.2f}")
        lines.append(f"Total insured value: ${row['total_insured_value']:,.0f}")
        lines.append(f"Locations: {row['location_count']}")

    lines.append("\n### Sample records")
    for index, record in enumerate(records, start=1):
        lines.append(f"Record {index}: {record}")

    for domain in domains:
        sources.append(
            DataSource(
                id=f"mock-{domain.lower()}",
                document_name=f"{domain} (demo dataset)",
                source_type="RMIS",
                confidence="High",
                preview=f"Demo {domain} records loaded for portfolio showcase.",
            )
        )

    return "\n".join(lines), sources, len(records), domains
