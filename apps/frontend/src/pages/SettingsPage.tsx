import { useEffect, useState, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fetchSpecs } from '@/services/chatService'
import type { AssistantSpecs } from '@/types/chat'

export function SettingsPage() {
  const [specs, setSpecs] = useState<AssistantSpecs | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSpecs()
      .then(setSpecs)
      .catch(() => setError('Unable to load assistant specs from the backend.'))
  }, [])

  return (
    <div className="h-full overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current assistant configuration loaded from the backend.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <SettingsSection title="Model" description="Azure OpenAI model routed through APIM.">
          <SpecRow label="Model" value={specs?.model ?? 'Loading…'} />
        </SettingsSection>

        <SettingsSection title="Retrieval" description="Origami on-demand routing with dynamic top_k per question type.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SpecRow label="Top K" value={specs?.top_k ?? '…'} />
            <SpecRow label="Aggregate cap" value={specs ? String(specs.origami_aggregate_max_records) : '…'} />
            <SpecRow label="Source confidence" value={specs?.source_confidence ?? '…'} />
            <SpecRow label="Retrieval mode" value={specs?.retrieval_mode ?? '…'} />
            <SpecRow label="LLM domain router" value={specs ? (specs.origami_use_llm_router ? 'On' : 'Off') : '…'} />
            <SpecRow
              label="Embedding intent"
              value={
                specs
                  ? specs.origami_use_embedding_intent
                    ? `On (${specs.azure_openai_embedding_model}, threshold ${specs.origami_intent_embedding_threshold})`
                    : 'Off (rules fallback)'
                  : '…'
              }
            />
            <SpecRow
              label="Origami timeout"
              value={specs ? `${specs.origami_retrieval_timeout_seconds}s` : '…'}
            />
            <SpecRow label="Origami environment" value={specs?.origami_environment ?? '…'} />
          </div>
        </SettingsSection>

        <SettingsSection title="Integrations" description="What is actually connected in this build.">
          <SpecRow
            label="Connected"
            value={specs?.connected.join(', ') ?? '…'}
          />
          <SpecRow
            label="Not connected"
            value={specs?.not_connected.join(', ') ?? '…'}
          />
        </SettingsSection>

        <SettingsSection title="Local testing" description="Per-prompt runtime and token usage appear under each assistant reply in chat.">
          <p className="text-sm text-muted-foreground">
            The backend also logs metrics to the uvicorn console for every <code>/chat</code> request.
          </p>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 pt-5">{children}</CardContent>
    </Card>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
