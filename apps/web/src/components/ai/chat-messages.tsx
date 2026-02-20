'use client'

import { useRef, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import type { UIMessage } from '@ai-sdk/react'
import { useChatContext } from './chat-provider'
import { cn } from '@/lib/utils'

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

const markdownComponents = {
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  img: () => null,
} as const

function MessageItem({
  message,
  t,
}: {
  message: UIMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: any) => string
}) {
  const text = getMessageText(message)

  const toolParts = message.parts.filter(
    (p) => p.type === 'dynamic-tool' || p.type.startsWith('tool-'),
  )

  if (message.role === 'assistant' && !text && toolParts.length === 0) return null

  return (
    <div
      className={cn(
        'flex',
        message.role === 'user' ? 'justify-end' : 'justify-start',
      )}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 50px' }}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2 text-sm wrap-break-word overflow-hidden',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted',
        )}
      >
        {text && message.role === 'assistant' ? (
          <div className="prose prose-sm prose-invert max-w-none wrap-break-word prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-a:text-primary prose-a:underline prose-strong:text-inherit">
            <ReactMarkdown components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        ) : text ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : null}

        {toolParts.map((part, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = part as any
          const toolName = p.toolName ?? p.type?.replace('tool-', '')

          if (p.state === 'output-available' && toolName === 'search_games' && Array.isArray(p.output)) {
            return (
              <div key={i} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="h-3 w-3" />
                <span>{t('showingResults', { count: p.output.length })}</span>
              </div>
            )
          }

          if (p.state === 'output-available' && (toolName === 'open_game' || toolName === 'navigate')) {
            return (
              <div key={i} className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="h-3 w-3" />
                <span>{toolName === 'open_game' ? '↗' : '🔍'}</span>
              </div>
            )
          }

          if (p.state && p.state !== 'output-available' && p.state !== 'output-error') {
            return (
              <div key={i} className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <Bot className="h-3 w-3" />
                <span>{t('thinking')}</span>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

export function ChatMessages() {
  const { messages, isLoading } = useChatContext()
  const t = useTranslations('chat')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="h-full overflow-y-auto p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="font-medium">{t('welcomeTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('welcomeDescription')}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageItem key={message.id} message={message} t={t} />
        ))}

        {isLoading && (() => {
          const last = messages[messages.length - 1]
          if (last?.role === 'assistant') {
            const hasText = getMessageText(last)
            const hasToolParts = last.parts.some(
              (p) => (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) &&
                'state' in p,
            )
            if (hasText || hasToolParts) return null
          }
          return (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2 text-sm">
                <span className="animate-pulse">{t('thinking')}</span>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
