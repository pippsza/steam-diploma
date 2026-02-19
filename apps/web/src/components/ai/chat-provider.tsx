'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useChat, type Message } from 'ai/react'

interface ChatContextValue {
  messages: Message[]
  input: string
  setInput: (input: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <ChatContext.Provider
      value={{ messages, input, setInput, handleSubmit, isLoading, isOpen, open, close, toggle }}
    >
      {children}
    </ChatContext.Provider>
  )
}
