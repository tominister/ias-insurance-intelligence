from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings


class AzureOpenAIError(Exception):
    pass


@dataclass
class TokenUsage:
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


@dataclass
class LLMReply:
    content: str
    model: str
    usage: TokenUsage


class AzureOpenAIService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _chat_completions_url(self) -> str:
        if self.settings.azure_openai_chat_path:
            base = self.settings.azure_openai_api_base_url.rstrip("/")
            path = self.settings.azure_openai_chat_path
            if path.startswith("http"):
                return path
            return f"{base}/{path.lstrip('/')}"

        return f"{self.settings.azure_openai_api_base_url.rstrip('/')}/chat/completions"

    def _responses_url(self) -> str:
        return f"{self.settings.azure_openai_api_base_url.rstrip('/')}/responses"

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.settings.azure_openai_subscription_key or "",
        }

    def _extract_chat_text(self, data: dict[str, Any]) -> str:
        if "choices" in data:
            return data["choices"][0]["message"]["content"].strip()

        output = data.get("output")
        if isinstance(output, list):
            for item in output:
                if item.get("type") != "message":
                    continue
                for content in item.get("content", []):
                    if content.get("type") == "output_text" and content.get("text"):
                        return str(content["text"]).strip()

        raise AzureOpenAIError("Unexpected Azure OpenAI response format")

    def _extract_usage(self, data: dict[str, Any]) -> TokenUsage:
        usage = data.get("usage")
        if not isinstance(usage, dict):
            return TokenUsage()

        return TokenUsage(
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"),
        )

    async def generate_reply(
        self,
        *,
        user_message: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> LLMReply:
        if not self.settings.azure_openai_configured:
            raise AzureOpenAIError("Azure OpenAI is not configured")

        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if history:
            for turn in history:
                role = turn.get("role")
                content = turn.get("content")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_message})

        chat_payload = {
            "model": self.settings.azure_openai_model,
            "messages": messages,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self._chat_completions_url(),
                headers=self._headers(),
                json=chat_payload,
            )

            if response.status_code >= 400:
                responses_payload = {
                    "model": self.settings.azure_openai_model,
                    "input": user_message if not system_prompt else f"{system_prompt}\n\n{user_message}",
                }
                response = await client.post(
                    self._responses_url(),
                    headers=self._headers(),
                    json=responses_payload,
                )

        if response.status_code >= 400:
            raise AzureOpenAIError(
                f"Azure OpenAI request failed ({response.status_code}): {response.text[:500]}"
            )

        data = response.json()
        return LLMReply(
            content=self._extract_chat_text(data),
            model=self.settings.azure_openai_model,
            usage=self._extract_usage(data),
        )

    def _embeddings_url(self) -> str:
        return f"{self.settings.azure_openai_api_base_url.rstrip('/')}/embeddings"

    async def create_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not self.settings.azure_openai_configured:
            raise AzureOpenAIError("Azure OpenAI is not configured")
        if not texts:
            return []

        payload = {
            "model": self.settings.azure_openai_embedding_model,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self._embeddings_url(),
                headers=self._headers(),
                json=payload,
            )

        if response.status_code >= 400:
            raise AzureOpenAIError(
                f"Azure OpenAI embeddings failed ({response.status_code}): {response.text[:300]}"
            )

        data = response.json()
        items = data.get("data")
        if not isinstance(items, list) or not items:
            raise AzureOpenAIError("Azure OpenAI embeddings response missing data")

        ordered = sorted(items, key=lambda item: item.get("index", 0))
        vectors: list[list[float]] = []
        for item in ordered:
            embedding = item.get("embedding")
            if not isinstance(embedding, list):
                raise AzureOpenAIError("Azure OpenAI embeddings response missing vector")
            vectors.append([float(value) for value in embedding])

        if len(vectors) != len(texts):
            raise AzureOpenAIError("Azure OpenAI embeddings count mismatch")

        return vectors

    async def create_embedding(self, text: str) -> list[float]:
        vectors = await self.create_embeddings([text])
        return vectors[0]

    async def health_check(self) -> dict[str, str]:
        if not self.settings.azure_openai_configured:
            return {"status": "not_configured", "detail": "Missing Azure OpenAI environment variables"}
        return {
            "status": "configured",
            "detail": f"APIM route configured for model {self.settings.azure_openai_model}",
        }

    async def connectivity_check(self) -> dict[str, str]:
        configured = await self.health_check()
        if configured["status"] != "configured":
            return configured

        try:
            reply = await self.generate_reply(
                user_message="Reply with exactly: OK",
                system_prompt="You are a health check endpoint. Respond with only OK.",
            )
            return {
                "status": "connected",
                "detail": f"Model {reply.model} responded: {reply.content[:40]}",
            }
        except AzureOpenAIError as exc:
            return {"status": "error", "detail": str(exc)[:300]}
