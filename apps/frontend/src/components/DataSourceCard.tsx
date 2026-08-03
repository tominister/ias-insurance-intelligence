import { ChevronRight, Database } from 'lucide-react'
import type { DataSource } from '@/types/chat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

interface DataSourceCardProps {
  source: DataSource
  onClick?: () => void
}

export function DataSourceCard({ source, onClick }: DataSourceCardProps) {
  const clickable = Boolean(onClick)

  return (
    <Card
      className={cn(
        'h-full transition-colors',
        clickable && 'cursor-pointer hover:border-primary/40 hover:bg-muted/30',
      )}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <CardHeader className="pb-3">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{source.name}</CardTitle>
          <StatusBadge status={source.status} />
        </div>
        <CardDescription>{source.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {source.lastSynced
            ? `Last synced ${new Date(source.lastSynced).toLocaleString()}`
            : clickable
              ? 'Click to view all accessible Origami tables'
              : 'No sync history available'}
        </p>
        {clickable && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            View data dictionary
            <ChevronRight className="h-3.5 w-3.5" />
          </p>
        )}
      </CardContent>
    </Card>
  )
}
