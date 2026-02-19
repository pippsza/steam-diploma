'use client'

import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatContext } from './chat-provider'
import { cn } from '@/lib/utils'

export function ChatMessages() {
  const { messages, isLoading } = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Tool invocations */}
              {message.toolInvocations?.map((invocation, i) => {
                if (invocation.state === 'result') {
                  const { toolName, result } = invocation

                  if (toolName === 'search_games' && Array.isArray(result)) {
                    return (
                      <div key={i} className="mt-2 space-y-1">
                        {result.map((game: { appid: number; name: string }) => (
                          <a
                            key={game.appid}
                            href={`/games/${game.appid}`}
                            className="block rounded-md bg-background/50 px-3 py-1.5 text-xs hover:bg-background/80 transition-colors"
                          >
                            {game.name}
                          </a>
                        ))}
                      </div>
                    )
                  }
                }
                return null
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2 text-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
