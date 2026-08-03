"""FastAPI authentication dependencies."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.security.token_validator import TokenValidationError, get_token_validator

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    subject: str
    name: str | None
    email: str | None
    oid: str | None
    claims: dict[str, Any]


def _build_user_from_token(token: str) -> AuthenticatedUser:
    claims = get_token_validator().validate(token)
    return AuthenticatedUser(
        subject=claims.subject,
        name=claims.name,
        email=claims.email,
        oid=claims.oid,
        claims=claims.raw,
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> AuthenticatedUser | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return None

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return _build_user_from_token(credentials.credentials)
    except TokenValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def require_auth(
    user: Annotated[AuthenticatedUser | None, Depends(get_current_user)],
) -> AuthenticatedUser | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
