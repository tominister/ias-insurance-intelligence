import { FileText } from 'lucide-react'
import type { Source } from '@/types/chat'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'

interface SourceCardProps {
  source: Source
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <Card className="border-border/80 bg-muted/40 shadow-none">
      <CardContent className="space-y-2 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-foreground">{source.documentName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{source.sourceType}</span>
              <StatusBadge confidence={source.confidence} />
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/80">Preview: </span>
          {source.preview}
        </p>
      </CardContent>
    </Card>
  )
}
