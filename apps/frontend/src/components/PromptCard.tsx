import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface PromptCardProps {
  prompt: string
  onSelect: (prompt: string) => void
}

export function PromptCard({ prompt, onSelect }: PromptCardProps) {
  return (
    <button type="button" onClick={() => onSelect(prompt)} className="w-full text-left">
      <Card className="h-full border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-secondary/50 hover:shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium leading-snug text-foreground">{prompt}</p>
        </div>
      </Card>
    </button>
  )
}
