import { Menu } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Header() {
  const { knowledgeBaseConnected, setSidebarOpen, sidebarOpen, currentView, dataSourcesTab } = useChat()

  const title =
    currentView === 'data-sources'
      ? dataSourcesTab === 'views'
        ? 'Data Sources — Views'
        : 'Data Sources'
      : currentView === 'settings'
        ? 'Settings'
        : currentView === 'about'
          ? 'About'
          : 'IAS Insurance Intelligence Assistant'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold text-foreground md:text-base">{title}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Enterprise insurance knowledge assistant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            knowledgeBaseConnected ? 'bg-success' : 'bg-destructive',
          )}
        />
        <span className="text-xs font-medium text-foreground">
          {knowledgeBaseConnected ? 'Knowledge Base Connected' : 'Knowledge Base Offline'}
        </span>
      </div>
    </header>
  )
}
