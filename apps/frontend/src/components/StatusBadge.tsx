import type { SourceConfidence } from '@/types/chat'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status?: 'Connected' | 'Not Connected'
  confidence?: SourceConfidence
  label?: string
  className?: string
}

export function StatusBadge({ status, confidence, label, className }: StatusBadgeProps) {
  if (confidence) {
    const variant =
      confidence === 'High' ? 'success' : confidence === 'Medium' ? 'warning' : 'danger'
    return (
      <Badge variant={variant} className={className}>
        Confidence: {confidence}
      </Badge>
    )
  }

  if (status) {
    return (
      <Badge variant={status === 'Connected' ? 'success' : 'outline'} className={className}>
        <span
          className={cn(
            'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
            status === 'Connected' ? 'bg-success' : 'bg-muted-foreground',
          )}
        />
        {status}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  )
}
