'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  getChatSessions,
  createChatSession,
  getChatSessionMessages,
  saveChatMessages,
  deleteChatSession,
} from '@/actions/chat-sessions'

export interface ChatSession {
  id: string
  title: string
  updatedAt?: string
}

export interface SearchGamesResult {
  appid: number
  name: string
  headerImage?: string | null
  isFree?: boolean
  price?: { currency?: string | null; final?: number | null; discountPercent?: number | null } | null
  genres?: string[]
}

export type ToolAction =
  | { type: 'search_games'; games: SearchGamesResult[]; aiMessage?: string }
  | null

interface ChatContextValue {
  messages: UIMessage[]
  sendUserMessage: (text: string) => void
  isLoading: boolean
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  // Session management
  sessions: ChatSession[]
  currentSessionId: string | null
  loadSessions: () => Promise<void>
  switchSession: (id: string) => Promise<void>
  startNewChat: () => Promise<void>
  removeSession: (id: string) => Promise<void>
  sessionsLoading: boolean
  // Tool actions
  toolAction: ToolAction
  clearToolAction: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: authSession } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [toolAction, setToolAction] = useState<ToolAction>(null)
  const processedToolIdsRef = useRef<Set<string>>(new Set())
  const pendingActionRef = useRef<
    | { type: 'send'; text: string }
    | { type: 'load'; messages: UIMessage[] }
    | null
  >(null)

  const { messages, sendMessage, setMessages, status } = useChat({
    id: currentSessionId ?? undefined,
    experimental_throttle: 50,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Process pending actions after useChat re-binds to the new session id
  useEffect(() => {
    if (!currentSessionId || !pendingActionRef.current) return
    const action = pendingActionRef.current
    pendingActionRef.current = null

    if (action.type === 'send') {
      sendMessage({ text: action.text })
    } else if (action.type === 'load') {
      setMessages(action.messages)
    }
  }, [currentSessionId, sendMessage, setMessages])

  // Save messages whenever they change and we have a session (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveChatMessages(currentSessionId, messages).catch(() => {})
    }, 1000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [messages, currentSessionId])

  // Detect tool invocations and trigger navigation.
  // Navigate immediately when tool output is available — don't wait for streaming to finish.
  useEffect(() => {
    // Find the most recent unprocessed assistant message with completed tool parts
    const toolAssistant = [...messages].reverse().find((m) => {
      if (m.role !== 'assistant' || processedToolIdsRef.current.has(m.id)) return false
      return m.parts.some(
        (p) =>
          (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) &&
          'state' in p &&
          ((p as any).state === 'output-available' || (p as any).state === 'output-error'),
      )
    })

    if (!toolAssistant) return

    // Mark as processed immediately to prevent re-entry
    processedToolIdsRef.current.add(toolAssistant.id)

    const toolParts = toolAssistant.parts.filter(
      (p) =>
        (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) &&
        'state' in p &&
        ((p as any).state === 'output-available' || (p as any).state === 'output-error'),
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = toolParts[toolParts.length - 1] as any

    // Skip errored tool calls — let AI handle them
    if (part.state === 'output-error') return

    // Gather AI text from the same message or the next assistant message
    let aiText = toolAssistant.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
    if (!aiText) {
      const idx = messages.indexOf(toolAssistant)
      for (let i = idx + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          aiText = messages[i].parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('')
          break
        }
      }
    }

    const toolName = part.toolName ?? part.type?.replace('tool-', '')

    switch (toolName) {
      case 'search_games': {
        const games = part.output as SearchGamesResult[]
        // Don't navigate if no results — let the user stay in chat and refine their query
        if (!Array.isArray(games) || games.length === 0) break
        setToolAction({ type: 'search_games', games, aiMessage: aiText || undefined })
        setIsOpen(false)
        router.push(`/${locale}/discover`)
        break
      }
      case 'open_game': {
        const output = part.output as { appid?: number; gameName?: string; action?: string }
        const appid = output.appid
        setIsOpen(false)
        if (appid) {
          router.push(`/${locale}/games/${appid}`)
        } else if (output.gameName) {
          router.push(`/${locale}/search?q=${encodeURIComponent(output.gameName)}`)
        }
        break
      }
      case 'navigate': {
        const output = part.output as Record<string, any>
        const params = output.params ?? output
        setIsOpen(false)
        const sp = new URLSearchParams()
        if (params.query) sp.set('q', params.query)
        if (params.genre) sp.set('genre', params.genre)
        if (params.is_free) sp.set('free', 'true')
        router.push(`/${locale}/search?${sp.toString()}`)
        break
      }
    }
  }, [messages, router, locale])

  const loadSessions = useCallback(async () => {
    if (!authSession?.user) return
    setSessionsLoading(true)
    try {
      const list = await getChatSessions()
      setSessions(list)
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false)
    }
  }, [authSession?.user])

  const startNewChat = useCallback(async () => {
    if (!authSession?.user) return
    try {
      const { id, title } = await createChatSession()
      pendingActionRef.current = { type: 'load', messages: [] }
      processedToolIdsRef.current.clear()
      setCurrentSessionId(id)
      setToolAction(null)
      setSessions((prev) => [{ id, title, updatedAt: new Date().toISOString() }, ...prev])
    } catch {
      // ignore
    }
  }, [authSession?.user])

  const switchSession = useCallback(async (id: string) => {
    try {
      const msgs = await getChatSessionMessages(id)
      pendingActionRef.current = { type: 'load', messages: msgs }
      // Pre-mark all existing tool messages as processed so they don't re-trigger navigation
      processedToolIdsRef.current.clear()
      for (const m of msgs) {
        if (m.role === 'assistant' && m.parts.some(
          (p) => (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) && 'state' in p,
        )) {
          processedToolIdsRef.current.add(m.id)
        }
      }
      setCurrentSessionId(id)
    } catch {
      // ignore
    }
  }, [])

  const removeSession = useCallback(async (id: string) => {
    try {
      await deleteChatSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (currentSessionId === id) {
        setCurrentSessionId(null)
      }
    } catch {
      // ignore
    }
  }, [currentSessionId])

  // Load sessions when chat opens
  useEffect(() => {
    if (isOpen && authSession?.user) {
      loadSessions()
    }
  }, [isOpen, authSession?.user, loadSessions])

  // Send a user message, auto-creating session if needed
  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      if (!currentSessionId) {
        try {
          const { id, title } = await createChatSession()
          pendingActionRef.current = { type: 'send', text }
          setCurrentSessionId(id)
          setSessions((prev) => [{ id, title, updatedAt: new Date().toISOString() }, ...prev])
        } catch {
          return
        }
      } else {
        sendMessage({ text })
      }
    },
    [currentSessionId, sendMessage],
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const clearToolAction = useCallback(() => setToolAction(null), [])

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendUserMessage,
        isLoading,
        isOpen,
        open,
        close,
        toggle,
        sessions,
        currentSessionId,
        loadSessions,
        switchSession,
        startNewChat,
        removeSession,
        sessionsLoading,
        toolAction,
        clearToolAction,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
