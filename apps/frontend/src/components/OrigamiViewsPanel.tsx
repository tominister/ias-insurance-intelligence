import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { fetchOrigamiViewPreview, fetchOrigamiViews } from '@/services/chatService'
import type { OrigamiViewDefinition, OrigamiViewPreviewResponse } from '@/types/chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OrigamiViewsPanel() {
  const [views, setViews] = useState<OrigamiViewDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<OrigamiViewPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchOrigamiViews()
      .then((response) => {
        if (!active) return
        setViews(response.views)
        setError(null)
        if (response.views.length > 0) {
          setExpandedId(response.views[0].id)
        }
      })
      .catch(() => {
        if (!active) return
        setViews([])
        setError('Unable to load Origami views from the backend.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const loadPreview = useCallback(async (viewId: string) => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const data = await fetchOrigamiViewPreview(viewId, 15)
      setPreview(data)
    } catch {
      setPreview(null)
      setPreviewError('Unable to load live preview. Schema tables below are still available.')
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const previewColumns =
    preview?.rows?.[0] != null ? Object.keys(preview.rows[0]).slice(0, 10) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Views</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Snowflake views from <code className="text-xs">data/Origami _Snwoflake views.docx</code>,
          materialized in the app by joining Origami API domains.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading view tables…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && views.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="border-b border-border px-3 py-2 font-medium">View</th>
                  <th className="border-b border-border px-3 py-2 font-medium">Snowflake path</th>
                  <th className="border-b border-border px-3 py-2 font-medium">Columns</th>
                  <th className="border-b border-border px-3 py-2 font-medium">Origami domains</th>
                  <th className="border-b border-border px-3 py-2 font-medium">Use</th>
                </tr>
              </thead>
              <tbody>
                {views.map((view) => (
                  <tr
                    key={view.id}
                    className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                    onClick={() => setExpandedId(expandedId === view.id ? null : view.id)}
                  >
                    <td className="px-3 py-2 font-mono text-xs font-semibold">{view.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {view.snowflake_path}
                    </td>
                    <td className="px-3 py-2">{view.column_count}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {view.domains.join(', ')}
                    </td>
                    <td className="px-3 py-2">
                      {view.premium_view ? (
                        <Badge variant="success">Premium</Badge>
                      ) : (
                        <Badge variant="secondary">Analytics</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {views.map((view) => {
            const open = expandedId === view.id
            return (
              <Card key={view.id} className="shadow-soft">
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setExpandedId(open ? null : view.id)}
                  >
                    <div>
                      <CardTitle className="text-base">{view.name}</CardTitle>
                      <CardDescription className="mt-1">{view.description}</CardDescription>
                    </div>
                    {open ? (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </CardHeader>

                {open && (
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {view.domains.map((domain) => (
                        <Badge key={domain} variant="outline" className="font-mono text-[11px]">
                          {domain}
                        </Badge>
                      ))}
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Columns ({view.column_count})
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="bg-muted/60">
                            <tr>
                              <th className="border-b border-border px-3 py-2 font-medium">#</th>
                              <th className="border-b border-border px-3 py-2 font-medium">
                                Column name
                              </th>
                              <th className="border-b border-border px-3 py-2 font-medium">
                                Key field
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {view.columns.map((column, index) => (
                              <tr key={column} className="border-b border-border last:border-b-0">
                                <td className="px-3 py-1.5 text-muted-foreground">{index + 1}</td>
                                <td className="px-3 py-1.5 font-mono">{column}</td>
                                <td className="px-3 py-1.5">
                                  {view.key_columns.includes(column) ? (
                                    <Badge variant="secondary">Key</Badge>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={previewLoading}
                      onClick={() => void loadPreview(view.id)}
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading live sample…
                        </>
                      ) : (
                        'Load live sample rows'
                      )}
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </>
      )}

      {previewError && <p className="text-sm text-destructive">{previewError}</p>}

      {preview && preview.rows.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Live sample: {preview.view.name}</CardTitle>
            <CardDescription>
              {preview.preview_count} of {preview.row_count} rows from Origami API joins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    {previewColumns.map((col) => (
                      <th key={col} className="border-b border-border px-2 py-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border last:border-b-0">
                      {previewColumns.map((col) => (
                        <td key={col} className="px-2 py-2 text-muted-foreground">
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}
