import { ChatProvider, useChat } from '@/context/ChatContext'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ChatWindow } from '@/components/ChatWindow'
import { DataSourcesPage } from '@/pages/DataSourcesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AboutPage } from '@/pages/AboutPage'
import ProtectedRoute from '@/auth/ProtectedRoute'
import { isAuthEnabled } from '@/auth/msalConfig'

function AppShell() {
  const { currentView } = useChat()
  const authEnabled = isAuthEnabled()

  return (
    <ProtectedRoute authEnabled={authEnabled}>
      <div className="flex h-full w-full overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-h-0 flex-1">
            {currentView === 'chat' && <ChatWindow />}
            {currentView === 'data-sources' && <DataSourcesPage />}
            {currentView === 'settings' && <SettingsPage />}
            {currentView === 'about' && <AboutPage />}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  )
}
