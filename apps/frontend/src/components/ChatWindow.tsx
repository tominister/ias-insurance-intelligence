import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Shield } from 'lucide-react'
import { SUGGESTED_PROMPTS } from '@/data/appData'
import { useChat } from '@/context/ChatContext'
import { Message, TypingIndicator } from '@/components/Message'
import { PromptCard } from '@/components/PromptCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ChatWindow() {
  const { messages, isTyping, error, sendMessage, clearError } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    const value = input.trim()
    if (!value || isTyping) return
    setInput('')
    await sendMessage(value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const showWelcome = messages.length === 0 && !isTyping

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
          {showWelcome ? (
            <WelcomeScreen onSelectPrompt={(prompt) => void sendMessage(prompt)} />
          ) : (
            <div className="flex flex-1 flex-col gap-5">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card/90 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-2">
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-[#fde7e9] px-3 py-2 text-xs text-destructive">
              <span>{error}</span>
              <button type="button" className="font-medium underline" onClick={clearError}>
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 shadow-soft"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about policies, claims, deductibles, or procedures…"
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className={cn('shrink-0', (!input.trim() || isTyping) && 'opacity-50')}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-center text-[11px] text-muted-foreground">
            Answers are grounded in live Origami RMIS data. Use the dev server URL from your terminal (often
            http://localhost:5174).
          </p>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Shield className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            IAS Insurance Intelligence Assistant
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
            Search internal insurance knowledge, policies, claims, and procedures
          </p>
        </div>
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <PromptCard key={prompt} prompt={prompt} onSelect={onSelectPrompt} />
        ))}
      </div>
    </div>
  )
}
