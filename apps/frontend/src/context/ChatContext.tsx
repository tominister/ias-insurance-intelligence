import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { checkHealth, sendChatMessage } from '@/services/chatService'
import type { AppView, ChatSession, DataSourcesTab, Message } from '@/types/chat'

interface ChatContextValue {
  chats: ChatSession[]
  selectedChatId: string | null
  selectedChat: ChatSession | null
  messages: Message[]
  isTyping: boolean
  error: string | null
  currentView: AppView
  dataSourcesTab: DataSourcesTab
  sidebarOpen: boolean
  knowledgeBaseConnected: boolean
  setCurrentView: (view: AppView) => void
  setDataSourcesTab: (tab: DataSourcesTab) => void
  setSidebarOpen: (open: boolean) => void
  selectChat: (chatId: string) => void
  createNewChat: () => void
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

function createEmptyChat(): ChatSession {
  const now = new Date().toISOString()
  return {
    id: `chat-${crypto.randomUUID()}`,
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

function deriveTitle(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= 42) return trimmed
  return `${trimmed.slice(0, 42)}…`
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<AppView>('chat')
  const [dataSourcesTab, setDataSourcesTab] = useState<DataSourcesTab>('sources')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [knowledgeBaseConnected, setKnowledgeBaseConnected] = useState(false)

  useEffect(() => {
    void checkHealth()
      .then((health) => {
        const azureReady = ['configured', 'connected'].includes(health.azure_openai.status)
        const origamiReady = ['configured', 'connected'].includes(health.origami.status)
        setKnowledgeBaseConnected(azureReady || origamiReady)
      })
      .catch(() => setKnowledgeBaseConnected(false))
  }, [])

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  )

  const messages = selectedChat?.messages ?? []

  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    setCurrentView('chat')
    setError(null)
  }, [])

  const createNewChat = useCallback(() => {
    const chat = createEmptyChat()
    setChats((prev) => [chat, ...prev])
    setSelectedChatId(chat.id)
    setCurrentView('chat')
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isTyping) return

      let activeChatId = selectedChatId
      let conversationId: string | null = selectedChatId
      let priorHistory: { role: Message['role']; content: string }[] = []

      if (!activeChatId) {
        const chat = createEmptyChat()
        activeChatId = chat.id
        conversationId = chat.id
        setChats((prev) => [chat, ...prev])
        setSelectedChatId(chat.id)
      } else {
        const existingChat = chats.find((chat) => chat.id === activeChatId)
        priorHistory = (existingChat?.messages ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        }))
      }

      const userMessage: Message = {
        id: `msg-${crypto.randomUUID()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat
          const isFirst = chat.messages.length === 0
          return {
            ...chat,
            title: isFirst ? deriveTitle(trimmed) : chat.title,
            updatedAt: userMessage.timestamp,
            messages: [...chat.messages, userMessage],
          }
        }),
      )

      setIsTyping(true)
      setError(null)
      setCurrentView('chat')

      try {
        const response = await sendChatMessage({
          message: trimmed,
          conversation_id: conversationId,
          history: priorHistory,
        })

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== activeChatId) return chat
            return {
              ...chat,
              id: response.conversation_id,
              updatedAt: response.message.timestamp,
              messages: [...chat.messages, response.message],
            }
          }),
        )
        setSelectedChatId(response.conversation_id)

        if (response.origami_records_used === 0 && response.metrics.intent_kind !== 'greeting') {
          setError(
            'No Origami RMIS records were used for this answer. Confirm the backend is running on port 8010 and retry.',
          )
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to reach the IAS assistant. Please try again.'
        setError(message)

        const fallback: Message = {
          id: `msg-${crypto.randomUUID()}`,
          role: 'assistant',
          content:
            'I could not reach the backend service. Please confirm the FastAPI server is running on port 8010, then try again.',
          timestamp: new Date().toISOString(),
        }

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== activeChatId) return chat
            return {
              ...chat,
              updatedAt: fallback.timestamp,
              messages: [...chat.messages, fallback],
            }
          }),
        )
      } finally {
        setIsTyping(false)
      }
    },
    [isTyping, selectedChatId, chats],
  )

  const value = useMemo<ChatContextValue>(
    () => ({
      chats,
      selectedChatId,
      selectedChat,
      messages,
      isTyping,
      error,
      currentView,
      dataSourcesTab,
      sidebarOpen,
      knowledgeBaseConnected,
      setCurrentView,
      setDataSourcesTab,
      setSidebarOpen,
      selectChat,
      createNewChat,
      sendMessage,
      clearError: () => setError(null),
    }),
    [
      chats,
      selectedChatId,
      selectedChat,
      messages,
      isTyping,
      error,
      currentView,
      dataSourcesTab,
      sidebarOpen,
      knowledgeBaseConnected,
      selectChat,
      createNewChat,
      sendMessage,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return ctx
}
