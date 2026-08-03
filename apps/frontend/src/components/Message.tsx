import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Message as MessageType } from '@/types/chat'
import { SourceCard } from '@/components/SourceCard'
import { cn } from '@/lib/utils'

interface MessageProps {
  message: MessageType
}

function formatSeconds(ms: number | null | undefined): string {
  if (ms == null) return 'n/a'
  return `${(ms / 1000).toFixed(2)} s`
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const hasSources = Boolean(message.sources?.length)

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[min(100%,42rem)] flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
              IAS
            </div>
            <span className="text-xs font-medium text-muted-foreground">Assistant</span>
          </div>
        )}

        <div
          className={cn(
            'rounded-xl px-4 py-3 text-[15px] leading-relaxed shadow-soft',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="table-wrap overflow-x-auto">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.metrics && (
          <div className="w-full rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Run metrics</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <span>Total: {formatSeconds(message.metrics.total_runtime_ms)}</span>
              <span>Origami fetch: {formatSeconds(message.metrics.origami_retrieval_ms)}</span>
              <span>LLM: {formatSeconds(message.metrics.llm_runtime_ms)}</span>
              <span>Records: {message.metrics.origami_records_used}</span>
              {message.metrics.intent_kind && <span>Intent: {message.metrics.intent_kind}</span>}
              {message.metrics.top_k_used != null && <span>Top K used: {message.metrics.top_k_used}</span>}
              {message.metrics.model && <span>Model: {message.metrics.model}</span>}
              {message.metrics.total_tokens != null && (
                <span>Total tokens: {message.metrics.total_tokens}</span>
              )}
              {message.metrics.tokens?.prompt_tokens != null && (
                <span>Prompt tokens: {message.metrics.tokens.prompt_tokens}</span>
              )}
              {message.metrics.tokens?.completion_tokens != null && (
                <span>Completion tokens: {message.metrics.tokens.completion_tokens}</span>
              )}
            </div>
            {message.metrics.origami_domains_queried.length > 0 && (
              <p className="mt-1">Domains: {message.metrics.origami_domains_queried.join(', ')}</p>
            )}
          </div>
        )}

        {!isUser && hasSources && (
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={() => setSourcesOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-secondary"
            >
              {sourcesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {sourcesOpen ? 'Hide sources' : `Sources (${message.sources!.length})`}
            </button>

            {sourcesOpen && (
              <div className="grid gap-2">
                {message.sources!.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[min(100%,42rem)] flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
            IAS
          </div>
          <span className="text-xs font-medium text-muted-foreground">Assistant</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
