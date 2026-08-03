import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { OrigamiDataDictionaryResponse } from '@/types/chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrigamiCatalogPanelProps {
  data: OrigamiDataDictionaryResponse | null
  loading: boolean
  error: string | null
  onClose: () => void
  onRefresh: () => void
  onVerifyAccess: () => void
}

export function OrigamiCatalogPanel({
  data,
  loading,
  error,
  onClose,
  onRefresh,
  onVerifyAccess,
}: OrigamiCatalogPanelProps) {
  const [query, setQuery] = useState('')
  const [showQueryableOnly, setShowQueryableOnly] = useState(false)

  const filtered = useMemo(() => {
    if (!data?.domains) return []
    const needle = query.trim().toLowerCase()
    return data.domains.filter((entry) => {
      if (showQueryableOnly && entry.queryable === false) return false
      if (!needle) return true
      return (
        entry.domain.toLowerCase().includes(needle) ||
        (entry.display_name ?? '').toLowerCase().includes(needle) ||
        (entry.table_name ?? '').toLowerCase().includes(needle) ||
        entry.description.toLowerCase().includes(needle)
      )
    })
  }, [data?.domains, query, showQueryableOnly])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="flex max-h-[min(90vh,900px)] w-full max-w-5xl flex-col shadow-soft">
        <CardHeader className="shrink-0 border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Origami RMIS — API Domain Catalog</CardTitle>
              <CardDescription className="mt-1">
                Domains exposed via /api/Domains that the assistant can route questions to.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {data && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{data.catalog_count} tables in catalog</Badge>
              {data.queryable_count != null && (
                <Badge variant="secondary">{data.queryable_count} queryable by API</Badge>
              )}
              <Badge variant="secondary">{data.source}</Badge>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by domain, display name, or table…"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showQueryableOnly}
                onChange={(e) => setShowQueryableOnly(e.target.checked)}
                className="rounded border-input"
              />
              Queryable only
            </label>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              Refresh catalog
            </Button>
            <Button variant="outline" size="sm" onClick={onVerifyAccess} disabled={loading}>
              Check API access
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-y-auto pt-4">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading domain catalog… use &quot;Check API access&quot; to probe /Query on each domain
              (may take up to a minute).
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {data?.catalog_scope_note && (
            <p className="mb-2 text-xs text-muted-foreground">{data.catalog_scope_note}</p>
          )}
          {data?.field_schema_note && (
            <p className="mb-4 text-xs text-muted-foreground">{data.field_schema_note}</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="border-b border-border px-3 py-2 font-medium">Domain</th>
                    <th className="border-b border-border px-3 py-2 font-medium">Display name</th>
                    <th className="border-b border-border px-3 py-2 font-medium">Table</th>
                    <th className="border-b border-border px-3 py-2 font-medium">API access</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.domain} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs">{entry.domain}</td>
                      <td className="px-3 py-2">{entry.display_name ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {entry.table_name ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        {entry.queryable == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : entry.queryable ? (
                          <Badge variant="success">Queryable</Badge>
                        ) : (
                          <Badge variant="secondary">Catalog only</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && data && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No tables match your filter.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
