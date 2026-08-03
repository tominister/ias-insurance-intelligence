export type MessageRole = 'user' | 'assistant'

export type SourceConfidence = 'High' | 'Medium' | 'Low'

export type SourceType =
  | 'Policy Document'
  | 'Guideline'
  | 'Claims Procedure'
  | 'Program Summary'
  | 'SharePoint'
  | 'RMIS'

export interface Source {
  id: string
  documentName: string
  sourceType: SourceType
  confidence: SourceConfidence
  preview: string
  url?: string
}

export interface TokenUsage {
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
}

export interface RequestMetrics {
  total_runtime_ms: number
  origami_retrieval_ms: number
  llm_runtime_ms?: number | null
  origami_records_used: number
  origami_domains_queried: string[]
  model?: string | null
  total_tokens?: number | null
  tokens?: TokenUsage | null
  intent_kind?: string | null
  top_k_used?: number | null
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  sources?: Source[]
  metrics?: RequestMetrics
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

export interface ChatHistoryMessage {
  role: MessageRole
  content: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string | null
  history?: ChatHistoryMessage[]
}

export interface ChatResponse {
  conversation_id: string
  message: Message
  origami_records_used?: number
  metrics: RequestMetrics
}

export interface AssistantSpecs {
  model: string
  top_k: string
  source_confidence: SourceConfidence
  retrieval_mode: string
  origami_environment: string
  origami_account: string | null
  origami_retrieval_timeout_seconds: number
  origami_use_llm_router: boolean
  origami_use_embedding_intent: boolean
  origami_intent_embedding_threshold: number
  azure_openai_embedding_model: string
  origami_aggregate_max_records: number
  connected: string[]
  not_connected: string[]
}

export type DataSourceStatus = 'Connected' | 'Not Connected'

export interface DataSource {
  id: string
  name: string
  description: string
  status: DataSourceStatus
  lastSynced?: string
}

export interface OrigamiDomainCatalogEntry {
  domain: string
  display_name?: string | null
  table_name?: string | null
  description: string
  queryable?: boolean | null
  data_dictionary_api?: string | null
}

export interface OrigamiDataDictionaryResponse {
  status: string
  source: string
  catalog_count: number
  queryable_count?: number | null
  field_schema_available: boolean
  catalog_scope_note?: string | null
  field_schema_note?: string | null
  domains: OrigamiDomainCatalogEntry[]
}

export type AppView = 'chat' | 'data-sources' | 'settings' | 'about'
export type DataSourcesTab = 'sources' | 'views'

export interface OrigamiViewDefinition {
  id: string
  name: string
  snowflake_path: string
  description: string
  domains: string[]
  key_columns: string[]
  columns: string[]
  column_count: number
  premium_view: boolean
}

export interface OrigamiViewsResponse {
  status: string
  source_document: string
  views: OrigamiViewDefinition[]
}

export interface OrigamiViewPreviewResponse {
  status: string
  view: OrigamiViewDefinition
  row_count: number
  preview_count: number
  rows: Array<Record<string, unknown>>
  summary?: Record<string, unknown> | null
}

export interface IntegrationStatus {
  status: string
  detail: string
}

export interface HealthResponse {
  status: string
  service: string
  ready_for_rag: boolean
  azure_openai: IntegrationStatus
  origami: IntegrationStatus
}

export interface IntegrationsResponse {
  azure_openai: IntegrationStatus
  origami: IntegrationStatus
  data_sources: Array<{
    id: string
    name: string
    status: DataSourceStatus
    description: string
  }>
}
