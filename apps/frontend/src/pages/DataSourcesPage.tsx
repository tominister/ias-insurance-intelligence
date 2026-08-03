import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useChat } from '@/context/ChatContext'
import { DataSourceCard } from '@/components/DataSourceCard'
import { OrigamiCatalogPanel } from '@/components/OrigamiCatalogPanel'
import { OrigamiViewsPanel } from '@/components/OrigamiViewsPanel'
import { fetchIntegrations, fetchOrigamiDataDictionary, mapIntegrationSources } from '@/services/chatService'
import type { DataSource, OrigamiDataDictionaryResponse } from '@/types/chat'
import { cn } from '@/lib/utils'

export function DataSourcesPage() {
  const { dataSourcesTab, setDataSourcesTab } = useChat()
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origamiOpen, setOrigamiOpen] = useState(false)
  const [catalog, setCatalog] = useState<OrigamiDataDictionaryResponse | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchIntegrations()
      .then((response) => {
        if (!active) return
        setSources(mapIntegrationSources(response.data_sources))
        setError(null)
      })
      .catch(() => {
        if (!active) return
        setSources([])
        setError('Unable to load connector status from the backend.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const loadOrigamiCatalog = useCallback(
    async (options: { refresh?: boolean; verify?: boolean } = {}) => {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const data = await fetchOrigamiDataDictionary(options)
        setCatalog(data)
      } catch {
        setCatalog(null)
        setCatalogError('Unable to load Origami data dictionary from the backend.')
      } finally {
        setCatalogLoading(false)
      }
    },
    [],
  )

  const openOrigamiCatalog = useCallback(() => {
    setOrigamiOpen(true)
    void loadOrigamiCatalog({ verify: false })
  }, [loadOrigamiCatalog])

  return (
    <div className="h-full overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-border pb-1">
          <TabButton
            active={dataSourcesTab === 'sources'}
            onClick={() => setDataSourcesTab('sources')}
          >
            Sources
          </TabButton>
          <TabButton active={dataSourcesTab === 'views'} onClick={() => setDataSourcesTab('views')}>
            Views
          </TabButton>
        </div>

        {dataSourcesTab === 'sources' && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Connected Sources</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live connector status from the IAS backend. Click Origami RMIS to browse API domains.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Checking connector status…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {sources.map((source) => (
                  <DataSourceCard
                    key={source.id}
                    source={source}
                    onClick={
                      source.id === 'origami' && source.status === 'Connected'
                        ? openOrigamiCatalog
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {dataSourcesTab === 'views' && <OrigamiViewsPanel />}
      </div>

      {origamiOpen && (
        <OrigamiCatalogPanel
          data={catalog}
          loading={catalogLoading}
          error={catalogError}
          onClose={() => setOrigamiOpen(false)}
          onRefresh={() => void loadOrigamiCatalog({ refresh: true, verify: false })}
          onVerifyAccess={() => void loadOrigamiCatalog({ verify: true })}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-b-2 border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
