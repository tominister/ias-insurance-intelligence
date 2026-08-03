import type { ReactNode } from 'react'
import {
  Database,
  Info,
  MessageSquarePlus,
  Settings,
  Shield,
  Table2,
  X,
} from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const {
    chats,
    selectedChatId,
    selectChat,
    createNewChat,
    currentView,
    setCurrentView,
    dataSourcesTab,
    setDataSourcesTab,
    sidebarOpen,
    setSidebarOpen,
  } = useChat()

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">IAS</p>
              <p className="truncate text-[11px] text-muted-foreground">Insurance Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button
            className="w-full justify-start"
            onClick={() => {
              createNewChat()
              setSidebarOpen(false)
            }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recent
          </p>
        </div>

        <ScrollArea className="flex-1 px-2 pb-3">
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => {
                  selectChat(chat.id)
                  setSidebarOpen(false)
                }}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                  selectedChatId === chat.id && currentView === 'chat'
                    ? 'bg-secondary text-primary'
                    : 'text-sidebar-foreground hover:bg-muted',
                )}
              >
                <p className="truncate text-sm font-medium">{chat.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-1 p-3">
          <NavButton
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            active={currentView === 'settings'}
            onClick={() => {
              setCurrentView('settings')
              setSidebarOpen(false)
            }}
          />
          <NavButton
            icon={<Database className="h-4 w-4" />}
            label="Data Sources"
            active={currentView === 'data-sources' && dataSourcesTab === 'sources'}
            onClick={() => {
              setCurrentView('data-sources')
              setDataSourcesTab('sources')
              setSidebarOpen(false)
            }}
          />
          <NavButton
            icon={<Table2 className="h-4 w-4" />}
            label="Views"
            active={currentView === 'data-sources' && dataSourcesTab === 'views'}
            indented
            onClick={() => {
              setCurrentView('data-sources')
              setDataSourcesTab('views')
              setSidebarOpen(false)
            }}
          />
          <NavButton
            icon={<Info className="h-4 w-4" />}
            label="About"
            active={currentView === 'about'}
            onClick={() => {
              setCurrentView('about')
              setSidebarOpen(false)
            }}
          />
        </div>
      </aside>
    </>
  )
}

function NavButton({
  icon,
  label,
  active,
  indented = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  indented?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium transition-colors',
        indented ? 'pl-9 pr-3' : 'px-3',
        active ? 'bg-secondary text-primary' : 'text-sidebar-foreground hover:bg-muted',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
