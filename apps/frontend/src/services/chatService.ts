import type {
  AssistantSpecs,
  ChatRequest,
  ChatResponse,
  DataSource,
  HealthResponse,
  IntegrationsResponse,
  OrigamiDataDictionaryResponse,
  OrigamiViewsResponse,
  OrigamiViewPreviewResponse,
} from '@/types/chat'
import { buildAuthHeaders } from '@/auth/authApi'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = await buildAuthHeaders(
    (init.headers as Record<string, string> | undefined) ?? {},
  )
  return fetch(input, { ...init, headers })
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  return response.json() as Promise<HealthResponse>
}

export async function fetchSpecs(): Promise<AssistantSpecs> {
  const response = await apiFetch(`${API_BASE}/specs`)
  if (!response.ok) {
    throw new Error('Failed to load assistant specs')
  }
  return response.json() as Promise<AssistantSpecs>
}

export async function fetchIntegrations(): Promise<IntegrationsResponse> {
  const response = await apiFetch(`${API_BASE}/integrations`)
  if (!response.ok) {
    throw new Error('Failed to load integrations')
  }
  return response.json() as Promise<IntegrationsResponse>
}

export async function fetchOrigamiDataDictionary(
  options: { refresh?: boolean; verify?: boolean } = {},
): Promise<OrigamiDataDictionaryResponse> {
  const { refresh = false, verify = false } = options
  const params = new URLSearchParams({ verify: String(verify) })
  if (refresh) params.set('refresh', 'true')

  const response = await apiFetch(`${API_BASE}/origami/data-dictionary?${params}`)
  if (!response.ok) {
    throw new Error('Failed to load Origami data dictionary')
  }
  return response.json() as Promise<OrigamiDataDictionaryResponse>
}

export async function fetchOrigamiViews(): Promise<OrigamiViewsResponse> {
  const response = await apiFetch(`${API_BASE}/origami/views`)
  if (!response.ok) {
    throw new Error('Failed to load Origami views')
  }
  return response.json() as Promise<OrigamiViewsResponse>
}

export async function fetchOrigamiViewPreview(viewId: string, limit = 25): Promise<OrigamiViewPreviewResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  const response = await apiFetch(`${API_BASE}/origami/views/${viewId}/preview?${params}`)
  if (!response.ok) {
    throw new Error('Failed to load Origami view preview')
  }
  return response.json() as Promise<OrigamiViewPreviewResponse>
}

export function mapIntegrationSources(
  dataSources: IntegrationsResponse['data_sources'],
): DataSource[] {
  return dataSources.map((source) => ({
    id: source.id,
    name: source.name,
    description: source.description,
    status: source.status,
  }))
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await apiFetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const detail = await response.text()
    try {
      const parsed = JSON.parse(detail) as { detail?: string }
      throw new Error(parsed.detail || detail || 'Failed to send chat message')
    } catch (err) {
      if (err instanceof Error && err.message !== detail) {
        throw err
      }
      throw new Error(detail || 'Failed to send chat message')
    }
  }

  return response.json() as Promise<ChatResponse>
}
