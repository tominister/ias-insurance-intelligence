"""Microsoft Entra ID JWT validation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import jwt
from jwt import PyJWKClient, PyJWTError

from app.config import Settings, get_settings


@dataclass(frozen=True)
class TokenClaims:
    subject: str
    name: str | None
    email: str | None
    oid: str | None
    raw: dict[str, Any]


class TokenValidationError(Exception):
    """Raised when a bearer token fails validation."""


class EntraTokenValidator:
    def __init__(self, settings: Settings) -> None:
        if not settings.azure_ad_tenant_id or not settings.azure_ad_client_id:
            raise RuntimeError("Azure AD tenant and client IDs are required for token validation.")

        self._tenant_id = settings.azure_ad_tenant_id
        self._client_id = settings.azure_ad_client_id
        self._issuer_v2 = f"https://login.microsoftonline.com/{self._tenant_id}/v2.0"
        self._issuer_v1 = f"https://sts.windows.net/{self._tenant_id}/"
        self._jwks_client = PyJWKClient(
            f"https://login.microsoftonline.com/{self._tenant_id}/discovery/v2.0/keys"
        )
        self._audiences = self._build_audiences(self._client_id, settings.azure_api_scope)

    @staticmethod
    def _build_audiences(client_id: str, api_scope: str | None) -> list[str]:
        audiences = {client_id, f"api://{client_id}"}
        if api_scope and api_scope.strip():
            audiences.add(api_scope.strip())
        return sorted(audiences)

    def validate(self, token: str) -> TokenClaims:
        if not token or not token.strip():
            raise TokenValidationError("Missing bearer token.")

        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self._audiences,
                options={
                    "require": ["exp", "iss", "aud", "sub"],
                    "verify_aud": True,
                    "verify_exp": True,
                    "verify_signature": True,
                },
                issuer=self._issuer_v2,
            )
        except PyJWTError as exc:
            try:
                signing_key = self._jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience=self._audiences,
                    options={
                        "require": ["exp", "iss", "aud", "sub"],
                        "verify_aud": True,
                        "verify_exp": True,
                        "verify_signature": True,
                    },
                    issuer=self._issuer_v1,
                )
            except PyJWTError as fallback_exc:
                raise TokenValidationError(str(fallback_exc)) from exc

        return TokenClaims(
            subject=str(payload.get("sub", "")),
            name=_first_str(payload, "name", "preferred_username"),
            email=_first_str(payload, "email", "preferred_username", "upn"),
            oid=_first_str(payload, "oid"),
            raw=payload,
        )


def _first_str(payload: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = payload.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


_validator: EntraTokenValidator | None = None


def get_token_validator() -> EntraTokenValidator:
    global _validator
    if _validator is None:
        _validator = EntraTokenValidator(get_settings())
    return _validator


def reset_token_validator_cache() -> None:
    global _validator
    _validator = None
